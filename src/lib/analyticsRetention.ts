/**
 * 埋点事件的保留期清理。
 *
 * `migrations/0004_analytics_events.sql` 没有 TTL，`day` 也没有过期机制，
 * 于是 `analytics_events` 会随着访问量无限增长。这里按天删除过期数据，
 * 由 worker 的每日 cron 触发。
 *
 * 保留 180 天：足够看同比，也不至于把 D1 撑爆（单条 ~200 字节，日均上千事件也是百 MB 级）。
 */

export const ANALYTICS_RETENTION_DAYS = 180

/** 一次最多删多少行，避免单条语句过久占用 D1（cron 每天跑，剩下的下次继续）。 */
export const ANALYTICS_PURGE_CHUNK = 5000

export function analyticsCutoffDay(days = ANALYTICS_RETENTION_DAYS, now = Date.now()): string {
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000)
  return cutoff.toISOString().slice(0, 10)
}

export interface PurgeResult {
  cutoffDay: string
  deleted: number
}

/**
 * 删除 `day < cutoffDay` 的事件。`day` 是 `YYYY-MM-DD` 字符串，字典序即时间序，
 * 所以直接比字符串，能吃到 `analytics_events_day_name_idx` 的左前缀。
 *
 * 分块删除用 rowid 子查询而不是 `DELETE ... LIMIT`：后者依赖 SQLite 的
 * SQLITE_ENABLE_UPDATE_DELETE_LIMIT 编译开关，D1 上不保证可用。
 */
export async function purgeAnalyticsEvents(
  db: CloudflareEnv['DB'],
  options: { days?: number; now?: number; chunk?: number } = {}
): Promise<PurgeResult> {
  const cutoffDay = analyticsCutoffDay(options.days, options.now)
  const chunk = options.chunk ?? ANALYTICS_PURGE_CHUNK
  const result = await db
    .prepare(
      `DELETE FROM analytics_events WHERE rowid IN (
         SELECT rowid FROM analytics_events WHERE day < ? LIMIT ?
       )`
    )
    .bind(cutoffDay, chunk)
    .run()
  const deleted = result?.meta?.changes ?? 0
  return { cutoffDay, deleted }
}
