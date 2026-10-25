import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import type { Element, Root, RootContent } from 'hast'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { NextRequest } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import MDXRenderer from '../src/components/MDXRenderer'
import middleware from '../src/middleware'
import { sanitizeMarkdownHTML } from '../src/lib/htmlSanitizer'
import { markdownToHTML } from '../src/lib/markdownProcessor'
import { getCourseContent } from '../src/lib/courseUtils'

const parser = unified().use(rehypeParse, { fragment: true })
function elements(node: Root | RootContent, tag: string): Element[] {
  return [
    ...(node.type === 'element' && node.tagName === tag ? [node] : []),
    ...('children' in node ? node.children.flatMap(child => elements(child, tag)) : [])
  ]
}
function textContent(node: Root | RootContent): string {
  return node.type === 'text' ? node.value : 'children' in node ? node.children.map(textContent).join('') : ''
}

function renderCourseDocument(content: string, locale = 'en'): Root {
  const noop = () => {}
  const router = { back: noop, forward: noop, refresh: noop, push: noop, replace: noop, prefetch: noop }
  // Render the actual page component so transformations after sanitization are
  // included. Only the framework contexts are supplied by the test.
  return parser.parse(renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <NextIntlClientProvider locale={locale} messages={{}}>
        <MDXRenderer content={content} locale={locale} title="Course title" coursePath={['essential-tools', 'Scoop']} />
      </NextIntlClientProvider>
    </AppRouterContext.Provider>
  ))
}

test('final course rendering cannot turn heading attribute text into executable HTML', async () => {
  for (const locale of ['en', 'zh']) {
    for (const closingTag of ['</h1>', '&lt;/h1&gt;']) {
      const markdown = `<h1><a title="${closingTag}<img src=/missing-probe.png onerror=this.dataset.probe=1>">Title</a></h1><p>Body</p>`
      const html = await markdownToHTML(markdown, { locale, coursePath: 'essential-tools/Scoop' }, { removeFirstHeading: true })
      const document = renderCourseDocument(html, locale)
      const article = elements(document, 'article')[0]
      assert.equal(elements(article, 'img').length, 0, 'attribute text must never become an image element')
      assert.equal(elements(article, 'script').length, 0)
      assert.equal(textContent(article).trim(), 'Body')
      assert.deepEqual(elements(document, 'h1').map(textContent), ['Course title'])
    }
  }
})

test('course title removal preserves later headings, surrounding content and code examples', async () => {
  const markdown = '<p>Before</p><div><h1 title="A > B">Title</h1><p>After</p></div>\n\n# Later heading\n\n`<h1>Example</h1>`'
  const html = await markdownToHTML(markdown, undefined, { removeFirstHeading: true })
  const article = elements(renderCourseDocument(html), 'article')[0]
  assert.deepEqual(elements(article, 'h1').map(textContent), ['Later heading'])
  assert.deepEqual(elements(article, 'p').map(textContent), ['Before', 'After', '<h1>Example</h1>'])
  assert.equal(textContent(elements(article, 'code')[0]), '<h1>Example</h1>')
})

test('the final renderer leaves safely quoted HTML in subsequent headings inert', async () => {
  const attribute = '</h1><img src=/missing-probe.png onerror=this.dataset.probe=1>'
  const markdown = `# Title\n\n<h1><a title="${attribute}">Later heading</a></h1><p>Body</p>`
  const html = await markdownToHTML(markdown, undefined, { removeFirstHeading: true })
  const article = elements(renderCourseDocument(html), 'article')[0]
  assert.equal(elements(article, 'img').length, 0)
  assert.equal(elements(article, 'a')[0].properties.title, attribute)
  assert.deepEqual(elements(article, 'h1').map(textContent), ['Later heading'])
  assert.equal(textContent(elements(article, 'p')[0]), 'Body')
})

test('title-only courses do not restore the duplicate heading and ordinary Markdown keeps its heading by default', async () => {
  const html = await markdownToHTML('# Title', undefined, { removeFirstHeading: true })
  const document = renderCourseDocument(html)
  assert.equal(textContent(elements(document, 'article')[0]).trim(), '')
  assert.deepEqual(elements(document, 'h1').map(textContent), ['Course title'])
  assert.deepEqual(elements(parser.parse(await markdownToHTML('# Title')), 'h1').map(textContent), ['Title'])
  const bodyOnly = await markdownToHTML('Body only', undefined, { removeFirstHeading: true })
  assert.equal(textContent(elements(renderCourseDocument(bodyOnly), 'article')[0]).trim(), 'Body only')
})

