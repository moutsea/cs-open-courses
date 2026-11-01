import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CourseAiConfigWriteError,
  DEFAULT_COURSE_AI_CONFIG_URL,
  loadCourseAiConfig,
  validateCourseAiConfig
} from '../scripts/load-course-ai-config.mjs'
import { courseAiMessagesEndpoint } from '../scripts/course-ai-endpoint.mjs'

const validConfig = () => ({
  baseUrl: 'https://ai.example.com/v1',
  model: 'remote-model',
  apiKey: 'remote-secret-key'
})

test('loader keeps the fallback and does not fetch when the sync secret is unset', async () => {
  let fetched = false
  let wrote = false
  const warnings: string[] = []

  const applied = await loadCourseAiConfig({
    env: { GITHUB_ENV: '/tmp/github-env' },
    fetchImpl: async () => {
      fetched = true
      throw new Error('fetch must not be called')
    },
    appendFileImpl: async () => {
      wrote = true
    },
    log: () => {},
    warn: (message: string) => warnings.push(message)
  })

  assert.equal(applied, false)
  assert.equal(fetched, false)
  assert.equal(wrote, false)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /^::warning::/)
  assert.match(warnings[0], /fallback/)
})

test('loader masks the new key and appends validated remote values to GITHUB_ENV', async () => {
  const requests: Array<{ url: string, headers: Record<string, string>, signal: AbortSignal, redirect: string }> = []
  const writes: Array<{ path: string, contents: string }> = []
  const logs: string[] = []
  const warnings: string[] = []

  const applied = await loadCourseAiConfig({
    env: {
      COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
      GITHUB_ENV: '/tmp/github-env'
    },
    fetchImpl: async (url: string, options: { headers: Record<string, string>, signal: AbortSignal, redirect: string }) => {
      requests.push({ url, ...options })
      return {
        ok: true,
        status: 200,
        json: async () => validConfig()
      }
    },
    appendFileImpl: async (path: string, contents: string) => {
      writes.push({ path, contents })
    },
    log: (message: string) => logs.push(message),
    warn: (message: string) => warnings.push(message)
  })

  assert.equal(applied, true)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, DEFAULT_COURSE_AI_CONFIG_URL)
  assert.equal(requests[0].headers['x-course-sync-secret'], 'sync-secret')
  assert.ok(requests[0].signal instanceof AbortSignal)
  assert.equal(requests[0].redirect, 'error', 'redirects must not forward the sync secret to another origin')
  assert.deepEqual(writes, [{
    path: '/tmp/github-env',
    contents: 'COURSE_AI_BASE_URL=https://ai.example.com/v1\n'
      + 'COURSE_AI_MODEL=remote-model\n'
      + 'COURSE_AI_API_KEY=remote-secret-key\n'
  }])
  assert.equal(logs[0], '::add-mask::remote-secret-key')
  assert.equal(logs.filter(message => message.includes('remote-secret-key')).length, 1)
  assert.deepEqual(warnings, [])
})

test('loader escapes percent signs when registering the exact API key mask', async () => {
  const logs: string[] = []
  const writes: string[] = []
  const apiKey = 'abc%25def%0Axyz'

  const applied = await loadCourseAiConfig({
    env: {
      COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
      GITHUB_ENV: '/tmp/github-env'
    },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ...validConfig(), apiKey }) }),
    appendFileImpl: async (_path: string, contents: string) => {
      writes.push(contents)
    },
    log: (message: string) => logs.push(message),
    warn: () => {}
  })

  assert.equal(applied, true)
  assert.equal(logs[0], '::add-mask::abc%2525def%250Axyz')
  assert.ok(writes[0].includes(`COURSE_AI_API_KEY=${apiKey}\n`), 'the original key must still be written unchanged')
})

test('loader does not leak malformed JSON response fragments into Actions logs', async () => {
  const logs: string[] = []
  const warnings: string[] = []
  const apiKey = 'secret-proof-value'

  const applied = await loadCourseAiConfig({
    env: {
      COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
      GITHUB_ENV: '/tmp/github-env'
    },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: () => new Response(apiKey).json()
    }),
    appendFileImpl: async () => {
      throw new Error('invalid JSON must not be written')
    },
    log: (message: string) => logs.push(message),
    warn: (message: string) => warnings.push(message)
  })

  assert.equal(applied, false)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /not valid JSON/)
  assert.equal([...logs, ...warnings].join('\n').includes(apiKey), false)
})

