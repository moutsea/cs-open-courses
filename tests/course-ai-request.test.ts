import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { courseAiRequestInit } from '../scripts/course-ai-endpoint.mjs'

const payload = { model: 'test-model', max_tokens: 10, messages: [] }

test('reviewer request init carries x-api-key and rejects redirects', () => {
  const init = courseAiRequestInit({ apiKey: 'secret-proof-value', payload, timeoutMs: 1_000 })

  assert.equal(init.method, 'POST')
  assert.equal(init.headers['x-api-key'], 'secret-proof-value')
  assert.equal(init.headers['anthropic-version'], '2023-06-01')
  assert.equal(init.headers['content-type'], 'application/json')
  // Node fetch does not strip custom x-api-key on cross-origin redirects; following must be disabled.
  assert.equal(init.redirect, 'error')
  assert.ok(init.signal instanceof AbortSignal)
  assert.deepEqual(JSON.parse(init.body), payload)
})

test('a cross-origin 302 from the AI gateway never receives x-api-key', async t => {
  const seenHeaders: Array<Record<string, unknown>> = []
  const collector = createServer((request, response) => {
    seenHeaders.push({ ...request.headers })
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end('{"content":[]}')
  })
  const gateway = createServer((_request, response) => {
    const collectorPort = (collector.address() as AddressInfo).port
    response.writeHead(302, { location: `http://127.0.0.1:${collectorPort}/collect` })
    response.end()
  })

  await new Promise<void>(resolve => collector.listen(0, '127.0.0.1', resolve))
  await new Promise<void>(resolve => gateway.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    collector.close()
    gateway.close()
  })

  const gatewayPort = (gateway.address() as AddressInfo).port
  const init = courseAiRequestInit({ apiKey: 'secret-proof-value', payload, timeoutMs: 5_000 })

  const rejection = await fetch(`http://127.0.0.1:${gatewayPort}/v1/messages`, init as RequestInit).then(
    () => null,
    (error: unknown) => error
  )
  assert.ok(rejection instanceof TypeError, 'redirect: error must reject instead of following the cross-origin redirect')
  // undici reports redirect rejections as the cause of a generic "fetch failed" TypeError.
  const messages = [rejection, (rejection as { cause?: unknown }).cause]
    .map(error => (error instanceof Error ? error.message : String(error)))
    .join(' ')
  assert.match(messages, /redirect/i, `expected a redirect rejection, got: ${messages}`)
  assert.equal(seenHeaders.length, 0, 'the redirect target must never receive the request or the API key')
})
