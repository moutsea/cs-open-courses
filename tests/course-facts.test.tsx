import assert from 'node:assert/strict'
import { test } from 'node:test'
import path from 'node:path'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { JSDOM } from 'jsdom'
import { renderToStaticMarkup } from 'react-dom/server'
import CourseFactSheet from '../src/components/CourseFactSheet'
import CourseFaq from '../src/components/CourseFaq'
import CourseComparisonTable from '../src/components/CourseComparisonTable'
import CourseStudyGuide from '../src/components/CourseStudyGuide'
import { parseMarkdownFile, type Course } from '../src/lib/courseParser'
import { buildCourseFaq, extractCourseFacts, factSheetRows, formatStudyHours, type FactLocale } from '../src/lib/courseFacts'
import { courseListSchema, courseSchema, faqSchema, getCourseSeo } from '../src/lib/courseSeo'
import { buildDynamicRoutePath } from '../src/lib/pathUtils'
import { markdownToHTML } from '../src/lib/markdownProcessor'

function sampleCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'CS123', slug: 'CS123', path: 'example/CS123', title: 'CS123',
    content: '', description: '', hasEnglishVersion: true, ...overrides
  }
}

async function readCourse(locale: FactLocale, route: string): Promise<Course> {
  return sampleCourse({
    ...await parseMarkdownFile(path.join(process.cwd(), 'course-content', locale, `${route}.md`), locale),
    id: route, path: route, slug: route.split('/').pop()!
  })
}

test('resource fragments survive extraction, fact sheet links and rendered FAQ links', async () => {
  const cases = [
    ['zh', 'programming-languages-design/PKU-SoftwareAnalysis', 'https://liveclass.org.cn/cloudCourse/#/courseDetail/8mI06L2eRqk8GcsW'],
    ['en', 'programming-languages-design/PKU-SoftwareAnalysis', 'https://liveclass.org.cn/cloudCourse/#/courseDetail/8mI06L2eRqk8GcsW'],
    ['en', 'computer-systems-basics/CSAPP', 'https://scs.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#folderID=%22b96d90ae-9871-4fae-91e2-b1627b43e25e%22']
  ] as const
  for (const [locale, route, url] of cases) {
    const course = await readCourse(locale, route)
    const facts = extractCourseFacts(course.content, locale)
    assert.equal(facts.resources.find(resource => resource.kind === 'video')?.url, url, route)
    const faq = buildCourseFaq(course, facts, locale)
    for (const component of [
      <CourseFactSheet key="facts" rows={[]} resources={facts.resources} locale={locale} />,
      <CourseFaq key="faq" items={faq} locale={locale} />
    ]) {
      const dom = new JSDOM(renderToStaticMarkup(component))
      assert.ok([...dom.window.document.querySelectorAll('a')].some(link => link.getAttribute('href') === url), route)
      dom.window.close()
    }
    assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text.includes(url)))
  }
})

test('URL cleanup removes tracking parameters but preserves functional queries and distinct fragments', () => {
  const facts = extractCourseFacts(`## Resources
- Textbooks: [Notes](https://example.org/course?edition=2026&lang=zh&utm_source=share#%E8%AF%BE%E7%A8%8B)
- Assignments: <https://example.org/course?edition=2026&lang=zh&vd_source=share#homework>
- Videos: [Unmodified](https://example.org/player?q=course%20name#/course/12?part=3)
`, 'en')
  assert.deepEqual(facts.resources.map(resource => resource.url).sort(), [
    'https://example.org/course?edition=2026&lang=zh#%E8%AF%BE%E7%A8%8B',
    'https://example.org/course?edition=2026&lang=zh#homework',
    'https://example.org/player?q=course%20name#/course/12?part=3'
  ].sort())
})

test('EE16 textbook and assignment section links are not deduplicated into its homepage', async () => {
  const course = await readCourse('en', 'electronics-basics/EE16')
  const facts = extractCourseFacts(course.content, 'en')
  for (const [kind, url] of [
    ['website', 'https://eecs16b.org/'],
    ['textbook', 'https://eecs16b.org/#notes'],
    ['assignment', 'https://eecs16b.org/#schedule']
  ]) assert.ok(facts.resources.some(resource => resource.kind === kind && resource.url === url), url)
})

test('CS571 weekly workload is preserved as text and omitted from total-duration schema', async () => {
  for (const locale of ['zh', 'en'] as const) {
    const course = await readCourse(locale, 'web-development/CS571')
    const facts = extractCourseFacts(course.content, locale)
    assert.match(facts.hours || '', locale === 'zh' ? /每周.*12 周/ : /hrs\/week.*12 weeks/)
    assert.equal('timeRequired' in courseSchema(course, locale, facts), false)
    const collection = courseListSchema([course], locale, 'Courses', new Map([[course.path, facts]]))
    assert.equal('timeRequired' in collection.itemListElement[0].item, false)
    const withoutSummary = { ...course, summary: '', summaryEn: '' }
    assert.doesNotMatch(getCourseSeo(withoutSummary, locale, facts).description, /~2 hours|约 2 学时/)
  }
})

test('structured total duration accepts only explicit finite positive hours', () => {
  const durations: Array<[Course['duration'], string]> = [
    ['60 小时', 'PT60H'], ['20', 'PT20H'], ['2.5 hours', 'PT2.5H'], ['0.5h', 'PT0.5H'],
    ['75 学时', 'PT75H'], [{ value: 150, originalText: '150 hours' }, 'PT150H'],
    [{ value: 2, originalText: '2.5 hours' }, 'PT2.5H'], [{ value: 2.5, originalText: '' }, 'PT2.5H']
  ]
  for (const [duration, expected] of durations) {
    assert.equal(courseSchema(sampleCourse({ duration }), 'en').timeRequired, expected, JSON.stringify(duration))
  }
})

test('ranges, bounds, weekly workloads and non-hour units never become a single total', () => {
  const ambiguous = ['60–80 hours', '少于 15 小时', '100h+', '约 60 小时', '因人而异',
    'Varying according to the learner', '2 hrs/week, 12 weeks', '2 weeks', '20 minutes', '0', '-2', 'Infinity', 'NaN']
  for (const originalText of ambiguous) {
    for (const duration of [originalText, { value: 2, originalText }]) {
      assert.equal('timeRequired' in courseSchema(sampleCourse({ duration }), 'zh'), false, JSON.stringify(duration))
    }
  }
  for (const value of [0, -1, Infinity, NaN]) {
    assert.equal('timeRequired' in courseSchema(sampleCourse({ duration: { value, originalText: '' } }), 'en'), false)
  }
  const facts = extractCourseFacts('## Introduction\n- Class Hour: 2 hrs/week, 12 weeks', 'en')
  assert.equal('timeRequired' in courseSchema(sampleCourse({ duration: '2 hours' }), 'en', facts), false)
})

test('workload FAQ repeats the source estimate without inventing its origin, scope or extra effort', async () => {
  for (const locale of ['zh', 'en'] as const) {
    const course = await readCourse(locale, 'web-development/CS571')
    const facts = extractCourseFacts(course.content, locale)
    const faq = buildCourseFaq(course, facts, locale)
    const answer = faq.find(item => /难吗|how (?:hard|long)/.test(item.q))!.a
    assert.ok(facts.hours && answer.includes(facts.hours))
    assert.doesNotMatch(answer, /官方|只包含|一半|official|lectures and reading only|50%/i)
    assert.equal(faqSchema(faq, locale).mainEntity.find(item => item.acceptedAnswer.text === answer)?.acceptedAnswer.text, answer)
  }
})

