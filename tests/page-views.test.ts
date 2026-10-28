import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { createTestDatabase, type TestDatabase } from './helpers/d1'
import {
  DAY_OFFSET_SECONDS,
  PAGE_VIEW_RETENTION_DAYS,
  classifyDevice,
  isBotUserAgent,
  isTrackedPage,
  loadTrafficSummary,
  normalizePath,
  purgePageViews,
  recordPageView,
  referrerHost,
  shanghaiDay,
  visitorHash
} from '../src/lib/pageViews'

/**
 * 每个用例一个独立的真实 D1（miniflare），迁移直接跑 `migrations/0005_page_views.sql`。
 * 理由见 tests/helpers/d1.ts：聚合逻辑必须真跑 SQL。
 */
async function fresh(t: TestContext): Promise<TestDatabase> {
  const database = await createTestDatabase()
  t.after(() => database.dispose())
  return database
}

const NOW = Date.UTC(2026, 9, 25, 2, 0, 0) // 2026-10-25 10:00 +08
const SALT = 'test-salt'
const SITE_HOST = 'www.example.test'

function view(overrides: Partial<Parameters<typeof recordPageView>[1]> = {}) {
  return {
    collectionMethod: 'browser' as const,
    eventId: crypto.randomUUID(),
    pathname: '/courses',
    search: '',
    referrer: null,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0 Safari/537.36',
    ip: '203.0.113.7',
    country: 'CN',
    ...overrides
  }
}

test('path rules: admin, api and assets are never tracked', () => {
  assert.equal(isTrackedPage('/courses'), true)
  assert.equal(isTrackedPage('/zh/course/data-structures-algorithms/CS61B'), true)
  assert.equal(isTrackedPage('/admin/gaps'), false)
  assert.equal(isTrackedPage('/api/track'), false)
  assert.equal(isTrackedPage('/_next/static/chunk.js'), false)
  assert.equal(isTrackedPage('/favicon.ico'), false)
  assert.equal(isTrackedPage('//evil.test/courses'), false)
  assert.equal(isTrackedPage('/courses?page=2'), false)
  assert.equal(isTrackedPage('courses'), false)
})

test('normalizePath merges slashes, drops query and index', () => {
  assert.equal(normalizePath('/courses'), '/courses')
  assert.equal(normalizePath('/courses/'), '/courses')
  assert.equal(normalizePath('/courses//data'), '/courses/data')
  assert.equal(normalizePath('/courses/index'), '/courses')
  assert.equal(normalizePath('/courses?filter=os#top'), '/courses')
  assert.equal(normalizePath('/'), '/')
  assert.equal(normalizePath('///'), '/')
})

test('bot and device classification', () => {
  assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true)
  assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0)'), true)
  assert.equal(isBotUserAgent('curl/8.4.0'), true)
  assert.equal(isBotUserAgent('python-requests/2.31'), true)
  assert.equal(isBotUserAgent('Mozilla/5.0 (Macintosh) Chrome/120.0 Safari/537.36'), false)

  assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148'), 'mobile')
  assert.equal(classifyDevice('Mozilla/5.0 (iPad; CPU OS 17_0)'), 'tablet')
  assert.equal(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'desktop')
  assert.equal(classifyDevice(''), 'desktop')
})

test('referrer is collapsed to a host and unattributed self-referrals remain unknown', () => {
  assert.equal(referrerHost('https://www.google.com/search?q=cs61b', SITE_HOST), 'google.com')
  assert.equal(referrerHost('https://www.example.test/courses', SITE_HOST), '')
  assert.equal(referrerHost('https://example.test/zh/course/x', SITE_HOST), '')
  assert.equal(referrerHost(null, SITE_HOST), '')
  assert.equal(referrerHost('not a url', SITE_HOST), '')
})

test('visitor hash is stable within a day and changes across days', async () => {
  const first = await visitorHash('203.0.113.7', 'UA', '2026-10-25', SALT)
  const again = await visitorHash('203.0.113.7', 'UA', '2026-10-25', SALT)
  const tomorrow = await visitorHash('203.0.113.7', 'UA', '2026-10-26', SALT)
  const otherSalt = await visitorHash('203.0.113.7', 'UA', '2026-10-25', 'other-salt')
  const otherIp = await visitorHash('203.0.113.8', 'UA', '2026-10-25', SALT)
  assert.equal(first, again)
  assert.equal(first.length, 64)
  assert.notEqual(first, tomorrow)
  assert.notEqual(first, otherSalt)
  assert.notEqual(first, otherIp)
})

test('days are cut at Asia/Shanghai midnight, not UTC', () => {
  assert.equal(DAY_OFFSET_SECONDS, 8 * 60 * 60)
  // UTC 2026-10-24 15:59 = 北京 23:59，还是 24 号
  assert.equal(shanghaiDay(Date.UTC(2026, 9, 24, 15, 59)), '2026-10-24')
  // UTC 2026-10-24 16:00 = 北京 25 号 00:00
  assert.equal(shanghaiDay(Date.UTC(2026, 9, 24, 16, 0)), '2026-10-25')
})

