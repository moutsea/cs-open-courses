import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { GET } from '../src/app/api/course-ai/config/route'
import { saveCourseAiChannel } from '../src/lib/courseAiChannel'
import { createTestDatabase } from './helpers/d1'

const NO_STORE = 'no-store, private'

function cloudflareEnvironment(t: TestContext, env: Record<string, unknown>): void {
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, { configurable: true, value: { env } })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
  })
}

function request(secret?: string): Request {
  return new Request('https://www.cs61bbeyond.com/api/course-ai/config', {
    headers: secret ? { 'x-course-sync-secret': secret } : {}
  })
}

async function assertNoStore(response: Response, status: number): Promise<void> {
  assert.equal(response.status, status)
  assert.equal(response.headers.get('cache-control'), NO_STORE)
}

test('course AI config route rejects missing configuration and credentials without caching', async t => {
  const database = await createTestDatabase({ migrations: ['0008_course_ai_channel.sql'] })
  t.after(() => database.dispose())

  cloudflareEnvironment(t, { DB: database.db })
  await assertNoStore(await GET(request()), 503)

  cloudflareEnvironment(t, { DB: database.db, COURSE_SYNC_CONFIG_SECRET: 'sync-secret' })
  await assertNoStore(await GET(request()), 401)
  await assertNoStore(await GET(request('wrong-secret')), 401)
  await assertNoStore(await GET(request('sync-secret')), 404)
})

test('course AI config route handles a missing database and database failures without caching', async t => {
  cloudflareEnvironment(t, { COURSE_SYNC_CONFIG_SECRET: 'sync-secret' })
  await assertNoStore(await GET(request('sync-secret')), 503)

  cloudflareEnvironment(t, {
    COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
    DB: {
      prepare: () => {
        throw new Error('private database failure')
      }
    }
  })
  const log = t.mock.method(console, 'error', () => undefined)
  const response = await GET(request('sync-secret'))
  await assertNoStore(response, 503)
  assert.equal(log.mock.callCount(), 1)
  assert.equal((await response.text()).includes('private database failure'), false)
})

test('course AI config route returns the authenticated channel exactly once with no-store', async t => {
  const database = await createTestDatabase({ migrations: ['0008_course_ai_channel.sql'] })
  t.after(() => database.dispose())
  cloudflareEnvironment(t, { DB: database.db, COURSE_SYNC_CONFIG_SECRET: 'sync-secret' })
  await saveCourseAiChannel(database.db, {
    baseUrl: 'https://ai.example.com/api/v1',
    model: 'remote-model',
    apiKey: 'remote-secret-key'
  })

  const response = await GET(request('sync-secret'))
  await assertNoStore(response, 200)
  assert.deepEqual(await response.json(), {
    baseUrl: 'https://ai.example.com/api/v1',
    model: 'remote-model',
    apiKey: 'remote-secret-key'
  })
})
