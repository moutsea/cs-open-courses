import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import AdminShell from '@/components/admin/AdminShell'
import {
  BarList,
  DayChart,
  SectionCard,
  ShareList,
  StatCard,
  formatNumber
} from '@/components/admin/panels'
import { loadAnalyticsReport, normalizeDays } from '@/lib/analyticsReport'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const RANGES = [7, 30, 90] as const

function formatUtc(ms: number | null): string {
  if (!ms) return '暂无数据'
  return `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days = normalizeDays(params.days ?? null)
  const currentPath = `/admin/analytics?days=${days}`
  await requireAdmin(currentPath)

  const { env } = await getCloudflareContext({ async: true }).catch(() => ({ env: {} as { DB?: D1Database } }))
  const db = (env as { DB?: D1Database }).DB

  let report: Awaited<ReturnType<typeof loadAnalyticsReport>> | null = null
  let error = ''
  if (db) {
    try {
      report = await loadAnalyticsReport(db, days)
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause)
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">流量看板</h2>
          <p className="mt-1 text-sm text-slate-400">
            最近 {days} 天（自 {report?.sinceDay ?? '—'}）· 最后一条事件 {formatUtc(report?.lastEventAt ?? null)}
          </p>
        </div>
        <nav className="flex items-center gap-2">
          {RANGES.map(value => (
            <Link
              key={value}
              href={`/admin/analytics?days=${value}`}
              aria-current={value === days ? 'page' : undefined}
              className={[
                'rounded-full border px-3.5 py-1.5 text-sm transition',
                value === days
                  ? 'border-cyan-400 bg-cyan-400 font-medium text-slate-950'
                  : 'border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-white'
              ].join(' ')}
            >
              {value} 天
            </Link>
          ))}
        </nav>
      </div>

      {!db ? (
        <SectionCard title="没有数据库绑定">
          <p className="text-sm text-slate-300">
            当前环境拿不到 D1。本地用 <code className="rounded bg-white/10 px-1.5 py-0.5">npm run cf:dev</code> 跑，线上检查 wrangler 绑定。
          </p>
        </SectionCard>
      ) : null}

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="事件总数" value={formatNumber(report.totalEvents)} hint={`日均 ${formatNumber(Math.round(report.totalEvents / days))} 条`} />
            <StatCard label="出站点击" value={formatNumber(report.totals.outbound_click ?? 0)} hint="点去课程官网 / 教材 / GitHub" />
            <StatCard label="站内搜索" value={formatNumber(report.totals.search ?? 0)} hint="用户到底想找什么" />
            <StatCard label="分类筛选" value={formatNumber(report.totals.course_filter ?? 0)} hint="目录页点分类的次数" />
            <StatCard
              label="收藏 + 进度"
              value={formatNumber((report.totals.course_favorite ?? 0) + (report.totals.course_progress ?? 0))}
              hint={`收藏 ${formatNumber(report.totals.course_favorite ?? 0)} / 进度 ${formatNumber(report.totals.course_progress ?? 0)}`}
            />
          </div>

          {report.totalEvents === 0 ? (
            <SectionCard title="这个时间段没有数据" hint="还没有真实流量">
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                <li>确认生产库已建表：<code className="rounded bg-white/10 px-1.5 py-0.5">npm run db:migrate:prod</code></li>
                <li>确认埋点代码已部署（部署之后才开始上报）</li>
                <li>
                  换更大的范围：<Link href="/admin/analytics?days=90" className="text-cyan-300 hover:underline">90 天</Link>
                </li>
              </ul>
            </SectionCard>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="出站点击 · 域名 Top 20">
              <BarList rows={report.outboundHosts} empty="这段时间还没有出站点击" mono />
            </SectionCard>
            <SectionCard title="出站点击 · 来源页面 Top 20">
              <BarList rows={report.outboundPages} empty="这段时间还没有出站点击" mono />
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="搜索词 Top 20" hint="内容缺口清单">
              <BarList rows={report.searchTerms} empty="这段时间还没有站内搜索" />
            </SectionCard>
            <SectionCard title="分类筛选 Top 15" hint="哪些分类值得做落地页">
              <BarList rows={report.filterCategories} empty="这段时间还没有筛选行为" />
            </SectionCard>
          </div>

          <SectionCard title="每日事件量">
            <DayChart daily={report.daily} days={days} sinceDay={report.sinceDay} />
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <SectionCard title="界面语言">
              <ShareList rows={report.locales} empty="暂无数据" />
            </SectionCard>
            <SectionCard title="设备">
              <ShareList rows={report.devices} empty="暂无数据" />
            </SectionCard>
            <SectionCard title="国家 / 地区">
              <ShareList rows={report.countries} empty="暂无数据" />
            </SectionCard>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            数据来自自己的 D1 表 <code className="rounded bg-white/10 px-1 py-0.5">analytics_events</code>（不存 IP / User-Agent / Cookie）。
            PV/UV 与来源在 Cloudflare 后台 Web Analytics 看，这里看的是站内行为和出站转化。常用 SQL 见仓库
            <code className="mx-1 rounded bg-white/10 px-1 py-0.5">reports/analytics.md</code> 第 7 节。
          </p>
        </>
      ) : null}
    </AdminShell>
  )
}
