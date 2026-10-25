import type { ReactNode } from 'react'
import type { DayRow, KeyCountRow } from '@/lib/analyticsReport'

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function SectionCard({
  title,
  hint,
  children
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1c34]/80 p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">{title}</h2>
        {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1c34]/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.07em] text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
    </div>
  )
}

/** 排行：左侧名称、中间占比条、右侧数值。 */
export function BarList({
  rows,
  empty,
  mono = false
}: {
  rows: KeyCountRow[]
  empty: string
  mono?: boolean
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>
  const max = Math.max(...rows.map(row => row.n), 1)
  return (
    <ul className="space-y-1">
      {rows.map(row => {
        const width = Math.max(Math.round((row.n / max) * 100), 2)
        const label = row.key === '' ? '（空）' : row.key
        return (
          <li
            key={`${row.key}-${row.n}`}
            className="grid grid-cols-[minmax(0,45%)_minmax(50px,1fr)_46px] items-center gap-2.5 py-[3px]"
          >
            <span
              title={label}
              className={[
                'truncate text-slate-300',
                mono ? 'font-mono text-[12.5px]' : 'text-sm'
              ].join(' ')}
            >
              {label}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-cyan-400/85" style={{ width: `${width}%` }} />
            </span>
            <span className="text-right text-[13px] tabular-nums text-white">{formatNumber(row.n)}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** 占比型：语言 / 设备 / 国家。 */
export function ShareList({ rows, empty }: { rows: KeyCountRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>
  const total = rows.reduce((sum, row) => sum + row.n, 0) || 1
  return (
    <ul className="space-y-1">
      {rows.map(row => {
        const share = Math.round((row.n / total) * 100)
        return (
          <li
            key={`${row.key}-${row.n}`}
            className="grid grid-cols-[minmax(0,45%)_minmax(50px,1fr)_46px] items-center gap-2.5 py-[3px]"
          >
            <span className="truncate text-sm text-slate-300">{row.key || '（未知）'}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-cyan-400/85"
                style={{ width: `${Math.max(share, 2)}%` }}
              />
            </span>
            <span className="text-right text-[13px] tabular-nums text-white">{share}%</span>
          </li>
        )
      })}
    </ul>
  )
}

/** 每日事件量柱状图（纯 div，无依赖）。 */
export function DayChart({ daily, days, sinceDay }: { daily: DayRow[]; days: number; sinceDay: string }) {
  const counts = new Map(daily.map(row => [row.day, row.n]))
  const start = new Date(`${sinceDay}T00:00:00Z`).getTime()
  const series = Array.from({ length: days }, (_, index) => {
    const day = new Date(start + index * 86_400_000).toISOString().slice(0, 10)
    return { day, n: counts.get(day) ?? 0 }
  })
  const max = Math.max(...series.map(item => item.n), 1)
  const peak = series.reduce((best, item) => (item.n > best.n ? item : best), series[0])

  return (
    <div>
      <div className="flex h-[132px] items-end gap-[3px]">
        {series.map(item => (
          <div
            key={item.day}
            title={`${item.day} · ${item.n} 条`}
            className={[
              'flex-1 rounded-t-[3px]',
              item.n === 0 ? 'bg-white/10' : 'bg-cyan-400/85'
            ].join(' ')}
            style={{ height: item.n === 0 ? '2px' : `${Math.max((item.n / max) * 100, 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{sinceDay}</span>
        <span>
          峰值 {peak.n} 条 / {peak.day}
        </span>
        <span>今天</span>
      </div>
    </div>
  )
}

/** 访问趋势：柱高按 PV，鼠标悬停给出当天 PV / UV / 爬虫。 */
export function TrafficChart({ daily }: { daily: { day: string; pv: number; uv: number; bots: number }[] }) {
  if (daily.length === 0) return <p className="text-sm text-slate-500">区间内没有访问记录</p>
  const max = Math.max(...daily.map(item => item.pv), 1)
  const peak = daily.reduce((best, item) => (item.pv > best.pv ? item : best), daily[0])
  return (
    <div>
      <div className="flex h-[132px] items-end gap-[3px]">
        {daily.map(item => (
          <div
            key={item.day}
            title={`${item.day} · PV ${formatNumber(item.pv)} · 日 UV ${formatNumber(item.uv)}${item.bots > 0 ? ` · 爬虫 ${formatNumber(item.bots)}` : ''}`}
            className={['flex-1 rounded-t-[3px]', item.pv === 0 ? 'bg-white/10' : 'bg-cyan-400/85'].join(' ')}
            style={{ height: item.pv === 0 ? '2px' : `${Math.max((item.pv / max) * 100, 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{daily[0].day}</span>
        <span>
          峰值 {formatNumber(peak.pv)} PV / {peak.day}
        </span>
        <span>{daily[daily.length - 1].day}</span>
      </div>
    </div>
  )
}

/**
 * 访问榜：PV 与「日 UV 合计」两个维度。
 *
 * 它比 BarList 多一列，因为 PV 高的页面不一定人多（一个人反复刷也能堆出 PV）。
 */
export function TrafficTable({
  rows,
  empty,
  mono = false
}: {
  rows: { label: string; pv: number; visitorDays: number }[]
  empty: string
  mono?: boolean
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>
  const total = rows.reduce((sum, row) => sum + row.pv, 0) || 1
  return (
    <ul className="space-y-1">
      {rows.map(row => {
        const share = Math.round((row.pv / total) * 100)
        return (
          <li
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_54px_54px_44px] items-center gap-2 py-[3px] text-[13px] tabular-nums"
          >
            <span
              title={row.label}
              className={['truncate text-slate-300', mono ? 'font-mono text-[12.5px]' : ''].join(' ')}
            >
              {row.label}
            </span>
            <span className="text-right text-white">{formatNumber(row.pv)}</span>
            <span className="text-right text-slate-400">{formatNumber(row.visitorDays)}</span>
            <span className="text-right text-slate-500">{share}%</span>
          </li>
        )
      })}
      <li className="grid grid-cols-[minmax(0,1fr)_54px_54px_44px] gap-2 border-t border-white/10 pt-1.5 text-[11px] uppercase tracking-[0.07em] text-slate-500">
        <span>名称</span>
        <span className="text-right">PV</span>
        <span className="text-right">日 UV 合计</span>
        <span className="text-right">占比</span>
      </li>
    </ul>
  )
}
