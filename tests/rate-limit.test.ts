import assert from 'node:assert/strict'
import test from 'node:test'
import { createRateLimiter } from '../src/lib/rateLimit'

test('rate limiter allows exactly the configured budget inside one window', () => {
  const limiter = createRateLimiter({ limit: 3, windowMs: 1000 })
  const start = 1_000_000
  assert.deepEqual(limiter.hit('a', start), { allowed: true, retryAfterSeconds: 0 })
  assert.equal(limiter.hit('a', start + 1).allowed, true)
  assert.equal(limiter.hit('a', start + 2).allowed, true)
  const blocked = limiter.hit('a', start + 900)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.retryAfterSeconds, 1, '剩余 100ms → 向上取整到 1 秒')
  // 其他键不受影响
  assert.equal(limiter.hit('b', start + 900).allowed, true)
})

test('rate limiter window resets and fresh keys start over', () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000 })
  assert.equal(limiter.hit('a', 0).allowed, true)
  assert.equal(limiter.hit('a', 500).allowed, false)
  // 窗口结束后重置
  assert.equal(limiter.hit('a', 1001).allowed, true)
})

test('rate limiter peek does not consume budget while hit does', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
  assert.equal(limiter.peek('a', 0).allowed, true)
  assert.equal(limiter.peek('a', 0).allowed, true)
  assert.equal(limiter.peek('a', 0).allowed, true, 'peek 不应计数')
  limiter.hit('a', 0)
  limiter.hit('a', 0)
  assert.equal(limiter.peek('a', 0).allowed, false)
  limiter.reset('a')
  assert.equal(limiter.peek('a', 0).allowed, true)
})

test('rate limiter never limits an empty key and prunes to the key cap', () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 10 })
  for (let index = 0; index < 5; index += 1) {
    assert.equal(limiter.hit('', index).allowed, true, '拿不到 IP 时不限流')
  }
  assert.equal(limiter.size(), 0, '空键不建桶')

  for (let index = 0; index < 10; index += 1) limiter.hit(`k${index}`, 0)
  assert.equal(limiter.size(), 10)
  // 第 11 个键进来时会淘汰最老的一半，键数不会无限增长
  limiter.hit('k10', 0)
  assert.ok(limiter.size() <= 10, `size = ${limiter.size()}`)
  assert.equal(limiter.peek('k0', 0).allowed, true, '被淘汰的键等于重新计数')
})

test('rate limiter drops expired buckets instead of accumulating them', () => {
  const limiter = createRateLimiter({ limit: 5, windowMs: 1000, maxKeys: 4 })
  for (let index = 0; index < 4; index += 1) limiter.hit(`k${index}`, 0)
  assert.equal(limiter.size(), 4)
  // 窗口过期后再来新键：先把过期的清掉，所以不会触发淘汰活键
  for (let index = 0; index < 4; index += 1) limiter.hit(`n${index}`, 5000)
  assert.equal(limiter.size(), 4)
  for (let index = 0; index < 4; index += 1) {
    assert.equal(limiter.peek(`k${index}`, 5000).allowed, true, '过期键已清空')
  }
})
