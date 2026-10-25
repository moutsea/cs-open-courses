import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { allowsAdminHost, canonicalRedirect } from '../src/lib/canonicalRedirect'
import { legacyCatalogRedirect } from '../src/lib/catalogRedirect'
import { getAllCourses } from '../src/lib/getServerData'
import { courseSchema, courseListSchema, getCourseSeo } from '../src/lib/courseSeo'
import { buildDynamicRoutePath } from '../src/lib/pathUtils'
import { courseGuides } from '../src/data/course-guides'
import revisions from '../src/data/generated/course-revisions.json'
import videos from '../src/data/course-videos.json'
import sitemap from '../src/app/sitemap'

test('video edits update both language sitemap dates without using link verification dates', () => {
  const entries = new Map(sitemap().map(entry => [entry.url, entry]))
  const dates: Record<string, string> = videos.courseUpdatedAt
  for (const coursePath of Object.keys(videos.courses)) {
    assert.ok(Date.parse(dates[coursePath]) > 0, `Missing video edit date: ${coursePath}`)
    for (const locale of ['en', 'zh']) {
      const url = `https://www.cs61bbeyond.com${locale === 'zh' ? '/zh' : ''}/course/${coursePath}`
      assert.ok(Date.parse(String(entries.get(url)?.lastModified)) >= Date.parse(dates[coursePath]), url)
    }
  }
  const current = videos.checkedAt
  try {
    videos.checkedAt = '2099-01-01'
    assert.deepEqual(sitemap(), [...entries.values()], 'Verification without content edits must not bump lastmod')
  } finally { videos.checkedAt = current }
})

test('production aliases redirect once and preserve encoded paths and query strings', () => {
  for (const origin of ['http://cs61bbeyond.com', 'https://cs61bbeyond.com', 'http://www.cs61bbeyond.com']) {
    const url = new URL(`${origin}/zh/course/intro/A%20B?q=C%2B%2B&lang=zh`)
    const redirected = canonicalRedirect(url)
    assert.equal(redirected?.href, 'https://www.cs61bbeyond.com/zh/course/intro/A%20B?q=C%2B%2B&lang=zh')
    assert.equal(canonicalRedirect(redirected!), null)
  }
  assert.equal(canonicalRedirect(new URL('http://localhost:3000/courses')), null)
  assert.equal(canonicalRedirect(new URL('https://preview.workers.dev/courses')), null)
})

test('the admin dashboard is hidden on preview deployments but reachable in production and locally', () => {
  // 正式域名与本地开发放行
  for (const host of ['cs61bbeyond.com', 'www.cs61bbeyond.com', 'localhost', '127.0.0.1', 'mac.local']) {
    assert.equal(allowsAdminHost(host), true, host)
  }
  // wrangler 打开 workers_dev/preview_urls 后产生的公开副本：后台一律当作不存在
  for (const host of ['cs-courses.example.workers.dev', 'preview.cs-courses.pages.dev', 'evil.example']) {
    assert.equal(allowsAdminHost(host), false, host)
  }
})

test('legacy filters migrate to the equivalent localized landing page', () => {
  const cases = [
    ['/courses?category=machine-learning&utm_source=test', '/courses/machine-learning?utm_source=test'],
    ['/zh/courses?category=programming-introduction&subcategory=python', '/zh/courses/programming-introduction/python'],
    ['/universities?university=mit', '/universities/mit'],
    ['/zh/universities?university=uc-berkeley', '/zh/universities/uc-berkeley'],
    ['/en/courses?category=operating-systems', '/courses/operating-systems']
  ]
  for (const [from, to] of cases) {
    const redirect = legacyCatalogRedirect(new URL(from, 'https://www.cs61bbeyond.com'))
    assert.equal(redirect?.pathname + redirect!.search, to)
    assert.equal(legacyCatalogRedirect(redirect!), null)
  }
  for (const path of ['/courses?category=__proto__', '/courses?category=unknown', '/search?q=mit', '/courses?category=programming-introduction&subcategory=unknown']) {
    assert.equal(legacyCatalogRedirect(new URL(path, 'https://www.cs61bbeyond.com')), null)
  }
})

test('course markup names the real provider and does not confuse page language with teaching language', async () => {
  const courses = await getAllCourses('en')
  const course = courses.find(course => course.slug === 'MIT6.S081')!
  assert.ok(course)
  const schema = courseSchema(course, 'zh')
  assert.deepEqual(schema.provider, { '@type': 'CollegeOrUniversity', name: 'Massachusetts Institute of Technology (MIT)', url: 'https://ocw.mit.edu' })
  assert.equal('inLanguage' in schema, false)
  const list = courseListSchema(courses, 'en', 'CS courses')
  assert.equal(list.numberOfItems, courses.length)
  for (const item of list.itemListElement) {
    assert.equal(item.url, item.item.url)
    assert.ok(item.item.description)
    assert.ok(item.item.name)
  }
})

