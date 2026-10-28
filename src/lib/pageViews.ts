/**
 * 访问统计（PV / UV）的服务端逻辑。
 *
 * 与 0004 的行为事件（`/api/track`）分开：那张表回答「用户想找什么」，
 * 这张表回答「来了多少人」。设计上的硬约束照抄 0004：
 *
 * - 不存原始 IP、不存 User-Agent、不存 Cookie；
 * - 访客标识 = sha256(IP + UA + 当日 + 盐)，跨天即失效，不能反查个人；
 * - 爬虫单独记账（`collection_method = 'bot'`），不计入 PV。
 *
 * 所有函数都把 `db` 当第一参数，测试可以直接塞一个真实的 node:sqlite 适配器。
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isTrackedPage, normalizePath } from './pageViewPaths'
import { DAY_OFFSET_SECONDS, shanghaiDay, shanghaiDaysAgo } from './calendarDay'

export { isTrackedPage, normalizePath }
export { DAY_OFFSET_SECONDS, shanghaiDay, shanghaiDaysAgo }

/** 与 0004 的行为事件一致：180 天后由每日 cron 清掉。 */
export const PAGE_VIEW_RETENTION_DAYS = 180

/** 删旧数据的分块大小，避免一次 DELETE 锁库太久。 */
export const PAGE_VIEW_PURGE_CHUNK = 5000

export type PageViewDevice = 'desktop' | 'mobile' | 'tablet'

export type PageViewCollectionMethod = 'browser' | 'bot' | 'legacy'

/**
 * 只统计人类访问：Googlebot 之类如果执行了 JS，会被浏览器上报重复计一次，
 * 所以采集端遇到已知爬虫直接跳过，爬虫请求由 middleware 单独记账。
 */
const BOT_PATTERN =
  /bot\b|bot\/|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|headlesschrome|phantomjs|python-requests|python-urllib|curl\/|wget\/|axios\/|go-http-client|okhttp|java\/|libwww|http-client|monitor|uptime|pingdom|lighthouse|gtmetrix|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|yandexbot|baiduspider|sogou|exabot|ia_archiver/i

export function isBotUserAgent(userAgent: string): boolean {
  return BOT_PATTERN.test(userAgent)
}

