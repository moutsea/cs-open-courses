import { Lexer, Parser } from 'marked'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'

// Shared by page metadata and the Node.js feed synchronizer. Decode entities
// through the rendered HTML exactly once, retaining resolved reference links.
const htmlParser = unified().use(rehypeParse, { fragment: true })
const TEXT_BLOCKS = new Set(['address', 'article', 'aside', 'blockquote', 'dd', 'div', 'dl', 'dt',
  'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr',
  'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'td', 'th', 'tr', 'ul'])

/** @param {import('hast').Root | import('hast').RootContent} node
 * @returns {string}
 */
function visibleText(node) {
  if (node.type === 'text') return node.value
  if (node.type === 'element') {
    if (['script', 'style', 'template'].includes(node.tagName)) return ''
    if (node.tagName === 'br') return ' '
  }
  const text = 'children' in node ? node.children.map(visibleText).join('') : ''
  return node.type === 'element' && TEXT_BLOCKS.has(node.tagName) ? ` ${text} ` : text
}

/** Render resolved tokens without re-lexing, then read text and decode entities.
 * @param {import('marked').Token[]} tokens
 * @returns {string}
 */
export function courseMarkdownText(tokens) {
  if (!tokens.length) return ''
  return visibleText(htmlParser.parse(Parser.parse(tokens, { gfm: true })))
    .replace(/\s+/g, ' ').trim()
}

/** @param {string} markdown
 * @param {string} fallback
 * @returns {string}
 */
export function courseMarkdownTitle(markdown, fallback) {
  const heading = Lexer.lex(markdown, { gfm: true })
    .find(token => token.type === 'heading' && token.depth === 1)
  return heading ? courseMarkdownText([heading]) || fallback : fallback
}

/** Link labels use text-context entity decoding, separately from their targets.
 * @param {import('marked').Tokens.Link} link
 * @returns {string}
 */
export function courseMarkdownLinkText(link) {
  return visibleText(htmlParser.parse(Parser.parseInline(link.tokens, { gfm: true })))
    .replace(/\s+/g, ' ').trim()
}
