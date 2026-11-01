import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test, { type TestContext } from 'node:test'
import { JSDOM } from 'jsdom'
import { extractEvidenceUrls, safePublicHttpsUrl, validateGeneratedMarkdown } from '../scripts/sync-course-feeds.mjs'
import { extractTitleFromMarkdown, markdownToHTML } from '../src/lib/markdownProcessor'
import { parseMarkdownFile, type Course } from '../src/lib/courseParser'
import { buildCourseFaq, extractCourseFacts, factSheetRows } from '../src/lib/courseFacts'
import { courseSchema, getCourseSeo } from '../src/lib/courseSeo'
import { searchCourses, type CourseSearchIndex } from '../src/lib/searchIndex'

const OFFICIAL_URL = 'https://course.example.edu/lecture?term=fall&year=2026'
const ENTRY_URL = 'https://github.com/fixture/repo/commit/abcdef1'
const TARGET = 'computer-systems-basics/ReviewCourse'

test('evidence URLs come from raw nested strings, preserving line endings and IPv6 authorities', () => {
  const urls = extractEvidenceUrls({
    entry: { summary: `Official: ${OFFICIAL_URL}\nNext line` },
    commit: { files: [
      { patch: '+https://example.edu/crlf\r\n+https://example.edu/tab\tmore' },
      { patch: '+[Notes](https://example.edu/notes).\n+<https://example.edu/autolink>' },
      { patch: '+https://[::1]/private\n+https://[2606:4700:4700::1111]/public' }
    ] },
    ignored: [null, 12, false]
  })
  assert.deepEqual([...urls], [
    OFFICIAL_URL, 'https://example.edu/crlf', 'https://example.edu/tab',
    'https://example.edu/notes', 'https://example.edu/autolink',
    'https://[::1]/private', 'https://[2606:4700:4700::1111]/public'
  ])
})

test('public URL validation rejects local IPv6, expanded aliases and mapped private IPv4', () => {
  for (const host of [
    '::', '::1', '0:0:0:0:0:0:0:1', 'fc00::1', 'fd00::1', 'fe80::1',
    'fea0::1', 'febf::1', 'fec0::1', 'ff02::1', '::127.0.0.1',
    '::ffff:127.0.0.1', '::ffff:192.168.1.1', '::ffff:a00:1'
  ]) {
    assert.equal(safePublicHttpsUrl(`https://[${host}]/`), false, host)
  }
  for (const url of [
    'https://localhost/', 'https://host.local/', 'https://127.0.0.1/',
    'https://10.0.0.1/', 'https://172.16.0.1/', 'https://192.168.0.1/',
    'https://169.254.169.254/', 'https://100.64.0.1/', 'https://239.1.1.1/',
    'http://example.edu/', 'https://user:password@example.edu/'
  ]) assert.equal(safePublicHttpsUrl(url), false, url)
  for (const url of [
    OFFICIAL_URL, 'https://8.8.8.8/', 'https://[2606:4700:4700::1111]/',
    'https://[2001:4860:4860::8888]/', 'https://[::ffff:8.8.8.8]/'
  ]) assert.equal(safePublicHttpsUrl(url), true, url)
})

test('final Markdown validation checks rendered links, autolinks, images and HTML attributes', () => {
  assert.doesNotThrow(() => validateGeneratedMarkdown(
    `[Course](<${OFFICIAL_URL.replace(/&/g, '&amp;')}>)`, [OFFICIAL_URL]
  ))
  for (const markdown of [
    '[Notes](https://unverified.example/)',
    'https://unverified.example/',
    'www.unverified.example',
    '![Image](https://unverified.example/image.png)',
    '<a href="https://unverified.example/">Notes</a>',
    '<a href="https://unverified&#46;example/">Notes</a>',
    '[Notes](javascript:alert%281%29)'
  ]) {
    assert.throws(() => validateGeneratedMarkdown(markdown, [OFFICIAL_URL]), /outside the approved evidence/, markdown)
  }
})

function courseAction() {
  return {
    type: 'create', confidence: 0.99, category: 'computer-systems-basics',
    slug: 'ReviewCourse', officialUrl: OFFICIAL_URL,
    english: {
      title: 'Review Course', offeredBy: 'Example University', difficulty: 'Intermediate',
      prerequisites: 'Basic C++', programmingLanguages: 'C++', classHours: '30 hours',
      description: 'This example course provides enough detail for realistic regression coverage of the course synchronization workflow.'
    },
    chinese: {
      title: '代码审查示例课程', offeredBy: '示例大学', difficulty: 'Intermediate',
      description: '这门课程提供足够详细的课程介绍，用于测试自动同步流程中的链接验证和证据解析，以及课程更新后的行为。'
    },
    resources: [{ url: OFFICIAL_URL, labelEn: 'Official course', labelZh: '课程官网' }]
  }
}

interface FeedFixtureEntry {
  id: string
  url: string
  title: string
  updatedAt: string
  action: unknown
}

interface FixtureReviewRequest {
  evidence: { entry: { id: string; title: string }; commit: { message: string } }
  existingCourses: { path: string }[]
}