test('recording a view stores derived data only, never the raw IP or UA', async t => {
  const { db, all } = await fresh(t)
  const result = await recordPageView(
    db,
    view({ search: '?utm_source=twitter&utm_medium=social&filter=os', referrer: 'https://www.google.com/search?q=x' }),
    { salt: SALT, siteHost: SITE_HOST, now: NOW, purgeProbability: 0 }
  )
  assert.equal(result.inserted, true)
  assert.equal(result.day, '2026-10-25')
  assert.equal(result.path, '/courses')

  const [row] = await all('SELECT * FROM page_views')
  assert.equal(row.day, '2026-10-25')
  assert.equal(row.path, '/courses')
  assert.equal(row.referrer_host, 'google.com')
  assert.equal(row.utm_source, 'twitter')
  assert.equal(row.utm_medium, 'social')
  // 只取 utm_*，其它查询参数（这里是 filter）不落库
  assert.equal(row.utm_campaign, '')
  assert.equal(row.country, 'CN')
  assert.equal(row.device, 'desktop')
  assert.equal(row.is_bot, 0)
  assert.equal(row.collection_method, 'browser')
  assert.equal(row.visitor_hash, await visitorHash('203.0.113.7', view().userAgent, '2026-10-25', SALT))
  // 原始 IP / UA 一个字都不能出现
  const dump = JSON.stringify(row)
  assert.equal(dump.includes('203.0.113.7'), false)
  assert.equal(dump.includes('Mozilla'), false)
})

test('the same event id is stored once, different ids on one page are all counted', async t => {
  const { db, all } = await fresh(t)
  const eventId = crypto.randomUUID()
  const options = { salt: SALT, siteHost: SITE_HOST, now: NOW, purgeProbability: 0 }

  assert.equal((await recordPageView(db, view({ eventId }), options)).inserted, true)
  // StrictMode / 重传 / BFCache 都会重复发同一个 id
  assert.equal((await recordPageView(db, view({ eventId }), options)).inserted, false)
  assert.equal((await recordPageView(db, view({ pathname: '/courses/data' }), options)).inserted, true)

  const [count] = await all<{ n: number }>('SELECT COUNT(*) AS n FROM page_views')
  assert.equal(count.n, 2)
})

test('untracked paths are not stored even if the client reports them', async t => {
  const { db, all } = await fresh(t)
  const result = await recordPageView(db, view({ pathname: '/admin/gaps' }), {
    salt: SALT,
    siteHost: SITE_HOST,
    now: NOW,
    purgeProbability: 0
  })
  assert.equal(result.inserted, false)
  const [count] = await all<{ n: number }>('SELECT COUNT(*) AS n FROM page_views')
  assert.equal(count.n, 0)
})

test('summary counts PV per view and UV per person-day, ignoring bots', async t => {
  const { db } = await fresh(t)
  const options = { salt: SALT, siteHost: SITE_HOST, purgeProbability: 0 }
  const personA = { ip: '198.51.100.1', userAgent: 'Mozilla/5.0 Chrome/120.0' }
  const personB = { ip: '198.51.100.2', userAgent: 'Mozilla/5.0 Safari/605.1' }

  // A 今天看两次同一页、再看另一页 → PV 3、UV 1
  await recordPageView(db, view({ ...personA, pathname: '/courses' }), { ...options, now: NOW })
  await recordPageView(db, view({ ...personA, pathname: '/courses' }), { ...options, now: NOW })
  await recordPageView(db, view({ ...personA, pathname: '/courses/data' }), { ...options, now: NOW })
  // B 今天看一次 → PV 4、UV 2
  await recordPageView(db, view({ ...personB, pathname: '/courses' }), { ...options, now: NOW })
  // 昨天 A 也来过 → 昨天 PV 1、UV 1
  await recordPageView(db, view({ ...personA }), { ...options, now: NOW - 24 * 60 * 60 * 1000 })
  // 爬虫请求：进 bots，不进 PV
  await recordPageView(db, view({ pathname: '/courses', userAgent: 'Googlebot/2.1', collectionMethod: 'bot', eventId: null }), {
    ...options,
    now: NOW
  })

  const summary = await loadTrafficSummary(db, 7, NOW)
  assert.equal(summary.range.days, 7)
  assert.equal(summary.range.to, '2026-10-25')
  assert.equal(summary.totals.pv, 5)
  // 日 UV 合计：昨天 A(1) + 今天 A,B(2) = 3，而不是区间去重后的 2
  assert.equal(summary.totals.visitorDays, 3)
  assert.equal(summary.totals.bots, 1)

  assert.equal(summary.daily.length, 7)
  const today = summary.daily.at(-1)
  assert.deepEqual({ day: today?.day, pv: today?.pv, uv: today?.uv, bots: today?.bots }, {
    day: '2026-10-25',
    pv: 4,
    uv: 2,
    bots: 1
  })
  const yesterday = summary.daily.at(-2)
  assert.deepEqual({ pv: yesterday?.pv, uv: yesterday?.uv }, { pv: 1, uv: 1 })
  // 没访问的日子补零，不能缺行
  assert.equal(summary.daily.filter(item => item.pv === 0).length, 5)

  assert.equal(summary.topPages[0].label, '/courses')
  assert.equal(summary.topPages[0].pv, 4)
  assert.equal(summary.topPages[1].label, '/courses/data')

  assert.equal(summary.devices[0].label, 'desktop')
  assert.equal(summary.countries[0].label, 'CN')
  // 空来源不能证明是直接打开，也可能是来源未传递或旧版站内浏览。
  assert.equal(summary.sources[0].label, '直接访问 / 来源未知')
})