export function classifyDevice(userAgent: string): PageViewDevice {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** 把来源 URL 收敛成主机名，去 www 前缀；未能归因的站内来源归入「直接访问 / 来源未知」。 */
export function referrerHost(referrer: string | null, siteHost: string): string {
  if (!referrer) return ''
  try {
    const url = new URL(referrer)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (!host) return ''
    if (siteHost && host === siteHost.replace(/^www\./, '').toLowerCase()) return ''
    return host
  } catch {
    return ''
  }
}

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/**
 * 当日访客标识。盐每天都参与运算，所以同一个人昨天和今天的哈希不同，
 * 数据库里凑不出「某个人的历史轨迹」。
 */
export async function visitorHash(ip: string, userAgent: string, day: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${userAgent}|${day}|${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(digest))
}

export interface PageViewInput {
  /** browser = 浏览器实际展示后上报；bot = middleware 记录的爬虫请求。 */
  collectionMethod: Exclude<PageViewCollectionMethod, 'legacy'>
  /** 浏览器每次浏览的随机 UUID；爬虫记录传 null。 */
  eventId: string | null
  pathname: string
  /** 原始查询串：只用来取三个 UTM 字段，其余参数（比如筛选条件）不落库。 */
  search: string
  referrer: string | null
  userAgent: string
  ip: string
  country: string
}

export interface RecordPageViewOptions {
  salt: string
  /** 本站主机名，用来排除未能归因的站内 referrer。 */
  siteHost?: string
  now?: number
  /**
   * 顺手清理过期数据的概率，默认 2%（约每 50 次写入清理一次），
   * 这样不用为访问表再单独加一个 cron。
   */
  purgeProbability?: number
  /** 便于测试固定「是否触发清理」，不传则用 Math.random()。 */
  random?: () => number
}

export interface RecordPageViewResult {
  /** 真正插入了新行（false 多半是同一 eventId 重传）。 */
  inserted: boolean
  /** 本次是否触发了过期清理。 */
  purged: number
  day: string
  path: string
}

/**
 * 写一条访问记录。
 *
 * 失败要让调用方决定怎么处理：浏览器上报失败可以忽略，爬虫记录失败只记日志，
 * 绝不能因为统计把页面打挂。
 */
export async function recordPageView(
  db: CloudflareEnv['DB'],
  input: PageViewInput,
  options: RecordPageViewOptions
): Promise<RecordPageViewResult> {
  const now = options.now ?? Date.now()
  const day = shanghaiDay(now)
  const path = normalizePath(input.pathname)
  // 后台/接口/静态资源即使被上报也不入库（客户端也拦了一层，这里是兜底）。
  if (!isTrackedPage(input.pathname)) {
    return { inserted: false, purged: 0, day, path }
  }

  const params = new URLSearchParams(input.search)
  const hash = await visitorHash(input.ip, input.userAgent, day, options.salt)
  const bot = isBotUserAgent(input.userAgent)

  const result = await db
    .prepare(
      `INSERT INTO page_views (
         day, path, referrer_host, utm_source, utm_medium, utm_campaign,
         visitor_hash, country, device, is_bot, collection_method, event_id, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(event_id) DO NOTHING`
    )
    .bind(
      day,
      path,
      referrerHost(input.referrer, options.siteHost ?? ''),
      (params.get('utm_source') ?? '').slice(0, 60),
      (params.get('utm_medium') ?? '').slice(0, 60),
      (params.get('utm_campaign') ?? '').slice(0, 60),
      hash,
      input.country.slice(0, 8),
      classifyDevice(input.userAgent),
      bot ? 1 : 0,
      input.collectionMethod,
      input.eventId,
      Math.floor(now / 1000)
    )
    .run()

  const changes = Number((result as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
  const inserted = changes > 0

  let purged = 0
  const probability = options.purgeProbability ?? 0.02
  const roll = (options.random ?? Math.random)()
  if (probability > 0 && roll < probability) {
    purged = await purgePageViews(db, { now })
  }

  return { inserted, purged, day, path }
}

/**
 * 记录一条爬虫文档请求（middleware 里调用）。
 *
 * 这条路径在 edge middleware 上跑，任何异常都必须被吞掉：统计挂掉不能连累页面。
 * 拿不到 D1 绑定（本地 next dev）时直接跳过。
 */
export async function recordBotPageView(input: Omit<PageViewInput, 'collectionMethod' | 'eventId'>): Promise<void> {
  let db: CloudflareEnv['DB'] | undefined
  let salt = 'cs-courses-analytics'
  try {
    const context = await getCloudflareContext({ async: true })
    const env = context.env as unknown as Record<string, unknown>
    db = env.DB as CloudflareEnv['DB'] | undefined
    for (const key of ['ANALYTICS_SALT', 'ADMIN_SESSION_SECRET']) {
      const value = env[key]
      if (typeof value === 'string' && value.length > 0) {
        salt = value
        break
      }
    }
  } catch {
    return
  }
  if (!db) return
  await recordPageView(
    db,
    { ...input, collectionMethod: 'bot', eventId: null },
    // 爬虫请求不触发清理：它们的频率不可控，清理交给 cron 与浏览器写入那条路径。
    { salt, purgeProbability: 0 }
  )
}

export interface PurgePageViewsOptions {
  days?: number
  now?: number
  chunk?: number
}

/**
 * 删除超过保留期的访问记录。
 *
 * 用 `rowid IN (SELECT ... LIMIT ?)` 而不是 `DELETE ... LIMIT`：后者要靠
 * SQLITE_ENABLE_UPDATE_DELETE_LIMIT 编译选项，D1 上不保证有。
 */
export async function purgePageViews(
  db: CloudflareEnv['DB'],
  options: PurgePageViewsOptions = {}
): Promise<number> {
  const days = options.days ?? PAGE_VIEW_RETENTION_DAYS
  const now = options.now ?? Date.now()
  const chunk = options.chunk ?? PAGE_VIEW_PURGE_CHUNK
  const cutoff = Math.floor(now / 1000) - days * 24 * 60 * 60
  const result = await db
    .prepare('DELETE FROM page_views WHERE rowid IN (SELECT rowid FROM page_views WHERE created_at < ? LIMIT ?)')
    .bind(cutoff, chunk)
    .run()
  return Number((result as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
}

export interface TrafficBucket {
  label: string
  /** 页面浏览量。 */
  pv: number
  /** 区间内「每天去重后再累加」的访客数，不是独立访客。 */
  visitorDays: number
}

export interface TrafficDay {
  day: string
  pv: number
  uv: number
  /** agent 记录下来的爬虫请求数（单独计数，不进 PV）。 */
  bots: number
}

export interface TrafficSummary {
  range: { from: string; to: string; days: number }
  totals: { pv: number; visitorDays: number; bots: number }
  daily: TrafficDay[]
  topPages: TrafficBucket[]
  sources: TrafficBucket[]
  countries: TrafficBucket[]
  devices: TrafficBucket[]
}

interface TotalsRow {
  pv: number
  visitor_days: number
}

interface DailyRow {
  day: string
  pv: number
  uv: number
  bots: number
}

interface LabelRow {
  label: string | null
  pv: number
  visitor_days: number
}

/** 人类浏览的过滤条件；爬虫与旧版记录都不算 PV。 */
const HUMAN = "collection_method = 'browser' AND is_bot = 0"

/** 排行榜统一取多少条。 */
const BUCKET_LIMIT = 15

/**
 * 聚合区间内的 PV / UV 与四个维度。
 *
 * 非法区间（NaN、0、负数）回退到 7 天，上限 90 天。
 */
export async function loadTrafficSummary(
  db: CloudflareEnv['DB'],
  requestedDays: number = 7,
  now: number = Date.now()
): Promise<TrafficSummary> {
  const span = Number.isFinite(requestedDays) && requestedDays >= 1 ? Math.min(Math.trunc(requestedDays), 90) : 7
  const to = shanghaiDay(now)
  const from = shanghaiDaysAgo(span - 1, now)

  const [totalsResult, dailyResult, pageResult, sourceResult, countryResult, deviceResult] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
         FROM page_views WHERE ${HUMAN} AND day BETWEEN ? AND ?`
      )
      .bind(from, to),
    db
      .prepare(
        `SELECT day,
                SUM(CASE WHEN ${HUMAN} THEN 1 ELSE 0 END) AS pv,
                COUNT(DISTINCT CASE WHEN ${HUMAN} THEN visitor_hash END) AS uv,
                SUM(CASE WHEN collection_method = 'bot' AND is_bot = 1 THEN 1 ELSE 0 END) AS bots
         FROM page_views WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day`
      )
      .bind(from, to),
    db
      .prepare(
        `SELECT path AS label, COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
         FROM page_views WHERE ${HUMAN} AND day BETWEEN ? AND ?
         GROUP BY path ORDER BY pv DESC LIMIT ${BUCKET_LIMIT}`
      )
      .bind(from, to),
    db
      .prepare(
        `SELECT CASE
                  WHEN utm_source <> '' THEN 'utm:' || utm_source
                  WHEN referrer_host <> '' THEN referrer_host
                  ELSE '' END AS label,
                COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
         FROM page_views WHERE ${HUMAN} AND day BETWEEN ? AND ?
         GROUP BY label ORDER BY pv DESC LIMIT ${BUCKET_LIMIT}`
      )
      .bind(from, to),
    db
      .prepare(
        `SELECT country AS label, COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
         FROM page_views WHERE ${HUMAN} AND day BETWEEN ? AND ?
         GROUP BY country ORDER BY pv DESC LIMIT 12`
      )
      .bind(from, to),
    db
      .prepare(
        `SELECT device AS label, COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
         FROM page_views WHERE ${HUMAN} AND day BETWEEN ? AND ?
         GROUP BY device ORDER BY pv DESC`
      )
      .bind(from, to)
  ])

  const totals = ((totalsResult.results?.[0] as unknown as TotalsRow | undefined)) ?? { pv: 0, visitor_days: 0 }
  const botsResult = await db
    .prepare(
      `SELECT COUNT(*) AS bots FROM page_views
       WHERE collection_method = 'bot' AND is_bot = 1 AND day BETWEEN ? AND ?`
    )
    .bind(from, to)
    .first<{ bots: number }>()

  const viewsByDay = new Map(
    ((dailyResult.results as unknown as DailyRow[] | undefined) ?? []).map(row => [row.day, row])
  )

  // 补零：没有访问的那天也要出现，否则趋势图会把空档挤掉。
  const daily: TrafficDay[] = []
  for (let index = span - 1; index >= 0; index -= 1) {
    const day = shanghaiDaysAgo(index, now)
    const row = viewsByDay.get(day)
    daily.push({
      day,
      pv: Number(row?.pv ?? 0),
      uv: Number(row?.uv ?? 0),
      bots: Number(row?.bots ?? 0)
    })
  }

  const bucket = (rows: LabelRow[] | undefined, fallback: string): TrafficBucket[] =>
    (rows ?? []).map(row => ({
      label: row.label ? row.label : fallback,
      pv: Number(row.pv ?? 0),
      visitorDays: Number(row.visitor_days ?? 0)
    }))

  return {
    range: { from, to, days: span },
    totals: {
      pv: Number(totals.pv ?? 0),
      visitorDays: Number(totals.visitor_days ?? 0),
      bots: Number(botsResult?.bots ?? 0)
    },
    daily,
    topPages: bucket(pageResult.results as unknown as LabelRow[] | undefined, '/'),
    sources: bucket(sourceResult.results as unknown as LabelRow[] | undefined, '直接访问 / 来源未知'),
    countries: bucket(countryResult.results as unknown as LabelRow[] | undefined, '未知'),
    devices: bucket(deviceResult.results as unknown as LabelRow[] | undefined, 'desktop')
  }
}
