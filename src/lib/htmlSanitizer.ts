import rehypeParse from 'rehype-parse'
import rehypeSanitize, { defaultSchema, type Options } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import type { Element, Root } from 'hast'
import { unified } from 'unified'
import { COURSE_ANCHOR_PREFIX } from './courseAnchors'

export interface HTMLSanitizerOptions {
  removeFirstHeading?: boolean
}

const courseSchema: Options = {
  ...defaultSchema,
  clobberPrefix: COURSE_ANCHOR_PREFIX,
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 'del', 'ins',
    'blockquote', 'pre', 'code', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'kbd'
  ],
  attributes: {
    '*': ['className', 'id', 'title', 'dataLanguage'],
    a: ['href'],
    img: ['src', 'alt', 'width', 'height'],
    ol: ['start'],
    li: ['value'],
    th: ['align', 'colSpan', 'rowSpan'],
    td: ['align', 'colSpan', 'rowSpan']
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https']
  },
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'template', 'svg', 'math']
}

function removeFirstHeading(parent: Root | Element): boolean {
  for (const [index, child] of parent.children.entries()) {
    if (child.type !== 'element') continue
    if (child.tagName === 'h1') {
      // Keep an anchor for links to the title shown separately by the page.
      const id = child.properties.id
      const replacement: Element[] = typeof id === 'string' && id
        ? [{ type: 'element', tagName: 'span', properties: { id }, children: [] }]
        : []
      parent.children.splice(index, 1, ...replacement)
      return true
    }
    if (removeFirstHeading(child)) return true
  }
  return false
}

function visitElements(parent: Root | Element, visit: (element: Element) => void) {
  for (const child of parent.children) {
    if (child.type !== 'element') continue
    visit(child)
    visitElements(child, visit)
  }
}

function prepareCourseHTML(options: HTMLSanitizerOptions) {
  return (tree: Root) => {
    if (options.removeFirstHeading) removeFirstHeading(tree)

    const ids = new Set<string>()
    visitElements(tree, element => {
      if (typeof element.properties.id === 'string') ids.add(element.properties.id)
    })
    visitElements(tree, element => {
      const href = element.properties.href
      if (element.tagName !== 'a' || typeof href !== 'string' || !href.startsWith('#') || href === '#') return
      let target = href.slice(1)
      if (!ids.has(target)) {
        try {
          target = decodeURIComponent(target)
        } catch {
          return
        }
      }
      // Only rewrite references to IDs in this content, leaving page chrome,
      // external URLs and missing anchors alone. Sanitization prefixes the IDs.
      if (ids.has(target)) element.properties.href = `#${encodeURIComponent(COURSE_ANCHOR_PREFIX + target)}`
    })
  }
}

// Parse entities and quoted attributes as HTML before applying the allowlist.
// All content transformations must run BEFORE the final sanitization step.
function createSanitizer(options: HTMLSanitizerOptions = {}) {
  return unified()
    .use(rehypeParse, { fragment: true })
    .use(prepareCourseHTML, options)
    .use(rehypeSanitize, courseSchema)
    .use(rehypeStringify)
    .freeze()
}

const sanitizer = createSanitizer()
const courseBodySanitizer = createSanitizer({ removeFirstHeading: true })

export function sanitizeHTML(html: string, options: HTMLSanitizerOptions = {}): string {
  if (!html || typeof html !== 'string') return ''
  const processor = options.removeFirstHeading ? courseBodySanitizer : sanitizer
  return String(processor.processSync(html))
}

export function sanitizeMarkdownHTML(markdownHtml: string, options?: HTMLSanitizerOptions): string {
  return sanitizeHTML(markdownHtml, options)
}