test('qualitative workload, ranges and lower bounds retain their wording in facts and FAQ', () => {
  for (const locale of ['zh', 'en'] as const) {
    for (const hours of [locale === 'zh' ? '因人而异' : 'Varying according to the learner', '100h+', '60–80 hours']) {
      const course = sampleCourse({ duration: hours })
      const facts = { resources: [], hours }
      assert.equal(factSheetRows(course, facts, locale).find(row => /学时|hours/.test(row.label))?.value, hours)
      const answer = buildCourseFaq(course, facts, locale)[0].a
      assert.ok(answer.includes(hours))
      assert.doesNotMatch(answer, /因人而异 小时|learner hours|只包含|50%|官方给出/)
    }
  }
})

test('FAQ does not imply an estimate exists when only difficulty is provided', () => {
  for (const locale of ['zh', 'en'] as const) {
    const faq = buildCourseFaq(sampleCourse({ difficulty: 'Intermediate' }), { resources: [] }, locale)
    assert.equal(faq.length, 1)
    assert.match(faq[0].a, locale === 'zh' ? /进阶/ : /Intermediate/)
    assert.doesNotMatch(faq[0].a, /时长|学时|小时|一半|time|estimate|hours|50%/i)
    assert.deepEqual(buildCourseFaq(sampleCourse(), { resources: [] }, locale), [])
  }
})

test('CS144 Introduction supplies prerequisites to fact sheet, comparison, FAQ and schema', async () => {
  const course = await readCourse('en', 'computer-networks/CS144')
  const facts = extractCourseFacts(course.content, 'en')
  const prerequisites = 'Computer System Fundamentals, CS106L'
  assert.equal(facts.prerequisites, prerequisites)
  assert.equal(facts.language, 'C++')
  assert.equal(facts.hours, '100 hours')
  const rows = factSheetRows(course, facts, 'en')
  assert.ok(rows.some(row => row.label === 'Prerequisites' && row.value === prerequisites))
  assert.ok(buildCourseFaq(course, facts, 'en').some(item => /prerequisites/.test(item.q) && item.a.includes(prerequisites)))
  assert.equal(courseSchema(course, 'en', facts).coursePrerequisites, prerequisites)
  const html = renderToStaticMarkup(<CourseComparisonTable locale="en" rows={[{title: course.title, routePath: course.path, prerequisites: facts.prerequisites}]} />)
  assert.ok(html.includes(prerequisites))
})

test('metadata heading aliases respect section boundaries and Windows line endings', () => {
  for (const heading of ['## Introduction', '### INTRODUCTION', '## Course Introduction', '## Descriptions', '## 课程简介']) {
    const facts = extractCourseFacts(`${heading}\r\n- Prerequisites: CS106L\r\n## Notes\r\n- Language: Wrong\r\n- Class Hour: 999 hours\r\n`)
    assert.equal(facts.prerequisites, 'CS106L', heading)
    assert.equal(facts.language, undefined)
    assert.equal(facts.hours, undefined)
  }
})

test('Haskell MOOC advertises its shared textbook URL but never nonexistent recordings', async () => {
  for (const locale of ['zh', 'en'] as const) {
    const course = await readCourse(locale, 'programming-introduction/functional/Haskell-MOOC')
    const facts = extractCourseFacts(course.content, locale)
    const title = getCourseSeo(course, locale, facts).title
    assert.doesNotMatch(title, /视频|Videos/)
    assert.match(title, /教材|Textbook/)
    assert.ok(facts.resources.some(item => item.kind === 'textbook' && item.url === 'https://haskell.mooc.fi/'))
  }
})

test('SEO media labels distinguish absent resources from actual books and videos', () => {
  for (const locale of ['zh', 'en'] as const) {
    for (const absent of ['None', 'N/A', 'Not available', 'None, use the course notes', '无', '暂无', '无，主要学习途径是课程笔记', '没有指定教材']) {
      const facts = extractCourseFacts(`## Resources\n- Textbook: ${absent}\n- Videos: ${absent}`, locale)
      assert.doesNotMatch(getCourseSeo(sampleCourse(), locale, facts).title, /教材|视频|Textbook|Videos/, absent)
    }
    for (const [resource, expected, excluded] of [
      ['Textbook: Computer Systems: A Programmer\'s Perspective, 3/E', /教材|Textbook/, /视频|Videos/],
      ['Textbook: [Book](https://example.org/book)', /教材|Textbook/, /视频|Videos/],
      ['Videos: [Recordings](https://example.org/lectures)', /视频|Videos/, /教材|Textbook/]
    ] as const) {
      const facts = extractCourseFacts(`## Resources\n- ${resource}`, locale)
      const title = getCourseSeo(sampleCourse(), locale, facts).title
      assert.match(title, expected)
      assert.doesNotMatch(title, excluded)
    }
    const both = extractCourseFacts('## Resources\n- Textbook: CSAPP\n- Videos: [Lectures](https://example.org/lectures)', locale)
    const title = getCourseSeo(sampleCourse(), locale, both).title
    assert.match(title, /教材|Textbook/)
    assert.match(title, /视频|Videos/)
  }
})

test('a link to alternative notes on a no-video line is not advertised as a recording', () => {
  const facts = extractCourseFacts('## 课程资源\n- 课程视频：无，直接看[lecture](https://example.org/notes)就可以了', 'zh')
  assert.doesNotMatch(getCourseSeo(sampleCourse(), 'zh', facts).title, /视频/)
  assert.equal(buildCourseFaq(sampleCourse(), facts, 'zh').some(item => /有视频/.test(item.q)), false)
})

test('resource display limits do not remove CS61A textbooks or assignments from the facts', async () => {
  const course = await readCourse('en', 'programming-introduction/python/CS61A')
  const facts = extractCourseFacts(course.content, 'en')
  assert.ok(facts.resources.length > 8)
  assert.ok(facts.resources.some(item => item.kind === 'textbook' && item.url === 'https://www.composingprograms.com/'))
  assert.ok(facts.resources.some(item => item.kind === 'assignment' && item.url === 'https://cs61a.org/'))
  const dom = new JSDOM(renderToStaticMarkup(<CourseFactSheet rows={[]} resources={facts.resources} locale="en" />))
  const links = [...dom.window.document.querySelectorAll('a')]
  assert.equal(links.length, 8)
  assert.ok(links.some(link => link.getAttribute('href') === 'https://www.composingprograms.com/'))
  assert.ok(links.some(link => link.textContent?.includes('Assignments & labs')))
  assert.ok(links.some(link => link.textContent?.includes('Lecture videos')))
  dom.window.close()
})

test('study guide renders nothing without a guide or related courses, but keeps a related link', () => {
  const only = sampleCourse()
  const sibling = sampleCourse({ id: 'CS456', slug: 'CS456', path: 'example/CS456', title: 'CS456' })
  const routeOf = (course: Course) => buildDynamicRoutePath(course.path).join('/')
  // A lone course in its category used to leave an empty bordered wrapper: a stray divider above the footer.
  assert.equal(renderToStaticMarkup(<CourseStudyGuide coursePath={routeOf(only)} courses={[only]} locale="en" />), '')
  const dom = new JSDOM(renderToStaticMarkup(<CourseStudyGuide coursePath={routeOf(only)} courses={[only, sibling]} locale="en" />))
  const links = [...dom.window.document.querySelectorAll('a')].map(link => link.getAttribute('href'))
  assert.deepEqual(links, [`/course/${routeOf(sibling)}`])
  dom.window.close()
})

