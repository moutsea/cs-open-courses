import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { loginAction } from '../actions'
import { getAdminPassword, isAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '登录 · CS61B & Beyond 后台',
  robots: { index: false, follow: false }
}

const MESSAGES: Record<string, string> = {
  invalid: '密码不对，再试一次。',
  throttled: '失败次数太多了，等 10 分钟再试。',
  unconfigured: '服务器没有配置 ADMIN_PASSWORD，先在环境变量里设一个。'
}

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const params = await searchParams
  const next = params.next?.startsWith('/admin') ? params.next : '/admin'

  if (await isAuthenticated()) redirect(next)

  const configured = Boolean(await getAdminPassword())
  const error = params.error ? MESSAGES[params.error] ?? '登录失败，再试一次。' : ''

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1c34]/85 p-7">
        <h1 className="text-lg font-semibold text-white">CS61B &amp; Beyond 后台</h1>
        <p className="mt-1 text-sm text-slate-400">输入密码后进入流量看板。</p>

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.07em] text-slate-400">密码</span>
            <input
              type="password"
              name="password"
              autoFocus
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/12 bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            进入后台
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {!configured ? (
          <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            还没有设置 <code>ADMIN_PASSWORD</code>：线上用 <code>npx wrangler secret put ADMIN_PASSWORD</code>，本地写进 <code>.dev.vars</code>。
          </p>
        ) : null}

        <p className="mt-6 text-xs text-slate-600">
          <Link href="/zh" className="hover:text-cyan-300">
            ← 返回站点
          </Link>
        </p>
      </div>
    </main>
  )
}
