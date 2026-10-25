import { Lexer, Parser, type Token, type Tokens } from 'marked'
import type { Root, RootContent } from 'hast'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'

const META_SECTION = /^(课程简介|课程介绍|课程概述|简介|(?:Course\s+)?Introductions?|Course\s+Overviews?|Descriptions?)$/i
const RESOURCE_SECTION = /^(课程资源|课程资源汇总|Course\s+(?:Resources?|Materials?)|Resources?)$/i

export interface CourseMarkdownSection {
  kind: 'meta' | 'resources'
  tokens: Token[]
}

/** Read actual headings and lists, so fenced examples cannot become metadata. */
export function courseMarkdownSections(markdown: string): CourseMarkdownSection[] {
  const sections: CourseMarkdownSection[] = []
  let current: CourseMarkdownSection | undefined
  let sectionDepth = 0
  for (const token of Lexer.lex(markdown, { gfm: true })) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth <= 3) {
      const heading = token as Tokens.Heading
      const text = heading.text.trim()
      const kind = heading.depth >= 2
        ? META_SECTION.test(text) ? 'meta' : RESOURCE_SECTION.test(text) ? 'resources' : undefined
        : undefined
      // Introductions may begin their prose under a descriptive subheading.
      // Keep that prose for summaries; leading metadata still stops there.
      if (!kind && current?.kind === 'meta' && heading.depth > sectionDepth) {
        current.tokens.push(token)
        continue
      }
      current = kind ? { kind, tokens: [] } : undefined
      if (current) {
        sectionDepth = heading.depth
        sections.push(current)
      }
    } else if (current) {
      current.tokens.push(token)
    }
  }
  return sections
}

/** Keep resolved inline tokens, including document-level reference links. */
export function courseListItemParagraphs(item: Tokens.ListItem): Array<Tokens.Text | Tokens.Paragraph> {
  return item.tokens
    .filter((token): token is Tokens.Text | Tokens.Paragraph => token.type === 'text' || token.type === 'paragraph')
}

/** Own paragraphs include continuations, but never text from nested lists. */
export function courseListItemText(item: Tokens.ListItem): string {
  return courseListItemParagraphs(item)
    .map(token => token.text)
    .join('\n')
}

const htmlParser = unified().use(rehypeParse, { fragment: true })
const TEXT_BLOCKS = new Set(['address', 'article', 'aside', 'blockquote', 'dd', 'div', 'dl', 'dt',
  'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr',
  'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'td', 'th', 'tr', 'ul'])

function visibleText(node: Root | RootContent): string {
  if (node.type === 'text') return node.value
  if (node.type === 'element') {
    if (['script', 'style', 'template'].includes(node.tagName)) return ''
    if (node.tagName === 'br') return ' '
  }
  const text = 'children' in node ? node.children.map(visibleText).join('') : ''
  return node.type === 'element' && TEXT_BLOCKS.has(node.tagName) ? ` ${text} ` : text
}

/** Render resolved tokens without re-lexing, then read text and decode entities. */
export function courseMarkdownText(tokens: Token[]): string {
  if (!tokens.length) return ''
  return visibleText(htmlParser.parse(Parser.parse(tokens, { gfm: true })))
    .replace(/\s+/g, ' ').trim()
}

/** Match the body's rendered href, decoding entities once in attribute context. */
export function courseMarkdownLinkHref(link: Tokens.Link): string | undefined {
  const element = htmlParser.parse(Parser.parseInline([link], { gfm: true })).children
    .find(node => node.type === 'element' && node.tagName === 'a')
  if (element?.type !== 'element') return undefined
  return typeof element.properties.href === 'string' ? element.properties.href : undefined
}

/** Link labels use text-context entity decoding, separately from their targets. */
export function courseMarkdownLinkText(link: Tokens.Link): string {
  return visibleText(htmlParser.parse(Parser.parseInline(link.tokens, { gfm: true })))
    .replace(/\s+/g, ' ').trim()
}

/** Metadata is the leading list block(s); the remaining blocks form the description. */
export function courseIntroduction(section: CourseMarkdownSection): {
  items: Tokens.ListItem[]
  description: string
} {
  const items: Tokens.ListItem[] = []
  let index = 0
  for (; index < section.tokens.length; index++) {
    const token = section.tokens[index]
    if (token.type === 'space' || token.type === 'def') continue
    if (token.type !== 'list') break
    items.push(...(token as Tokens.List).items)
  }
  const description: Token[] = []
  let started = false
  for (const token of section.tokens.slice(index)) {
    if (token.type === 'def') continue
    if (token.type === 'hr') break
    if (token.type === 'heading') {
      if (started) break
      continue
    }
    if (!started && (token.type === 'space' || token.type === 'list')) continue
    started = true
    description.push(token)
  }
  return { items, description: courseMarkdownText(description) }
}