async function fixture(t: TestContext) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'course-feed-safety-')))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const directory of ['scripts', 'src/lib', 'automation', 'course-content/en/computer-systems-basics', 'course-content/zh/computer-systems-basics']) {
    await mkdir(path.join(root, directory), { recursive: true })
  }
  await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir')
  for (const script of ['sync-course-feeds.mjs', 'course-ai-endpoint.mjs']) {
    await copyFile(path.join('scripts', script), path.join(root, 'scripts', script))
  }
  for (const helper of ['courseMarkdownRenderer.mjs', 'courseMarkdownText.mjs', 'courseResourceKinds.mjs']) {
    await copyFile(path.join('src/lib', helper), path.join(root, 'src/lib', helper))
  }
  await writeFile(path.join(root, 'automation/course-feeds.json'), JSON.stringify({
    version: 1,
    sources: [{ id: 'fixture', name: 'Fixture', repository: 'fixture/repo',
      feedUrl: 'https://github.com/fixture/repo/commits/main.atom', minimumConfidence: 0.95, enabled: true }]
  }))
  const statePath = path.join(root, 'automation/course-feed-state.json')
  await writeFile(statePath, JSON.stringify({ version: 1, sources: { fixture: { seenEntryIds: [] } }, decisions: [] }))
  await writeFile(path.join(root, 'mock.mjs'), `
import { readFile, writeFile } from 'node:fs/promises'
const scenario = JSON.parse(await readFile(new URL('./scenario.json', import.meta.url), 'utf8'))
const entries = scenario.entries ?? [{ id: scenario.entryId, url: scenario.entryUrl, title: scenario.entryTitle,
  updatedAt: '2026-11-01T00:00:00Z', action: scenario.action }]
const reviewRequests = []
const requestsPath = new URL('./review-requests.json', import.meta.url)
await writeFile(requestsPath, '[]')
globalThis.fetch = async (url, options) => {
  if (String(url).endsWith('.atom')) return new Response('<feed>' + entries.map(entry =>
    '<entry><id>' + entry.id + '</id><link href="' + entry.url + '"/><title>' + entry.title + '</title><updated>' + entry.updatedAt + '</updated></entry>'
  ).join('') + '</feed>')
  if (String(url).startsWith('https://api.github.com/')) return Response.json({
    html_url: '${ENTRY_URL}', commit: { message: scenario.commitMessage ?? 'Add course' }, files: [{ filename: 'README.md', patch: scenario.patch }]
  })
  if (String(url) === 'https://reviewer.example/v1/messages') {
    const context = JSON.parse(JSON.parse(options.body).messages[0].content)
    reviewRequests.push(context)
    await writeFile(requestsPath, JSON.stringify(reviewRequests))
    const action = entries.find(entry => entry.id === context.evidence.entry.id).action
    return Response.json({ content: [{ type: 'text', text: scenario.responseText ?? JSON.stringify({ actions: Array.isArray(action) ? action : [action] }) }] })
  }
  throw new Error('Unexpected request: ' + url)
}
`)
  return {
    root,
    coursePath: (locale: string) => path.join(root, 'course-content', locale, `${TARGET}.md`),
    async run(action: unknown, patch = `+[Course](${OFFICIAL_URL})`, entryId = 'commit-fixture', options: {
      mode?: 'auto' | 'shadow'; entryUrl?: string; entryTitle?: string; replay?: boolean; responseText?: string
      entries?: FeedFixtureEntry[]; commitMessage?: string
    } = {}) {
      await writeFile(path.join(root, 'scenario.json'), JSON.stringify({ action, patch, entryId, entryUrl: options.entryUrl ?? ENTRY_URL,
        entryTitle: options.entryTitle ?? 'Add course', responseText: options.responseText,
        entries: options.entries, commitMessage: options.commitMessage }))
      const log = execFileSync(process.execPath, ['--import', path.join(root, 'mock.mjs'), path.join(root, 'scripts/sync-course-feeds.mjs')], {
        cwd: root, encoding: 'utf8', timeout: 20_000,
        env: { ...process.env, COURSE_AI_API_KEY: 'fixture-key', COURSE_AI_BASE_URL: 'https://reviewer.example/',
          COURSE_SYNC_MODE: options.mode ?? 'auto', COURSE_SYNC_REPLAY_LATEST: options.replay ? '1' : '0', COURSE_SYNC_MAX_PER_SOURCE: '3' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      return { ...JSON.parse(await readFile(statePath, 'utf8')), log,
        reviewRequests: JSON.parse(await readFile(path.join(root, 'review-requests.json'), 'utf8')) as FixtureReviewRequest[] }
    }
  }
}

async function renderedCourse(markdown: string) {
  const html = await markdownToHTML(markdown, { coursePath: TARGET, locale: 'en' })
  const dom = new JSDOM(html)
  const document: Document = dom.window.document
  const result = {
    urls: Array.from(document.querySelectorAll('[href], [src]'), node => node.getAttribute('href') ?? node.getAttribute('src')),
    text: document.body.textContent || ''
  }
  dom.window.close()
  return result
}

test('course creation keeps AI labels and metadata as text, with only approved rendered links', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const injection = 'Notes](https://unverified.example/) [Official'
  action.resources[0].labelEn = injection
  action.resources[0].labelZh = injection
  action.english.title += ' [Title](https://unverified.example/)'
  action.english.offeredBy += ' [School](https://unverified.example/)'
  action.english.prerequisites += ' ![Image](https://unverified.example/image.png)'
  action.english.programmingLanguages += ' www.unverified.example'
  action.english.classHours += ' https://unverified.example/'
  action.english.description += ' [Notes](https://unverified.example/) &lbrack;escaped&rbrack;'
  action.chinese.description += ' [资料](https://unverified.example/)'
  const state = await files.run(action)
  assert.equal(state.decisions[0].type, 'create')
  for (const locale of ['en', 'zh']) {
    const rendered = await renderedCourse(await readFile(files.coursePath(locale), 'utf8'))
    assert.deepEqual(rendered.urls, [OFFICIAL_URL, ENTRY_URL])
    assert.ok(rendered.text.includes(injection), 'Labels remain readable literal text')
    if (locale === 'en') assert.ok(rendered.text.includes('C++'))
  }
})

test('managed updates escape summaries and preserve prior content on repeated appends', async t => {
  const files = await fixture(t)
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), '# Existing course\n\nOriginal text.\n')
  const update = {
    type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: "Updated resources [Notes](https://unverified.example/) $'",
    summaryZh: "课程新增资料和讲解 [资料](https://unverified.example/) $'",
    resources: [{ url: OFFICIAL_URL, labelEn: 'Notes](https://unverified.example/) [Official', labelZh: '课程官网' }]
  }
  assert.equal((await files.run(update)).decisions[0].type, 'update')
  const second = await files.run(update, `+${OFFICIAL_URL}\n`, 'second-commit')
  assert.equal(second.decisions[0].type, 'update')
  for (const locale of ['en', 'zh']) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    assert.equal(markdown.match(/# Existing course/g)?.length, 1)
    assert.equal(markdown.match(/AUTO-COURSE-UPDATES:START/g)?.length, 1)
    assert.equal(markdown.match(/feed-entry:/g)?.length, 2)
    const rendered = await renderedCourse(markdown)
    assert.deepEqual(rendered.urls, [ENTRY_URL, OFFICIAL_URL, ENTRY_URL, OFFICIAL_URL])
    assert.ok(rendered.text.includes("$'"))
  }
  const before = await readFile(files.coursePath('en'), 'utf8')
  await files.run(update, `+${OFFICIAL_URL}\n`, 'second-commit')
  assert.equal(await readFile(files.coursePath('en'), 'utf8'), before, 'Seen entries remain idempotent')
})

test('a course with a bare official URL at a patch line ending is created, not rejected and marked seen', async t => {
  const files = await fixture(t)
  const state = await files.run(courseAction(), `+Course homepage: ${OFFICIAL_URL}\n+More information\n`)
  assert.equal(state.decisions[0].type, 'create')
  assert.equal(state.decisions[0].changedFiles.length, 2)
  assert.deepEqual(state.sources.fixture.seenEntryIds, ['commit-fixture'])
  assert.deepEqual((await renderedCourse(await readFile(files.coursePath('en'), 'utf8'))).urls, [OFFICIAL_URL, ENTRY_URL])
})

test('private IPv6 evidence cannot become a course or a resource link', async t => {
  const files = await fixture(t)
  const action = courseAction()
  action.officialUrl = 'https://[::1]/private'
  action.resources[0].url = action.officialUrl
  const rejected = await files.run(action, `+${action.officialUrl}\n`)
  assert.equal(rejected.decisions[0].type, 'reject')
  await assert.rejects(readFile(files.coursePath('en')), { code: 'ENOENT' })

  const valid = courseAction()
  valid.resources.push({ url: 'https://[fd00::1]/notes', labelEn: 'Notes', labelZh: '笔记' })
  const state = await files.run(valid, `+${OFFICIAL_URL}\n+https://[fd00::1]/notes\n`, 'public-course')
  assert.equal(state.decisions[0].type, 'create')
  assert.deepEqual((await renderedCourse(await readFile(files.coursePath('en'), 'utf8'))).urls, [OFFICIAL_URL, ENTRY_URL])
})

test('generated escaped metadata reaches facts, schema, FAQ and the actual search index as visible text', async t => {
  const files = await fixture(t)
  const base = courseAction()
  const action = {
    ...base,
    english: { ...base.english, title: 'C++ Programming & C#', offeredBy: 'Research & Development University',
      prerequisites: 'CS 6.001', programmingLanguages: 'C++ / C#', classHours: '1.5 hours' },
    chinese: { ...base.chinese, title: 'C++ 与 C# 程序设计', prerequisites: 'CS 6.001',
      programmingLanguages: 'C++ / C#', classHours: '1.5 小时' }
  }
  assert.equal((await files.run(action)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const expected = locale === 'en' ? action.english : action.chinese
    const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
    assert.match(parsed.content, /C\\\+\\\+/, 'Markdown remains escaped on disk')
    assert.equal(parsed.title, expected.title)
    assert.equal(extractTitleFromMarkdown(parsed.content), expected.title)
    assert.equal(parsed.university, expected.offeredBy)
    assert.equal(parsed.programmingLanguage, expected.programmingLanguages)
    assert.deepEqual(parsed.duration, { value: 1.5, originalText: expected.classHours })
    const facts = extractCourseFacts(parsed.content, locale)
    assert.equal(facts.language, expected.programmingLanguages)
    assert.equal(facts.prerequisites, expected.prerequisites)
    assert.equal(facts.hours, expected.classHours)
    const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
    const rows = factSheetRows(course, facts, locale)
    assert.ok(rows.some(row => row.value === expected.programmingLanguages))
    assert.ok(rows.some(row => row.value === expected.classHours))
    assert.equal(courseSchema(course, locale, facts).timeRequired, 'PT1.5H')
    assert.ok(buildCourseFaq(course, facts, locale).some(item => item.a.includes('CS 6.001')))
  }
  execFileSync(path.resolve('node_modules/.bin/tsx'), [path.resolve('scripts/generate-course-search-index.ts')], {
    cwd: files.root, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe']
  })
  const index = JSON.parse(await readFile(path.join(files.root, 'src/data/generated/course-search-index.json'), 'utf8')) as CourseSearchIndex[]
  assert.equal(index[0].titleEn, action.english.title)
  assert.equal(index[0].title, action.chinese.title)
  for (const query of ['C++', 'C#']) assert.equal(searchCourses(query, index).length, 1, query)
})

test('metadata text resolves references and formatting without decoding literal punctuation twice', async t => {
  const files = await fixture(t)
  const markdown = [
    '```markdown', '# Fake heading', '```', '',
    '# **C\\+\\+** &amp; `C#` \\[literal\\]', '', '## Introduction', '',
    '- **University**: [Research &amp; Development][university]',
    '- Prerequisites: [CS 6.001][intro], `C:\\tools`, \\&amp; and \\*literal\\*',
    '- Programming Languages: **C\\+\\+**, `C#`',
    '- Class Hour: 1\\.5 hours', '',
    '[university]: https://example.edu/', '[intro]: https://example.edu/intro'
  ].join('\n')
  await writeFile(files.coursePath('en'), markdown)
  const parsed = await parseMarkdownFile(files.coursePath('en'), 'en')
  const facts = extractCourseFacts(markdown, 'en')
  assert.equal(parsed.title, 'C++ & C# [literal]')
  assert.equal(parsed.university, 'Research & Development')
  assert.equal(parsed.programmingLanguage, 'C++, C#')
  assert.equal(facts.language, parsed.programmingLanguage)
  assert.equal(facts.prerequisites, 'CS 6.001, C:\\tools, &amp; and *literal*')
  assert.deepEqual(parsed.duration, { value: 1.5, originalText: '1.5 hours' })
})

test('evidence extraction retains balanced URL parentheses and strips only Markdown or prose delimiters', () => {
  for (const url of [
    'https://example.edu/course_(2026)',
    'https://example.edu/course_(part_(2))/notes.pdf?term=(2026)',
    'https://example.edu/course_%282026%29'
  ]) {
    for (const text of [`[Course](${url})`, `[Course](<${url}>)`, `[course]: ${url}\n`, `${url}\n`, `See (${url}).`]) {
      assert.deepEqual([...extractEvidenceUrls({ patch: text })], [url], text)
    }
  }
})

test('balanced-parentheses course URLs pass shadow and real sync with identical resource destinations', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const url = 'https://example.edu/course_(part_(2))/notes.pdf?term=(2026)'
  action.officialUrl = url
  action.resources[0].url = url
  const patch = `+[Course](${url})\n`
  const shadow = await files.run(action, patch, 'parentheses', { mode: 'shadow' })
  assert.match(shadow.log, /fixture: create /)
  assert.deepEqual(shadow.sources.fixture.seenEntryIds, [])
  await assert.rejects(readFile(files.coursePath('en')), { code: 'ENOENT' })
  assert.equal((await files.run(action, patch, 'parentheses')).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    assert.deepEqual((await renderedCourse(markdown)).urls, [url, ENTRY_URL])
    assert.ok(extractCourseFacts(markdown, locale).resources.some(resource => resource.url === url))
  }
})

