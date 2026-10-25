/**
 * 采集端（浏览器）与服务端共用的路径规则。
 *
 * 单独一个模块是因为 `PageViewTracker` 是客户端组件：这里不能出现任何
 * D1 / getCloudflareContext 之类的服务端 import，否则会把服务端代码打进浏览器包。
 */

/**
 * 哪些路径算「页面」。
 *
 * 后台、接口、Next 静态资源一律不统计；带扩展名的（图片、sitemap.xml 等）也不算。
 */
export function isTrackedPage(pathname: string): boolean {
  return (
    pathname.startsWith('/') &&
    !pathname.startsWith('//') &&
    !/[\\?#\u0000-\u001f]/.test(pathname) &&
    !/^\/(?:admin|api|_next)(?:\/|$)/.test(pathname) &&
    !/\.[a-zA-Z0-9]{1,8}$/.test(pathname)
  )
}

/** 去掉查询串、锚点、重复斜杠与末尾斜杠，让 /courses 和 /courses/ 合并成一条。 */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.split('?')[0].split('#')[0] ?? '/'
  const collapsed = trimmed.replace(/\/{2,}/g, '/')
  const withoutIndex = collapsed.replace(/\/index$/, '/')
  const withoutTrailing = withoutIndex.replace(/\/+$/, '')
  return withoutTrailing === '' ? '/' : withoutTrailing
}
