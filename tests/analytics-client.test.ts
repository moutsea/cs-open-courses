import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { attachAnalyticsFlushListeners, track, trackOutbound } from '../src/lib/analytics'
import { MAX_ANALYTICS_BODY_BYTES } from '../src/lib/analyticsLimits'
import { POST } from '../src/app/api/track/route'

function setup(t: TestContext) {
  const window = Object.assign(new EventTarget(), {
    location: { pathname: '/zh/course/advanced-mathematics/The_Information_Theory_Pattern_Recognition_and_Neural_Networks', hostname: 'www.cs61bbeyond.com' }
  })
  const document = new EventTarget()
  const beacons: Blob[] = []
  const requests: { body: string; keepalive: boolean | undefined }[] = []
  const transport: { beacon: () => boolean; fetch: (options: RequestInit) => Promise<Response> } = {
    beacon: (): boolean => true,
    fetch: async (): Promise<Response> => new Response(null, { status: 204 })
  }
  const values = {
    window, document,
    navigator: { sendBeacon: (_url: string, body: Blob) => { beacons.push(body); return transport.beacon() } },
    fetch: async (_url: string, options: RequestInit) => {
      requests.push({ body: String(options.body), keepalive: options.keepalive })
      return transport.fetch(options)
    }
  }
  const original = Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const detach = attachAnalyticsFlushListeners()
  t.after(async () => {
    // Drain any failed batch before restoring globals; failures must never create an endless timer.
    transport.beacon = () => true
    transport.fetch = async () => new Response(null, { status: 204 })
    window.dispatchEvent(new Event('online'))
    await setImmediate()
    t.mock.timers.tick(1000)
    await setImmediate()
    detach()
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
  async function flush() { t.mock.timers.tick(500); await setImmediate() }
  return { window, document, transport, beacons, requests, flush }
}

for (const outcome of ['false', 'throw'] as const) {
  test(`Beacon ${outcome} uses the same batch in a keepalive fetch, without duplicate sends`, async t => {
    const ui = setup(t)
    ui.transport.beacon = () => { if (outcome === 'throw') throw new Error('Beacon blocked'); return false }
    track('search', { q: 'CS61B' })
    await ui.flush()
    assert.equal(ui.beacons.length, 1)
    assert.equal(ui.requests.length, 1)
    assert.equal(ui.requests[0].body, await ui.beacons[0].text())
    assert.equal(ui.requests[0].keepalive, true)
    assert.equal(JSON.parse(ui.requests[0].body).events[0].props.q, 'CS61B')
    ui.window.dispatchEvent(new Event('pagehide'))
    await ui.flush()
    assert.equal(ui.requests.length, 1)
  })
}

test('an accepted Beacon does not also issue a fetch', async t => {
  const ui = setup(t)
  track('search', { q: 'CS61B' })
  await ui.flush()
  assert.equal(ui.beacons.length, 1)
  assert.equal(ui.requests.length, 0)
})

for (const failure of ['network', 'http'] as const) {
  test(`failed fallback (${failure}) retains events for online recovery without a retry loop`, async t => {
    const ui = setup(t)
    ui.transport.beacon = () => false
    ui.transport.fetch = async () => {
      if (failure === 'network') throw new Error('Offline')
      return new Response(null, { status: 503 })
    }
    track('search', { q: 'retain me' })
    await ui.flush()
    assert.equal(ui.requests.length, 1)
    t.mock.timers.tick(60_000)
    await setImmediate()
    assert.equal(ui.requests.length, 1)
    ui.transport.beacon = () => true
    ui.window.dispatchEvent(new Event('online'))
    await setImmediate()
    assert.equal(ui.beacons.length, 2)
    assert.equal(JSON.parse(await ui.beacons[1].text()).events[0].props.q, 'retain me')
    ui.window.dispatchEvent(new Event('pagehide'))
    await setImmediate()
    assert.equal(ui.beacons.length, 2)
  })
}

test('pagehide during a pending fallback does not duplicate the in-flight batch and drains later events', async t => {
  const ui = setup(t)
  ui.transport.beacon = () => false
  let complete!: (response: Response) => void
  ui.transport.fetch = () => new Promise(resolve => { complete = resolve })
  track('search', { q: 'first' })
  await ui.flush()
  track('search', { q: 'second' })
  ui.window.dispatchEvent(new Event('pagehide'))
  ui.document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(ui.requests.length, 1)
  ui.transport.beacon = () => true
  complete(new Response(null, { status: 204 }))
  await setImmediate()
  assert.equal(ui.beacons.length, 2)
  assert.equal(JSON.parse(await ui.beacons[1].text()).events[0].props.q, 'second')
  await ui.flush()
  assert.equal(ui.beacons.length, 2)
})

test('UTF-8 byte batching preserves a full queue when the page is hidden', async t => {
  const ui = setup(t)
  for (let index = 0; index < 60; index++) {
    trackOutbound(new URL(`https://www.youtube.com/playlist?list=${'x'.repeat(90)}&i=${index}`), '中文公开视频'.repeat(10))
  }
  ui.window.dispatchEvent(new Event('pagehide'))
  await setImmediate()
  let total = 0
  for (const blob of ui.beacons) {
    assert.ok(blob.size <= MAX_ANALYTICS_BODY_BYTES)
    const events = JSON.parse(await blob.text()).events
    assert.ok(events.length <= 20)
    total += events.length
  }
  assert.equal(total, 60)
  const batches = ui.beacons.length
  await ui.flush()
  assert.equal(ui.beacons.length, batches)
})

test('real track endpoint keeps failed D1 events queued and writes them once after recovery', async t => {
  const ui = setup(t)
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  let failing = true
  let attempts = 0
  const saved: { args: unknown[] }[] = []
  Object.defineProperty(globalThis, symbol, { configurable: true, value: { env: { DB: {
    prepare: () => ({ bind: (...args: unknown[]) => ({ args }) }),
    batch: async (statements: { args: unknown[] }[]) => {
      attempts++
      if (failing) throw new Error('D1 temporarily unavailable')
      saved.push(...statements)
      return []
    }
  } } } })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
  })
  t.mock.method(console, 'error', () => undefined)
  const statuses: number[] = []
  ui.transport.beacon = () => false
  ui.transport.fetch = async options => {
    const response = await POST(new Request('https://example.test/api/track', options))
    statuses.push(response.status)
    return response
  }
  track('search', { q: 'D1 recovery' })
  await ui.flush()
  assert.deepEqual(statuses, [503])
  assert.equal(attempts, 1)
  assert.equal(saved.length, 0)
  t.mock.timers.tick(60_000)
  await setImmediate()
  assert.equal(attempts, 1, 'failed database writes must not cause a retry loop')

  failing = false
  ui.window.dispatchEvent(new Event('online'))
  await setImmediate()
  assert.deepEqual(statuses, [503, 204])
  assert.equal(attempts, 2)
  assert.equal(saved.length, 1)
  assert.equal(JSON.parse(String(saved[0].args[6])).q, 'D1 recovery')
  assert.equal(ui.requests[0].body, ui.requests[1].body)
  ui.window.dispatchEvent(new Event('pagehide'))
  await ui.flush()
  assert.equal(attempts, 2, 'the successful retry must remove the batch from the queue')
})