test('public IPv6 URLs retain authority brackets through sync, facts and page rendering', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const url = 'https://[2606:4700:4700::1111]:8443/%5Bnotes%5D?name=%22quoted%22&term=fall'
  action.officialUrl = url
  action.resources[0].url = url
  const patch = `+[Course](<${url}>)\n`
  const shadow = await files.run(action, patch, 'ipv6', { mode: 'shadow' })
  assert.match(shadow.log, /fixture: create /)
  assert.deepEqual(shadow.decisions, [])
  for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
  assert.equal((await files.run(action, patch, 'ipv6')).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    validateGeneratedMarkdown(markdown, [url, ENTRY_URL])
    assert.deepEqual((await renderedCourse(markdown)).urls, [url, ENTRY_URL])
    assert.ok(extractCourseFacts(markdown, locale).resources.some(resource => resource.url === url))
  }
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'Updated lecture resources for the new semester.', summaryZh: '更新本学期课程讲义和配套资源。', resources: action.resources }
  const original = await readFile(files.coursePath('en'), 'utf8')
  assert.match((await files.run(update, patch, 'ipv6-update', { mode: 'shadow' })).log, /fixture: update /)
  assert.equal(await readFile(files.coursePath('en'), 'utf8'), original)
  assert.equal((await files.run(update, patch, 'ipv6-update')).decisions[0].type, 'update')
  assert.deepEqual((await renderedCourse(await readFile(files.coursePath('en'), 'utf8'))).urls, [url, ENTRY_URL, ENTRY_URL, url])
})

test('shadow and real sync both reject final-render validation failures without writing either language', async t => {
  for (const type of ['create', 'update'] as const) {
    const files = await fixture(t)
    const base = courseAction()
    const action = type === 'create' ? base : { type, confidence: 0.99, targetPath: TARGET,
      summaryEn: 'Updated lecture resources for the new semester.', summaryZh: '更新本学期课程讲义和配套资源。', resources: base.resources }
    const original = '# Existing course\n\nOriginal content.\n'
    if (type === 'update') for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), original)
    const statePath = path.join(files.root, 'automation/course-feed-state.json')
    const originalState = await readFile(statePath, 'utf8')
    for (const mode of ['shadow', 'auto'] as const) {
      // Valid course evidence reaches the final renderer; its source link fails
      // that last check. Both modes must run it, including update summaries.
      const result = await files.run(action, undefined, 'invalid-source', { mode, entryUrl: 'https://127.0.0.1/commit/abcdef1' })
      assert.match(result.log, /fixture: reject /, `${type}/${mode}`)
      if (mode === 'shadow') assert.equal(await readFile(statePath, 'utf8'), originalState)
      else assert.match(result.decisions[0].reason, /outside the approved evidence/)
      for (const locale of ['en', 'zh']) {
        if (type === 'update') assert.equal(await readFile(files.coursePath(locale), 'utf8'), original)
        else await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
      }
    }
  }
})

test('sync preserves URL fragments, trailing path slashes and query values in both languages', async t => {
  const files = await fixture(t)
  const urls = [
    'https://course.example.edu/#/courses/CS101',
    'https://course.example.edu/#/courses/CS102',
    'https://course.example.edu/lookup?next=/',
    'https://course.example.edu/lectures/',
    'https://course.example.edu/lectures/#week-2'
  ]
  const action = courseAction()
  action.officialUrl = urls[0]
  action.resources = urls.map((url, index) => ({ url, labelEn: `Course page ${index}`, labelZh: `课程网站 ${index}` }))
  const patch = urls.map(url => `+[Course](<${url}>)`).join('\n')
  assert.match((await files.run(action, patch, 'url-destinations', { mode: 'shadow' })).log, /fixture: create /)
  assert.equal((await files.run(action, patch, 'url-destinations')).decisions[0].type, 'create')
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'Preserve exact course destinations in this update.', summaryZh: '本次更新保留课程链接的完整目标地址。', resources: action.resources }
  assert.equal((await files.run(update, patch, 'url-update')).decisions[0].type, 'update')
  for (const locale of ['en', 'zh'] as const) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    assert.deepEqual((await renderedCourse(markdown)).urls, [...urls, ENTRY_URL, ENTRY_URL, ...urls])
    assert.deepEqual(extractCourseFacts(markdown, locale).resources.filter(resource => urls.includes(resource.url)).map(resource => resource.url), urls)
  }
})

test('final validation distinguishes fragments and slashes that change URL destinations', () => {
  for (const [approved, changed] of [
    ['https://example.edu/#/course', 'https://example.edu/#/unapproved'],
    ['https://example.edu/lectures/', 'https://example.edu/lectures'],
    ['https://example.edu/lookup?next=/', 'https://example.edu/lookup?next=']
  ]) {
    assert.doesNotThrow(() => validateGeneratedMarkdown(`[Course](<${approved}>)`, [approved]))
    assert.throws(() => validateGeneratedMarkdown(`[Course](<${changed}>)`, [approved]), /outside the approved evidence/)
  }
})

test('multiple updates to one course retain every summary and resource and remain idempotent on replay', async t => {
  const files = await fixture(t)
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), '# Existing course\n\nOriginal content.\n')
  const updates = [
    { type: 'update', confidence: 0.99, targetPath: TARGET,
      summaryEn: `First update ${'lecture '.repeat(68)}first conclusion.`, summaryZh: '第一次更新新增课程讲义与教学说明。',
      resources: [{ url: 'https://example.edu/notes#week-1', labelEn: 'Notes', labelZh: '讲义' }] },
    { type: 'update', confidence: 0.98, targetPath: `/${TARGET.toLowerCase()}.md`,
      summaryEn: `Second update ${'homework '.repeat(61)}second conclusion.`, summaryZh: '第二次更新新增课程作业与解答。',
      resources: [{ url: 'https://example.edu/homework/', labelEn: 'Homework', labelZh: '作业' }] }
  ]
  for (const update of updates) assert.ok(update.summaryEn.length <= 600)
  const patch = updates.flatMap(update => update.resources.map(resource => `+${resource.url}`)).join('\n')
  const statePath = path.join(files.root, 'automation/course-feed-state.json')
  const originalState = await readFile(statePath, 'utf8')
  const shadow = await files.run(updates, patch, 'multiple-updates', { mode: 'shadow' })
  assert.equal(shadow.log.match(/fixture: update /g)?.length, 1, 'Actions are grouped by the resolved course path')
  assert.equal(await readFile(statePath, 'utf8'), originalState)
  const applied = await files.run(updates, patch, 'multiple-updates')
  assert.equal(applied.decisions.length, 1)
  assert.equal(applied.decisions[0].type, 'update')
  assert.equal(applied.decisions[0].confidence, 0.98)
  assert.equal(applied.decisions[0].changedFiles.length, 2)
  const before = []
  for (const locale of ['en', 'zh'] as const) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    before.push(markdown)
    assert.equal(markdown.match(/feed-entry:/g)?.length, 1)
    const rendered = await renderedCourse(markdown)
    for (const update of updates) assert.ok(rendered.text.includes(locale === 'en' ? update.summaryEn : update.summaryZh))
    assert.deepEqual(rendered.urls, updates.flatMap(update => [ENTRY_URL, update.resources[0].url]))
  }
  // Force actual reviewer execution despite seenEntryIds, with reordered actions.
  const replayed = await files.run([...updates].reverse(), patch, 'multiple-updates', { replay: true })
  assert.equal(replayed.decisions[0].changedFiles.length, 0)
  assert.deepEqual(await Promise.all(['en', 'zh'].map(locale => readFile(files.coursePath(locale), 'utf8'))), before)
})