test('bare USTC and MIT resource URLs reach fact sheets, FAQ links and Course schema', async () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const [route, website] of [
      ['computer-graphics/USTC ComputerGraphics', 'http://staff.ustc.edu.cn/~lgliu/Courses/ComputerGraphics_2020_spring-summer/default.htm'],
      ['deep-generative-models/MIT6.S184', 'https://diffusion.csail.mit.edu/']
    ]) {
      const course = await readCourse(locale, route)
      const facts = extractCourseFacts(course.content, locale)
      assert.ok(facts.resources.some(item => item.kind === 'website' && item.url === website), `${locale}/${route}`)
      assert.equal(courseSchema(course, locale, facts).sameAs, website)
      const faq = buildCourseFaq(course, facts, locale)
      assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text.includes(website)))
      for (const component of [
        <CourseFactSheet key="facts" rows={[]} resources={facts.resources} locale={locale} />,
        <CourseFaq key="faq" items={faq} locale={locale} />
      ]) {
        const dom = new JSDOM(renderToStaticMarkup(component))
        assert.ok([...dom.window.document.querySelectorAll('a')].some(link => link.getAttribute('href') === website))
        dom.window.close()
      }
      if (route.startsWith('computer-graphics')) {
        assert.ok(facts.resources.some(item => item.kind === 'video' && item.url.startsWith('https://www.bilibili.com/video/BV1iT4y1o7oM/')))
        assert.ok(facts.resources.some(item => item.kind === 'assignment' && item.url === website))
      }
    }
  }
})

test('mixed Markdown, autolink and bare resource URLs retain roles, queries and fragments', () => {
  const facts = extractCourseFacts(`## Resources
- Course Website: [Current](https://example.org/website), <https://example.org/archive> and https://example.org/textbook?term=2026&utm_source=share#schedule.
- Videos: **https://example.org/video#part-2**
- Assignments: https://example.org/homework，
- Textbooks: [Book](https://example.org/Book_(2026)) and https://example.org/notes。
- Other: \`https://example.org/code\` ![Cover](https://example.org/cover.png) [Unsafe](javascript:alert(1))
`, 'en')
  const linked = facts.resources.filter(item => item.url)
  assert.equal(linked.length, 7)
  assert.deepEqual(linked.filter(item => item.kind === 'website').map(item => item.url), [
    'https://example.org/website', 'https://example.org/archive', 'https://example.org/textbook?term=2026#schedule'
  ])
  assert.equal(linked.find(item => item.kind === 'assignment')?.url, 'https://example.org/homework')
  assert.deepEqual(linked.filter(item => item.kind === 'textbook').map(item => item.url), [
    'https://example.org/Book_(2026)', 'https://example.org/notes'
  ])
  assert.ok(linked.every(item => !/code|cover|javascript/.test(item.url)))
})

test('resource classification keeps generic material descriptions and assignment label aliases', async () => {
  for (const [locale, route, kind, url] of [
    ['en', 'deep-learning/EECS498-007', 'textbook', 'https://www.deeplearningbook.org/'],
    ['en', 'deep-learning/CS231', 'assignment', 'http://cs231n.stanford.edu/schedule.html'],
    ['zh', 'operating-systems/COS318', 'assignment', 'https://www.cs.princeton.edu/courses/archive/fall20/cos318/projects.html'],
    ['zh', 'computer-graphics/15462', 'video', 'https://www.bilibili.com/video/BV1QZ4y1K7ga'],
    ['en', 'system-security/SEEDLabs', 'website', 'https://seedsecuritylabs.org/index.html'],
    ['en', 'compilers/USTC-Compilers', 'assignment', 'https://ustc-compiler-principles.github.io/textbook']
  ] as const) {
    const course = await readCourse(locale, route)
    const facts = extractCourseFacts(course.content, locale)
    assert.ok(facts.resources.some(item => item.kind === kind && item.url === url), `${locale}/${route}`)
  }
})

test('URLs with balanced parentheses remain intact in fact sheet and FAQ anchors', () => {
  const url = 'https://example.org/Book_(2026)?edition=2#chapter-1'
  const facts = extractCourseFacts(`## Resources\n- Textbook: [Book](${url})`, 'en')
  const faq = buildCourseFaq(sampleCourse(), facts, 'en')
  const wrapped = { q: 'Reference', a: `Read the notes (${url}).` }
  for (const component of [
    <CourseFactSheet key="facts" rows={[]} resources={facts.resources} locale="en" />,
    <CourseFaq key="faq" items={[...faq, wrapped]} locale="en" />
  ]) {
    const dom = new JSDOM(renderToStaticMarkup(component))
    const links = [...dom.window.document.querySelectorAll('a')]
    assert.ok(links.length)
    assert.ok(links.every(link => link.getAttribute('href') === url))
    dom.window.close()
  }
})

test('None and 无 never become programming languages or toolchain advice in real-course FAQs', async () => {
  const routes = ['advanced-mathematics/CS70', 'computer-networks/topdown', 'computer-networks/topdown_ustc',
    'machine-learning/CS229', 'mathematics-basics/MITLA', 'mathematics-basics/MITmaths', 'mathematics-basics/information']
  for (const locale of ['en', 'zh'] as const) {
    for (const route of routes) {
      const course = await readCourse(locale, route)
      const facts = extractCourseFacts(course.content, locale)
      const faq = buildCourseFaq(course, facts, locale)
      const answer = faq.find(item => /编程语言|programming language/.test(item.q))!.a
      assert.match(answer, locale === 'zh' ? /未指定编程语言要求/ : /do not specify a programming language requirement/)
      assert.doesNotMatch(answer, /uses None|written None|toolchain|environment setup|使用.*无|环境配置|边学边补/)
      assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text === answer))
    }
  }
})

test('language qualifiers survive extraction and FAQ answers without invented setup guidance', () => {
  for (const language of ['Python preferred', 'Anything would be OK, Python preferred', 'C++ (preferred)', 'Java']) {
    const facts = extractCourseFacts(`## Introduction\n- Programming Language: ${language}`, 'en')
    assert.equal(facts.language, language)
    const answer = buildCourseFaq(sampleCourse(), facts, 'en')[0].a
    assert.ok(answer.includes(language))
    assert.doesNotMatch(answer, /uses .* for its coursework|environment setup|pick it up/)
  }
  for (const locale of ['en', 'zh'] as const) {
    for (const language of ['None', '无', 'N/A', 'Not specified']) {
      const course = sampleCourse({ programmingLanguage: language })
      assert.match(buildCourseFaq(course, { resources: [] }, locale)[0].a, locale === 'zh' ? /未指定编程语言要求/ : /do not specify a programming language requirement/)
      assert.doesNotMatch(getCourseSeo(course, locale).description, /None|N\/A|Not specified|无 实现/i)
    }
  }
})

test('absent and qualified prerequisites are quoted without inventing extra requirements', async () => {
  const routes = ['programming-introduction/python/CS50P', 'programming-introduction/java/COS126',
    'deep-generative-models/CMU15-779', 'deep-generative-models/large-language-models/CMU11-711', 'advanced-mathematics/CS70']
  for (const locale of ['en', 'zh'] as const) {
    for (const route of routes) {
      const course = await readCourse(locale, route)
      const facts = extractCourseFacts(course.content, locale)
      const faq = buildCourseFaq(course, facts, locale)
      const answer = faq.find(item => /先修要求|prerequisites/.test(item.q))!.a
      assert.ok(facts.prerequisites && answer.includes(facts.prerequisites), `${locale}/${route}`)
      assert.doesNotMatch(answer, /foundation course first|later assignments assume|write and debug|先补完|动手写代码|基本语法|官方/)
      assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text === answer))
    }
  }
})

test('English no-textbook statements do not advertise textbooks in actual course titles', async () => {
  for (const route of ['programming-introduction/python/CS50P', 'artificial-intelligence/CS50', 'system-security/MIT6.1600']) {
    const course = await readCourse('en', route)
    const facts = extractCourseFacts(course.content, 'en')
    assert.equal(facts.resources.find(item => item.kind === 'textbook')?.available, false, route)
    assert.doesNotMatch(getCourseSeo(course, 'en', facts).title, /Textbook/, route)
    assert.equal(buildCourseFaq(course, facts, 'en').some(item => /textbook/.test(item.q)), false)
  }
})

