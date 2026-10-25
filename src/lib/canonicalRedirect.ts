const PRODUCTION_HOSTS = new Set(['cs61bbeyond.com', 'www.cs61bbeyond.com'])

/** 正式站点域名。其它域名（workers.dev / pages.dev 预览）不算。 */
export function isProductionHost(hostname: string): boolean {
  return PRODUCTION_HOSTS.has(hostname)
}

/**
 * 能不能在这台主机上暴露后台。
 *
 * 以前 `wrangler.jsonc` 打开了 `workers_dev` 与 `preview_urls`，每次部署都多一份
 * 带 `*.workers.dev` 的公开副本，后台挂在那里等于多开一个入口。现在两个开关都关了，
 * 这条规则保留作纵深防御（例如有人在 dashboard 里临时重新打开、或走自定义预览域）。规则：
 * - 正式域名：允许；
 * - 本地开发（localhost / 127.0.0.1 / [::1] / *.local）：允许；
 * - 其余（预览副本、被解析过来的自定义域）：后台一律当作不存在。
 */
export function allowsAdminHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (isProductionHost(host)) return true
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1') return true
  return host.endsWith('.local')
}

export function canonicalRedirect(url: URL): URL | null {
  if (!PRODUCTION_HOSTS.has(url.hostname)) return null
  if (url.hostname === 'www.cs61bbeyond.com' && url.protocol === 'https:') return null
  const destination = new URL(url)
  destination.protocol = 'https:'
  destination.hostname = 'www.cs61bbeyond.com'
  destination.port = ''
  return destination
}

/**
 * 非正式域名的响应要不要加 `X-Robots-Tag: noindex`。
 *
 * 正式域之外的回源（本地 dev 除外）不该被搜索引擎收录：同一份内容挂在两个域名下
 * 会互相稀释，预览副本更不该出现在索引里。
 */
export function shouldNoindex(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return !isProductionHost(host) && host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]' && host !== '::1' && !host.endsWith('.local')
}