test('an invalid update does not suppress other valid updates from the same entry', async t => {
  const files = await fixture(t)
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), '# Existing course\n')
  const valid = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'First valid update includes new lecture notes.', summaryZh: '第一次有效更新新增了课程讲义。', resources: [] }
  const invalid = { ...valid, confidence: 0.1, summaryEn: 'Rejected summary must never appear.', summaryZh: '被拒绝的内容不应该出现在课程中。' }
  const second = { ...valid, summaryEn: 'Second valid update includes new assignments.', summaryZh: '第二次有效更新新增了课程作业。' }
  const result = await files.run([valid, invalid, second])
  assert.deepEqual(result.decisions.map((decision: { type: string }) => decision.type).sort(), ['reject', 'update'])
  const rendered = await renderedCourse(await readFile(files.coursePath('en'), 'utf8'))
  assert.ok(rendered.text.includes(valid.summaryEn))
  assert.ok(rendered.text.includes(second.summaryEn))
  assert.ok(!rendered.text.includes(invalid.summaryEn))
})

test('public URL checks reject dotted local names, including encoded dots and local subdomains', () => {
  for (const url of [
    'https://localhost./admin', 'https://LOCALHOST./admin', 'https://localhost%2e/admin',
    'https://localhost../admin', 'https://service.local./notes', 'https://service.local%2e/notes',
    'https://app.localhost/notes', 'https://app.localhost./notes'
  ]) {
    assert.equal(safePublicHttpsUrl(url), false, url)
    assert.throws(() => validateGeneratedMarkdown(`[Course](<${url}>)`, [url]), /outside the approved evidence/, url)
  }
  for (const url of ['https://example.edu./course', 'https://localhost.example.edu/course']) {
    assert.equal(safePublicHttpsUrl(url), true, 'Public domains must not be rejected for a trailing dot or a local-looking label')
  }
})

test('dotted local URLs cannot create courses or survive resource filtering during sync', async t => {
  const files = await fixture(t)
  const localUrls = ['https://localhost./admin', 'https://service.local./notes', 'https://app.localhost./notes']
  for (const [index, url] of localUrls.entries()) {
    const action = courseAction()
    action.officialUrl = url
    action.resources[0].url = url
    for (const mode of ['shadow', 'auto'] as const) {
      const result = await files.run(action, `+${url}`, `local-${index}`, { mode })
      assert.match(result.log, /fixture: reject /)
      for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
    }
  }
  const action = courseAction()
  action.resources.push(...localUrls.map(url => ({ url, labelEn: 'Local notes', labelZh: '本地笔记' })))
  const patch = [OFFICIAL_URL, ...localUrls].map(url => `+${url}`).join('\n')
  assert.equal((await files.run(action, patch, 'public-with-local-resources')).decisions[0].type, 'create')
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'New resources must also use public destinations.', summaryZh: '更新后的课程资源也必须使用公网地址。', resources: action.resources }
  assert.equal((await files.run(update, patch, 'update-with-local-resources')).decisions[0].type, 'update')
  for (const locale of ['en', 'zh']) {
    assert.deepEqual((await renderedCourse(await readFile(files.coursePath(locale), 'utf8'))).urls, [OFFICIAL_URL, ENTRY_URL, ENTRY_URL, OFFICIAL_URL])
  }
})

test('shadow and auto reject conflicting creation paths, including case aliases, without losing the first course', async t => {
  for (const slug of ['ReviewCourse', 'reviewcourse']) {
    const files = await fixture(t)
    const first = courseAction()
    const second = { ...courseAction(), slug,
      english: { ...first.english, title: 'A completely different course' },
      chinese: { ...first.chinese, title: '另一门完全不同的课程' } }
    const statePath = path.join(files.root, 'automation/course-feed-state.json')
    const originalState = await readFile(statePath, 'utf8')
    const shadow = await files.run([first, second], undefined, 'conflicting-creates', { mode: 'shadow' })
    assert.equal(shadow.log.match(/fixture: create /g)?.length, 1)
    assert.equal(shadow.log.match(/fixture: reject /g)?.length, 1)
    assert.equal(await readFile(statePath, 'utf8'), originalState)
    for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
    const applied = await files.run([first, second], undefined, 'conflicting-creates')
    assert.deepEqual(applied.decisions.map((decision: { type: string }) => decision.type), ['reject', 'create'])
    assert.match(applied.decisions[0].reason, /Course file already exists/)
    for (const locale of ['en', 'zh']) {
      const rendered = await renderedCourse(await readFile(files.coursePath(locale), 'utf8'))
      assert.ok(rendered.text.includes(locale === 'en' ? first.english.title : first.chinese.title))
      assert.ok(!rendered.text.includes(locale === 'en' ? second.english.title : second.chinese.title))
    }
  }
})

test('a rejected create does not reserve its target against a later valid create in either mode', async t => {
  const files = await fixture(t)
  const valid = courseAction()
  const rejected = { ...courseAction(), english: { ...valid.english, description: 'Too short' } }
  for (const mode of ['shadow', 'auto'] as const) {
    const result = await files.run([rejected, valid], undefined, 'retry-after-reject', { mode })
    assert.equal(result.log.match(/fixture: reject /g)?.length, 1)
    assert.equal(result.log.match(/fixture: create /g)?.length, 1)
    if (mode === 'shadow') await assert.rejects(readFile(files.coursePath('en')), { code: 'ENOENT' })
    else assert.equal(result.decisions[0].type, 'create')
  }
})

test('non-string localized titles are rejected before writing files or mutating shadow state', async t => {
  const files = await fixture(t)
  const statePath = path.join(files.root, 'automation/course-feed-state.json')
  let index = 0
  for (const field of ['english', 'chinese'] as const) {
    for (const title of [1234, ['A valid-looking title'], { text: 'Course title' }, null]) {
      const base = courseAction()
      const action = { ...base, [field]: { ...base[field], title } }
      for (const mode of ['shadow', 'auto'] as const) {
        const before = await readFile(statePath, 'utf8')
        const result = await files.run(action, undefined, `bad-title-${index}`, { mode })
        assert.match(result.log, /fixture: reject /)
        if (mode === 'shadow') assert.equal(await readFile(statePath, 'utf8'), before)
        else {
          assert.match(result.decisions[0].reason, /title/)
          assert.deepEqual(result.decisions[0].changedFiles, [])
        }
        for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
      }
      index++
    }
  }
})

test('invalid localized field types do not abort valid sibling actions', async t => {
  const cases = [
    { title: 1234 }, { offeredBy: ['Example University'] }, { description: { text: 'Description' } },
    { prerequisites: ['C++'] }, { programmingLanguages: { value: 'C++' } }, { classHours: 30 }
  ]
  for (const fields of cases) {
    const files = await fixture(t)
    const valid = courseAction()
    const rejected = { ...valid, slug: 'InvalidCourse', english: { ...valid.english, ...fields } }
    for (const mode of ['shadow', 'auto'] as const) {
      const result = await files.run([rejected, valid], undefined, 'bad-and-valid', { mode })
      assert.equal(result.log.match(/fixture: reject /g)?.length, 1)
      assert.equal(result.log.match(/fixture: create /g)?.length, 1)
      if (mode === 'auto') {
        assert.deepEqual(result.decisions.map((decision: { type: string }) => decision.type), ['create', 'reject'])
        assert.deepEqual(result.sources.fixture.seenEntryIds, ['bad-and-valid'])
        assert.equal((await parseMarkdownFile(files.coursePath('en'), 'en')).title, valid.english.title)
      }
      for (const locale of ['en', 'zh']) {
        await assert.rejects(readFile(path.join(files.root, 'course-content', locale, valid.category, 'InvalidCourse.md')), { code: 'ENOENT' })
      }
    }
  }
})

