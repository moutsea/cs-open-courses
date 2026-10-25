'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  clearSessionCookie,
  getAdminPassword,
  safeEqual,
  setSessionCookie
} from '@/lib/adminAuth'
import {
  clearLoginFailures,
  clientIpFromHeaders,
  isLoginBlocked,
  recordLoginFailure
} from '@/lib/loginThrottle'

/** 只允许跳回站内 /admin 下的路径，避免开放重定向。 */
function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : ''
  if (!raw.startsWith('/admin') || raw.startsWith('//') || raw.includes('://')) return '/admin'
  if (raw.startsWith('/admin/login')) return '/admin'
  return raw
}

export async function loginAction(formData: FormData): Promise<void> {
  const expected = await getAdminPassword()
  const next = safeNext(formData.get('next'))
  const submitted = String(formData.get('password') ?? '')
  const ip = clientIpFromHeaders(await headers())

  if (!expected) {
    redirect('/admin/login?error=unconfigured')
  }
  // 先看节流再比密码：被限流的请求连比较都不做，也少一处时序通道。
  if (isLoginBlocked(ip)) {
    redirect(`/admin/login?error=throttled&next=${encodeURIComponent(next)}`)
  }
  if (!submitted || !safeEqual(submitted, expected)) {
    recordLoginFailure(ip)
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`)
  }

  clearLoginFailures(ip)
  await setSessionCookie()
  revalidatePath('/admin')
  redirect(next)
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  revalidatePath('/admin')
  redirect('/admin/login')
}