test('every curated guide and related course resolves in both languages', async () => {
  for (const locale of ['en', 'zh']) {
    const courses = await getAllCourses(locale)
    const paths = new Map(courses.map(course => [buildDynamicRoutePath(course.path).join('/'), course]))
    for (const [path, guide] of Object.entries(courseGuides)) {
      assert.ok(paths.has(path), path)
      for (const related of guide.related) assert.ok(paths.has(related), related)
      assert.equal(getCourseSeo(paths.get(path)!, locale).title, guide[locale as 'en' | 'zh'].title)
    }
  }
})

test('sitemap includes every course and topic with reciprocal language alternates and no epoch dates', async () => {
  const entries = sitemap()
  const urls = new Set(entries.map(entry => entry.url))
  assert.equal(urls.size, entries.length)
  for (const locale of ['en', 'zh']) {
    for (const course of await getAllCourses(locale)) {
      const pathname = `/course/${buildDynamicRoutePath(course.path).join('/')}`
      assert.ok(urls.has(new URL(`https://www.cs61bbeyond.com${locale === 'zh' ? '/zh' : ''}${pathname}`).href))
    }
  }
  assert.ok(urls.has('https://www.cs61bbeyond.com/courses/machine-learning'))
  assert.ok(urls.has('https://www.cs61bbeyond.com/zh/universities/mit'))
  assert.ok(!entries.some(entry => entry.url.includes('?') || entry.url.endsWith('/search')))
  for (const entry of entries) {
    if (entry.lastModified) assert.ok(Date.parse(String(entry.lastModified)) > 0)
    for (const url of Object.values(entry.alternates?.languages || {})) assert.ok(urls.has(url!))
  }
  for (const [file, revision] of Object.entries(revisions)) {
    const hash = createHash('sha256').update(await readFile(`course-content/${file}`)).digest('hex')
    assert.equal(revision.hash, hash, `Stale SEO revision for ${file}`)
  }
})

test('the new filter and sort params never land on the legacy catalog redirect', async () => {
  const { legacyCatalogRedirect } = await import('../src/lib/catalogRedirect')
  // `/courses?filter=…` 是客户端筛选参数，不能被旧目录重定向 308 抢走（那也是它不叫 category 的原因）。
  for (const url of [
    'https://www.cs61bbeyond.com/courses?filter=operating-systems',
    'https://www.cs61bbeyond.com/zh/courses?filter=operating-systems/kernel',
    'https://www.cs61bbeyond.com/courses?filter=operating-systems&sort=title',
    'https://www.cs61bbeyond.com/zh/courses?sort=difficulty'
  ]) {
    assert.equal(legacyCatalogRedirect(new URL(url)), null, url)
  }
  // 旧参数仍然照旧跳转到分类落地页，新参数不改变既有行为。
  const legacy = legacyCatalogRedirect(new URL('https://www.cs61bbeyond.com/courses?category=operating-systems'))
  assert.equal(legacy?.pathname, '/courses/operating-systems')
})

test('course structured data describes the category it belongs to', async () => {
  const { loadCourse } = await import('../src/lib/coursePageData')
  const { courseSchema } = await import('../src/lib/courseSeo')
  // 详情页 JSON-LD 的 about 之前恒缺：Course 对象上从来没设 categorySlug。
  for (const [locale, coursePath, expected] of [
    ['en', 'programming-introduction/cpp/CS106B_CS106X', ['Programming Introduction', 'C++']],
    ['zh', 'programming-introduction/cpp/CS106B_CS106X', ['编程入门', 'C++']],
    ['en', 'data-structures-algorithms/CS61B', ['Data Structures Algorithms']]
  ] as const) {
    const { course } = await loadCourse(locale, coursePath)
    assert.equal(course.categorySlug, coursePath.split('/')[0])
    const schema = courseSchema(course, locale)
    const about = Array.isArray(schema.about) ? schema.about.map(item => item.name) : [schema.about?.name]
    assert.deepEqual(about, [...expected], `${locale} ${coursePath}`)
  }
  // 全部课程都要有 about，不能再有遗漏。
  const { getAllCourses } = await import('../src/lib/getServerData')
  const courses = await getAllCourses('en')
  assert.ok(courses.length > 100)
  for (const path of courses.slice(0, 20).map(course => course.path.replace(/^en\//, '').replace(/\.md$/, ''))) {
    const { course } = await loadCourse('en', path)
    assert.ok(courseSchema(course, 'en').about, `${path} 缺 about`)
  }
})

test('preview copies are closed off: no public workers.dev host and noindex everywhere else', async () => {
  const { shouldNoindex } = await import('../src/lib/canonicalRedirect')
  const { readFile } = await import('node:fs/promises')
  // wrangler 的两个公开副本开关必须关掉，否则整站（含 /admin）会多出可访问入口。
  const wrangler = await readFile('wrangler.jsonc', 'utf8')
  assert.match(wrangler, /"workers_dev":\s*false/)
  assert.match(wrangler, /"preview_urls":\s*false/)
  // 正式域正常收录；其它主机一律 noindex；本地开发不打标记。
  for (const host of ['www.cs61bbeyond.com', 'cs61bbeyond.com']) assert.equal(shouldNoindex(host), false)
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1', 'site.local']) assert.equal(shouldNoindex(host), false)
  for (const host of ['cs-courses.example.workers.dev', 'preview.cs-courses.pages.dev', 'evil.example']) {
    assert.equal(shouldNoindex(host), true, host)
  }
})