test('C, C++ and C# titles stay distinct while actual duplicates are detected after reloading Markdown', async t => {
  const files = await fixture(t)
  const actions = ['C', 'C++', 'C#'].map((language, index) => {
    const base = courseAction()
    const url = `https://example.edu/course-${index}`
    return { ...base, slug: `Language${index}`, officialUrl: url,
      english: { ...base.english, title: `${language} Programming` },
      chinese: { ...base.chinese, title: `${language} 程序设计` },
      resources: [{ url, labelEn: 'Course page', labelZh: '课程官网' }] }
  })
  const patch = actions.map(action => `+${action.officialUrl}`).join('\n')
  assert.equal((await files.run(actions, patch, 'language-courses', { mode: 'shadow' })).log.match(/fixture: create /g)?.length, 3)
  assert.equal((await files.run(actions, patch, 'language-courses')).decisions.filter((decision: { type: string }) => decision.type === 'create').length, 3)
  for (const action of actions) {
    assert.equal((await parseMarkdownFile(path.join(files.root, 'course-content/en', action.category, `${action.slug}.md`), 'en')).title, action.english.title)
  }
  // Rebuild the index from escaped, persisted Markdown, including Unicode width normalization.
  const duplicate = { ...actions[2], slug: 'DuplicateCSharp',
    english: { ...actions[2].english, title: 'Ｃ＃   programming' },
    chinese: { ...actions[2].chinese, title: '一个不同的中文名称' } }
  const result = await files.run(duplicate, patch, 'duplicate-after-reload')
  assert.equal(result.decisions[0].type, 'reject')
  assert.match(result.decisions[0].reason, /Course title already exists.*Language2/)
})

test('creation rejects names that cannot round-trip through update and course routing paths', async t => {
  const files = await fixture(t)
  for (const slug of ['ReviewCourse.md', 'ReviewCourse..2026', 'ReviewCourse.md-notes']) {
    const action = { ...courseAction(), slug }
    for (const mode of ['shadow', 'auto'] as const) {
      const result = await files.run(action, undefined, `invalid-slug-${slug}`, { mode })
      assert.match(result.log, /fixture: reject /)
      if (mode === 'auto') assert.match(result.decisions[0].reason, /Unsafe course slug/)
      for (const locale of ['en', 'zh']) {
        await assert.rejects(readFile(path.join(files.root, 'course-content', locale, action.category, `${slug}.md`)), { code: 'ENOENT' })
      }
    }
  }
})

test('accepted dotted and versioned course names can be updated using their indexed path or filename alias', async t => {
  for (const slug of ['MIT6.S081', 'ReviewCourse_v2']) {
    const files = await fixture(t)
    const action = { ...courseAction(), slug }
    assert.equal((await files.run(action)).decisions[0].type, 'create')
    const targetPath = `${action.category}/${slug}`
    for (const [index, target] of [targetPath, `/${targetPath}.md`].entries()) {
      const update = { type: 'update', confidence: 0.99, targetPath: target,
        summaryEn: `Update ${index} contains new course lecture notes.`, summaryZh: `第 ${index} 次更新新增课程讲义与说明。`, resources: [] }
      const state = await files.run(update, undefined, `update-${index}`)
      assert.equal(state.decisions[0].type, 'update')
      assert.equal(state.decisions[0].targetPath, targetPath)
      for (const locale of ['en', 'zh']) {
        const markdown = await readFile(path.join(files.root, 'course-content', locale, `${targetPath}.md`), 'utf8')
        assert.ok((await renderedCourse(markdown)).text.includes(locale === 'en' ? update.summaryEn : update.summaryZh))
      }
    }
  }
})

test('plain course fields retain generics, comparisons and entity text without turning them into HTML or links', async t => {
  const files = await fixture(t)
  const base = courseAction()
  const literal = 'vector<T>, vector<int>, x < y > z, &lt;T&gt;, &#1114112;'
  const unsafeMarkup = '<a href="https://unverified.example/">link</a> <img src="https://unverified.example/image.png">'
  const action = { ...base,
    english: { ...base.english, title: 'C++ vector<T> Programming', offeredBy: 'Department <CS>',
      prerequisites: literal, description: `${base.english.description} ${literal} ${unsafeMarkup}` },
    chinese: { ...base.chinese, title: 'C++ vector<T> 程序设计', prerequisites: literal,
      description: `${base.chinese.description} ${literal} ${unsafeMarkup}` },
    resources: [{ url: OFFICIAL_URL, labelEn: 'vector<T> &amp; notes', labelZh: 'vector<T> &amp; 笔记' }] }
  assert.equal((await files.run(action)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const expected = locale === 'en' ? action.english : action.chinese
    const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
    assert.equal(parsed.title, expected.title)
    assert.equal(extractCourseFacts(parsed.content, locale).prerequisites, literal)
    const rendered = await renderedCourse(parsed.content)
    assert.ok(rendered.text.includes(literal))
    assert.ok(rendered.text.includes(unsafeMarkup), 'HTML-looking prose remains literal text')
    assert.ok(rendered.text.includes(locale === 'en' ? action.resources[0].labelEn : action.resources[0].labelZh))
    assert.deepEqual(rendered.urls, [OFFICIAL_URL, ENTRY_URL])
  }
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: `Updated explanations: ${literal} ${unsafeMarkup}`, summaryZh: `更新课程中的泛型和比较表达式说明：${literal} ${unsafeMarkup}`, resources: action.resources }
  assert.equal((await files.run(update, undefined, 'literal-update')).decisions[0].type, 'update')
  for (const locale of ['en', 'zh']) {
    const rendered = await renderedCourse(await readFile(files.coursePath(locale), 'utf8'))
    assert.ok(rendered.text.includes(locale === 'en' ? update.summaryEn : update.summaryZh))
    assert.deepEqual(rendered.urls, [OFFICIAL_URL, ENTRY_URL, ENTRY_URL, OFFICIAL_URL])
  }
})

test('Feed HTML still decodes to readable event text separately from literal AI course fields', async t => {
  const files = await fixture(t)
  const result = await files.run(courseAction(), undefined, 'html-feed-title', {
    entryTitle: '&lt;b&gt;New course &amp; notes&lt;/b&gt;'
  })
  assert.equal(result.decisions[0].type, 'create')
  assert.equal(result.decisions[0].entryTitle, 'New course & notes')
})

async function sourcePolicy(root: string, overrides: Record<string, unknown>) {
  const filename = path.join(root, 'automation/course-feeds.json')
  const config = JSON.parse(await readFile(filename, 'utf8'))
  Object.assign(config.sources[0], overrides)
  await writeFile(filename, JSON.stringify(config))
}

test('non-string or unknown action types cannot bypass an update-only source in shadow or auto mode', async t => {
  const files = await fixture(t)
  const original = '# Existing course\n\nOriginal content.\n'
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), original)
  await sourcePolicy(files.root, { allowedActions: ['ignore', 'update'], targetPaths: [TARGET] })
  const types = [['update'], ['ignore'], ['create'], { toString: null }, true, null, '', 'delete']
  for (const [index, type] of types.entries()) {
    const action = { ...courseAction(), type, targetPath: TARGET, slug: 'ForbiddenCreate' }
    for (const mode of ['shadow', 'auto'] as const) {
      const statePath = path.join(files.root, 'automation/course-feed-state.json')
      const before = await readFile(statePath, 'utf8')
      const result = await files.run(action, undefined, `invalid-type-${index}`, { mode })
      assert.match(result.log, /fixture: reject /)
      assert.doesNotMatch(result.log, /fixture: (create|update|ignore) /)
      if (mode === 'shadow') assert.equal(await readFile(statePath, 'utf8'), before)
      else assert.deepEqual(result.decisions[0].changedFiles, [])
      for (const locale of ['en', 'zh']) {
        assert.equal(await readFile(files.coursePath(locale), 'utf8'), original)
        await assert.rejects(readFile(path.join(files.root, 'course-content', locale, action.category, `${action.slug}.md`)), { code: 'ENOENT' })
      }
    }
  }
})

test('malformed actions do not abort valid siblings and string actions still enforce source permissions', async t => {
  const files = await fixture(t)
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), '# Existing course\n')
  await sourcePolicy(files.root, { allowedActions: ['ignore', 'update'], targetPaths: [TARGET] })
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'Valid update survives malformed sibling actions.', summaryZh: '有效更新不会被其他非法动作中断。', resources: [] }
  const malformed = { type: { toString: null }, confidence: { toString: null } }
  const result = await files.run([null, malformed, update], undefined, 'mixed-types')
  assert.deepEqual(result.decisions.map((decision: { type: string }) => decision.type).sort(), ['reject', 'reject', 'update'])
  assert.ok((await renderedCourse(await readFile(files.coursePath('en'), 'utf8'))).text.includes(update.summaryEn))
  const denied = await files.run([
    { ...courseAction(), slug: 'ForbiddenStringCreate' },
    { ...update, targetPath: 'computer-systems-basics/OtherCourse' },
    { type: 'ignore', confidence: 0, reason: 'No actionable changes' }
  ], undefined, 'explicit-permissions')
  assert.deepEqual(denied.decisions.slice(0, 3).map((decision: { type: string }) => decision.type).sort(), ['ignore', 'reject', 'reject'])
  await assert.rejects(readFile(path.join(files.root, 'course-content/en/computer-systems-basics/ForbiddenStringCreate.md')), { code: 'ENOENT' })
})

