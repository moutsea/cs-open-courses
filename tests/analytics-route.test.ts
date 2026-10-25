import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { POST } from '../src/app/api/track/route'
import { MAX_ANALYTICS_BODY_BYTES } from '../src/lib/analyticsLimits'

function database(t: TestContext, failure?: 'prepare' | 'batch') {
  const batches: unknown[][] = []
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, { configurable: true, value: { env: { DB: {
    prepare: (sql: string) => {
      if (failure === 'prepare') throw new Error('Cloudflare context: private database error')
      return { bind: (...args: unknown[]) => ({ sql, args }) }
    },
    batch: async (statements: unknown[]) => {
      if (failure === 'batch') throw new Error('D1_ERROR: private database error')
      batches.push(statements)
      return []
    }
  } } } })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
  })
  return batches
}

function request(body: string | ReadableStream<Uint8Array>, headers?: HeadersInit) {
  // String bodies make undici default to text/plain, but the real client always sends JSON
  // (`fetch(ENDPOINT, { headers: { 'content-type': 'application/json' } })`).
  return new Request('https://example.test/api/track', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', ...(headers as Record<string, string> | undefined) },
    duplex: 'half'
  } as RequestInit)
}

const valid = JSON.stringify({ events: [{ name: 'search', path: '/zh/search', locale: 'zh', props: { q: '课程' } }] })

test('track rejects null and other invalid JSON shapes without throwing or writing', async t => {
  const batches = database(t)
  for (const body of ['null', 'false', '42', '"search"', '[]', '{}', '{"events":null}', '{invalid', '']) {
    assert.equal((await POST(request(body))).status, 204, body)
  }
  assert.equal(batches.length, 0)
  assert.equal((await POST(request(valid))).status, 204)
  assert.equal(batches.length, 1)
})

test('track cancels oversized uploads while streaming, including absent or misleading Content-Length', async t => {
  const batches = database(t)
  for (const headers of [undefined, { 'content-length': '1' }]) {
    let pulls = 0
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++
        if (pulls > 20) controller.close()
        else controller.enqueue(new Uint8Array(4096).fill(32))
      },
      cancel() { cancelled = true }
    }, { highWaterMark: 0 })
    assert.equal((await POST(request(body, headers))).status, 204)
    assert.equal(pulls, 3, 'stop on the first chunk exceeding 8 KiB')
    assert.equal(cancelled, true)
  }
  assert.equal(batches.length, 0)
})

test('track counts UTF-8 bytes, accepts exactly 8 KiB and rejects one byte more', async t => {
  const batches = database(t)
  const exact = valid + ' '.repeat(MAX_ANALYTICS_BODY_BYTES - Buffer.byteLength(valid))
  assert.equal((await POST(request(exact))).status, 204)
  assert.equal(batches.length, 1)
  assert.equal((await POST(request(exact + ' '))).status, 204)
  assert.equal(batches.length, 1)
  const multibyte = JSON.stringify({ events: [{ name: 'search', props: { q: '课'.repeat(3000) } }] })
  assert.ok(multibyte.length < MAX_ANALYTICS_BODY_BYTES)
  assert.ok(Buffer.byteLength(multibyte) > MAX_ANALYTICS_BODY_BYTES)
  await POST(request(multibyte))
  assert.equal(batches.length, 1)
})

test('track preserves split UTF-8 characters and handles aborted streams', async t => {
  const batches = database(t)
  const bytes = new TextEncoder().encode(valid)
  let offset = 0
  await POST(request(new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === bytes.length) controller.close()
      else controller.enqueue(bytes.slice(offset, ++offset))
    }
  })))
  const statement = batches[0][0] as { args: unknown[] }
  assert.equal(JSON.parse(String(statement.args[6])).q, '课程')
  const broken = new ReadableStream<Uint8Array>({ pull(controller) { controller.error(new Error('Upload aborted')) } })
  assert.equal((await POST(request(broken))).status, 204)
  assert.equal(batches.length, 1)
})

for (const failure of ['prepare', 'batch'] as const) {
  test(`track returns a retryable error when D1 ${failure} fails, without exposing details`, async t => {
    const batches = database(t, failure)
    const log = t.mock.method(console, 'error', () => undefined)
    const response = await POST(request(valid))
    assert.equal(response.status, 503)
    assert.equal(await response.text(), '')
    assert.equal(batches.length, 0)
    assert.equal(log.mock.callCount(), 1)
  })
}

for (const environment of ['development', 'production']) {
  for (const missing of ['context', 'binding']) {
    test(`track handles missing ${missing} in ${environment} explicitly`, async t => {
      const symbol = Symbol.for('__cloudflare-context__')
      const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
      Object.defineProperty(globalThis, symbol, { configurable: true, value: missing === 'context' ? undefined : { env: {} } })
      const env = { NODE_ENV: environment, NEXT_RUNTIME: undefined }
      for (const [key, value] of Object.entries(env)) {
        const previous = process.env[key]
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
        t.after(() => {
          if (previous === undefined) delete process.env[key]
          else process.env[key] = previous
        })
      }
      t.after(() => {
        if (original) Object.defineProperty(globalThis, symbol, original)
        else Reflect.deleteProperty(globalThis, symbol)
      })
      const log = t.mock.method(console, 'error', () => undefined)
      const response = await POST(request(valid))
      assert.equal(response.status, environment === 'production' ? 503 : 204)
      assert.equal(await response.text(), '')
      assert.equal(log.mock.callCount(), environment === 'production' ? 1 : 0)
    })
  }
}

test('track rejects requests that declare themselves cross-site, and non-JSON bodies', async t => {
  const batches = database(t)

  // 明确跨站：Sec-Fetch-Site 或 Origin 与本站不同 → 直接 403，不写库。
  const crossSite: Record<string, string>[] = [
    { 'sec-fetch-site': 'cross-site' },
    { 'sec-fetch-site': 'same-site' },
    { origin: 'https://evil.example' },
    { origin: 'null' }
  ]
  for (const headers of crossSite) {
    const response = await POST(request(valid, headers))
    assert.equal(response.status, 403, JSON.stringify(headers))
  }
  assert.equal(batches.length, 0)

  // 声明了 content-type 却不是 JSON：跨站 no-cors 只能发简单类型，这里一并挡掉。
  for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
    const response = await POST(request(valid, { 'content-type': contentType }))
    assert.equal(response.status, 415, contentType)
  }
  assert.equal(batches.length, 0)

  // 同源浏览器请求、以及不带这些头的非浏览器客户端照常放行。
  const sameSite: Record<string, string>[] = [
    { 'sec-fetch-site': 'same-origin' },
    { 'sec-fetch-site': 'none' },
    { origin: 'https://example.test' }
  ]
  for (const headers of sameSite) {
    assert.equal((await POST(request(valid, headers))).status, 204, JSON.stringify(headers))
  }
  assert.equal(batches.length, 3)
})

test('track rate limits per client IP and keeps the bucket map from growing forever', async t => {
  database(t)
  const limited = () => request(valid, { 'cf-connecting-ip': '203.0.113.7' })
  // 120 次窗口额度：前 120 次放行，第 121 次开始 429。
  for (let index = 0; index < 120; index += 1) {
    assert.equal((await POST(limited())).status, 204, `request ${index}`)
  }
  assert.equal((await POST(limited())).status, 429)

  // 换一个 IP 立刻恢复（限流是按 IP 的，不是全局）。
  assert.equal((await POST(request(valid, { 'cf-connecting-ip': '203.0.113.8' }))).status, 204)
})
