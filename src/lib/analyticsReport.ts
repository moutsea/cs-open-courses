/**
 * /admin/analytics 的聚合查询。SQL 单独放一份常量，方便在本地用 sqlite 直接验证语法。
 */

import { shanghaiDaysAgo } from './calendarDay'

export interface CountRow {
  n: number
}

export interface KeyCountRow {
  key: string
  n: number
}

export interface DayRow {
  day: string
  n: number
}

export interface AnalyticsReport {
  days: number
  sinceDay: string
  totals: Record<string, number>
  totalEvents: number
  lastEventAt: number | null
  outboundHosts: KeyCountRow[]
  outboundPages: KeyCountRow[]
  searchTerms: KeyCountRow[]
  filterCategories: KeyCountRow[]
  locales: KeyCountRow[]
  daily: DayRow[]
  devices: KeyCountRow[]
  countries: KeyCountRow[]
}

export const QUERIES = {
  totals: `SELECT name, COUNT(*) AS n FROM analytics_events WHERE day >= ? GROUP BY name ORDER BY n DESC`,
  lastEvent: `SELECT MAX(occurred_at) AS last FROM analytics_events`,
  outboundHosts: `SELECT target_host AS key, COUNT(*) AS n FROM analytics_events
    WHERE name = 'outbound_click' AND target_host <> '' AND day >= ?
    GROUP BY target_host ORDER BY n DESC LIMIT 20`,
  outboundPages: `SELECT path AS key, COUNT(*) AS n FROM analytics_events
    WHERE name = 'outbound_click' AND day >= ?
    GROUP BY path ORDER BY n DESC LIMIT 20`,
  searchTerms: `SELECT json_extract(props_json, '$.q') AS key, COUNT(*) AS n FROM analytics_events
    WHERE name = 'search' AND day >= ? AND json_extract(props_json, '$.q') IS NOT NULL
    GROUP BY key ORDER BY n DESC LIMIT 20`,
  filterCategories: `SELECT json_extract(props_json, '$.category') AS key, COUNT(*) AS n FROM analytics_events
    WHERE name = 'course_filter' AND day >= ?
    GROUP BY key ORDER BY n DESC LIMIT 15`,
  locales: `SELECT locale AS key, COUNT(*) AS n FROM analytics_events
    WHERE day >= ? GROUP BY locale ORDER BY n DESC`,
  daily: `SELECT day AS day, COUNT(*) AS n FROM analytics_events
    WHERE day >= ? GROUP BY day ORDER BY day`,
  devices: `SELECT device AS key, COUNT(*) AS n FROM analytics_events
    WHERE day >= ? GROUP BY device ORDER BY n DESC`,
  countries: `SELECT country AS key, COUNT(*) AS n FROM analytics_events
    WHERE country <> '' AND day >= ? GROUP BY country ORDER BY n DESC LIMIT 15`
} as const

export function sinceDay(days: number, now: number = Date.now()): string {
  const safeDays = Math.min(Math.max(Math.trunc(days) || 1, 1), 365)
  // analytics_events.day 与 page_views.day 都按 Asia/Shanghai 切分，这里必须同口径。
  return shanghaiDaysAgo(safeDays - 1, now)
}

export function normalizeDays(value: string | null): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 30
  return [7, 30, 90].includes(parsed) ? parsed : 30
}

async function all(db: D1Database, sql: string, param: string): Promise<Array<Record<string, unknown>>> {
  const result = await db.prepare(sql).bind(param).all()
  return (result.results as Array<Record<string, unknown>> | undefined) ?? []
}

function toKeyRows(rows: Array<Record<string, unknown>>): KeyCountRow[] {
  return rows.map(row => ({ key: typeof row.key === 'string' ? row.key : String(row.key ?? ''), n: Number(row.n) || 0 }))
}

export async function loadAnalyticsReport(db: D1Database, days: number): Promise<AnalyticsReport> {
  const since = sinceDay(days)
  const [totals, last, outboundHosts, outboundPages, searchTerms, filterCategories, locales, daily, devices, countries] =
    await Promise.all([
      all(db, QUERIES.totals, since),
      db.prepare(QUERIES.lastEvent).first<{ last: number | null }>(),
      all(db, QUERIES.outboundHosts, since),
      all(db, QUERIES.outboundPages, since),
      all(db, QUERIES.searchTerms, since),
      all(db, QUERIES.filterCategories, since),
      all(db, QUERIES.locales, since),
      all(db, QUERIES.daily, since),
      all(db, QUERIES.devices, since),
      all(db, QUERIES.countries, since)
    ])

  const totalsMap: Record<string, number> = {}
  let totalEvents = 0
  for (const row of totals) {
    const name = String(row.name ?? '')
    const count = Number(row.n) || 0
    totalsMap[name] = count
    totalEvents += count
  }

  return {
    days,
    sinceDay: since,
    totals: totalsMap,
    totalEvents,
    lastEventAt: typeof last?.last === 'number' ? last.last : null,
    outboundHosts: toKeyRows(outboundHosts),
    outboundPages: toKeyRows(outboundPages),
    searchTerms: toKeyRows(searchTerms),
    filterCategories: toKeyRows(filterCategories),
    locales: toKeyRows(locales),
    daily: daily.map(row => ({ day: String(row.day ?? ''), n: Number(row.n) || 0 })),
    devices: toKeyRows(devices),
    countries: toKeyRows(countries)
  }
}

/**
 * 内容缺口分析要看的搜索词比看板多得多（看板只关心 Top20），单独一条查询，
 * 免得把 `AnalyticsReport` 的形状改大。
 */
export async function loadSearchTerms(db: D1Database, days: number, limit = 300): Promise<KeyCountRow[]> {
  const since = sinceDay(days)
  const sql = `SELECT json_extract(props_json, '$.q') AS key, COUNT(*) AS n FROM analytics_events
    WHERE name = 'search' AND day >= ? AND json_extract(props_json, '$.q') IS NOT NULL
    GROUP BY key ORDER BY n DESC LIMIT ?`
  const result = await db
    .prepare(sql)
    .bind(since, Math.min(Math.max(Math.trunc(limit) || 300, 1), 1000))
    .all()
  return toKeyRows((result.results as Array<Record<string, unknown>> | undefined) ?? [])
}