test('confidence values must be numbers in range for create, update and ignore actions', async t => {
  const files = await fixture(t)
  const original = '# Existing course\n\nOriginal content.\n'
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), original)
  await sourcePolicy(files.root, { minimumConfidence: 0.99 })
  const values: unknown[] = [true, false, [1], 90, 1.01, -0.01, '0.99', null, undefined, {}, { toString: null }]
  for (const [index, confidence] of values.entries()) {
    const actions = [
      { ...courseAction(), slug: 'InvalidConfidence', confidence },
      { type: 'update', confidence, targetPath: TARGET,
        summaryEn: 'Invalid confidence must not update this course.', summaryZh: '非法置信度不得修改这门课程。', resources: [] },
      { type: 'ignore', confidence, reason: 'An invalid probability is still invalid for ignore' }
    ]
    for (const mode of ['shadow', 'auto'] as const) {
      const result = await files.run(actions, undefined, `invalid-confidence-${index}`, { mode })
      assert.equal(result.log.match(/fixture: reject /g)?.length, 3)
      if (mode === 'auto') {
        for (const decision of result.decisions.slice(0, 3)) {
          assert.match(decision.reason, /confidence/)
          assert.equal(decision.confidence, 0, 'Rejected values must not be coerced while recording the decision')
        }
      }
      for (const locale of ['en', 'zh']) {
        assert.equal(await readFile(files.coursePath(locale), 'utf8'), original)
        await assert.rejects(readFile(path.join(files.root, 'course-content', locale, 'computer-systems-basics/InvalidConfidence.md')), { code: 'ENOENT' })
      }
    }
  }
  // JSON allows exponents which overflow JavaScript numbers; do not serialize
  // Infinity through JSON.stringify, which would silently replace it with null.
  const overflow = { ...courseAction(), slug: 'InvalidConfidence', confidence: 1 }
  const responseText = JSON.stringify({ actions: [overflow] }).replace('"confidence":1', '"confidence":1e309')
  const result = await files.run(overflow, undefined, 'overflow-confidence', { responseText })
  assert.equal(result.decisions[0].type, 'reject')
  assert.equal(result.decisions[0].confidence, 0)
})

test('confidence boundaries preserve low-confidence ignore and enforce thresholds on mutations', async t => {
  for (const confidence of [0, 0.989, 0.99, 1]) {
    const files = await fixture(t)
    for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), '# Existing course\n')
    await sourcePolicy(files.root, { minimumConfidence: 0.99 })
    const result = await files.run([
      { ...courseAction(), slug: 'ThresholdCourse', confidence },
      { type: 'update', confidence, targetPath: TARGET,
        summaryEn: 'Apply this update only if its confidence is sufficient.', summaryZh: '只在置信度达到门槛时应用这次课程更新。', resources: [] },
      { type: 'ignore', confidence, reason: 'Ignore does not approve any mutation' }
    ])
    assert.deepEqual(result.decisions.map((decision: { type: string }) => decision.type).sort(),
      confidence >= 0.99 ? ['create', 'ignore', 'update'] : ['ignore', 'reject', 'reject'])
    assert.equal(result.decisions.find((decision: { type: string }) => decision.type === 'ignore').confidence, confidence)
  }
})

test('configuration rejects a confidence threshold above one', async t => {
  const files = await fixture(t)
  await sourcePolicy(files.root, { minimumConfidence: 1.01 })
  assert.throws(() => execFileSync(process.execPath, [path.join(files.root, 'scripts/sync-course-feeds.mjs'), '--check'], {
    cwd: files.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  }), /minimumConfidence/)
})

test('sync deduplicates entity, link and formatted headings by the same visible title used by pages', async t => {
  const titles = [
    '# C&#43;&#43; Programming',
    '# [C++ Programming](https://example.edu/cpp)',
    '# [C++ Programming][course]\n\n[course]: https://example.edu/cpp',
    '# **C++** `Programming`',
    '# <span>C++</span> Programming',
    '```md\n# Fake title\n```\n\nC++ Programming\n==='
  ]
  for (const markdown of titles) {
    const files = await fixture(t)
    for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), markdown)
    assert.equal(extractTitleFromMarkdown(markdown), 'C++ Programming')
    const base = courseAction()
    const action = { ...base, slug: 'DuplicateVisibleTitle', english: { ...base.english, title: 'C++ Programming' } }
    for (const mode of ['shadow', 'auto'] as const) {
      const result = await files.run(action, undefined, 'duplicate-visible-title', { mode })
      assert.match(result.log, /fixture: reject /)
      if (mode === 'auto') assert.match(result.decisions[0].reason, /Course title already exists/)
      for (const locale of ['en', 'zh']) {
        assert.equal(await readFile(files.coursePath(locale), 'utf8'), markdown)
        await assert.rejects(readFile(path.join(files.root, 'course-content', locale, action.category, `${action.slug}.md`)), { code: 'ENOENT' })
      }
    }
  }
})

test('title deduplication decodes entities once and keeps literal entity text distinct', async t => {
  const files = await fixture(t)
  const markdown = String.raw`# C\&\#35; Programming`
  for (const locale of ['en', 'zh']) await writeFile(files.coursePath(locale), markdown)
  assert.equal(extractTitleFromMarkdown(markdown), 'C&#35; Programming')
  const base = courseAction()
  const action = { ...base, slug: 'ActualCSharp', english: { ...base.english, title: 'C# Programming' } }
  assert.equal((await files.run(action)).decisions[0].type, 'create')
  const literalDuplicate = { ...base, slug: 'LiteralEntityDuplicate', english: { ...base.english, title: 'C&#35; Programming' } }
  const result = await files.run(literalDuplicate, undefined, 'literal-entity-duplicate')
  assert.equal(result.decisions[0].type, 'reject')
  assert.match(result.decisions[0].reason, /Course title already exists/)
})

function feedEntry(position: number, action: unknown): FeedFixtureEntry {
  return { id: `event-${position}`, url: `https://github.com/fixture/repo/commit/abcdef${position}`,
    title: `Course change ${position}`, updatedAt: `2026-11-${String(position).padStart(2, '0')}T00:00:00Z`, action }
}

test('normal sync drains a limited backlog oldest first without losing updates to a newly created course', async t => {
  const files = await fixture(t)
  await sourcePolicy(files.root, { maxPerRun: 1 })
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'The second lecture and its notes are now available.', summaryZh: '课程新增第二讲的视频和配套学习资料。', resources: [] }
  const latest = { ...update, summaryEn: 'The fourth lecture and its notes are now available.', summaryZh: '课程新增第四讲的视频和配套学习资料。' }
  const entries = [feedEntry(4, latest), feedEntry(3, { type: 'ignore', confidence: 0 }), feedEntry(2, update), feedEntry(1, courseAction())]
  const statePath = path.join(files.root, 'automation/course-feed-state.json')
  await writeFile(statePath, JSON.stringify({ version: 1, sources: { fixture: { seenEntryIds: ['event-3'] } }, decisions: [] }))

  for (const [id, type] of [['event-1', 'create'], ['event-2', 'update'], ['event-4', 'update']]) {
    const result = await files.run(null, undefined, undefined, { entries })
    assert.deepEqual(result.reviewRequests.map((request: FixtureReviewRequest) => request.evidence.entry.id), [id])
    assert.equal(result.decisions[0].type, type)
    assert.equal(result.decisions[0].entryId, id)
    assert.ok(result.sources.fixture.seenEntryIds.includes(id))
    if (type === 'update') assert.ok(result.reviewRequests[0].existingCourses.some((course: { path: string }) => course.path === TARGET))
  }
  for (const locale of ['en', 'zh']) {
    const markdown = await readFile(files.coursePath(locale), 'utf8')
    const rendered = await renderedCourse(markdown)
    assert.ok(rendered.text.includes(locale === 'en' ? update.summaryEn : update.summaryZh))
    assert.ok(rendered.text.includes(locale === 'en' ? latest.summaryEn : latest.summaryZh))
    assert.ok(markdown.indexOf('2026-11-04') < markdown.indexOf('2026-11-02'))
    assert.equal(markdown.match(/feed-entry:/g)?.length, 2)
  }
  const before = await readFile(files.coursePath('en'), 'utf8')
  const done = await files.run(null, undefined, undefined, { entries })
  assert.match(done.log, /no new entries/)
  assert.deepEqual(done.reviewRequests, [])
  assert.equal(done.decisions.length, 3)
  assert.equal(await readFile(files.coursePath('en'), 'utf8'), before)
})

