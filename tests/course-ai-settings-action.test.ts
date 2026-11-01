import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { persistCourseAiChannelForm } from '../src/app/admin/settings/persistCourseAiChannelForm'

const CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

function contextDescriptor(t: TestContext, descriptor: PropertyDescriptor): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, CONTEXT_SYMBOL)
  Object.defineProperty(globalThis, CONTEXT_SYMBOL, { configurable: true, ...descriptor })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, CONTEXT_SYMBOL, original)
    else Reflect.deleteProperty(globalThis, CONTEXT_SYMBOL)
  })
}

async function expectRedirect(promise: Promise<void>, destination: string): Promise<void> {
  const thrown = await promise.then(() => null, (error: unknown) => error)
  assert.ok(thrown instanceof Error, `expected redirect to ${destination}`)
  assert.match(String((thrown as { digest?: unknown }).digest ?? thrown.message), new RegExp(destination.replace(/[?]/g, '\\?')))
}

function form(apiKey = ''): FormData {
  const data = new FormData()
  data.set('baseUrl', 'https://ai.example.com/api/v1')
  data.set('model', 'remote-model')
  data.set('apiKey', apiKey)
  return data
}

test('Admin channel save handles Cloudflare context failures with a controlled redirect', async t => {
  contextDescriptor(t, {
    get: () => {
      throw new Error('context unavailable')
    }
  })
  t.mock.method(console, 'error', () => undefined)
  await expectRedirect(persistCourseAiChannelForm(form()), '/admin/settings?error=save-failed')
})

test('Admin channel save reports a missing D1 binding separately', async t => {
  contextDescriptor(t, { value: { env: {} } })
  await expectRedirect(persistCourseAiChannelForm(form()), '/admin/settings?error=unavailable')
})
