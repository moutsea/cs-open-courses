import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import middleware from '../src/middleware'
import { loadTrafficSummary } from '../src/lib/pageViews'
import { createTestDatabase, type TestDatabase } from './helpers/d1'

/**
 * middleware 的爬虫记账。
 *
 * 这条链路的意义：不执行 JS 的爬虫永远不会走浏览器上报，如果不在这里记一笔，
 * 「爬虫来了多少次」就完全是盲区（而且它们通常是 SEO 诊断的第一手信号）。
 * 但它绝不能污染 PV —— 下面的用例就是在钉这个边界。
 */
async function wire(t: TestContext): Promise<TestDatabase> {
  const database = await createTestDatabase()
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, {
    configurable: true,
    value: { env: { DB: database.db, ANALYTICS_SALT: 'test-salt' } }
  })
  t.after(async () => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
    await database.dispose()
  })
  return database
}

/** 收集 waitUntil 交出去的任务，等它们跑完再断言。 */
function run(request: NextRequest) {
  const tasks: Promise<unknown>[] = []
  const response = middleware(request, {
    waitUntil: (task: Promise<unknown>) => tasks.push(task),
    passThroughOnException: () => undefined
  } as never)
  return { response, tasks: Promise.all(tasks) }
}

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0 Safari/537.36'

function page(path: string, headers: Record<string, string>) {
  return new NextRequest(`https://www.cs61bbeyond.com${path}`, { headers })
}

test('crawler document requests are counted separately from page views', async t => {
  const database = await wire(t)

  const { response, tasks } = run(page('/zh/courses', { 'user-agent': GOOGLEBOT, 'cf-connecting-ip': '66.249.66.1' }))
  assert.equal(response.status, 200)
  await tasks

  const rows = await database.all<{ path: string; collection_method: string; is_bot: number; event_id: string | null }>(
    'SELECT path, collection_method, is_bot, event_id FROM page_views'
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].path, '/zh/courses')
  assert.equal(rows[0].collection_method, 'bot')
  assert.equal(rows[0].is_bot, 1)
  // 爬虫没有浏览器端的 eventId，唯一索引对 NULL 不生效，所以可以有多行
  assert.equal(rows[0].event_id, null)

  const summary = await loadTrafficSummary(database.db, 7)
  assert.equal(summary.totals.bots, 1)
  assert.equal(summary.totals.pv, 0, '爬虫不能算进 PV')
  assert.equal(summary.totals.visitorDays, 0)
})

test('normal browsers and prefetches are not recorded by the middleware', async t => {
  const database = await wire(t)

  // 正常浏览器：交给前端 PageViewTracker，middleware 不重复记账
  const browser = run(page('/zh/courses', { 'user-agent': BROWSER }))
  // Next 的预加载：一次跳转会打出好几条请求，记账会把爬虫数灌爆
  const prefetch = run(page('/zh/courses', { 'user-agent': GOOGLEBOT, 'next-router-prefetch': '1' }))
  const rsc = run(page('/zh/courses', { 'user-agent': GOOGLEBOT, rsc: '1' }))
  await Promise.all([browser.tasks, prefetch.tasks, rsc.tasks])

  const rows = await database.all('SELECT path FROM page_views')
  assert.equal(rows.length, 0)
})

test('non-GET requests and admin paths never reach the counter', async t => {
  const database = await wire(t)

  const post = run(
    new NextRequest('https://www.cs61bbeyond.com/zh/courses', { method: 'POST', headers: { 'user-agent': GOOGLEBOT } })
  )
  // /admin 走的是主机守卫那条分支，提前 return，不该被记账
  const admin = run(page('/admin/gaps', { 'user-agent': GOOGLEBOT }))
  await Promise.all([post.tasks, admin.tasks])

  assert.equal((await database.all('SELECT path FROM page_views')).length, 0)
})

test('admin paths stay 404 on non-production hosts even for crawlers', async t => {
  await wire(t)
  // workers.dev 副本上 /admin 要彻底隐身（爬虫也不例外）
  const request = new NextRequest('https://cs-courses.example.workers.dev/admin', {
    headers: { 'user-agent': GOOGLEBOT }
  })
  const { response, tasks } = run(request)
  await tasks
  assert.equal(response.status, 404)
})