test('no-textbook wording is distinguished from real titles beginning with No', () => {
  for (const value of ['No textbook required', 'No textbook is needed in this course.',
    'There is no required textbook, but the lecture notes are good reading materials.']) {
    const facts = extractCourseFacts(`## Resources\n- Textbooks: ${value}`, 'en')
    assert.doesNotMatch(getCourseSeo(sampleCourse(), 'en', facts).title, /Textbook/)
  }
  for (const value of ['No Silver Bullet', '[No Silver Bullet](https://example.org/book)', 'NoSQL Distilled']) {
    const facts = extractCourseFacts(`## Resources\n- Textbooks: ${value}`, 'en')
    assert.match(getCourseSeo(sampleCourse(), 'en', facts).title, /Textbook/)
    assert.notEqual(facts.resources[0].available, false)
  }
})

test('English workload aliases populate real-course metadata, comparisons, FAQ and schema', async () => {
  const cases = [
    ['compilers/CS143', '150', 150], ['compilers/NJU-Compilers', '80', 80],
    ['deep-generative-models/MIT6.S184', '20', 20],
    ['deep-generative-models/large-language-models/CMU11-667', '100+ hours', null],
    ['operating-systems/HITOS', '100 hours+', null],
    ['programming-languages-design/NJU-SoftwareAnalysis', '60 hours', 60],
    ['programming-languages-design/PKU-SoftwareAnalysis', '60 hours', 60]
  ] as const
  for (const [route, text, total] of cases) {
    const course = await readCourse('en', route)
    const facts = extractCourseFacts(course.content, 'en')
    assert.equal(facts.hours, text, route)
    assert.deepEqual(course.duration, { value: total, originalText: text }, route)
    const displayedHours = formatStudyHours(text, 'en')
    assert.equal(factSheetRows(course, facts, 'en').find(row => row.label === 'Estimated hours')?.value, displayedHours)
    assert.ok(buildCourseFaq(course, facts, 'en').some(item => item.a.includes(displayedHours)))
    const comparison = renderToStaticMarkup(<CourseComparisonTable locale="en" rows={[{title: course.title, routePath: course.path, hours: displayedHours}]} />)
    assert.ok(comparison.includes(displayedHours))
    const schema = courseSchema(course, 'en', facts)
    assert.equal(schema.timeRequired, total === null ? undefined : `PT${total}H`, route)
    const collection = courseListSchema([course], 'en', 'Courses', new Map([[course.path, facts]]))
    assert.equal(collection.itemListElement[0].item.timeRequired, schema.timeRequired)
  }
})

test('metadata workload values preserve bounds and weekly units while accepting decimal totals', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'course-hours-'))
  const file = path.join(directory, 'course.md')
  try {
    for (const label of ['Learning Hours', 'estimated study hours', 'Class Hours', 'Estimated Study Time', 'Estimated Time Commitment', 'Estimated Workload', '预计学时']) {
      for (const [text, total] of [['2.5 hours', 2.5], ['20', 20], ['100+ hours', null], ['100 hours+', null],
        ['2 hrs/week, 12 weeks', null], ['每周 2 小时，共 12 周', null], ['30-40 hours', null]] as const) {
        const markdown = `# Example\n\n## Introduction\n\n- **${label}**: ${text}\n`
        await writeFile(file, markdown)
        const parsed = await parseMarkdownFile(file, 'en')
        assert.deepEqual(parsed.duration, { value: total, originalText: text }, `${label}: ${text}`)
        assert.equal(extractCourseFacts(markdown, 'en').hours, text)
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('CMU11-711 URL labels produce separate valid FAQ anchors in both languages', async () => {
  const assignment = 'https://www.phontron.com/class/anlp-fall2024/assignments/'
  const website = 'https://www.phontron.com/class/anlp-fall2024/'
  for (const locale of ['en', 'zh'] as const) {
    const course = await readCourse(locale, 'deep-generative-models/large-language-models/CMU11-711')
    const facts = extractCourseFacts(course.content, locale)
    const faq = buildCourseFaq(course, facts, locale)
    const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale={locale} />))
    const links = [...dom.window.document.querySelectorAll('a')].map(link => link.getAttribute('href'))
    assert.ok(links.includes(assignment))
    assert.ok(links.every(url => url === assignment || url === website), JSON.stringify(links))
    assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text.includes(assignment)))
    dom.window.close()
  }
})

test('FAQ URL boundaries exclude quotation marks while preserving URL punctuation and fragments', () => {
  const url = "https://example.org/O'Reilly_(2026)?label=%22quoted%22#part-2"
  for (const [open, close] of [['"', '"'], ['「', '」'], ['『', '』'], ['“', '”'], ['《', '》']]) {
    const answer = `${open}${url}${close}：${url}。`
    const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={[{q: 'Reference', a: answer}]} locale="zh" />))
    assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(link => link.getAttribute('href')), [url, url])
    dom.window.close()
  }
})

test('CMU10-414 metadata continuation preserves prerequisites, later fields and the real summary', async () => {
  const course = await readCourse('en', 'machine-learning-systems/CMU10-414')
  const facts = extractCourseFacts(course.content, 'en')
  const prerequisites = 'Introduction to Systems (e.g., 15-213), Basics of Deep Learning, Fundamental Mathematical Knowledge'
  assert.equal(facts.prerequisites, prerequisites)
  assert.equal(course.programmingLanguage, 'Python, C++')
  assert.equal(course.difficulty, 'Intermediate')
  assert.deepEqual(course.duration, {value: 100, originalText: '100 hours'})
  assert.match(course.summaryEn || '', /^The rise of deep learning/)
  assert.doesNotMatch(getCourseSeo(course, 'en', facts).description, /Programming Languages:|Estimated Hours:|Difficulty:/)
  const schema = courseSchema(course, 'en', facts)
  assert.equal(schema.coursePrerequisites, prerequisites)
  assert.equal(schema.educationalLevel, 'Intermediate')
  assert.equal(schema.timeRequired, 'PT100H')
  assert.ok(buildCourseFaq(course, facts, 'en').some(item => item.a.includes(prerequisites)))
})

