import assert from 'node:assert/strict'
import test from 'node:test'
import { ADMIN_SESSION_MAX_AGE_SECONDS, sessionToken, verifySessionToken } from '../src/lib/adminSession'

const password = 'regression-test-password'
const issuedAt = Date.UTC(2026, 9, 24, 12)

test('admin sessions expire on the server at the seven-day boundary', async () => {
  const token = await sessionToken(password, issuedAt)
  const expiry = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS * 1000
  assert.equal(await verifySessionToken(token, password, issuedAt), true)
  assert.equal(await verifySessionToken(token, password, expiry - 1), true)
  assert.equal(await verifySessionToken(token, password, expiry), false)
  assert.equal(await verifySessionToken(token, password, issuedAt + 8 * 86400000), false)
})

test('session expiry, issue time and nonce cannot be modified or replayed with a rotated password', async () => {
  const token = await sessionToken(password, issuedAt)
  const parts = token.split('.')
  for (const position of [1, 2, 3, 4]) {
    const changed = [...parts]
    changed[position] = position < 3 ? String(Number(parts[position]) + 3600) : parts[position].replace(/^./, parts[position][0] === 'a' ? 'b' : 'a')
    assert.equal(await verifySessionToken(changed.join('.'), password, issuedAt), false)
  }
  // Even changing both timestamps to preserve the lifetime must fail the signature check.
  parts[1] = String(Number(parts[1]) - 3600)
  parts[2] = String(Number(parts[2]) - 3600)
  assert.equal(await verifySessionToken(parts.join('.'), password, issuedAt), false)
  assert.equal(await verifySessionToken(token, 'rotated-password', issuedAt), false)
  assert.equal(await verifySessionToken(token, password, issuedAt - 1000), false)
  assert.notEqual(await sessionToken(password, issuedAt), token)
})

test('old perpetual tokens and malformed cookies are rejected', async () => {
  const oldDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cs61bbeyond:admin-session:v1:${password}`))
  const oldToken = Buffer.from(oldDigest).toString('hex')
  for (const token of [oldToken, '', 'null', 'v2.0.NaN.nonce.signature', 'v2.'.repeat(10000)]) {
    assert.equal(await verifySessionToken(token, password, issuedAt), false)
  }
  assert.equal(await verifySessionToken(await sessionToken(password, issuedAt), '', issuedAt), false)
})
