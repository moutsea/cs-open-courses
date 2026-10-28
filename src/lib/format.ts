/** 数字展示的统一入口，避免各处各写一份 toLocaleString。 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * 紧凑写法：1,234 → 1.2k，12,345 → 12.3k，123,456 → 123k。
 *
 * 用在空间很窄的地方（柱子上方的标注、纵轴刻度）。窄屏一列只有 20 来像素，
 * 写全量数字会压到隔壁列上；精确值留给悬浮卡片。
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const abs = Math.abs(value)
  if (abs < 1000) return String(Math.round(value))
  const units: [number, string][] = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k']
  ]
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = value / size
      // 三位数以上不留小数（123k），否则保留一位（10.5k），避免半值刻度被四舍五入成 11k。
      const digits = Math.abs(scaled) >= 100 ? 0 : 1
      return `${scaled.toFixed(digits).replace(/\.0$/, '')}${suffix}`
    }
  }
  return String(Math.round(value))
}
