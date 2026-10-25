import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { POST } from '../src/app/api/analytics/page-view/route'
import { createTestDatabase } from './helpers/d1'

/**
 * 上报接口的行为约束：只收本站的 JSON、挡住已知爬虫、按 IP 限流、
 * 并且重复 eventId 只入库一次。这里用一个真实的 SQLite 当 D1，
 * 断言的是「库里多了几行」，而不是「有没有调用某个函数」。
 */
async function database(t: TestContext) {
  const { db, all, dispose } = await createTestDatabase()
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, {
    configurable: true,
    value: { env: { DB: db, ANALYTICS_SALT: 'test-salt' } }
  })
  t.after(async () => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
    await dispose()
  })
  return { rows: () => all<Record<string, unknown>>('SELECT * FROM page_views') }
}

const ORIGIN = 'https://www.example.test'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0 Safari/537.36'

function request(
  body: string,
  headers: Record<string, string> = {},
  init: { headers?: Record<string, string> } = {}
) {
  return new Request(`${ORIGIN}/api/analytics/page-view`, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      origin: ORIGIN,
      'user-agent': BROWSER_UA,
      'cf-connecting-ip': '203.0.113.9',
      ...headers,
      ...(init.headers ?? {})
    },
    duplex: 'half'
  } as RequestInit)
}

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    eventId: crypto.randomUUID(),
    pathname: '/courses',
    referrer: 'https://www.google.com/search?q=cs61b',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    ...overrides
  })
}

test('same-origin browser report is stored with derived fields only', async t => {
  const db = await database(t)
  const response = await POST(request(payload({ utmSource: 'twitter' })))
  assert.equal(response.status, 204)

  const rows = await db.rows()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].path, '/courses')
  assert.equal(rows[0].referrer_host, 'google.com')
  assert.equal(rows[0].utm_source, 'twitter')
  assert.equal(rows[0].collection_method, 'browser')
  assert.equal(rows[0].is_bot, 0)
  const dump = JSON.stringify(rows[0])
  assert.equal(dump.includes('203.0.113.9'), false)
  assert.equal(dump.includes('Mozilla'), false)
})

test('cross-site and non-JSON requests are rejected before touching the database', async t => {
  const db = await database(t)
  assert.equal((await POST(request(payload(), { origin: 'https://evil.example' }))).status, 403)
  assert.equal((await POST(request(payload(), { 'sec-fetch-site': 'cross-site' }))).status, 403)
  assert.equal((await POST(request(payload(), {}, { headers: { origin: '' } }))).status, 403)
  assert.equal(
    (await POST(request(payload(), { 'content-type': 'text/plain' }))).status,
    415
  )
  assert.equal((await db.rows()).length, 0)
})

test('known crawlers get a 204 without a row, and untracked paths are rejected', async t => {
  const db = await database(t)
  const bot = request(payload(), { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })
  assert.equal((await POST(bot)).status, 204)

  // 后台 / 接口 / 静态资源即使被上报也不入库
  assert.equal((await POST(request(payload({ pathname: '/admin/gaps' })))).status, 400)
  assert.equal((await POST(request(payload({ pathname: '/api/track' })))).status, 400)
  assert.equal((await db.rows()).length, 0)
})

test('malformed payloads are rejected', async t => {
  const db = await database(t)
  assert.equal((await POST(request('not json'))).status, 400)
  assert.equal((await POST(request('[]'))).status, 400)
  assert.equal((await POST(request(JSON.stringify({ eventId: 'not-a-uuid', pathname: '/courses' })))).status, 400)
  assert.equal((await POST(request(payload({ pathname: '' })))).status, 400)
  assert.equal((await POST(request(payload({ pathname: '/courses?x=1' })))).status, 400)
  assert.equal((await db.rows()).length, 0)
})

test('a replayed event id does not inflate the page view count', async t => {
  const db = await database(t)
  const body = payload()
  assert.equal((await POST(request(body))).status, 204)
  assert.equal((await POST(request(body))).status, 204)
  assert.equal((await db.rows()).length, 1)
})

test('oversized bodies are rejected instead of being parsed', async t => {
  const db = await database(t)
  const huge = JSON.stringify({
    eventId: crypto.randomUUID(),
    pathname: '/courses',
    referrer: 'https://example.test/' + 'x'.repeat(8 * 1024)
  })
  assert.equal((await POST(request(huge))).status, 400)
  assert.equal((await db.rows()).length, 0)
})

test('the per-IP rate limit eventually answers 429', async t => {
  await database(t)
  let last = 0
  // 限流是 120 次/分钟，按 IP 计。用独立 IP，免得把同文件里其它用例的额度吃光
  // （限流器是模块级的，同一进程内共享）。
  for (let index = 0; index < 121; index += 1) {
    const response = await POST(request(payload({ pathname: '/courses' }), { 'cf-connecting-ip': '198.51.100.200' }))
    last = response.status
    if (last === 429) break
  }
  assert.equal(last, 429)
})
