import assert from 'node:assert/strict'
import { test } from 'node:test'
import path from 'node:path'
import { stat } from 'node:fs/promises'
import { markdownToHTML } from '../src/lib/markdownProcessor'
import { getAllCourses } from '../src/lib/getServerData'
import { buildDynamicRoutePath, localizedPath, toPosixPath } from '../src/lib/pathUtils'

test('Markdown course links preserve language, encoding, query strings and fragments', async () => {
  const cases = [
    ['en', 'computer-networks/topdown', './CS144.en.md', '/course/computer-networks/CS144'],
    ['zh', 'computer-architecture/CS61C', './N2T.md', '/zh/course/computer-architecture/N2T'],
    ['zh', 'data-structures-algorithms/6.006', '../编程入门/cpp/CS106B_CS106X.md', '/zh/course/programming-introduction/cpp/CS106B_CS106X'],
    ['en', 'programming-introduction/java/MIT 6.092', '../../软件工程/6031.en.md', '/course/software-engineering/6031'],
    ['zh', 'programming-introduction/java/MIT 6.092', '../../%E8%BD%AF%E4%BB%B6%E5%B7%A5%E7%A8%8B/6031.md', '/zh/course/software-engineering/6031'],
    ['en', 'programming-introduction/java/COS126', './MIT%206.092.md?from=notes#resources', '/course/programming-introduction/java/MIT%206.092?from=notes#resources'],
    ['zh', 'essential-tools/Emacs', 'Vim.en.md', '/course/essential-tools/Vim'],
    ['zh', 'essential-tools/Emacs', '/course/essential-tools/Vim.md', '/course/essential-tools/Vim'],
    ['en', 'essential-tools/Emacs', '/zh/course/essential-tools/Vim.md', '/zh/course/essential-tools/Vim']
  ]
  for (const [locale, coursePath, href, expected] of cases) {
    const html = await markdownToHTML(`[**Next course**](${href})`, { locale, coursePath })
    assert.ok(html.includes(`href="${expected}"`), html)
    assert.ok(html.includes('<strong>Next course</strong>'))
  }
})

test('external documents, images, ordinary links and code examples keep their destinations', async () => {
  const links = ['https://github.com/example/repo/blob/main/README.md', '//example.org/course/CS144.md', '/downloads/notes.md', '#resources', '?edition=2026', 'mailto:hello@example.org']
  const markdown = links.map(href => `[Resource](${href})`).join('\n') + '\n![Figure](./image.md)\n`[Example](./CS144.en.md)`'
  const html = await markdownToHTML(markdown, { locale: 'zh', coursePath: 'computer-networks/topdown' })
  for (const href of links) assert.ok(html.includes(`href="${href}"`), href)
  assert.ok(html.includes('src="./image.md"'))
  assert.ok(html.includes('<code>[Example](./CS144.en.md)</code>'))
})

test('all rendered internal links in every course resolve to real localized pages', async () => {
  const localizedCourses = await Promise.all(['en', 'zh'].map(async locale => ({ locale, courses: await getAllCourses(locale) })))
  const known = new Set(localizedCourses.flatMap(({ locale, courses }) => courses.map(course =>
    localizedPath(locale, `/course/${buildDynamicRoutePath(course.path).map(encodeURIComponent).join('/')}`))))
  let checked = 0
  for (const { locale, courses } of localizedCourses) {
    for (const course of courses) {
      const coursePath = buildDynamicRoutePath(course.path).join('/')
      const page = new URL(localizedPath(locale, `/course/${coursePath}`), 'https://www.cs61bbeyond.com')
      const html = await markdownToHTML(course.content, { locale, coursePath })
      for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
        const url = new URL(match[1], page)
        if (url.origin !== page.origin || !/^\/(?:zh\/)?course\//.test(url.pathname)) continue
        assert.ok(known.has(url.pathname), `${course.path} links to missing course: ${url.pathname}`)
        checked++
      }
    }
  }
  assert.ok(checked >= 16, 'Expected the formerly broken course references to be checked')
})

test('catalog paths stay posix so Windows separators cannot break routes and slugs', async () => {
  // Windows 上 path.relative 会返回反斜杠；下游全部按 '/' 切分，所以入口必须归一化。
  assert.equal(toPosixPath('zh\\data-structures-algorithms\\CS61B.md'), 'zh/data-structures-algorithms/CS61B.md')
  assert.deepEqual(buildDynamicRoutePath('zh\\data-structures-algorithms\\CS61B.md'), ['data-structures-algorithms', 'CS61B'])
  assert.deepEqual(buildDynamicRoutePath('en\\programming-introduction\\java\\MIT 6.092.md'), ['programming-introduction', 'java', 'MIT 6.092'])

  for (const locale of ['en', 'zh']) {
    const courses = await getAllCourses(locale)
    assert.ok(courses.length > 0)
    for (const course of courses) {
      assert.doesNotMatch(course.path, /\\/, `${locale}/${course.slug} 的 path 含反斜杠`)
      assert.ok(course.path.startsWith(`${locale}/`), `${course.path} 缺少语言前缀`)
      assert.equal(buildDynamicRoutePath(course.path).length >= 2, true, `${course.path} 拆不出分类与课程`)
    }
  }
})

