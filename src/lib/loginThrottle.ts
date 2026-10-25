/**
 * 管理后台登录失败节流。
 *
 * 旧实现只做 `safeEqual` 比较：没有节流、没有延迟，密码可以被无限次尝试
 * （`src/middleware.ts` 的 matcher 明确排除了 /admin，中间件层也不会拦）。
 *
 * 策略：**只对失败计数**，成功即清零。这样正常操作永远不会被自己挡在门外，
 * 而暴力破解每 10 分钟最多 8 次，猜中概率可以忽略。
 *
 * 键用 IP；拿不到 IP（例如本地 next dev 没有 cf-connecting-ip）时退化成
 * 单个全局桶——宁可在大后端偶尔误伤，也不要出现「无 IP 就不限流」的空档。
 */

import { createRateLimiter } from './rateLimit'

/** 10 分钟内允许 8 次失败 */
const LOGIN_FAILURE_LIMIT = 8
const LOGIN_FAILURE_WINDOW_MS = 10 * 60_000

/** 拿不到 IP 时用的桶名，避免限流形同虚设。 */
export const UNKNOWN_CLIENT = 'unknown-client'

const limiter = createRateLimiter({
  limit: LOGIN_FAILURE_LIMIT,
  windowMs: LOGIN_FAILURE_WINDOW_MS,
  // 后台登录的并发客户端极少，几个键足够；上限压低进一步限制内存。
  maxKeys: 200
})

/** 从请求头里取客户端 IP（Cloudflare 与本地开发两种形态）。 */
export function clientIpFromHeaders(headers: Pick<Headers, 'get'>): string {
  const direct = headers.get('cf-connecting-ip')?.trim()
  if (direct) return direct
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return UNKNOWN_CLIENT
}

/** 这个 IP 现在还能不能再试一次（不计数）。 */
export function isLoginBlocked(ip: string): boolean {
  return !limiter.peek(ip).allowed
}

/** 记一次失败。 */
export function recordLoginFailure(ip: string): void {
  limiter.hit(ip)
}

/** 登录成功后清掉失败计数。 */
export function clearLoginFailures(ip: string): void {
  limiter.reset(ip)
}

/** 仅用于测试与观测。 */
export function loginThrottleSize(): number {
  return limiter.size()
}