test('multiline metadata respects paragraphs, section boundaries and fenced examples', async () => {
  const markdown = `# Example

## Course Introduction

- University: Example University
- Prerequisites: Linear algebra,
  probability and calculus
- Programming Languages: Python,
  C++
- Course Difficulty: 🌟🌟🌟
- Estimated Workload: 80 hours

The actual description.

## Notes

- Estimated Workload: 999 hours

\`\`\`markdown
## Course Introduction
- Programming Languages: Wrong
## Resources
- Videos: https://example.org/fake
\`\`\`
`.replace(/\n/g, '\r\n')
  const directory = await mkdtemp(path.join(tmpdir(), 'course-metadata-'))
  try {
    const file = path.join(directory, 'course.md')
    await writeFile(file, markdown)
    const parsed = await parseMarkdownFile(file, 'en')
    const facts = extractCourseFacts(markdown, 'en')
    assert.equal(facts.prerequisites, 'Linear algebra, probability and calculus')
    assert.equal(facts.language, 'Python, C++')
    assert.equal(parsed.programmingLanguage, facts.language)
    assert.equal(parsed.difficulty, 'Intermediate')
    assert.deepEqual(parsed.duration, {value: 80, originalText: '80 hours'})
    assert.equal(parsed.summaryEn, 'The actual description.')
    assert.deepEqual(facts.resources, [])
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('existing introductory subheadings and Difficulty Level metadata retain their values', async () => {
  for (const locale of ['en', 'zh'] as const) {
    const course = await readCourse(locale, 'programming-introduction/functional/CS3110')
    const summary = locale === 'zh' ? course.summary : course.summaryEn
    assert.match(summary || '', locale === 'zh' ? /^如果说编程入门/ : /^If the best course/)
    assert.equal(course.programmingLanguage, 'OCaml')
    assert.equal(course.difficulty, 'Intermediate')
  }
  assert.equal((await readCourse('en', 'computer-architecture/CA')).difficulty, 'Intermediate')
})

test('nested CMU15-799 homepages retain their website role in facts, FAQ and schema', async () => {
  for (const locale of ['en', 'zh'] as const) {
    const course = await readCourse(locale, 'database-systems/15799')
    const facts = extractCourseFacts(course.content, locale)
    const websites = facts.resources.filter(item => item.kind === 'website' && item.url)
    assert.deepEqual(websites.map(item => item.url), [
      'https://15799.courses.cs.cmu.edu/fall2013',
      'https://15799.courses.cs.cmu.edu/spring2022/',
      'https://15799.courses.cs.cmu.edu/spring2025/'
    ])
    assert.equal(courseSchema(course, locale, facts).sameAs, websites[0].url)
    assert.ok(buildCourseFaq(course, facts, locale).some(item => item.a.includes(websites[0].url)))
  }
})

test('CMU15-462 nested videos and supplementary textbooks keep their resource roles', async () => {
  for (const locale of ['en', 'zh'] as const) {
    const course = await readCourse(locale, 'computer-graphics/15462')
    const facts = extractCourseFacts(course.content, locale)
    assert.ok(facts.resources.some(item => item.kind === 'video' && item.url.startsWith('https://www.youtube.com/')))
    const books = facts.resources.filter(item => item.kind === 'textbook' && item.url)
    assert.equal(books.length, 3)
    assert.ok(books.every(item => item.available !== false))
    const faq = buildCourseFaq(course, facts, locale)
    assert.ok(faq.some(item => item.a.includes(books[0].url)))
  }
})

test('nested resource roles stay scoped and explicit child roles override the parent', () => {
  const facts = extractCourseFacts(`## Resources
- Course Website
  - Archives
    - [2025](https://example.org/2025)
  - Videos: [Recordings](https://example.org/watch)
- Textbook
  - [A Book About Video](https://example.org/book)
- Other: [Forum](https://example.org/forum)
- Videos: None, read these notes instead
  - [Notes](https://example.org/notes)
## Personal Resources
- Textbook: [Personal](https://example.org/personal)
`, 'en')
  const linked = facts.resources.filter(item => item.url)
  assert.equal(linked.find(item => item.url.endsWith('/2025'))?.kind, 'website')
  assert.equal(linked.find(item => item.url.endsWith('/watch'))?.kind, 'video')
  assert.equal(linked.find(item => item.url.endsWith('/book'))?.kind, 'textbook')
  assert.equal(linked.find(item => item.url.endsWith('/forum'))?.kind, 'other')
  assert.equal(linked.find(item => item.url.endsWith('/notes'))?.available, false)
  assert.equal(linked.some(item => item.url.endsWith('/personal')), false)
})

test('CMU11-868 FAQ selects actual assignments instead of the syllabus', async () => {
  const course = await readCourse('en', 'deep-generative-models/large-language-models/CMU11-868')
  const facts = extractCourseFacts(course.content, 'en')
  assert.equal(facts.resources.find(item => item.label === 'Syllabus')?.kind, 'other')
  assert.equal(facts.resources.find(item => item.kind === 'assignment' && item.url)?.url, 'https://llmsystem.github.io/llmsystemhomework/')
  const faq = buildCourseFaq(course, facts, 'en')
  assert.match(faq.find(item => /assignments and labs/.test(item.q))!.a, /https:\/\/llmsystem.github.io\/llmsystemhomework\//)
})

test('English resource keywords match whole words without losing Chinese labels', () => {
  for (const label of ['Syllabus', 'Collaboration', 'Videography', 'Readington']) {
    const facts = extractCourseFacts(`## Resources\n- ${label}: [Link](https://example.org/link)`, 'en')
    assert.equal(facts.resources[0].kind, 'other', label)
  }
  for (const label of ['Labs', 'Lab', 'Coursework', 'Assignments', 'Problem Sets', '课程作业', '课程项目']) {
    const facts = extractCourseFacts(`## Resources\n- ${label}: [Link](https://example.org/link)`, 'en')
    assert.equal(facts.resources[0].kind, 'assignment', label)
  }
})

test('CS168 materials and corrected CS230 resource heading populate resource entry points', async () => {
  for (const [route, website] of [
    ['computer-networks/CS168', 'https://su26.cs168.io/'],
    ['deep-learning/CS230', 'https://www.coursera.org/specializations/deep-learning']
  ]) {
    const course = await readCourse('en', route)
    const facts = extractCourseFacts(course.content, 'en')
    assert.equal(courseSchema(course, 'en', facts).sameAs, website)
    assert.ok(facts.resources.some(item => item.kind === 'website' && item.url === website))
    assert.ok(buildCourseFaq(course, facts, 'en').some(item => item.a.includes(website)))
    if (route.endsWith('CS168')) assert.ok(facts.resources.some(item => item.kind === 'textbook' && item.url === 'https://textbook.cs168.io/'))
  }
})

test('website fields in course introductions populate facts and schema for all affected courses', async () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const name of ['CMU10-708', 'CS229M', 'STA4273', 'STAT8201']) {
      const course = await readCourse(locale, `advanced-machine-learning/${name}`)
      const facts = extractCourseFacts(course.content, locale)
      const website = facts.resources.find(item => item.kind === 'website' && item.url)
      assert.ok(website, `${locale}/${name}`)
      assert.equal(courseSchema(course, locale, facts).sameAs, website.url)
      assert.ok(buildCourseFaq(course, facts, locale).some(item => item.a.includes(website.url)))
      const dom = new JSDOM(renderToStaticMarkup(<CourseFactSheet rows={[]} resources={facts.resources} locale={locale} />))
      assert.ok([...dom.window.document.querySelectorAll('a')].some(link => link.getAttribute('href') === website.url))
      dom.window.close()
    }
  }
})

test('introduction resource extraction excludes links in prerequisite and university values', () => {
  const facts = extractCourseFacts(`## Introduction
- University: [University Labs](https://example.org/university)
- Prerequisites: [Textbook](https://example.org/prerequisite)
- Course Website: [Home](https://example.org/home)

Description with [videos](https://example.org/prose).

## Notes
- Course Website: [Unrelated](https://example.org/unrelated)
`, 'en')
  assert.deepEqual(facts.resources.filter(item => item.url).map(item => item.url), ['https://example.org/home'])
  assert.equal(facts.prerequisites, 'Textbook')
})

test('Estimated Workload populates the two real English courses and total-duration schema', async () => {
  for (const [name, hours] of [['CMU11-711', 100], ['CMU11-868', 120]] as const) {
    const course = await readCourse('en', `deep-generative-models/large-language-models/${name}`)
    const facts = extractCourseFacts(course.content, 'en')
    assert.equal(facts.hours, `${hours} hours`)
    assert.deepEqual(course.duration, {value: hours, originalText: `${hours} hours`})
    assert.equal(factSheetRows(course, facts, 'en').find(row => row.label === 'Estimated hours')?.value, `${hours} hours`)
    assert.ok(buildCourseFaq(course, facts, 'en').some(item => item.a.includes(`${hours} hours`)))
    assert.equal(courseSchema(course, 'en', facts).timeRequired, `PT${hours}H`)
    const collection = courseListSchema([course], 'en', 'LLM Courses', new Map([[course.path, facts]]))
    assert.equal(collection.itemListElement[0].item.timeRequired, `PT${hours}H`)
  }
})

test('real reference-style resources reach fact sheets, FAQ links and FAQ schema', async () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const [route, kind, expectedCount] of [
      ['machine-learning-systems/MLC', 'video', 1],
      ['computer-architecture/N2T', 'textbook', 1],
      ...(locale === 'zh' ? [['advanced-mathematics/CS126', 'textbook', 3] as const] : [])
    ] as const) {
      const course = await readCourse(locale, route)
      const facts = extractCourseFacts(course.content, locale)
      const resources = facts.resources.filter(item => item.kind === kind && item.url)
      assert.equal(resources.length, expectedCount, `${locale}/${route}`)
      const faq = buildCourseFaq(course, facts, locale)
      const dom = new JSDOM(renderToStaticMarkup(<>
        <CourseFactSheet rows={[]} resources={facts.resources} locale={locale} />
        <CourseFaq items={faq} locale={locale} />
      </>))
      const d = dom.window.document
      for (const resource of resources) {
        assert.ok([...d.querySelectorAll('section[aria-label] a')].some(a => a.getAttribute('href') === resource.url))
      }
      assert.ok([...d.querySelectorAll('section[aria-labelledby="course-faq"] a')].some(a => a.getAttribute('href') === resources[0].url))
      assert.ok(faqSchema(faq, locale).mainEntity.some(item => item.acceptedAnswer.text.includes(resources[0].url)))
      dom.window.close()
    }
  }
})

