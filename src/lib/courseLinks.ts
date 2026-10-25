import { buildDynamicRoutePath, localizedPath } from './pathUtils'

export interface CourseLinkContext {
  coursePath: string
  locale: string
}

// Markdown uses repository-relative filenames; the website uses localized routes.
export function resolveCourseMarkdownLink(href: string, context: CourseLinkContext): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(href)) return href
  try {
    const basePath = localizedPath(context.locale, `/course/${context.coursePath.split('/').map(encodeURIComponent).join('/')}`)
    const url = new URL(href, `https://course-links.invalid${basePath}`)
    const match = url.pathname.match(/^\/(?:(en|zh)\/)?course\/(.+)$/)
    if (!match) return href
    const path = match[2].split('/').map(decodeURIComponent)
    const filename = path[path.length - 1]
    const extension = filename.match(/(?:\.(en|zh))?\.md$/i)
    if (!extension) return href
    path[path.length - 1] = filename.slice(0, -extension[0].length)
    const destination = buildDynamicRoutePath(path.join('/')).map(encodeURIComponent).join('/')
    const locale = extension[1]?.toLowerCase() || match[1] || 'en'
    return `${localizedPath(locale, `/course/${destination}`)}${url.search}${url.hash}`
  } catch {
    return href
  }
}
