import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { ADMIN_SESSION_MAX_AGE_SECONDS, sessionToken, verifySessionToken } from './adminSession'

export { sessionToken } from './adminSession'

/**
 * /admin 的登录状态。
 *
 * 不再用 Basic Auth：现在是一个真正的后台页面（有登录页、有导航、以后还会加更多区块），
 * 浏览器原生弹框那种方式没法做「退出登录」和错误提示。
 *
 * 无状态 cookie：签发时间、过期时间和随机 nonce 由 HMAC-SHA256 签名。
 * - 服务端不存 session，不需要额外表；
 * - 改密码 => 旧 cookie 自动失效；
 * - 密码本身不出现在 cookie 里。
 * - 服务端验证签名和 7 天期限，不依赖浏览器删除过期 cookie。
 */

export const ADMIN_COOKIE = 'cs61b_admin'

export function safeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder()
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  let diff = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }
  return diff === 0
}

/** 生产环境用 wrangler secret put ADMIN_PASSWORD，本地写 .dev.vars。 */
export async function getAdminPassword(): Promise<string> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const fromBinding = (env as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD
    if (fromBinding && fromBinding.trim()) return fromBinding.trim()
  } catch {
    // 没有 Cloudflare 上下文（纯 node 环境）时退回 process.env
  }
  return (process.env.ADMIN_PASSWORD || '').trim()
}

/**
 * 可选的独立签名密钥（wrangler secret put ADMIN_SESSION_SECRET）。
 *
 * 未配置时退回只用密码，行为和以前一致；配置后就从「密码就是 HMAC 密钥」
 * 变成「密钥材料 = 密钥 + 密码」：
 * - 泄露密码不足以离线伪造 cookie（攻击者还得知道 secret）；
 * - 改密码仍然让旧 cookie 失效（密码仍在材料里，这个特性必须保住）；
 * - 换 secret 等于强制所有人重新登录。
 */
export async function getAdminSessionSecret(): Promise<string> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const fromBinding = (env as { ADMIN_SESSION_SECRET?: string }).ADMIN_SESSION_SECRET
    if (fromBinding && fromBinding.trim()) return fromBinding.trim()
  } catch {
    // 同上：纯 node 环境退回 process.env
  }
  return (process.env.ADMIN_SESSION_SECRET || '').trim()
}

/** sessionToken() 实际用作 HMAC 密钥的字符串。 */
async function sessionKeyMaterial(password: string): Promise<string> {
  const secret = await getAdminSessionSecret()
  return secret ? `${secret}\n${password}` : password
}

export async function isAuthenticated(): Promise<boolean> {
  const password = await getAdminPassword()
  if (!password) return false
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token, await sessionKeyMaterial(password))
}

/** 页面/布局开头调用；未登录直接跳登录页。 */
export async function requireAdmin(currentPath = '/admin'): Promise<void> {
  if (await isAuthenticated()) return
  redirect(`/admin/login?next=${encodeURIComponent(currentPath)}`)
}

export async function setSessionCookie(): Promise<void> {
  const password = await getAdminPassword()
  const store = await cookies()
  store.set(ADMIN_COOKIE, await sessionToken(await sessionKeyMaterial(password)), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production'
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}
