import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import AdminShell from '@/components/admin/AdminShell'
import { BarList, DayChart, SectionCard, StatCard, formatNumber } from '@/components/admin/panels'
import { loadAnalyticsReport } from '@/lib/analyticsReport'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  await requireAdmin('/admin')

  const { env } = await getCloudflareContext({ async: true }).catch(() => ({ env: {} as { DB?: D1Database } }))
  const db = (env as { DB?: D1Database }).DB

  if (!db) {
    return (
      <AdminShell>
        <SectionCard title="没有数据库绑定">
          <p className="text-sm text-slate-300">
            当前环境拿不到 D1。本地请用 <code className="rounded bg-white/10 px-1.5 py-0.5">npm run cf:dev</code>，
            线上确认 <code className="rounded bg-white/10 px-1.5 py-0.5">wrangler.jsonc</code> 里的 DB 绑定。
          </p>
        </SectionCard>
      </AdminShell>
    )
  }

  let report: Awaited<ReturnType<typeof loadAnalyticsReport>> | null = null
  let error = ''
  try {
    report = await loadAnalyticsReport(db, 7)
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause)
  }

  return (
    <AdminShell>
      {error ? (
        <SectionCard title="查询失败" hint="多半是表还没建">
          <p className="text-sm text-slate-300">
            跑一次 <code className="rounded bg-white/10 px-1.5 py-0.5">npm run db:migrate:prod</code> 建表。
          </p>
          <p className="mt-2 font-mono text-xs text-slate-500">{error}</p>
        </SectionCard>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="近 7 天事件" value={formatNumber(report.totalEvents)} hint={`日均 ${formatNumber(Math.round(report.totalEvents / 7))} 条`} />
            <StatCard label="出站点击" value={formatNumber(report.totals.outbound_click ?? 0)} hint="点去课程官网 / 教材 / GitHub" />
            <StatCard label="站内搜索" value={formatNumber(report.totals.search ?? 0)} hint="用户主动表达的需求" />
            <StatCard
              label="收藏 + 进度"
              value={formatNumber((report.totals.course_favorite ?? 0) + (report.totals.course_progress ?? 0))}
              hint={`收藏 ${formatNumber(report.totals.course_favorite ?? 0)} / 进度 ${formatNumber(report.totals.course_progress ?? 0)}`}
            />
          </div>

          <SectionCard title="每日事件量 · 近 7 天">
            <DayChart daily={report.daily} days={7} sinceDay={report.sinceDay} />
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="出站域名 Top 10" hint="联盟转化的第一步">
              <BarList rows={report.outboundHosts.slice(0, 10)} empty="还没有出站点击" mono />
            </SectionCard>
            <SectionCard title="搜索词 Top 10" hint="下一步该补什么内容">
              <BarList rows={report.searchTerms.slice(0, 10)} empty="还没有站内搜索" />
            </SectionCard>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/analytics?days=30"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/20"
            >
              看完整的流量看板（30 天）→
            </Link>
            <Link
              href="/admin/gaps?days=90"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              搜了什么但没答上来（内容缺口）→
            </Link>
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}
