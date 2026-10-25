import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { normalizeBatch } from '@/lib/analyticsServer'
import { MAX_ANALYTICS_BODY_BYTES } from '@/lib/analyticsLimits'
import { createRateLimiter } from '@/lib/rateLimit'

/**
 * 第一方事件收集入口。设计目标：
 * - 只接受白名单事件，字段长度全部截断，避免被当作任意写入通道；
 * - 不落库 IP / User-Agent，只保留国家与设备类型；
 * - 拿不到 D1 绑定（本地 next dev）时直接 204，不报错、不阻塞页面。
 */

export const dynamic = 'force-dynamic'

const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 120

// 旧实现用一张只增不减的 Map，被随机 IP 打就会一直占内存；这里带上过期清理与键数上限。
const limiter = createRateLimiter({ limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS })

/**
 * 是不是「明确声明了跨站」的请求。
 *
 * 浏览器发 POST 一定带 Origin（同源也一样）或 Sec-Fetch-Site，所以真实浏览器流量
 * 不可能绕过这层判断；而缺头的是 curl / 测试这类非浏览器客户端，从头部无从判断来源，
 * 交给限流兜底。换句话说：只拒绝有证据表明跨站的请求，避免误伤合法调用。
 */
function isCrossSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return true
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== new URL(request.url).host
  } catch {
    return true
  }
}

/** 声明了 content-type 却不是 JSON 的请求一律拒绝：跨站 no-cors 只能发简单类型。 */
function hasWrongContentType(request: Request): boolean {
  const contentType = request.headers.get('content-type')
  if (!contentType) return false
  return !contentType.toLowerCase().includes('application/json')
}

function detectDevice(userAgent: string): string {
  return /Mobi|Android|iPhone|iPad|Tablet/i.test(userAgent) ? 'mobile' : 'desktop'
}

function unavailable(error: unknown): NextResponse {
  console.error(JSON.stringify({
    message: 'Analytics insert failed',
    error: error instanceof Error ? error.message : 'Unknown error'
  }))
  // A failed write must not acknowledge the batch: fetch clients retain it for recovery.
  return new NextResponse(null, { status: 503 })
}

async function readBody(request: Request): Promise<string | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) return text + decoder.decode()
      size += value.byteLength
      if (size > MAX_ANALYTICS_BODY_BYTES) return null
      text += decoder.decode(value, { stream: true })
    }
  } catch {
    // Aborted or broken uploads are invalid analytics batches, not server failures.
    return null
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export async function POST(request: Request) {
  if (isCrossSite(request)) {
    return new NextResponse(null, { status: 403 })
  }
  if (hasWrongContentType(request)) {
    return new NextResponse(null, { status: 415 })
  }

  const ip = request.headers.get('cf-connecting-ip') || ''
  if (!limiter.hit(ip).allowed) {
    return new NextResponse(null, { status: 429 })
  }

  const body = await readBody(request)
  if (!body) {
    return new NextResponse(null, { status: 204 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return new NextResponse(null, { status: 204 })
  }
  const events = normalizeBatch('events' in payload ? payload.events : undefined)
  if (events.length === 0) return new NextResponse(null, { status: 204 })

  const now = Date.now()
  const day = new Date(now).toISOString().slice(0, 10)
  const device = detectDevice(request.headers.get('user-agent') || '')
  const country = (request.headers.get('cf-ipcountry') || '').slice(0, 2)

  let db: CloudflareEnv['DB'] | undefined
  try {
    db = (await getCloudflareContext({ async: true })).env.DB
  } catch (error) {
    // Local next dev may run without Cloudflare; production configuration failures must surface.
    if (process.env.NODE_ENV !== 'production') return new NextResponse(null, { status: 204 })
    return unavailable(error)
  }
  if (!db) {
    if (process.env.NODE_ENV !== 'production') return new NextResponse(null, { status: 204 })
    return unavailable(new Error('Missing analytics DB binding'))
  }

  try {
    await db.batch(
      events.map(event =>
        db
          .prepare(
            `INSERT INTO analytics_events (occurred_at, day, name, path, locale, target_host, props_json, country, device)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(now, day, event.name, event.path, event.locale, event.targetHost, event.props, country, device)
      )
    )
  } catch (error) {
    return unavailable(error)
  }

  return new NextResponse(null, { status: 204 })
}
