/**
 * 站点日历日：统一按 Asia/Shanghai（UTC+8，无夏令时）切分。
 *
 * 两张统计表的 `day` 列都由这里产生，写入方和查询方必须用同一套口径，
 * 否则北京时间 00:00–08:00 这段时间，同一批访问会在两张图里落到不同的日子：
 * - `page_views.day`：edge 采集时用 shanghaiDay() 写入；
 * - `analytics_events.day`：track 路由用 shanghaiDay() 写入（0006 迁移之前是 UTC 日，
 *   迁移按 occurred_at 回填成了北京时间日）。
 */
export const DAY_OFFSET_SECONDS = 8 * 60 * 60

/** 时间戳（ms）→ 北京时间的自然日，形如 2026-10-27。 */
export function shanghaiDay(now: number = Date.now()): string {
  return new Date(now + DAY_OFFSET_SECONDS * 1000).toISOString().slice(0, 10)
}

/**
 * 时间戳（ms）→ 北京时间的「2026-10-27 16:12」。
 *
 * 后台展示时间统一走这里：`day` 列已经是北京时间自然日了，时间戳却写成 UTC，
 * 读的人得自己加 8 小时，同一个页面上两套口径很容易看错。
 */
export function shanghaiDateTime(now: number = Date.now()): string {
  return new Date(now + DAY_OFFSET_SECONDS * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

/** 北京时间往前数 N 个自然日，N = 0 即今天。 */
export function shanghaiDaysAgo(days: number, now: number = Date.now()): string {
  return shanghaiDay(now - days * 24 * 60 * 60 * 1000)
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

/**
 * 2026-10-22 → 周四。
 *
 * 入参本身就是日历日，按 UTC 解析不会被本地时区推到前一天；
 * 非法日期返回空串，调用方自己决定怎么兜底。
 */
export function weekdayLabel(day: string): string {
  const time = Date.parse(`${day}T00:00:00Z`)
  if (Number.isNaN(time)) return ''
  return WEEKDAY_LABELS[new Date(time).getUTCDay()]
}
