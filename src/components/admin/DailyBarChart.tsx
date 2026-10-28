'use client'

import { useState } from 'react'
import { formatCompact, formatNumber } from '@/lib/format'
import { weekdayLabel } from '@/lib/calendarDay'
import { axisTicks, axisTopPercent, barHeight, laneFromPointerX, tooltipPlacement } from './chartMath'

/** 柱状图的一条：日期 + 主指标值 + 悬浮时附带的次要指标。 */
export interface DailyBarPoint {
  day: string
  value: number
  extras?: { label: string; value: number }[]
}

const PLOT_HEIGHT = 148
/** 超过这个列数就把间距压到 1px：否则 90 天在手机上车道宽度会算成负的，柱子直接消失。 */
const DENSE_THRESHOLD = 45
/** 每条指标前的圆点颜色，PV / 日 UV / 爬虫各自固定，扫一眼就能对上。 */
const DOT_COLORS = ['bg-cyan-300', 'bg-teal-300', 'bg-amber-300']

/**
 * 每日柱状图（纯 div，无图表库依赖）。
 *
 * 数值的几条出口：
 * 1. 列少（≤ 8 根）时直接把数字标在柱子上，一眼就能读；
 * 2. 鼠标在绘图区任意位置移动/点击，按横坐标取最近的一列 —— 90 天在手机上
 *    每列只有 1px 出头，靠柱子自己当热区是点不中的；
 * 3. 键盘：整张图只占一个 Tab 停靠点（roving tabindex），用左右方向键 / Home / End 逐天看；
 * 4. 触屏点按（用 click 判定，滚动/划动不会误触发），卡片跟着留下。
 *
 * 视觉上：实色青柱 + 顶部一道内高光描边，悬停那一列加淡青底、柱身发光但不改色；
 * 背景铺 0 / 50% / 100% 三条参考线，纵轴写刻度，不悬浮也能读出量级；
 * 列少时柱子限宽居中、并逐列标日期与星期，别把 7 根柱子拉成一整面墙。
 */
