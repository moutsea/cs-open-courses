/**
 * 进程内固定窗口限流。
 *
 * 为什么不是 Durable Object / D1：这里只需要「挡住明显的滥用」，不需要精确配额。
 * 每个 Worker isolate 各自计数，多 isolate 时实际额度会被放大，这是刻意的取舍——
 * 换来的是零额外绑定、零额外延迟。要精确限流再换 Durable Object。
 *
 * 关键点是**不能无限增长**：旧实现（/api/track）直接往 Map 里塞键且从不删除，
 * 被随机 IP 打就会一直占内存。这里过期即清、键数超上限再淘汰最老的一半。
 */

export interface RateLimitOptions {
  /** 一个窗口内允许的次数 */
  limit: number
  /** 窗口长度（毫秒） */
  windowMs: number
  /** 键数上限，超出后淘汰最老的条目，兜底内存 */
  maxKeys?: number
}

export interface RateLimitState {
  allowed: boolean
  /** 距离窗口重置还剩多少秒（仅在 !allowed 时有意义） */
  retryAfterSeconds: number
}

export interface RateLimiter {
  /** 记一次，返回这次是否放行 */
  hit(key: string, now?: number): RateLimitState
  /** 只看状态，不计数 */
  peek(key: string, now?: number): RateLimitState
  /** 清掉某个键（例如登录成功后清零失败次数） */
  reset(key: string): void
  /** 当前保留的键数，仅用于测试与观测 */
  size(): number
}

const DEFAULT_MAX_KEYS = 5000

export function createRateLimiter({ limit, windowMs, maxKeys = DEFAULT_MAX_KEYS }: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>()

  function prune(now: number): void {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key)
    }
    if (buckets.size < maxKeys) return
    // 还有这么多活着的键，说明窗口内确实被打爆了：按插入顺序丢掉最老的一半。
    let remaining = Math.ceil(buckets.size / 2)
    for (const key of buckets.keys()) {
      buckets.delete(key)
      remaining -= 1
      if (remaining <= 0) return
    }
  }

  function stateOf(key: string, now: number): RateLimitState {
    const bucket = buckets.get(key)
    if (!bucket || now >= bucket.resetAt) return { allowed: true, retryAfterSeconds: 0 }
    return {
      allowed: bucket.count < limit,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    }
  }

  return {
    hit(key, now = Date.now()) {
      if (!key) return { allowed: true, retryAfterSeconds: 0 }
      const bucket = buckets.get(key)
      if (!bucket || now >= bucket.resetAt) {
        if (buckets.size >= maxKeys) prune(now)
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, retryAfterSeconds: 0 }
      }
      bucket.count += 1
      // 计数超过 limit 后仍继续累加，这样连打不会因为窗口边界被绕开。
      return {
        allowed: bucket.count <= limit,
        retryAfterSeconds: bucket.count <= limit ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      }
    },
    peek(key, now = Date.now()) {
      if (!key) return { allowed: true, retryAfterSeconds: 0 }
      return stateOf(key, now)
    },
    reset(key) {
      buckets.delete(key)
    },
    size() {
      return buckets.size
    }
  }
}
