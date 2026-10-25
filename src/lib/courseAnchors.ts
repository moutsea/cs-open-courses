// Shared by the server sanitizer and the browser's legacy-fragment fallback.
export const COURSE_ANCHOR_PREFIX = 'user-content-'

export function findCourseAnchorFallback(article: HTMLElement, hash: string): HTMLElement | null {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  if (!fragment) return null

  const candidates = [fragment]
  try {
    const decoded = decodeURIComponent(fragment)
    if (decoded !== fragment) candidates.push(decoded)
  } catch {
    // A literal percent is a valid part of an ID. Keep the exact lookup, but
    // never let a malformed fragment break the course page.
  }

  const document = article.ownerDocument
  // Let the browser handle native targets, including already-prefixed IDs and
  // anchors outside the course body. Only missing original IDs need a fallback.
  if (candidates.some(id => document.getElementById(id))) return null

  for (const id of candidates) {
    const target = document.getElementById(COURSE_ANCHOR_PREFIX + id)
    if (target && article.contains(target)) return target
  }
  return null
}
