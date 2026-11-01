import { Renderer } from 'marked'

/** Share link rendering between the page, extracted facts and feed validation. */
export function createCourseMarkdownRenderer() {
  const renderer = new Renderer()
  const renderLink = renderer.link
  renderer.link = function (token) {
    const html = renderLink.call(this, token)
    // Marked's encodeURI escapes IPv6 authority brackets. Restore only a valid
    // literal host; leave path/query escaping and HTML attribute escaping intact.
    if (/^https?:\/\/\[[0-9a-f:.]+\](?=[:/?#]|$)/i.test(token.href)) {
      try {
        const url = new URL(token.href)
        if (url.hostname.startsWith('[')) {
          return html.replace(/^(<a href="https?:\/\/)%5B([0-9a-f:.]+)%5D(?=[:/?#"])/i, '$1[$2]')
        }
      } catch {
        // Invalid destinations retain the normal renderer/sanitizer behavior.
      }
    }
    return html
  }
  return renderer
}
