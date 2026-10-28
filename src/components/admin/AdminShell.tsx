import Link from 'next/link'
import { logoutAction } from '@/app/admin/actions'
import AdminNav from './AdminNav'
import RefreshButton from './RefreshButton'

/** 后台外框：标题 + 导航 + 刷新 + 退出登录。各页面自己决定要不要包它。 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/zh"
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            回站点
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-white">后台</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminNav />
          {/* 刷新和退出放一组：窄屏一行放不下时整组换行，不会把「退出」单独挤到下一行。 */}
          <div className="flex items-center gap-3">
            <RefreshButton />
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-400 transition hover:border-rose-400/40 hover:text-rose-200"
              >
                退出
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
