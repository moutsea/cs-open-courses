import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isTrackedPage } from '@/lib/pageViewPaths'
import { isBotUserAgent, recordPageView } from '@/lib/pageViews'
import { createRateLimiter } from '@/lib/rateLimit'

/**
 * 页面访问上报入口（PV / UV）。
 *
 * 与 `/api/track` 的分工：那边收「行为事件」（搜索、筛选、收藏…），这边只收
 * 「某个页面被真正看到了」。两条链路分开是因为失败语义不同 —— 行为事件丢了
 * 只是少一条样本，访问记录丢了就等于 PV 少一次，所以这里额外要求同源、
 * 限制请求体，并用 eventId 唯一索引吞掉重传。
 *
 * 只记录派生数据：IP 与 User-Agent 拿来算当日访客哈希后就丢弃，不入库。
 */

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4 * 1024
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 120

// 与 /api/track 一样是 isolate 内存限流：多 isolate 时实际阈值会被放大，
// 想要全局限流得换 Durable Object 或 D1 计数表。
const limiter = createRateLimiter({ limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS })

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function empty(status: number): NextResponse {
  return new NextResponse(null, { status, headers: { 'cache-control': 'no-store' } })
}

async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null
  const reader = request.body?.getReader()
  if (!reader) return null
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) return text + decoder.decode()
      size += value.byteLength
      if (size > MAX_BODY_BYTES) return null
      text += decoder.decode(value, { stream: true })
    }
  } catch {
    return null
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

interface PageViewPayload {
  eventId: string
  pathname: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

function parsePayload(raw: unknown): PageViewPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const source = raw as Record<string, unknown>
  const eventId = typeof source.eventId === 'string' ? source.eventId : ''
  const pathname = typeof source.pathname === 'string' ? source.pathname : ''
  if (!UUID_PATTERN.test(eventId)) return null
  if (!pathname || pathname.length > 512 || !isTrackedPage(pathname)) return null
  const text = (value: unknown, max: number): string =>
    typeof value === 'string' ? value.slice(0, max) : ''
  return {
    eventId,
    pathname,
    referrer: text(source.referrer, 512),
    utmSource: text(source.utmSource, 60),
    utmMedium: text(source.utmMedium, 60),
    utmCampaign: text(source.utmCampaign, 60)
  }
}

const SALT_KEYS = ['ANALYTICS_SALT', 'ADMIN_SESSION_SECRET'] as const

/**
 * 访客哈希的盐：优先专用 secret `ANALYTICS_SALT`，没配就复用后台会话密钥，
 * 最后退回固定串（本地开发用；轮换这个值等于把所有历史 UV 打散，所以别在生产依赖兜底）。
 */
function analyticsSalt(env: Record<string, unknown>): string {
  for (const key of SALT_KEYS) {
    const value = env[key]
    if (typeof value === 'string' && value.length > 0) return value
    const fromProcess = process.env[key]
    if (fromProcess) return fromProcess
  }
  return 'cs-courses-analytics'
}

export async function POST(request: Request) {
  // 浏览器上报必须来自本站：其它站点往这里灌水只会污染访问量。
  const origin = request.headers.get('origin')
  const sameOrigin = origin !== null && origin === new URL(request.url).origin
  if (!sameOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return empty(403)
  }
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return empty(415)
  }

  const userAgent = request.headers.get('user-agent') ?? ''
  // 已执行 JS 的已知爬虫交给 middleware 那条链路记账，避免重复计数。
  if (isBotUserAgent(userAgent)) return empty(204)

  const body = await readBody(request)
  if (!body) return empty(400)
  let payload: PageViewPayload | null = null
  try {
    payload = parsePayload(JSON.parse(body))
  } catch {
    payload = null
  }
  if (!payload) return empty(400)

  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  if (!limiter.hit(ip).allowed) return empty(429)

  let db: CloudflareEnv['DB'] | undefined
  let salt = analyticsSalt({})
  try {
    const context = await getCloudflareContext({ async: true })
    const env = context.env as unknown as Record<string, unknown>
    db = env.DB as CloudflareEnv['DB'] | undefined
    salt = analyticsSalt(env)
  } catch (error) {
    // 本地 next dev 没有 Cloudflare 运行时；生产里拿不到上下文要留痕。
    if (process.env.NODE_ENV !== 'production') return empty(204)
    console.error(JSON.stringify({
      message: 'Page view context unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    }))
    return empty(503)
  }
  if (!db) {
    if (process.env.NODE_ENV !== 'production') return empty(204)
    return empty(503)
  }

  try {
    await recordPageView(
      db,
      {
        collectionMethod: 'browser',
        eventId: payload.eventId,
        pathname: payload.pathname,
        search: new URLSearchParams({
          utm_source: payload.utmSource,
          utm_medium: payload.utmMedium,
          utm_campaign: payload.utmCampaign
        }).toString(),
        referrer: payload.referrer || null,
        userAgent,
        ip,
        country: request.headers.get('cf-ipcountry') ?? ''
      },
      { salt, siteHost: new URL(request.url).host }
    )
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Page view insert failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }))
    return empty(503)
  }

  return empty(204)
}
