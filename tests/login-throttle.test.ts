import assert from 'node:assert/strict'
import test from 'node:test'
import {
  UNKNOWN_CLIENT,
  clearLoginFailures,
  clientIpFromHeaders,
  isLoginBlocked,
  loginThrottleSize,
  recordLoginFailure
} from '../src/lib/loginThrottle'

function headers(values: Record<string, string>): Pick<Headers, 'get'> {
  const map = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]))
  return { get: (name: string) => map.get(name.toLowerCase()) ?? null }
}

test('client IP prefers Cloudflare header, then X-Forwarded-For, then a shared bucket', () => {
  assert.equal(clientIpFromHeaders(headers({ 'cf-connecting-ip': ' 203.0.113.7 ' })), '203.0.113.7')
  assert.equal(
    clientIpFromHeaders(headers({ 'x-forwarded-for': '198.51.100.9, 10.0.0.1' })),
    '198.51.100.9'
  )
  assert.equal(clientIpFromHeaders(headers({})), UNKNOWN_CLIENT)
})

test('repeated login failures eventually block the IP, and a success clears it', () => {
  const ip = 'throttle-test-success'
  assert.equal(isLoginBlocked(ip), false)
  // 8 次以内仍然可试
  for (let attempt = 0; attempt < 8; attempt += 1) {
    assert.equal(isLoginBlocked(ip), false, `attempt ${attempt}`)
    recordLoginFailure(ip)
  }
  assert.equal(isLoginBlocked(ip), true, '第 9 次开始拒绝')

  // 成功登录清零，正常管理员不会被自己锁在门外
  clearLoginFailures(ip)
  assert.equal(isLoginBlocked(ip), false)
})

test('throttling is per IP so one attacker cannot lock out everyone', () => {
  const attacker = 'throttle-test-attacker'
  for (let attempt = 0; attempt < 9; attempt += 1) recordLoginFailure(attacker)
  assert.equal(isLoginBlocked(attacker), true)
  assert.equal(isLoginBlocked('throttle-test-bystander'), false)
  clearLoginFailures(attacker)
  assert.equal(loginThrottleSize() >= 0, true)
})