export function DailyBarChart({
  points,
  unit,
  empty
}: {
  points: DailyBarPoint[]
  /** 指标单位：PV / 事件。用在悬浮卡片与下方峰值说明里。 */
  unit: string
  /** 一条数据都没有时的提示文案。 */
  empty?: string
}) {
  const [activeDay, setActiveDay] = useState<string | null>(null)
  // Tab 停靠点单独记，只跟着焦点走。日期与按钮的 key 一致，范围更新时
  // 即使同一天换了数组下标，焦点、提示和停靠点也仍指向同一天。
  const [focusDay, setFocusDay] = useState<string | null>(null)
  const activeIndex = points.findIndex(point => point.day === activeDay)
  const focusIndex = points.findIndex(point => point.day === focusDay)
  // 日期被移除时清掉记忆，避免后续范围再次包含它时凭空恢复旧提示。
  if (activeDay !== null && activeIndex === -1) setActiveDay(null)
  if (focusDay !== null && focusIndex === -1) setFocusDay(null)

  if (points.length === 0) return <p className="text-sm text-slate-500">{empty ?? '区间内没有记录'}</p>

  const max = Math.max(...points.map(point => point.value), 1)
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0])
  const activePoint = activeIndex === -1 ? null : points[activeIndex]
  // 原焦点日期已不在区间内时退回第一列，保持整张图恰有一个 Tab 停靠点。
  const tabStop = focusIndex === -1 ? 0 : focusIndex
  const activeHeight = activePoint ? barHeight(activePoint.value, max) : '0%'
  const allZero = points.every(point => point.value === 0)
  // 列少的时候直接把数字标在柱子上；30 / 90 天这种密集视图才完全靠悬浮。
  const showValues = points.length <= 8
  const dense = points.length > DENSE_THRESHOLD
  const ticks = axisTicks(max, allZero)
  const laneGap = dense ? 'gap-px' : 'gap-[3px]'

  /** 指针落在哪一列；绘图区没布局出来（宽高为 0）时返回 null。 */
  const pickLane = (event: { clientX: number; currentTarget: HTMLDivElement }) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return laneFromPointerX({
      clientX: event.clientX,
      left: rect.left,
      width: rect.width,
      count: points.length
    })
  }

  return (
    <div>
      <div className="flex gap-3">
        <div
          className="relative w-9 shrink-0 text-right text-[10px] leading-none tabular-nums text-slate-500"
          style={{ height: PLOT_HEIGHT }}
          aria-hidden
        >
          {ticks.map(tick => (
            <span
              key={tick}
              className={[
                'absolute right-0',
                tick === max && !allZero ? 'text-slate-400' : ''
              ].join(' ')}
              style={
                tick === 0
                  ? { bottom: 0 }
                  : tick === max
                    ? { top: 0 }
                    : { top: `${axisTopPercent(tick, max)}%`, transform: 'translateY(-50%)' }
              }
            >
              {formatCompact(tick)}
            </span>
          ))}
        </div>

        <div
          className="relative flex-1"
          style={{ height: PLOT_HEIGHT }}
          onPointerMove={event => {
            // 手指在图表上划过时多半是在滚页面，别顺手弹出一堆卡片；触屏走下面的点按。
            if (event.pointerType === 'touch') return
            const index = pickLane(event)
            if (index !== null) setActiveDay(points[index].day)
          }}
          onClick={event => {
            // 键盘（Enter / 空格）产生的 click 没有指针坐标，交给柱子自己的 onClick。
            if (event.detail === 0) return
            const index = pickLane(event)
            if (index !== null) setActiveDay(points[index].day)
          }}
          onMouseLeave={event => {
            // focusDay 记的是 Tab 停靠点，失焦后也会保留；这里只恢复实际仍聚焦的列。
            const focused = event.currentTarget.ownerDocument.activeElement
            const index = [...event.currentTarget.querySelectorAll('button')].findIndex(button => button === focused)
            setActiveDay(index >= 0 ? points[index].day : null)
          }}
        >
          {/* 参考线与整数刻度同高；奇数峰值的中档不一定正好在 50%。 */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="absolute inset-x-0 top-0 border-t border-dashed border-white/15" />
            {ticks.length > 2 ? (
              <span
                className="absolute inset-x-0 border-t border-white/[0.07]"
                style={{ top: `${axisTopPercent(ticks[1], max)}%` }}
              />
            ) : null}
            <span className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          </div>

          <div className={['flex h-full items-end', laneGap].join(' ')}>
            {points.map((point, index) => {
              const isActive = activeIndex === index
              const height = barHeight(point.value, max)
              const percent = point.value <= 0 ? 0 : Math.max((point.value / max) * 100, 3)
              // 柱子够高就把数字写在柱子里，矮柱子写在柱顶上方。
              const labelInside = percent > 72
              return (
                <button
                  key={point.day}
                  type="button"
                  onClick={() => setActiveDay(point.day)}
                  onMouseEnter={() => setActiveDay(point.day)}
                  onFocus={() => {
                    setFocusDay(point.day)
                    setActiveDay(point.day)
                  }}
                  onBlur={() => setActiveDay(current => (current === point.day ? null : current))}
                  tabIndex={index === tabStop ? 0 : -1}
                  onKeyDown={event => {
                    // 90 天视图若每根柱子都能 Tab，用户要按 90 次才能越过图表；
                    // 改成整张图一个停靠点 + 方向键移动。
                    const last = points.length - 1
                    const next =
                      event.key === 'ArrowRight'
                        ? Math.min(index + 1, last)
                        : event.key === 'ArrowLeft'
                          ? Math.max(index - 1, 0)
                          : event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? last
                              : null
                    if (next === null) return
                    // 已在首/末列时也要吃掉按键，否则方向键会顺带滚动页面。
                    event.preventDefault()
                    // 边界按键不会触发新的 focus，仍要恢复被鼠标悬停替换的焦点列提示。
                    setActiveDay(points[next].day)
                    if (next === index) return
                    // 用 querySelectorAll 而不是 children + instanceOf HTMLElement：
                    // 后者依赖全局构造器，在 jsdom / iframe 里会直接抛 ReferenceError。
                    event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus()
                  }}
                  aria-label={[
                    `${point.day}：${unit} ${formatNumber(point.value)}`,
                    ...(point.extras ?? []).map(extra => `${extra.label} ${formatNumber(extra.value)}`)
                  ].join('，')}
                  className={[
                    'group relative flex h-full min-w-px flex-1 cursor-pointer items-end rounded-md outline-none',
                    'focus-visible:ring-1 focus-visible:ring-cyan-300/70'
                  ].join(' ')}
                >
                  {/* 悬停/选中底色：宽度跟柱子一致，7 天视图里不会糊成一整块。 */}
                  <span
                    aria-hidden
                    className={[
                      'pointer-events-none absolute inset-y-0 left-0 right-0 mx-auto w-full max-w-[72px]',
                      'rounded-md transition-colors duration-150',
                      isActive ? 'bg-cyan-400/[0.09]' : 'bg-transparent group-hover:bg-cyan-400/[0.05]'
                    ].join(' ')}
                  />
                  <span
                    aria-hidden
                    className={[
                      'relative mx-auto block w-full max-w-[72px] rounded-t-[4px]',
                      'transition-[box-shadow,background-color] duration-200',
                      point.value === 0
                        ? 'bg-cyan-300/20'
                        : isActive
                          ? 'bg-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_18px_rgba(34,211,238,0.5)]'
                          : 'bg-cyan-400/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-cyan-400'
                    ].join(' ')}
                    style={{ height }}
                  >
                    {showValues && labelInside ? (
                      <span className="absolute inset-x-0 top-1 text-center text-[9px] font-semibold leading-tight tabular-nums text-[#04131d] sm:text-[10px]">
                        {formatCompact(point.value)}
                      </span>
                    ) : null}
                  </span>
                  {showValues && !labelInside ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 text-center text-[9px] leading-tight tabular-nums text-slate-400 sm:text-[10px]"
                      style={{ bottom: `calc(${height} + 4px)` }}
                    >
                      {formatCompact(point.value)}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {activePoint ? (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-20 rounded-xl border border-white/15 bg-[#0a1729]/95 px-3 py-2 shadow-2xl shadow-black/60 backdrop-blur-sm"
              style={{
                transform: 'translateX(-50%)',
                ...tooltipPlacement({ index: activeIndex, count: points.length, height: activeHeight }),
                // 多指标在窄屏会换行增高；固定在绘图区顶部，避免中高柱旁的卡片顶出图表。
                top: 8,
                bottom: 'auto'
              }}
            >
              <div className="flex items-baseline gap-1.5 text-[11px] leading-4 text-slate-400">
                <span className="tabular-nums">{activePoint.day}</span>
                <span>{weekdayLabel(activePoint.day)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] leading-4 tabular-nums">
                {[{ label: unit, value: activePoint.value }, ...(activePoint.extras ?? [])].map(
                  (row, rowIndex) => (
                    <span key={row.label} className="inline-flex items-baseline gap-1.5">
                      <span
                        aria-hidden
                        className={[
                          'h-1.5 w-1.5 shrink-0 self-center rounded-full',
                          DOT_COLORS[rowIndex % DOT_COLORS.length]
                        ].join(' ')}
                      />
                      <span className="text-slate-400">{row.label}</span>
                      <span className="text-[12.5px] font-semibold text-white">
                        {formatNumber(row.value)}
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex gap-3">
        <span className="w-9 shrink-0" />
        {allZero ? (
          <p className="flex-1 text-[11px] text-slate-600">这段时间 {unit} 全是 0</p>
        ) : showValues ? (
          // 列少的时候逐列标日期，比只写首尾两天更好读。
          <div className={['flex flex-1', laneGap].join(' ')}>
            {points.map(point => (
              <span key={point.day} className="min-w-0 flex-1 text-center text-[9px] leading-tight sm:text-[10px]">
                <span className="block tabular-nums text-slate-400">{point.day.slice(5)}</span>
                <span className="block text-slate-500">{weekdayLabel(point.day)}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-baseline justify-between text-[11px] text-slate-500">
            <span className="tabular-nums">{points[0].day}</span>
            {/* 窄屏塞不下三段，峰值信息在纵轴顶部已经能看到。 */}
            <span className="hidden text-slate-400 sm:inline">
              峰值 <span className="font-medium text-cyan-200">{formatNumber(peak.value)}</span> {unit} /{' '}
              <span className="tabular-nums">{peak.day}</span>
            </span>
            <span className="tabular-nums">{points[points.length - 1].day}</span>
          </div>
        )}
      </div>
    </div>
  )
}