test('same-page links resolve to sanitized IDs including encoded and already-prefixed names', () => {
  for (const id of ['resources', '课程资源', 'section one', '100%', 'user-content-resources', 'location']) {
    for (const fragment of [id, encodeURIComponent(id)]) {
      const document = parser.parse(sanitizeMarkdownHTML(`<a href="#${fragment}">Jump</a><h2 id="${id}">Resources</h2>`))
      const targetId = elements(document, 'h2')[0].properties.id
      const href = elements(document, 'a')[0].properties.href as string
      assert.equal(targetId, `user-content-${id}`, 'DOM clobbering protection must remain enabled')
      assert.equal(decodeURIComponent(href.slice(1)), targetId, `${id}: the link must match the emitted ID`)
    }
  }
})

test('anchor rewriting leaves external, cross-page and unmatched links unchanged', () => {
  const links = ['https://example.org/#resources', '/other#resources', '?edition=2#resources', '#missing', '#', '#%ZZ']
  const document = parser.parse(sanitizeMarkdownHTML('<h2 id="resources">Resources</h2>' + links.map(href => `<a href="${href}">Link</a>`).join('')))
  assert.deepEqual(elements(document, 'a').map(link => link.properties.href), links)
})

test('final course rendering preserves anchors on removed titles and sanitizes their replacement', async () => {
  const markdown = '<h1 id="course-title" onclick="alert(1)">Title</h1>\n\n[Top](#course-title) · [Resources](#resources)\n\n<h2 id="resources">Resources</h2>'
  const html = await markdownToHTML(markdown, undefined, { removeFirstHeading: true })
  const article = elements(renderCourseDocument(html), 'article')[0]
  const anchor = elements(article, 'span')[0]
  assert.deepEqual(anchor.properties, { id: 'user-content-course-title' })
  assert.equal(elements(article, 'h1').length, 0)
  assert.deepEqual(elements(article, 'a').map(link => link.properties.href), ['#user-content-course-title', '#user-content-resources'])
  assert.equal(elements(article, 'h2')[0].properties.id, 'user-content-resources')
})