test('utm source wins over referrer in the source bucket', async t => {
  const { db } = await fresh(t)
  const options = { salt: SALT, siteHost: SITE_HOST, now: NOW, purgeProbability: 0 }
  await recordPageView(db, view({ search: '?utm_source=newsletter' , referrer: 'https://www.google.com/' }), options)
  await recordPageView(db, view({ search: '?utm_source=newsletter' }), options)
  await recordPageView(db, view({ referrer: 'https://news.ycombinator.com/item?id=1' }), options)

  const summary = await loadTrafficSummary(db, 7, NOW)
  const labels = summary.sources.map(row => row.label)
  assert.deepEqual(labels, ['utm:newsletter', 'news.ycombinator.com'])
  assert.equal(summary.sources[0].pv, 2)
})

test('summary clamps the requested range and returns zeroes for an empty table', async t => {
  const { db } = await fresh(t)
  const empty = await loadTrafficSummary(db, 7, NOW)
  assert.equal(empty.totals.pv, 0)
  assert.equal(empty.totals.visitorDays, 0)
  assert.equal(empty.totals.bots, 0)
  assert.equal(empty.daily.length, 7)
  assert.ok(empty.daily.every(item => item.pv === 0))
  assert.deepEqual(empty.topPages, [])

  assert.equal((await loadTrafficSummary(db, Number.NaN, NOW)).range.days, 7)
  assert.equal((await loadTrafficSummary(db, 0, NOW)).range.days, 7)
  assert.equal((await loadTrafficSummary(db, 365, NOW)).range.days, 90)
  assert.equal((await loadTrafficSummary(db, 30, NOW)).range.days, 30)
})

test('purge removes only rows past the retention window, in chunks', async t => {
  const { db, all } = await fresh(t)
  const options = { salt: SALT, siteHost: SITE_HOST, now: NOW, purgeProbability: 0 }
  const old = NOW - (PAGE_VIEW_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
  await recordPageView(db, view({ pathname: '/old-1' }), { ...options, now: old })
  await recordPageView(db, view({ pathname: '/old-2' }), { ...options, now: old })
  await recordPageView(db, view({ pathname: '/fresh' }), options)

  assert.equal(await purgePageViews(db, { now: NOW }), 2)
  const rows = await all<{ path: string }>('SELECT path FROM page_views')
  assert.deepEqual(rows.map(row => row.path), ['/fresh'])

  // 分块：只删掉 chunk 指定的行数，剩下的留给下次 cron
  await recordPageView(db, view({ pathname: '/old-3' }), { ...options, now: old })
  await recordPageView(db, view({ pathname: '/old-4' }), { ...options, now: old })
  assert.equal(await purgePageViews(db, { now: NOW, chunk: 1 }), 1)
})

test('a write can opportunistically purge, and never does when probability is zero', async t => {
  const { db } = await fresh(t)
  const old = NOW - (PAGE_VIEW_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
  const base = { salt: SALT, siteHost: SITE_HOST, purgeProbability: 0 }
  await recordPageView(db, view({ pathname: '/old' }), { ...base, now: old })

  // random() 返回 0.9 > 默认 2% → 不清理
  const skipped = await recordPageView(db, view({ pathname: '/a' }), { ...base, now: NOW, purgeProbability: 0.02, random: () => 0.9 })
  assert.equal(skipped.purged, 0)

  // random() 返回 0.001 < 2% → 顺手清理
  const purged = await recordPageView(db, view({ pathname: '/b' }), { ...base, now: NOW, purgeProbability: 0.02, random: () => 0.001 })
  assert.equal(purged.purged, 1)

  // 爬虫那条路径显式传 purgeProbability: 0，绝不触发清理
  const bot = await recordPageView(db, view({ pathname: '/c' }), { ...base, now: NOW, random: () => 0 })
  assert.equal(bot.purged, 0)
})