test('reference variants preserve nested roles, functional URLs and document scope', () => {
  const facts = extractCourseFacts(`## Course Introduction
- Course Website: [Site][site]

## Course Resources
- Videos:
  - [**Lecture**][LECTURE]
  - [Archive][]
- Textbook: [Book]
- Assignments: [Lab][lab]
- Other: \`[Not a link][fake]\` ![Image][image] [Contact][mail]

## Personal Resources
- Videos: [Personal][private]

[site]: https://example.org/course
[lecture]: https://example.org/watch?edition=2026&utm_source=share#part-2
[archive]: https://example.org/archive
[book]: https://example.org/Book_(2026)
[lab]: https://example.org/course#labs
[fake]: https://example.org/fake
[image]: https://example.org/image.png
[mail]: mailto:hello@example.org
[private]: https://example.org/private
`, 'en')
  assert.deepEqual(facts.resources.filter(item => item.url).map(({kind, label, url}) => ({kind, label, url})), [
    {kind: 'website', label: 'Site', url: 'https://example.org/course'},
    {kind: 'video', label: 'Lecture', url: 'https://example.org/watch?edition=2026#part-2'},
    {kind: 'video', label: 'Archive', url: 'https://example.org/archive'},
    {kind: 'textbook', label: 'Book', url: 'https://example.org/Book_(2026)'},
    {kind: 'assignment', label: 'Lab', url: 'https://example.org/course#labs'}
  ])
  assert.equal(courseSchema(sampleCourse(), 'en', facts).sameAs, 'https://example.org/course')
})

test('unspecified and unpublished textbooks are not advertised by real-course SEO', async () => {
  for (const [locale, route] of [
    ['en', 'programming-introduction/DeCal'],
    ['en', 'computer-architecture/CA'],
    ['zh', 'software-engineering/17803']
  ] as const) {
    const course = await readCourse(locale, route)
    const facts = extractCourseFacts(course.content, locale)
    assert.equal(facts.resources.find(item => item.kind === 'textbook')?.available, false, route)
    assert.doesNotMatch(getCourseSeo(course, locale, facts).title, /Textbook|教材/)
    assert.equal(buildCourseFaq(course, facts, locale).some(item => /textbook|教材/.test(item.q)), false)
  }
})

test('negative textbook qualifiers do not hide optional reference books or titles beginning with No', () => {
  for (const value of ['No specified textbook', 'No designated textbook; see the readings.', '未公开，每节课前会有阅读材料']) {
    const facts = extractCourseFacts(`## Resources\n- Textbook: ${value}`, 'en')
    assert.equal(facts.resources[0].available, false, value)
    assert.doesNotMatch(getCourseSeo(sampleCourse(), 'en', facts).title, /Textbook/)
  }
  for (const value of ['No Silver Bullet', 'NoSQL Distilled', 'Nothing Is Impossible']) {
    const facts = extractCourseFacts(`## Resources\n- Textbook: [${value}](https://example.org/book)`, 'en')
    assert.notEqual(facts.resources[0].available, false, value)
    assert.match(buildCourseFaq(sampleCourse(), facts, 'en')[0].a, /https:\/\/example.org\/book/)
  }
  const optional = extractCourseFacts(`## Resources
- Textbooks: No designated textbook, but these supplementary books are recommended:
  - [Optional book][book]

[book]: https://example.org/optional
`, 'en')
  assert.equal(optional.resources.find(item => !item.url)?.available, false)
  assert.notEqual(optional.resources.find(item => item.url)?.available, false)
  assert.match(buildCourseFaq(sampleCourse(), optional, 'en')[0].a, /https:\/\/example.org\/optional/)
})

test('MIT6.050J summaries and SEO contain the visible reference label without its definition', async () => {
  const course = await readCourse('zh', 'mathematics-basics/information')
  const expected = 'MIT 面向大一新生的信息论入门课程，Penfield 教授专门为这门课写了一本教材作为课程 notes，内容深入浅出，生动有趣。'
  const facts = extractCourseFacts(course.content, 'zh')
  assert.equal(course.summary, expected)
  assert.equal(getCourseSeo(course, 'zh', facts).description, expected)
  assert.equal(courseSchema(course, 'zh', facts).description, expected)
})