test('every catalog course reports the language versions it actually has', async () => {
  for (const locale of ['en', 'zh']) {
    const mirrorLocale = locale === 'zh' ? 'en' : 'zh'
    for (const course of await getAllCourses(locale)) {
      const relative = course.path.split('/').slice(1)
      const mirrorExists = await stat(path.join(process.cwd(), 'course-content', mirrorLocale, ...relative))
        .then(() => true, () => false)
      assert.equal(course.hasEnglishVersion, locale === 'en' || mirrorExists, `${course.path} 的英文版标记不对`)
      assert.equal(course.hasChineseVersion, locale === 'zh' || mirrorExists, `${course.path} 的中文版标记不对`)
    }
  }
})

test('slug labels keep symbols: cpp reads as C++ everywhere it is displayed', async () => {
  const { slugLabel } = await import('../src/lib/categoryMapping')
  const { categoryName } = await import('../src/lib/catalog')
  // 首字母大写拼不回符号缩写，cpp 曾经一律显示成 Cpp。
  assert.equal(slugLabel('cpp', 'en'), 'C++')
  assert.equal(slugLabel('cpp', 'zh'), 'C++')
  assert.equal(categoryName('cpp', 'en'), 'C++')
  assert.equal(categoryName('cpp', 'zh'), 'C++')
  // 普通 slug 仍然按词大写 / 取中文名，未被例外表影响。
  assert.equal(slugLabel('machine-learning', 'en'), 'Machine Learning')
  assert.equal(slugLabel('machine-learning', 'zh'), '机器学习')
  assert.equal(slugLabel('large-language-models', 'zh'), '大语言模型')
  // 中文名缺失时退回英文写法，不把 slug 直接露出来。
  assert.equal(slugLabel('not-a-real-category', 'zh'), 'Not A Real Category')
  // 目录里真实存在的 cpp 子分类不能回退成 Cpp。
  for (const locale of ['en', 'zh']) {
    const courses = await getAllCourses(locale)
    const cpp = courses.filter(course => course.path.includes('/cpp/'))
    assert.ok(cpp.length > 0, `${locale} 目录里应存在 cpp 子分类课程`)
  }
})

test('Chinese university pages translate the breadcrumb name, not just the title (regression guard)', async () => {
  const page = await import('../src/app/[locale]/universities/[university]/page')
  assert.equal(typeof page.default, 'function')
  // 面包屑必须用本地化校名：中文页之前用的是英文原名（title 用对了，面包屑漏了）。
  const source = await import('node:fs/promises').then(fs => fs.readFile('src/app/[locale]/universities/[university]/page.tsx', 'utf8'))
  assert.doesNotMatch(source, /name: university\.name, pathname: `\/universities\/\$\{slug\}`/)
  assert.match(source, /name, pathname: `\/universities\/\$\{slug\}`/)
})

test('header tool links and footer project links share one language-prefix rule', async () => {
  const { aiToolLinks, OTHER_PROJECTS, projectHref } = await import('../src/lib/projectLinks')
  // aiinide 曾经在 Header 里写死正式站、在 Footer 里带 /zh，两边不一致。
  const zhHeaderHrefs = aiToolLinks('zh').map(link => link.href)
  const zhFooterHrefs = OTHER_PROJECTS.map(project => projectHref(project, 'zh'))
  for (const href of ['https://aiinide.com/zh', 'https://www.codeilab.com/zh', 'https://www.codebyai.net/zh']) {
    assert.ok(zhHeaderHrefs.includes(href), `Header 缺 ${href}`)
    assert.ok(zhFooterHrefs.includes(href), `Footer 缺 ${href}`)
  }
  // 英文站回到根地址；没有中文版的站点两边都不加前缀。
  assert.deepEqual(aiToolLinks('en').map(link => link.href), [
    'https://aiinide.com',
    'https://www.codeilab.com',
    'https://www.codebyai.net',
    'https://kimiseek.app'
  ])
  assert.equal(projectHref(OTHER_PROJECTS[0], 'en'), 'https://www.codebyai.net')
  assert.equal(aiToolLinks('zh').at(-1)?.href, 'https://kimiseek.app')
})
