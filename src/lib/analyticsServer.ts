/**
 * /api/track 的校验逻辑单独放一份纯函数，方便单元测试，也不让 Cloudflare 绑定渗进测试环境。
 */

export const ALLOWED_EVENTS: ReadonlySet<string> = new Set([
  'outbound_click',
  'search',
  'course_filter',
  'course_favorite',
  'course_progress',
  'language_switch'
])

import { MAX_EVENTS_PER_REQUEST } from './analyticsLimits'
export { MAX_EVENTS_PER_REQUEST } from './analyticsLimits'
const MAX_PROPS_BYTES = 600

export interface NormalizedEvent {
  name: string
  path: string
  locale: string
  targetHost: string
  props: string
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f]/g, '').slice(0, maxLength)
}

function cleanPath(value: unknown): string {
  const path = cleanString(value, 200).split('?')[0].split('#')[0]
  return path.startsWith('/') ? path : '/'
}

function cleanProps(value: unknown): string {
  if (!value || typeof value !== 'object') return '{}'
  const source = value as Record<string, unknown>
  const clean: Record<string, string | number | boolean> = {}
  for (const [key, raw] of Object.entries(source)) {
    const name = cleanString(key, 24)
    if (!name) continue
    if (typeof raw === 'string') clean[name] = raw.slice(0, 120)
    else if (typeof raw === 'number' && Number.isFinite(raw)) clean[name] = raw
    else if (typeof raw === 'boolean') clean[name] = raw
  }
  const json = JSON.stringify(clean)
  return json.length <= MAX_PROPS_BYTES ? json : JSON.stringify({ truncated: true })
}

export function normalizeEvent(input: unknown): NormalizedEvent | null {
  if (!input || typeof input !== 'object') return null
  const source = input as Record<string, unknown>
  const name = cleanString(source.name, 40)
  if (!ALLOWED_EVENTS.has(name)) return null
  return {
    name,
    path: cleanPath(source.path),
    locale: cleanString(source.locale, 5),
    targetHost: cleanString(source.targetHost, 80),
    props: cleanProps(source.props)
  }
}

export function normalizeBatch(input: unknown, limit: number = MAX_EVENTS_PER_REQUEST): NormalizedEvent[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, limit)
    .map(normalizeEvent)
    .filter((event): event is NormalizedEvent => event !== null)
}