test('summary text preserves visible formatting and punctuation without reference or HTML markup', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'course-summary-'))
  try {
    const file = path.join(directory, 'course.md')
    await writeFile(file, `# Example
## Course Introduction
- Programming Language: C#

[book]: https://example.org/Book_(2026)

### Overview

Read [the **book**][book], [Book][], and [guide](https://example.org/guide_(2026)). Use \`C#\`, *care*, and &#x4e2d; &amp; English.

> Quote with <em>visible</em> text.<br>Next line.

<div><p>First paragraph.</p><p>Second paragraph.</p></div>

<!-- hidden comment -->
<script>hidden script</script>

### Details
Not part of the summary.

## Resources
- Textbook: [Book]
`)
    const course = await parseMarkdownFile(file, 'en')
    assert.equal(course.programmingLanguage, 'C#')
    assert.equal(course.summaryEn, 'Read the book, Book, and guide. Use C#, care, and 中 & English. Quote with visible text. Next line. First paragraph. Second paragraph.')
    assert.equal(course.summary, '')
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('unavailable linked textbooks have identical behavior across inline and reference syntax', () => {
  for (const [locale, label] of [['en', 'No designated textbook'], ['zh', '未公开']] as const) {
    const url = 'https://example.org/policy'
    const variants = [
      `[${label}](${url})`,
      `[${label}][policy]\n\n[policy]: ${url}`,
      `[${label}][]\n\n[${label}]: ${url}`,
      `[${label}]\n\n[${label}]: ${url}`,
      `[**${label}**][policy]\n\n[policy]: ${url}`
    ]
    for (const value of variants) {
      const facts = extractCourseFacts(`## Resources\n- Textbook: ${value}`, locale)
      assert.deepEqual(facts.resources, [{kind: 'textbook', label, url, available: false}], value)
      assert.doesNotMatch(getCourseSeo(sampleCourse(), locale, facts).title, /Textbook|教材/)
      const faq = buildCourseFaq(sampleCourse(), facts, locale)
      assert.deepEqual(faq, [])
      assert.deepEqual(faqSchema(faq, locale).mainEntity, [])
      const dom = new JSDOM(renderToStaticMarkup(<CourseFactSheet rows={[]} resources={facts.resources} locale={locale} />))
      assert.equal(dom.window.document.querySelectorAll('a').length, 0)
      dom.window.close()
    }
  }
})

test('reference availability uses visible wording rather than reference identifiers', () => {
  const unavailable = extractCourseFacts(`## Resources
- Textbooks: [No designated textbook][recommended]
  - [Alternative notes][notes]

[recommended]: https://example.org/policy
[notes]: https://example.org/notes
`, 'en')
  assert.ok(unavailable.resources.every(item => item.available === false))
  assert.deepEqual(buildCourseFaq(sampleCourse(), unavailable, 'en'), [])

  const optional = extractCourseFacts(`## Resources
- Textbooks: [No designated textbook][policy]; [recommended][advice] reference books:
  - [No Silver Bullet][book]

[policy]: https://example.org/policy
[advice]: https://example.org/advice
[book]: https://example.org/book
`, 'en')
  assert.equal(optional.resources.find(item => item.url.endsWith('/policy'))?.available, false)
  assert.notEqual(optional.resources.find(item => item.url.endsWith('/book'))?.available, false)
  const faq = buildCourseFaq(sampleCourse(), optional, 'en')
  assert.match(faq[0].a, /No Silver Bullet/)
  assert.doesNotMatch(faq[0].a, /No designated textbook/)
})

test('entity-encoded query separators match body links in facts, FAQ and schema', async () => {
  for (const separator of ['&amp;', '&#38;', '&#x26;']) {
    const sourceUrl = `https://www.youtube.com/watch?v=lecture${separator}list=course#part-2`
    const expected = 'https://www.youtube.com/watch?v=lecture&list=course#part-2'
    for (const [link, definitions] of [
      [`[Lecture](${sourceUrl})`, ''],
      ['[Lecture][video]', `\n\n[video]: ${sourceUrl}`],
      [`<${sourceUrl}>`, ''],
      [sourceUrl, '']
    ]) {
      const markdown = `## Resources\n- Course Website: ${link}\n- Videos: ${link}${definitions}`
      const body = new JSDOM(await markdownToHTML(markdown))
      const facts = extractCourseFacts(markdown, 'en')
      assert.deepEqual([...body.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), [expected, expected])
      assert.deepEqual(facts.resources.map(item => item.url), [expected, expected], markdown)
      assert.equal(new URL(facts.resources[1].url).searchParams.get('list'), 'course')
      assert.equal(courseSchema(sampleCourse(), 'en', facts).sameAs, expected)
      const faq = buildCourseFaq(sampleCourse(), facts, 'en')
      assert.ok(faqSchema(faq, 'en').mainEntity.every(item => item.acceptedAnswer.text.includes(expected)))
      const rendered = new JSDOM(renderToStaticMarkup(<>
        <CourseFactSheet rows={[]} resources={facts.resources} locale="en" />
        <CourseFaq items={faq} locale="en" />
      </>))
      assert.deepEqual([...rendered.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), [expected, expected, expected, expected])
      body.window.close()
      rendered.window.close()
    }
  }
})

test('link entity decoding happens once and preserves percent encoding and attribute-context ampersands', async () => {
  for (const [sourceUrl, expected] of [
    ['https://example.org/?a=1&amp;amp;list=literal', 'https://example.org/?a=1&amp;list=literal'],
    ['https://example.org/?q=%26amp%3B&amp;list=course#%E8%AF%BE%E7%A8%8B', 'https://example.org/?q=%26amp%3B&list=course#%E8%AF%BE%E7%A8%8B'],
    ['https://example.org/?a=1&copycat=2&notit=3', 'https://example.org/?a=1&copycat=2&notit=3'],
    ['https://example.org/Book_(2026)?q=O&#39;Reilly&amp;edition=2', 'https://example.org/Book_(2026)?q=O%27Reilly&edition=2']
  ]) {
    const markdown = `## Resources\n- Textbook: [Book][book]\n\n[book]: ${sourceUrl}`
    const body = new JSDOM(await markdownToHTML(markdown))
    assert.equal(body.window.document.querySelector('a')?.href, expected)
    const facts = extractCourseFacts(markdown, 'en')
    assert.equal(facts.resources[0].url, expected)
    const faq = new JSDOM(renderToStaticMarkup(<CourseFaq items={buildCourseFaq(sampleCourse(), facts, 'en')} locale="en" />))
    assert.equal(faq.window.document.querySelector('a')?.getAttribute('href'), expected)
    body.window.close()
    faq.window.close()
  }
})

test('tracking removal and deduplication operate on decoded targets without losing functional queries', () => {
  const facts = extractCourseFacts(`## Resources
- Videos: [Video][video], [Same video](https://example.org/watch?v=lecture&list=course#part-2)

[video]: https://example.org/watch?v=lecture&amp;list=course&amp;utm_source=share#part-2
`, 'en')
  assert.deepEqual(facts.resources, [{kind: 'video', label: 'Video', url: 'https://example.org/watch?v=lecture&list=course#part-2'}])
})

test('decoding link targets never admits non-HTTP schemes or image and code sources', () => {
  const facts = extractCourseFacts(`## Resources
- Videos: [Unsafe][unsafe], [Contact][mail], ![Image][image], \`[Code][code]\`

[unsafe]: java&#x73;cript:alert(1)
[mail]: mailto:hello@example.org
[image]: https://example.org/image.png
[code]: https://example.org/code
`, 'en')
  assert.equal(facts.resources.some(item => item.url), false)
})

test('FAQ preserves terminal URL entities across inline and reference links in both languages', async () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const [sourceUrl, expected] of [
      ['https://example.org/book?chapter=1&#59;', 'https://example.org/book?chapter=1;'],
      ['https://example.org/book?q=&amp;amp;', 'https://example.org/book?q=&amp;'],
      ['https://example.org/book?chapter=1%3B', 'https://example.org/book?chapter=1%3B']
    ]) {
      for (const markdown of [
        `## Resources\n- Textbook: [Book](${sourceUrl})`,
        `## Resources\n- Textbook: [Book][book]\n\n[book]: ${sourceUrl}`
      ]) {
        const facts = extractCourseFacts(markdown, locale)
        const faq = buildCourseFaq(sampleCourse(), facts, locale)
        const body = new JSDOM(await markdownToHTML(markdown))
        const rendered = new JSDOM(renderToStaticMarkup(<>
          <CourseFactSheet rows={[]} resources={facts.resources} locale={locale} />
          <CourseFaq items={faq} locale={locale} />
        </>))
        try {
          assert.equal(body.window.document.querySelector('a')?.href, expected)
          assert.equal(facts.resources[0].url, expected)
          assert.deepEqual([...rendered.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), [expected, expected])
          assert.equal(new URL(rendered.window.document.querySelector('section[aria-labelledby] a')!.getAttribute('href')!).search,
            new URL(expected).search)
          assert.equal(faqSchema(faq, locale).mainEntity[0].acceptedAnswer.text, faq[0].a)
          const answer = rendered.window.document.querySelector('details p')!
          assert.equal(answer.textContent, faq[0].a.replace(expected, expected.replace(/^https?:\/\//, '')))
          assert.equal(answer.querySelector('a')?.nextSibling?.textContent?.startsWith(locale === 'zh' ? '。' : '. '), true)
        } finally {
          body.window.close()
          rendered.window.close()
        }
      }
    }
  }
})

test('FAQ preserves legitimate trailing punctuation in every resource answer', () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const suffix of ['.', ',', ';', ':', '!', '?', ')', '#part;']) {
      const website = `https://example.org/site?chapter=1${suffix}`
      const assignment = `https://example.org/labs?chapter=1${suffix}`
      const video = `https://example.org/watch?chapter=1${suffix}`
      const textbook = `https://example.org/book?chapter=1${suffix}`
      const facts = extractCourseFacts(`## Resources
- Website: [Home](<${website}>)
- Assignments: [Labs](<${assignment}>)
- Videos: [Lectures](<${video}>)
- Textbook: [Book](<${textbook}>)`, locale)
      for (const resources of [facts.resources, facts.resources.filter(item => item.kind === 'website')]) {
        const faq = buildCourseFaq(sampleCourse(), {resources}, locale)
        const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale={locale} />))
        try {
          assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')),
            resources.length === 1 ? [website] : [textbook, video, assignment, website], `${locale}: ${suffix}`)
          assert.deepEqual(faqSchema(faq, locale).mainEntity.map(item => item.acceptedAnswer.text), faq.map(item => item.a))
        } finally {
          dom.window.close()
        }
      }
    }
  }
})