test('both Scoop tutorials retain all commands, headings and syntax highlighting after sanitization', async () => {
  for (const locale of ['en', 'zh']) {
    const markdown = await readFile(`course-content/${locale}/essential-tools/Scoop.md`, 'utf8')
    const document = parser.parse(await markdownToHTML(markdown))
    const expectedCode = [...markdown.matchAll(/```powershell\n([\s\S]*?)\n```/g)].map(match => match[1])
    const blocks = elements(document, 'pre')
    assert.equal(blocks.length, 3)
    assert.deepEqual(blocks.map(textContent), expectedCode, `${locale}: code blocks must not swallow later content`)
    assert.deepEqual(elements(document, 'h2').map(textContent), [...markdown.matchAll(/^## (.+)$/gm)].map(match => match[1]))
    for (const block of blocks) {
      assert.deepEqual(elements(block, 'code')[0].properties.className, ['hljs', 'language-powershell'])
    }
  }
})

test('safe attributes with spaces, quotes and greater-than signs remain intact', () => {
  const document = parser.parse(sanitizeMarkdownHTML('<p><a href="https://example.org/?a=1&amp;b=2" title="A &quot;quoted&quot; title > example">Resource</a><img src="/image.png" alt="An image description" width="300" height="200" /></p>'))
  const link = elements(document, 'a')[0]
  assert.equal(link.properties.title, 'A "quoted" title > example')
  assert.equal(link.properties.href, 'https://example.org/?a=1&b=2')
  assert.equal(textContent(link), 'Resource')
  assert.equal(elements(document, 'img')[0].properties.alt, 'An image description')
  assert.equal(elements(document, 'img')[0].properties.width, 300)
})

test('code examples keep text that resembles dangerous HTML or event attributes', async () => {
  const example = 'const options = "javascript: data: onclick= expression("; <script>example</script>'
  const document = parser.parse(await markdownToHTML('`' + example + '`'))
  assert.equal(textContent(elements(document, 'code')[0]), example)
  assert.equal(elements(document, 'script').length, 0)
})

test('encoded and control-character dangerous URL schemes are removed from links and images', () => {
  const urls = [
    'javascript:alert(1)', 'java&#x73;cript:alert(1)', '&#106;avascript:alert(1)',
    'JaVaScRiPt:alert(1)', 'java&#x09;script:alert(1)', 'java&#10;script:alert(1)',
    '&#32;javascript:alert(1)', 'vbscript:msgbox(1)', 'data:text/html,example'
  ]
  for (const url of urls) {
    const document = parser.parse(sanitizeMarkdownHTML(`<a href="${url}">Resource</a><img src="${url}" />`))
    assert.equal(elements(document, 'a')[0].properties.href, undefined, url)
    assert.equal(elements(document, 'img')[0].properties.src, undefined, url)
    assert.equal(textContent(document), 'Resource')
  }
})

test('ordinary URLs and relative course links survive filtering', () => {
  for (const url of ['https://example.org/a', 'http://example.org/a', 'mailto:hello@example.org', '//example.org/a', '/zh/course/essential-tools/Scoop', '../CS144.md', '#resources', '?edition=2026']) {
    const document = parser.parse(sanitizeMarkdownHTML(`<a href="${url}">Resource</a>`))
    assert.equal(elements(document, 'a')[0].properties.href, url)
  }
})

test('self-closing elements and embedded active HTML cannot bypass attribute filtering', () => {
  const html = '<img src="/safe.png" onerror="alert(1)" style="position:fixed" />' +
    '<script>alert(2)</script><iframe src="https://example.org"></iframe><style>body{display:none}</style>' +
    '<svg><a href="javascript:alert(3)">SVG link</a></svg><p>Safe text</p>'
  const document = parser.parse(sanitizeMarkdownHTML(html))
  assert.deepEqual(elements(document, 'img')[0].properties, { src: '/safe.png' })
  for (const tag of ['script', 'iframe', 'style', 'svg']) assert.equal(elements(document, tag).length, 0)
  assert.equal(textContent(document), 'Safe text')
})

test('the Markdown rendering entry point sanitizes content before it reaches the client', async () => {
  const document = parser.parse(await markdownToHTML('[Resource](java&#x73;cript:void(0))\n\n<img src="/safe.png" onerror="alert(1)" />'))
  assert.equal(elements(document, 'a')[0].properties.href, undefined)
  assert.equal(elements(document, 'img')[0].properties.onError, undefined)
})

test('malformed course path encodings resolve as missing courses instead of throwing', async () => {
  for (const locale of ['en', 'zh']) {
    for (const segment of ['%', 'bad%', '%ZZ', '%E0%A4%A', '%C0%AF', '%25']) {
      const result = await getCourseContent(['essential-tools', segment], locale)
      assert.equal(result.exists, false, `${locale}/${segment}`)
    }
    assert.equal((await getCourseContent([], locale)).exists, false)
  }
})

test('locale routing rejects encodings that become malformed during URL rewriting', () => {
  for (const prefix of ['', '/en', '/zh']) {
    for (const segment of ['%', '%25', '%2525', '%252525', '%25ZZ', '%ZZ', '%E0%A4%A', '%' + '25'.repeat(12)]) {
      const request = new NextRequest(`https://www.cs61bbeyond.com${prefix}/course/essential-tools/${segment}`)
      assert.equal(middleware(request).status, 400, request.url)
    }
  }
})

test('locale routing preserves valid encoded course paths and query strings', () => {
  for (const prefix of ['', '/zh']) {
    const request = new NextRequest(`https://www.cs61bbeyond.com${prefix}/course/programming-introduction/java/MIT%206.092?from=a%25b`)
    const response = middleware(request)
    assert.equal(response.status, 200)
    const rewrite = new URL(response.headers.get('x-middleware-rewrite') || request.url)
    assert.equal(decodeURIComponent(rewrite.pathname), `${prefix || '/en'}/course/programming-introduction/java/MIT 6.092`)
    assert.equal(rewrite.searchParams.get('from'), 'a%b')
  }
})

test('decoded, encoded and legacy space-containing course paths still load both translations', async () => {
  for (const locale of ['en', 'zh']) {
    for (const filename of ['MIT 6.092', 'MIT%206.092', 'MIT+6.092']) {
      const result = await getCourseContent(['programming-introduction', 'java', filename], locale)
      assert.equal(result.exists, true, `${locale}/${filename}`)
      assert.equal(result.hasEnglishVersion, true)
      assert.equal(result.hasChineseVersion, true)
    }
    assert.equal((await getCourseContent(['essential-tools', 'does-not-exist'], locale)).exists, false)
  }
})

test('invalid path segments cannot resolve files outside the requested course directory', async () => {
  for (const segments of [['..', '..', 'README'], ['%2e%2e', '%2e%2e', 'README'], ['..%2F..%2FREADME'], ['..\\..\\README'], ['essential-tools', 'Scoop%00'], ['essential-tools', '']]) {
    assert.equal((await getCourseContent(segments, 'en')).exists, false, segments.join('/'))
  }
})