test('loader fails closed after a partial GITHUB_ENV write instead of mixing configurations', async () => {
  let envText = ''
  const warnings: string[] = []

  await assert.rejects(loadCourseAiConfig({
    env: {
      COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
      GITHUB_ENV: '/tmp/github-env'
    },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => validConfig() }),
    appendFileImpl: async (_path: string, contents: string) => {
      envText += contents.split('\n')[0] + '\n'
      throw new Error('simulated I/O failure after a partial write')
    },
    log: () => {},
    warn: (message: string) => warnings.push(message)
  }), CourseAiConfigWriteError)

  assert.equal(envText, 'COURSE_AI_BASE_URL=https://ai.example.com/v1\n')
  assert.deepEqual(warnings, [], 'a partial write must not claim that the fallback was preserved')
})

test('loader keeps the fallback on HTTP and network failures', async t => {
  for (const [name, fetchImpl] of [
    ['404 response', async () => ({ ok: false, status: 404, json: async () => validConfig() })],
    ['network failure', async () => { throw new Error('network unavailable') }]
  ] as const) {
    await t.test(name, async () => {
      let wrote = false
      const logs: string[] = []
      const warnings: string[] = []
      const applied = await loadCourseAiConfig({
        env: {
          COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
          GITHUB_ENV: '/tmp/github-env'
        },
        fetchImpl,
        appendFileImpl: async () => {
          wrote = true
        },
        log: (message: string) => logs.push(message),
        warn: (message: string) => warnings.push(message)
      })

      assert.equal(applied, false)
      assert.equal(wrote, false)
      assert.deepEqual(logs, [])
      assert.equal(warnings.length, 1)
      assert.match(warnings[0], /fallback/)
    })
  }
})

test('Messages endpoint preserves gateway paths without duplicating an existing /v1 prefix', () => {
  const cases = [
    ['https://ai.example.com/', 'https://ai.example.com/v1/messages'],
    ['https://ai.example.com', 'https://ai.example.com/v1/messages'],
    ['https://ai.example.com/api', 'https://ai.example.com/api/v1/messages'],
    ['https://ai.example.com/api/', 'https://ai.example.com/api/v1/messages'],
    ['https://ai.example.com/v1', 'https://ai.example.com/v1/messages'],
    ['https://ai.example.com/v1/', 'https://ai.example.com/v1/messages'],
    ['https://ai.example.com/api/v1', 'https://ai.example.com/api/v1/messages'],
    ['https://ai.example.com/api/v1/', 'https://ai.example.com/api/v1/messages']
  ]

  for (const [baseUrl, expected] of cases) {
    assert.equal(courseAiMessagesEndpoint(baseUrl), expected, baseUrl)
  }
})

test('loader rejects non-HTTPS URLs, URL credentials, queries, hashes, and env injection', async () => {
  const invalidConfigs = [
    { ...validConfig(), baseUrl: 'http://ai.example.com/v1' },
    { ...validConfig(), baseUrl: 'https://user:password@ai.example.com/v1' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/v1?key=value' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/v1#fragment' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/v1\nCOURSE_AI_MODEL=injected' },
    { ...validConfig(), model: 'remote-model\nCOURSE_AI_API_KEY=injected' },
    { ...validConfig(), apiKey: 'remote-secret-key\r\nCOURSE_AI_MODEL=injected' }
  ]

  for (const config of invalidConfigs) {
    assert.throws(() => validateCourseAiConfig(config))
    let wrote = false
    const logs: string[] = []
    const warnings: string[] = []
    const applied = await loadCourseAiConfig({
      env: {
        COURSE_SYNC_CONFIG_SECRET: 'sync-secret',
        GITHUB_ENV: '/tmp/github-env'
      },
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => config }),
      appendFileImpl: async () => {
        wrote = true
      },
      log: (message: string) => logs.push(message),
      warn: (message: string) => warnings.push(message)
    })

    assert.equal(applied, false)
    assert.equal(wrote, false)
    assert.deepEqual(logs, [], 'invalid values must be rejected before masking or writing')
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /fallback/)
  }
})