test('FAQ keeps resource targets distinct from URL labels and other URLs sharing their prefix', () => {
  const website = 'https://example.org/course'
  const assignment = 'https://example.org/course/labs?part=1;'
  const labelUrl = 'https://example.org/course/syllabus'
  for (const locale of ['en', 'zh'] as const) {
    const facts = extractCourseFacts(`## Resources
- Website: [Home](${website})
- Assignments: [${labelUrl}](${assignment})`, locale)
    const faq = buildCourseFaq(sampleCourse(), facts, locale)
    const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale={locale} />))
    try {
      assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), [labelUrl, assignment, website])
      const text = dom.window.document.querySelector('details p')!.textContent
      assert.equal(text, faq[0].a.replace(/https?:\/\//g, ''))
    } finally {
      dom.window.close()
    }
  }
})

test('FAQ URL labels retain terminal punctuation for inline and reference resources in both languages', () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const suffix of [';', '.', ',', ':', '!', '?', ')', '#part;']) {
      const url = `https://example.org/resource?chapter=1${suffix}`
      for (const reference of [false, true]) {
        const link = reference ? `[${url}][resource]` : `[${url}](<${url}>)`
        const facts = extractCourseFacts(`## Resources
- Website: [Home](https://example.org/)
- Textbook: ${link}
- Videos: ${link}
- Assignments: ${link}
${reference ? `\n[resource]: <${url}>` : ''}`, locale)
        const faq = buildCourseFaq(sampleCourse(), facts, locale)
        const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale={locale} />))
        try {
          assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')),
            [url, url, url, url, url, url, 'https://example.org/'], `${locale}, ${suffix}, reference=${reference}`)
          assert.deepEqual([...dom.window.document.querySelectorAll('details p')].map(p => p.textContent),
            faq.map(item => item.a.replace(/https?:\/\//g, '')))
          assert.deepEqual(faqSchema(faq, locale).mainEntity.map(item => item.acceptedAnswer.text), faq.map(item => item.a))
        } finally {
          dom.window.close()
        }
      }
    }
  }
})

test('FAQ preserves distinct URL labels without substituting a resource target or matching a shorter prefix', () => {
  const website = 'https://example.org/course'
  const labelUrl = 'https://example.org/course/labs?edition=old;'
  const targetUrl = 'https://example.org/course/labs?edition=new;'
  for (const locale of ['en', 'zh'] as const) {
    const facts = extractCourseFacts(`## Resources
- Website: [Home](${website})
- Assignments: [${labelUrl}](${targetUrl})`, locale)
    const faq = buildCourseFaq(sampleCourse(), facts, locale)
    const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale={locale} />))
    try {
      assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')),
        [labelUrl, targetUrl, website])
      assert.equal(dom.window.document.querySelector('details p')?.textContent, faq[0].a.replace(/https?:\/\//g, ''))
    } finally {
      dom.window.close()
    }
  }
})

test('FAQ URL labels use visible Markdown text and decode entities only once', async () => {
  for (const locale of ['en', 'zh'] as const) {
    for (const [sourceUrl, expected] of [
      ['https://example.org/book?chapter=1&#59;', 'https://example.org/book?chapter=1;'],
      ['https://example.org/book?q=&amp;amp;', 'https://example.org/book?q=&amp;'],
      ['https://example.org/book?q=%26amp%3B', 'https://example.org/book?q=%26amp%3B']
    ]) {
      for (const markup of [`[${sourceUrl}](${sourceUrl})`, `[*${sourceUrl}*][book]\n\n[book]: ${sourceUrl}`]) {
        const markdown = `## Resources\n- Textbook: ${markup}`
        const body = new JSDOM(await markdownToHTML(markdown))
        const facts = extractCourseFacts(markdown, locale)
        const faq = buildCourseFaq(sampleCourse(), facts, locale)
        const dom = new JSDOM(renderToStaticMarkup(<>
          <CourseFactSheet rows={[]} resources={facts.resources} locale={locale} />
          <CourseFaq items={faq} locale={locale} />
        </>))
        try {
          assert.equal(body.window.document.querySelector('a')?.textContent, expected)
          assert.equal(facts.resources[0].label, expected)
          assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), [expected, expected, expected])
          assert.ok(faqSchema(faq, locale).mainEntity[0].acceptedAnswer.text.includes(expected))
        } finally {
          body.window.close()
          dom.window.close()
        }
      }
    }
  }
})

test('FAQ still distinguishes ordinary label prose and non-HTTP labels from complete URL labels', () => {
  const url = 'https://example.org/book?chapter=1;'
  const cases = [
    ['Lecture notes (https://example.org/guide).', ['https://example.org/guide', url]],
    ['No Silver Bullet', [url]],
    ['mailto:hello@example.org', [url]],
    ['javascript:alert(1)', [url]]
  ] as const
  for (const [label, expected] of cases) {
    const facts = extractCourseFacts(`## Resources\n- Textbook: [${label}](${url})`, 'en')
    const faq = buildCourseFaq(sampleCourse(), facts, 'en')
    const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale="en" />))
    try {
      assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a => a.getAttribute('href')), expected)
      assert.equal(dom.window.document.querySelector('details p')?.textContent, faq[0].a.replace(/https?:\/\//g, ''))
    } finally {
      dom.window.close()
    }
  }
})

test('single-language courses never claim a version they do not have', () => {
  const enOnly = sampleCourse({ hasEnglishVersion: true, hasChineseVersion: false })
  const zhOnly = sampleCourse({ hasEnglishVersion: false, hasChineseVersion: true })
  const bilingual = sampleCourse({ hasEnglishVersion: true, hasChineseVersion: true })
  const legacy = sampleCourse({ hasEnglishVersion: true }) // 旧调用方没给中文标记
  const versionRow = (course: Course, locale: FactLocale) =>
    factSheetRows(course, extractCourseFacts('', locale), locale)
      .find(row => /语言版本|Language versions/.test(row.label))?.value

  assert.deepEqual(courseSchema(enOnly, 'en').availableLanguage, ['en'])
  assert.deepEqual(courseSchema(zhOnly, 'zh').availableLanguage, ['zh-CN'])
  assert.deepEqual(courseSchema(bilingual, 'en').availableLanguage, ['zh-CN', 'en'])
  assert.deepEqual(courseSchema(legacy, 'en').availableLanguage, ['zh-CN', 'en'], '缺中文标记时按双语处理，保持旧行为')

  assert.equal(versionRow(enOnly, 'zh'), 'English')
  assert.equal(versionRow(enOnly, 'en'), 'English')
  assert.equal(versionRow(zhOnly, 'zh'), '中文')
  assert.equal(versionRow(zhOnly, 'en'), 'Chinese')
  assert.equal(versionRow(bilingual, 'zh'), '中文 / English')
  assert.equal(versionRow(bilingual, 'en'), 'English / Chinese')
  assert.equal(versionRow(legacy, 'en'), 'English / Chinese')
  assert.equal(versionRow(sampleCourse({ hasEnglishVersion: false }), 'en'), undefined)
})

test('FAQ questions are real headings and the summary keeps only phrasing content', async () => {
  const course = await readCourse('en', 'computer-systems-basics/CSAPP')
  const facts = extractCourseFacts(course.content, 'en')
  const faq = buildCourseFaq(course, facts, 'en')
  assert.ok(faq.length > 0)
  const dom = new JSDOM(renderToStaticMarkup(<CourseFaq items={faq} locale="en" />))
  const { document } = dom.window
  // 问题文本是 h3，且 h3 的祖先里不能有 span（span 只允许 phrasing content，原来 h3 嵌在 span 里）。
  const headings = [...document.querySelectorAll('summary h3')]
  assert.equal(headings.length, faq.length)
  for (const heading of headings) {
    assert.equal(heading.closest('span'), null)
    assert.equal(heading.parentElement?.tagName, 'SUMMARY')
  }
  // 装饰箭头对读屏隐藏，标题文字仍可读。
  const arrow = document.querySelector('summary span[aria-hidden="true"]')
  assert.ok(arrow)
  assert.equal(arrow.textContent?.trim(), '▸')
  dom.window.close()
})
