/** @typedef {'website' | 'video' | 'textbook' | 'assignment' | 'other'} ResourceKind */

/** @type {Array<{ kind: ResourceKind, test: RegExp }>} */
const RESOURCE_KIND_PATTERNS = [
  { kind: 'textbook', test: /(课程教材|教材|课本|\b(?:textbooks?|text\s*books?|reading)\b)/i },
  { kind: 'video', test: /(课程视频|视频|录播|\b(?:recordings?|videos?|lecture\s+videos?)\b)/i },
  { kind: 'assignment', test: /(课程作业|作业|实验|项目|\b(?:coursework|homeworks?|assignments?|labs?|projects?|problem\s+sets?)\b)/i },
  { kind: 'website', test: /(课程网站|课程主页|官网|网站|\b(?:websites?|course\s+(?:site|page|website)|homepages?)\b)/i }
]

/** Share classification between generated resources and the facts read by pages.
 * @param {string} label
 * @returns {ResourceKind}
 */
export function classifyCourseResource(label) {
  for (const pattern of RESOURCE_KIND_PATTERNS) {
    if (pattern.test.test(label)) return pattern.kind
  }
  return 'other'
}
