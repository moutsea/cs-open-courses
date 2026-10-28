/** 按标签页保存入口来源，不引入访客 ID 或 Cookie。 */
export interface PageViewAttribution {
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

const STORAGE_KEY = 'cs-courses:page-view-attribution:v1'
const HISTORY_KEY = '__csCoursesPageViewAttributionV1'
// 布局切换可以重挂载组件，但同一文档的入口不应随当前 URL 改变。
const documentSources = new WeakMap<Document, PageViewAttribution>()

function originOnly(referrer: string): string {
  try {
    const url = new URL(referrer)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : ''
  } catch {
    return ''
  }
}

function parseSource(raw: unknown): PageViewAttribution | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  if (['referrer', 'utmSource', 'utmMedium', 'utmCampaign'].some(key => typeof value[key] !== 'string')) return null
  return {
    referrer: originOnly(value.referrer as string),
    utmSource: (value.utmSource as string).slice(0, 60),
    utmMedium: (value.utmMedium as string).slice(0, 60),
    utmCampaign: (value.utmCampaign as string).slice(0, 60)
  }
}

function readStored(): PageViewAttribution | null {
  try {
    return parseSource(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return null
  }
}

function readHistorySource(): PageViewAttribution | null {
  try {
    return parseSource(window.history.state?.[HISTORY_KEY])
  } catch {
    return null
  }
}

function isHistoryRecord(state: unknown): state is Record<string, unknown> | null {
  if (state === null) return true
  if (typeof state !== 'object') return false
  const prototype = Object.getPrototypeOf(state)
  // History API 也允许 Date、Map、数组等结构化数据，不能展开后破坏其类型和值。
  // 用原型链判断也兼容 iframe / 其它 realm 创建的普通记录。
  return prototype === null || Object.getPrototypeOf(prototype) === null
}

function withHistorySource(state: unknown, source: PageViewAttribution): unknown {
  if (!isHistoryRecord(state)) return state
  // History state 支持循环与共享引用。先克隆整个对象图，再给新根加来源；
  // 浅展开会让 self、Map key 等仍指向旧根，改变历史恢复的数据结构。
  // 旧浏览器没有 structuredClone 时透传；克隆失败则保留原异常，不能再次读取
  // 可能带副作用的 getter，让原本失败的写入意外成功。
  if (state !== null && typeof structuredClone !== 'function') return state
  const snapshot = state === null ? {} : structuredClone(state)
  snapshot[HISTORY_KEY] = source
  return snapshot
}

function preserveHistorySource(source: PageViewAttribution): void {
  // 来源属于整个 Document，包装器也与文档同寿命。组件重挂载不能撤掉 Next
  // 已经捕获的包装器；Next 内外任一层调用 History API 都会同步带上快照。
  // 相同 URL 的导航可能完全不重渲染采集器，不能依赖路由 effect 补写。
  const history = window.history
  for (const method of ['pushState', 'replaceState'] as const) {
    try {
      const original = history[method]
      history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
        args[0] = withHistorySource(args[0], source)
        return original.apply(this, args)
      }
    } catch {
      // History API 被限制时仍可上报来源，后续写入也保持尽力而为。
    }
  }
}

export function storePageViewAttribution(source: PageViewAttribution): void {
  try {
    const state: unknown = window.history.state
    if (isHistoryRecord(state)) {
      // 绑定到当前历史条目，返回旧入口时不借用 sessionStorage 中较新的来源。
      // 保留 Next.js 的路由状态，不改 URL，也不新增历史条目。
      window.history.replaceState(withHistorySource(state, source), '')
    }
  } catch {
    // History API 受限不应影响页面访问上报。
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(source))
  } catch {
    // 存储被禁用时，组件内的 ref 仍能让 SPA 跳转沿用入口来源。
  }
}

/**
 * 仅在新文档/组件首次挂载时读取入口。SPA 内跳转由组件保留这份结果。
 * 刷新和历史恢复优先用该历史条目的来源；站内整页跳转沿用当前来源。
 * 新的外站/直接打开入口读取本次 UTM 和 referrer，
 * 无来源的直接打开也必须覆盖，不能误用上次访问的来源。
 */
export function readPageViewAttribution(): PageViewAttribution {
  const current = documentSources.get(document)
  if (current) return current
  const referrer = originOnly(document.referrer)
  const siteHost = window.location.hostname.replace(/^www\./, '')
  const internal = referrer !== '' && new URL(referrer).hostname.replace(/^www\./, '') === siteHost
  const params = new URLSearchParams(window.location.search)
  // 站内链接的 UTM 不是入口证据；存储不可用时应降级为未知，不能改记为站内推广。
  const entry: PageViewAttribution = {
    referrer: internal ? '' : referrer,
    utmSource: internal ? '' : (params.get('utm_source') ?? '').slice(0, 60),
    utmMedium: internal ? '' : (params.get('utm_medium') ?? '').slice(0, 60),
    utmCampaign: internal ? '' : (params.get('utm_campaign') ?? '').slice(0, 60)
  }
  const navigation = window.performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
  let stored: PageViewAttribution | null = null
  if (navigation?.type === 'back_forward' || navigation?.type === 'reload') {
    // 只信任当前历史条目的快照。新入口可能在 hydration 前刷新，sessionStorage
    // 仍属于上次入口；当前条目没有快照时使用文档自带的信息，不能借用标签页最近来源。
    stored = readHistorySource()
  } else if (internal) {
    stored = readStored()
  }
  const source = stored ?? entry
  documentSources.set(document, source)
  preserveHistorySource(source)
  storePageViewAttribution(source)
  return source
}
