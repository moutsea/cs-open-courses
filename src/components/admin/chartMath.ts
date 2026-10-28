/**
 * 柱状图的纯计算：刻度、柱子高度、悬浮卡片定位、按横坐标选列。
 *
 * 抽在这里的原因有两个：组件保持清爽；这些逻辑不用渲染就能测（jsdom 没有布局，
 * 在组件里只能靠 stub getBoundingClientRect 间接测）。
 */

/** 悬浮卡片宽度上限（px）。左右夹紧按「一半」算，窄屏时宽度跟着绘图区收。 */
export const TOOLTIP_WIDTH = 232
export const TOOLTIP_HALF = TOOLTIP_WIDTH / 2

/** 柱子高度：0 值留 2px 的基线痕迹，其余最少 3%，免得小值看不见。 */
export function barHeight(value: number, max: number): string {
  if (value <= 0) return '2px'
  return `${Math.max((value / max) * 100, 3)}%`
}

/**
 * 纵轴刻度：0 / 半值 / 最大值。
 *
 * 最大值为 1（全 0，或只有 1 条数据）时半值会算成 1，跟顶档重复，
 * 所以退化成 0 / 1 两档；全 0 时只留一个 0，别编造一个「1」当最大值。
 */
export function axisTicks(max: number, allZero: boolean): number[] {
  if (allZero) return [0]
  const safeMax = Math.max(max, 1)
  const mid = Math.round(safeMax / 2)
  return mid > 0 && mid < safeMax ? [safeMax, mid, 0] : [safeMax, 0]
}

/** Position an axis value as a percentage from the top of the plot. */
export function axisTopPercent(value: number, max: number): number {
  const safeMax = Math.max(max, 1)
  return ((safeMax - value) / safeMax) * 100
}

/**
 * 悬浮卡片的定位。
 *
 * 横向：按列中心，夹在绘图区内；卡片宽度取 `min(232px, 100%)`，半宽取 `min(116px, 50%)`，
 * 于是绘图区比卡片还窄时（小屏手机）卡片正好铺满绘图区，不会顶到卡片外面去。
 * 纵向：普通柱放在柱顶上方；高柱翻到柱顶下方，避免越过绘图区顶部覆盖面板标题。
 */
export function tooltipPlacement({
  index,
  count,
  height
}: {
  index: number
  count: number
  height: string
}): { left: string; bottom?: string; top?: string; width: string } {
  const center = ((index + 0.5) / Math.max(count, 1)) * 100
  const half = `min(${TOOLTIP_HALF}px, 50%)`
  const barPercent = height.endsWith('%') ? Number.parseFloat(height) : 0
  return {
    width: `min(${TOOLTIP_WIDTH}px, 100%)`,
    left: `clamp(${half}, ${center}%, calc(100% - ${half}))`,
    ...(barPercent >= 50
      ? { top: `calc(100% - ${height} + 10px)` }
      : { bottom: `calc(${height} + 10px)` })
  }
}

/**
 * 按指针横坐标换算落在哪一列。
 *
 * 90 天在手机上每列只有 1px 出头，靠柱子自己做热区根本点不中；
 * 所以整个绘图区都当指针板，按比例算最近的一列（车道等宽，间距误差可以忽略）。
 */
export function laneFromPointerX({
  clientX,
  left,
  width,
  count
}: {
  clientX: number
  left: number
  width: number
  count: number
}): number | null {
  if (count <= 0 || !Number.isFinite(width) || width <= 0) return null
  const ratio = (clientX - left) / width
  if (!Number.isFinite(ratio)) return null
  const index = Math.floor(ratio * count)
  return Math.min(count - 1, Math.max(0, index))
}