test('shadow sync applies the backlog limit after ordering and makes the planned creation available to its update', async t => {
  const files = await fixture(t)
  await sourcePolicy(files.root, { maxPerRun: 2 })
  const update = { type: 'update', confidence: 0.99, targetPath: TARGET,
    summaryEn: 'The second lecture and its notes are now available.', summaryZh: '课程新增第二讲的视频和配套学习资料。', resources: [] }
  const entries = [feedEntry(3, update), feedEntry(2, update), feedEntry(1, courseAction())]
  const statePath = path.join(files.root, 'automation/course-feed-state.json')
  const before = await readFile(statePath, 'utf8')
  const result = await files.run(null, undefined, undefined, { entries, mode: 'shadow' })
  assert.deepEqual(result.reviewRequests.map((request: FixtureReviewRequest) => request.evidence.entry.id), ['event-1', 'event-2'])
  assert.ok(result.reviewRequests[1].existingCourses.some((course: { path: string }) => course.path === TARGET))
  assert.match(result.log, /fixture: create /)
  assert.match(result.log, /fixture: update /)
  assert.doesNotMatch(result.log, /fixture: reject /)
  assert.equal(await readFile(statePath, 'utf8'), before)
  for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
})

test('explicit replay still selects the newest limited batch and reviews it oldest first even when seen', async t => {
  const files = await fixture(t)
  await sourcePolicy(files.root, { maxPerRun: 2 })
  const ignore = { type: 'ignore', confidence: 0, reason: 'No actionable change' }
  const entries = [feedEntry(3, ignore), feedEntry(2, ignore), feedEntry(1, ignore)]
  await writeFile(path.join(files.root, 'automation/course-feed-state.json'), JSON.stringify({
    version: 1, sources: { fixture: { seenEntryIds: entries.map(entry => entry.id) } }, decisions: []
  }))
  const result = await files.run(null, undefined, undefined, { entries, replay: true })
  assert.deepEqual(result.reviewRequests.map((request: FixtureReviewRequest) => request.evidence.entry.id), ['event-2', 'event-3'])
  assert.deepEqual(result.decisions.map((decision: { entryId: string }) => decision.entryId), ['event-3', 'event-2'])
})

test('raw commit messages preserve numeric entity literals, generics and URL evidence without XML decoding', async t => {
  const files = await fixture(t)
  const commitMessage = `Fix vector<T> and A < B && B > C\nHandle &#x110000; &#1114112; &#xD800; &#x1F600; &amp;\nCourse: <${OFFICIAL_URL}>`
  const expectedMessage = commitMessage.replace(/\s+/g, ' ')
  for (const mode of ['shadow', 'auto'] as const) {
    // The URL is present only in the raw commit message, not in the patch or feed.
    const result = await files.run(courseAction(), '+Add course documentation', 'raw-commit', { commitMessage, mode })
    assert.equal(result.reviewRequests[0].evidence.commit.message, expectedMessage)
    assert.match(result.log, /fixture: create /)
    if (mode === 'auto') {
      assert.equal(result.decisions[0].type, 'create')
      assert.deepEqual(result.sources.fixture.seenEntryIds, ['raw-commit'])
      for (const locale of ['en', 'zh']) {
        assert.deepEqual((await renderedCourse(await readFile(files.coursePath(locale), 'utf8'))).urls, [OFFICIAL_URL, ENTRY_URL])
      }
    }
  }
})

test('an empty commit message uses the already-decoded feed title without decoding it again', async t => {
  const files = await fixture(t)
  const result = await files.run({ type: 'ignore', confidence: 0 }, undefined, 'fallback-title', {
    commitMessage: '', entryTitle: 'Keep &amp;#x110000; and &amp;amp; literals'
  })
  assert.equal(result.reviewRequests[0].evidence.entry.title, 'Keep &#x110000; and &amp; literals')
  assert.equal(result.reviewRequests[0].evidence.commit.message, result.reviewRequests[0].evidence.entry.title)
  assert.deepEqual(result.sources.fixture.seenEntryIds, ['fallback-title'])
})

test('invalid feed numeric entities are replaced without aborting while valid characters decode once', async t => {
  const files = await fixture(t)
  const invalid = ['&#x110000;', '&#1114112;', `&#${'9'.repeat(400)};`, '&#xD800;', '&#55296;', '&#0;', '&#xFFFF;']
  const result = await files.run(courseAction(), undefined, 'numeric-entities', {
    entryTitle: `${invalid.join(' / ')} / valid: &#x1F600; &#128512; &#65; &#x41; &#x26;#65;`
  })
  const expected = `${invalid.map(() => '\uFFFD').join(' / ')} / valid: 😀 😀 A A &#65;`
  assert.equal(result.reviewRequests[0].evidence.entry.title, expected)
  assert.equal(result.decisions[0].entryTitle, expected)
  assert.equal(result.decisions[0].type, 'create')
  assert.deepEqual(result.sources.fixture.seenEntryIds, ['numeric-entities'])
  for (const locale of ['en', 'zh']) assert.ok((await readFile(files.coursePath(locale), 'utf8')).includes('# '))
})

async function assertGeneratedOfficialCourse(filePath: string, locale: 'en' | 'zh') {
  const parsed = await parseMarkdownFile(filePath, locale)
  const facts = extractCourseFacts(parsed.content, locale)
  const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '',
    hasEnglishVersion: true, hasChineseVersion: true }
  assert.equal(facts.resources.filter(resource => resource.kind === 'website' && resource.url === OFFICIAL_URL).length, 1,
    `${locale}: the validated official URL must retain its website role`)
  assert.equal(courseSchema(course, locale, facts).sameAs, OFFICIAL_URL, `${locale}: schema must identify the official site`)
  const officialFaq = buildCourseFaq(course, facts, locale).find(item => /official .* course site|官方课程网站/.test(item.q))
  assert.ok(officialFaq, `${locale}: the official-site FAQ must be present`)
  assert.ok(officialFaq.answerParts?.some(part => typeof part !== 'string' && part.url === OFFICIAL_URL))
  return { facts, rendered: await renderedCourse(parsed.content) }
}

test('official URL retains its website role in both locales when AI resource labels are generic', async t => {
  for (const labels of [
    { labelEn: 'Official course', labelZh: '课程官网' },
    { labelEn: 'Review Course [2026]', labelZh: '资料入口（2026）' }
  ]) {
    const files = await fixture(t)
    const action = courseAction()
    action.resources = [{ url: OFFICIAL_URL, ...labels }]
    assert.equal((await files.run(action)).decisions[0].type, 'create')
    for (const locale of ['en', 'zh'] as const) {
      const { facts, rendered } = await assertGeneratedOfficialCourse(files.coursePath(locale), locale)
      const label = locale === 'en' ? labels.labelEn : labels.labelZh
      assert.equal(facts.resources.find(resource => resource.url === OFFICIAL_URL)?.label, label)
      assert.ok(rendered.text.includes(label), 'Keep the original link label as escaped visible text')
      assert.deepEqual(rendered.urls, [OFFICIAL_URL, ENTRY_URL], 'Merging the official role must not duplicate links')
    }
  }
})

test('official URL remains primary when duplicate resources and other course websites are supplied', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const archiveUrl = 'https://archive.example.edu/course'
  const videoUrl = 'https://video.example.edu/lectures'
  const officialAlias = 'https://COURSE.EXAMPLE.EDU:443/lecture?term=fall&year=2026'
  action.officialUrl = officialAlias
  action.resources = [
    { url: archiveUrl, labelEn: 'Archived course website', labelZh: '历史课程网站' },
    { url: officialAlias, labelEn: 'Official course page', labelZh: '课程官网' },
    { url: OFFICIAL_URL, labelEn: 'Duplicate label', labelZh: '重复入口' },
    { url: videoUrl, labelEn: 'Lecture videos', labelZh: '课程视频' }
  ]
  const patch = [OFFICIAL_URL, archiveUrl, videoUrl].map(url => `+<${url}>`).join('\n')
  assert.equal((await files.run(action, patch)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const { facts, rendered } = await assertGeneratedOfficialCourse(files.coursePath(locale), locale)
    assert.deepEqual(rendered.urls, [OFFICIAL_URL, archiveUrl, videoUrl, ENTRY_URL])
    assert.ok(facts.resources.some(resource => resource.url === archiveUrl && resource.kind === 'website'))
    assert.ok(facts.resources.some(resource => resource.url === videoUrl && resource.kind === 'video'))
    assert.ok(!rendered.text.includes(locale === 'en' ? 'Duplicate label' : '重复入口'))
  }
})

