import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CourseAiChannelValidationError,
  normalizeCourseAiChannel,
  readCourseAiChannel,
  saveCourseAiChannel
} from '../src/lib/courseAiChannel'
import { createTestDatabase } from './helpers/d1'
import { validateCourseAiConfig } from '../scripts/load-course-ai-config.mjs'
import { getSettingsMessage, SETTINGS_MESSAGES } from '../src/app/admin/settings/settingsMessages'

const validConfig = () => ({
  baseUrl: 'https://ai.example.com/anthropic/',
  model: 'claude-test-model',
  apiKey: 'test-secret-key'
})

test('course AI channel validation accepts HTTPS gateway paths and rejects unsafe values', () => {
  assert.deepEqual(normalizeCourseAiChannel(validConfig()), validConfig())
  assert.deepEqual(validateCourseAiConfig(normalizeCourseAiChannel(validConfig())), validConfig())
  assert.deepEqual(
    normalizeCourseAiChannel({ ...validConfig(), baseUrl: 'https://ai.example.com' }).baseUrl,
    'https://ai.example.com/'
  )

  for (const input of [
    { ...validConfig(), baseUrl: 'http://ai.example.com/' },
    { ...validConfig(), baseUrl: 'https://user:secret@ai.example.com/' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/?key=secret' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/#secret' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/\nCOURSE_AI_MODEL=injected' },
    { ...validConfig(), baseUrl: 'https://ai.example.com/\tadmin' },
    { ...validConfig(), model: '' },
    { ...validConfig(), model: 'model\nCOURSE_AI_API_KEY=injected' },
    { ...validConfig(), model: 'bad\tvalue' },
    { ...validConfig(), model: 'bad\u2028value' },
    { ...validConfig(), apiKey: '' },
    { ...validConfig(), apiKey: 'secret\r\nCOURSE_AI_MODEL=injected' },
    { ...validConfig(), apiKey: 'bad\tvalue' },
    { ...validConfig(), apiKey: 'bad\u007fvalue' }
  ]) {
    assert.throws(() => normalizeCourseAiChannel(input), CourseAiChannelValidationError)
    assert.throws(() => validateCourseAiConfig(input), 'Actions must reject the same invalid configuration as Admin')
  }
})

test('blank-key saves atomically preserve a key rotated by another Admin request', async t => {
  const database = await createTestDatabase({ migrations: ['0008_course_ai_channel.sql'] })
  t.after(() => database.dispose())

  await saveCourseAiChannel(database.db, normalizeCourseAiChannel(validConfig()))
  const staleRequest = await readCourseAiChannel(database.db)
  assert.ok(staleRequest)

  await saveCourseAiChannel(database.db, normalizeCourseAiChannel({
    ...validConfig(),
    apiKey: 'newly-rotated-key'
  }))
  await saveCourseAiChannel(database.db, normalizeCourseAiChannel({
    baseUrl: staleRequest.baseUrl,
    model: 'model-from-blank-key-request',
    apiKey: staleRequest.apiKey
  }), { preserveApiKey: true })

  const saved = await readCourseAiChannel(database.db)
  assert.equal(saved?.model, 'model-from-blank-key-request')
  assert.equal(saved?.apiKey, 'newly-rotated-key')
})

test('Admin settings messages ignore inherited object keys and unknown query values', () => {
  assert.equal(getSettingsMessage('saved'), SETTINGS_MESSAGES.saved)
  assert.equal(getSettingsMessage(undefined, 'invalid'), SETTINGS_MESSAGES.invalid)
  assert.equal(getSettingsMessage('saved', '__proto__'), SETTINGS_MESSAGES.saved)
  for (const error of ['__proto__', 'constructor', 'toString', 'unknown']) {
    assert.equal(getSettingsMessage(undefined, error), undefined, error)
  }
})

test('D1 migration stores one Admin channel and updates it without exposing extra rows', async t => {
  const database = await createTestDatabase({ migrations: ['0008_course_ai_channel.sql'] })
  t.after(() => database.dispose())

  assert.equal(await readCourseAiChannel(database.db), null)
  await saveCourseAiChannel(database.db, normalizeCourseAiChannel(validConfig()))
  const saved = await readCourseAiChannel(database.db)
  assert.equal(saved?.baseUrl, validConfig().baseUrl)
  assert.equal(saved?.model, validConfig().model)
  assert.equal(saved?.apiKey, validConfig().apiKey)
  assert.ok(saved?.updatedAt)

  await saveCourseAiChannel(database.db, normalizeCourseAiChannel({
    ...validConfig(),
    model: 'replacement-model',
    apiKey: 'replacement-secret'
  }))
  assert.equal((await readCourseAiChannel(database.db))?.model, 'replacement-model')
  assert.equal((await readCourseAiChannel(database.db))?.apiKey, 'replacement-secret')
  assert.equal(await database.all<{ count: number }>('SELECT COUNT(*) AS count FROM course_ai_channel').then(rows => rows[0].count), 1)
})
