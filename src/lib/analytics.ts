/**
 * 第一方轻量统计：把关键行为（出站点击、搜索、筛选、收藏）发到站内 /api/track，
 * 由 Worker 写进 D1。不使用 Cookie、不采集 IP，可作为 Google Analytics 之外的兜底数据源
 * （GA 常被广告拦截插件挡掉，而站内请求基本不受影响）。
 */

import { MAX_ANALYTICS_BODY_BYTES, MAX_EVENTS_PER_REQUEST } from './analyticsLimits'

export type AnalyticsEventName =
  | 'outbound_click'
  | 'search'
  | 'course_filter'
  | 'course_favorite'
  | 'course_progress'
  | 'language_switch'

type PropValue = string | number | boolean

export type AnalyticsProps = Record<string, PropValue | undefined | null>

interface QueuedEvent {
  name: AnalyticsEventName
  path: string
  locale: string
  targetHost: string
  props: Record<string, PropValue>
}

const ENDPOINT = '/api/track'
/** 攒一小段时间再发，避免用户快速连点时产生一串请求。 */
const FLUSH_DELAY = 500
const MAX_QUEUE = 60

let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let isFlushing = false
let flushAll = false

function localeFromPath(path: string): string {
  return path === '/zh' || path.startsWith('/zh/') ? 'zh' : 'en'
}

function currentPath(): string {
  return window.location.pathname.slice(0, 200)
}

function stripLocalePrefix(path: string): string {
  return path.replace(/^\/zh(?=\/|$)/, '') || '/'
}

function sanitizeProps(props: AnalyticsProps): Record<string, PropValue> {
  const clean: Record<string, PropValue> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string') {
      clean[key] = value.replace(/\s+/g, ' ').trim().slice(0, 120)
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) clean[key] = value
    } else if (typeof value === 'boolean') {
      clean[key] = value
    }
  }
  return clean
}

/** 用户开了「请勿追踪」就彻底不发请求。 */
function isOptedOut(): boolean {
  if (typeof navigator === 'undefined') return true
  const nav = navigator as Navigator & { msDoNotTrack?: string }
  if (nav.doNotTrack === '1' || nav.msDoNotTrack === '1') return true
  const legacy = (window as Window & { doNotTrack?: string }).doNotTrack
  return legacy === '1'
}

async function send(body: string): Promise<boolean> {
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) return true
  } catch {
    // A blocked Beacon API must not prevent the fetch fallback.
  }
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
      keepalive: true
    })
    return response.ok
  } catch {
    return false
  }
}

async function flush(drain = false): Promise<void> {
  flushAll ||= drain
  if (timer !== null) clearTimeout(timer)
  timer = null
  if (isFlushing) return
  if (queue.length === 0) { flushAll = false; return }
  isFlushing = true
  let sent = false
  const batch: QueuedEvent[] = []
  try {
    // A batch of 20 valid events can still exceed the byte limit, particularly in Chinese.
    while (queue.length > 0 && batch.length < MAX_EVENTS_PER_REQUEST) {
      const candidate = [...batch, queue[0]]
      if (new TextEncoder().encode(JSON.stringify({ events: candidate })).byteLength > MAX_ANALYTICS_BODY_BYTES) {
        if (batch.length > 0) break
        queue.shift() // An individually oversized event cannot be accepted by the server.
        continue
      }
      batch.push(queue.shift()!)
    }
    sent = batch.length === 0 || await send(JSON.stringify({ events: batch }))
    if (!sent) queue = [...batch, ...queue].slice(-MAX_QUEUE)
  } finally {
    isFlushing = false
    // Keep failures for the next interaction/online event; do not spin while offline.
    if (sent && queue.length > 0) {
      if (flushAll) void flush(true)
      else schedule()
    } else {
      flushAll = false
    }
  }
}

function schedule(): void {
  if (timer !== null) return
  timer = setTimeout(() => { void flush() }, FLUSH_DELAY)
}

/** 记录一个自定义事件。名字必须在 /api/track 的允许列表里，否则会被服务端丢弃。 */
export function track(name: AnalyticsEventName, props: AnalyticsProps = {}, targetHost = ''): void {
  if (typeof window === 'undefined') return
  if (isOptedOut()) return
  if (queue.length >= MAX_QUEUE) queue.shift()
  const path = currentPath()
  queue.push({
    name,
    path,
    locale: localeFromPath(path),
    targetHost,
    props: { page: stripLocalePrefix(path), ...sanitizeProps(props) }
  })
  schedule()
}

/** 出站点击（课程官网、教材、视频、联盟链接）——衡量内容到外部的转化率。 */
export function trackOutbound(url: URL, label: string): void {
  if (typeof window === 'undefined') return
  if (url.hostname === window.location.hostname) return
  // 只记 origin + pathname：query 里可能有邮箱、token、来源追踪参数，
  // 埋点表不该成为第三方的字符串仓库。
  const href = `${url.origin}${url.pathname}`.slice(0, 200)
  track('outbound_click', { host: url.hostname, label, href }, url.hostname)
}

/** 页面离开前把队列里的剩余事件发完（sendBeacon 在 unload 阶段才不会被丢弃）。 */
export function attachAnalyticsFlushListeners(): () => void {
  const onHide = () => { void flush(true) }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onHide)
  window.addEventListener('online', onHide)
  return () => {
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onHide)
    window.removeEventListener('online', onHide)
  }
}