test('official URL keeps its website role when resource lists omit it or exceed the resource limit', async t => {
  for (const resourceCount of [0, 8]) {
    const files = await fixture(t)
    const action = courseAction()
    const notes = Array.from({ length: resourceCount }, (_, index) => ({
      url: `https://notes.example.edu/lecture-${index}`, labelEn: `Notes ${index}`, labelZh: `笔记 ${index}`
    }))
    // With eight other resources, the ordinary resource limit drops the last
    // item. The independently validated official URL must still be retained.
    action.resources = resourceCount ? [...notes, action.resources[0]] : []
    const patch = [OFFICIAL_URL, ...notes.map(resource => resource.url)].map(url => `+<${url}>`).join('\n')
    assert.equal((await files.run(action, patch)).decisions[0].type, 'create')
    for (const locale of ['en', 'zh'] as const) {
      const { rendered } = await assertGeneratedOfficialCourse(files.coursePath(locale), locale)
      assert.deepEqual(rendered.urls, [OFFICIAL_URL, ...notes.map(resource => resource.url), ENTRY_URL])
    }
  }
})

test('generated provenance stays visible without becoming a course resource, FAQ or SEO claim', async t => {
  for (const name of ['CS Video Courses', 'Course Textbooks', 'Nand2Tetris Projects']) {
    const files = await fixture(t)
    await sourcePolicy(files.root, { name })
    assert.equal((await files.run(courseAction())).decisions[0].type, 'create')
    for (const locale of ['en', 'zh'] as const) {
      const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
      const facts = extractCourseFacts(parsed.content, locale)
      const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
      assert.deepEqual(facts.resources.map(resource => ({ kind: resource.kind, url: resource.url })), [
        { kind: 'website', url: OFFICIAL_URL }
      ], `${locale}: a source's name must never create resource facts`)
      const faq = buildCourseFaq(course, facts, locale)
      assert.ok(faq.every(item => !item.a.includes(ENTRY_URL)))
      assert.ok(faq.every(item => !/video lectures|textbook|assignments and labs|有视频|有教材|作业和实验/.test(item.q)))
      assert.doesNotMatch(getCourseSeo(course, locale, facts).title, /Videos|Textbook|视频|教材/)
      assert.equal(courseSchema(course, locale, facts).sameAs, OFFICIAL_URL)
      const rendered = await renderedCourse(parsed.content)
      assert.deepEqual(rendered.urls, [OFFICIAL_URL, ENTRY_URL])
      assert.ok(rendered.text.includes(name), 'Keep the source attribution visible to readers')
    }
  }
})

test('generated provenance does not hide or replace genuine video resources', async t => {
  const files = await fixture(t)
  await sourcePolicy(files.root, { name: 'CS Video Courses' })
  const videoUrl = 'https://video.example.edu/lectures'
  const action = courseAction()
  action.resources.push({ url: videoUrl, labelEn: 'Lecture videos', labelZh: '课程视频' })
  assert.equal((await files.run(action, `+${OFFICIAL_URL}\n+${videoUrl}`)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
    const facts = extractCourseFacts(parsed.content, locale)
    const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
    assert.deepEqual(facts.resources.filter(resource => resource.kind === 'video').map(resource => resource.url), [videoUrl])
    assert.ok(facts.resources.every(resource => resource.url !== ENTRY_URL))
    const videoFaq = buildCourseFaq(course, facts, locale).find(item => /video lectures|有视频/.test(item.q))
    assert.ok(videoFaq?.answerParts?.some(part => typeof part !== 'string' && part.url === videoUrl))
    assert.match(getCourseSeo(course, locale, facts).title, /Videos|视频/)
  }
})

test('official URLs retain their secondary resource roles and corresponding bilingual FAQs', async t => {
  for (const [kind, labelEn, labelZh, question] of [
    ['textbook', 'Textbook', '课程教材', /textbook|有教材/],
    ['video', 'Lecture videos', '课程视频', /video lectures|有视频/],
    ['assignment', 'Assignments', '课程作业', /assignments and labs|作业和实验/]
  ] as const) {
    const files = await fixture(t)
    const action = courseAction()
    action.resources = [{ url: OFFICIAL_URL, labelEn, labelZh }]
    const statePath = path.join(files.root, 'automation/course-feed-state.json')
    const before = await readFile(statePath, 'utf8')
    assert.match((await files.run(action, undefined, undefined, { mode: 'shadow' })).log, /fixture: create /)
    assert.equal(await readFile(statePath, 'utf8'), before)
    for (const locale of ['en', 'zh']) await assert.rejects(readFile(files.coursePath(locale)), { code: 'ENOENT' })
    assert.equal((await files.run(action)).decisions[0].type, 'create')
    for (const locale of ['en', 'zh'] as const) {
      const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
      const facts = extractCourseFacts(parsed.content, locale)
      const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
      assert.deepEqual(facts.resources.filter(resource => resource.url === OFFICIAL_URL).map(resource => resource.kind), ['website', kind])
      assert.equal(facts.resources.find(resource => resource.kind === kind)?.label, locale === 'en' ? labelEn : labelZh)
      assert.equal(courseSchema(course, locale, facts).sameAs, OFFICIAL_URL)
      const faq = buildCourseFaq(course, facts, locale).find(item => question.test(item.q))
      assert.ok(faq?.answerParts?.some(part => typeof part !== 'string' && part.url === OFFICIAL_URL), `${locale}: preserve ${kind} FAQ`)
      assert.deepEqual((await renderedCourse(parsed.content)).urls, [OFFICIAL_URL, OFFICIAL_URL, ENTRY_URL])
    }
  }
})

test('role-aware merging preserves distinct bilingual roles while suppressing duplicate roles and generic aliases', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const alias = 'https://COURSE.EXAMPLE.EDU:443/lecture?term=fall&year=2026'
  action.resources = [
    { url: OFFICIAL_URL, labelEn: 'Textbook', labelZh: '课程视频' },
    { url: alias, labelEn: 'Recommended textbook', labelZh: '课程教材' },
    { url: OFFICIAL_URL, labelEn: 'Lecture videos', labelZh: '课程视频' },
    { url: alias, labelEn: 'Assignments', labelZh: '课程作业' },
    { url: OFFICIAL_URL, labelEn: 'Official course', labelZh: '课程官网' },
    { url: alias, labelEn: 'Duplicate label', labelZh: '重复入口' }
  ]
  assert.equal((await files.run(action)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
    const facts = extractCourseFacts(parsed.content, locale)
    const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
    assert.deepEqual(facts.resources.map(resource => ({ kind: resource.kind, url: resource.url })), [
      { kind: 'website', url: OFFICIAL_URL }, { kind: 'video', url: OFFICIAL_URL },
      { kind: 'textbook', url: OFFICIAL_URL }, { kind: 'assignment', url: OFFICIAL_URL }
    ])
    assert.equal(courseSchema(course, locale, facts).sameAs, OFFICIAL_URL)
    const rendered = await renderedCourse(parsed.content)
    assert.deepEqual(rendered.urls, [...Array(4).fill(OFFICIAL_URL), ENTRY_URL])
    assert.ok(!rendered.text.includes(locale === 'en' ? 'Duplicate label' : '重复入口'))
  }
})

test('shared resource URLs keep multiple roles even when they are not the official URL', async t => {
  const files = await fixture(t)
  const action = courseAction()
  const portal = 'https://portal.example.edu/course'
  action.resources.push(
    { url: portal, labelEn: 'Lecture videos', labelZh: '课程视频' },
    { url: portal, labelEn: 'Recordings', labelZh: '录播' },
    { url: portal, labelEn: 'Assignments', labelZh: '课程作业' }
  )
  assert.equal((await files.run(action, `+${OFFICIAL_URL}\n+${portal}`)).decisions[0].type, 'create')
  for (const locale of ['en', 'zh'] as const) {
    const parsed = await parseMarkdownFile(files.coursePath(locale), locale)
    const facts = extractCourseFacts(parsed.content, locale)
    const course: Course = { ...parsed, id: TARGET, path: TARGET, slug: 'ReviewCourse', description: '', hasEnglishVersion: true }
    assert.deepEqual(facts.resources.filter(resource => resource.url === portal).map(resource => resource.kind), ['video', 'assignment'])
    assert.equal(courseSchema(course, locale, facts).sameAs, OFFICIAL_URL)
    assert.deepEqual((await renderedCourse(parsed.content)).urls, [OFFICIAL_URL, portal, portal, ENTRY_URL])
  }
})
