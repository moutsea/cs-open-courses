import type { Course } from './courseParser'
import type { Token, Tokens } from 'marked'
import { isStudyHoursLabel } from './courseStudyHours'
import { courseIntroduction, courseListItemParagraphs, courseListItemText, courseMarkdownLinkHref, courseMarkdownLinkText, courseMarkdownSections, courseMarkdownText } from './courseMarkdown'

export type FactLocale = 'zh' | 'en'

export type ResourceKind = 'website' | 'video' | 'textbook' | 'assignment' | 'other'

export interface CourseResource {
  kind: ResourceKind
  /** Original link text, e.g. "Spring 2026 官方课程视频" */
  label: string
  url: string
  /** False when the source explicitly says this resource is unavailable. */
  available?: boolean
}

export interface CourseFacts {
  prerequisites?: string
  language?: string
  difficultyLabel?: string
  hours?: string
  resources: CourseResource[]
}

export interface FactRow {
  label: string
  value: string
}

export type CourseFaqAnswerPart = string | { url: string }

export interface CourseFaqItem {
  q: string
  a: string
  /** Exact resource targets, kept separate from prose punctuation for rendering. */
  answerParts?: CourseFaqAnswerPart[]
}

/** Keep one answer for display and JSON-LD without re-parsing known resource URLs. */
function linkedAnswer(strings: TemplateStringsArray, ...values: CourseFaqAnswerPart[]): Pick<CourseFaqItem, 'a' | 'answerParts'> {
  const answerParts: CourseFaqAnswerPart[] = []
  strings.forEach((text, index) => {
    answerParts.push(text)
    if (index < values.length) answerParts.push(values[index])
  })
  return {
    a: answerParts.map(part => typeof part === 'string' ? part : part.url).join(''),
    answerParts
  }
}

/** A complete URL label has an explicit boundary, just like a resource target. */
function faqResourceLabel(label: string): CourseFaqAnswerPart {
  if (/^https?:\/\/\S+$/i.test(label)) {
    try {
      new URL(label)
      return { url: label }
    } catch {
      // Invalid URLs and ordinary prose keep the plain-text rendering path.
    }
  }
  return label
}

const RESOURCE_KIND_PATTERNS: Array<{ kind: ResourceKind; test: RegExp }> = [
  { kind: 'textbook', test: /(课程教材|教材|课本|\b(?:textbooks?|text\s*books?|reading)\b)/i },
  { kind: 'video', test: /(课程视频|视频|录播|\b(?:recordings?|videos?|lecture\s+videos?)\b)/i },
  { kind: 'assignment', test: /(课程作业|作业|实验|项目|\b(?:coursework|homeworks?|assignments?|labs?|projects?|problem\s+sets?)\b)/i },
  { kind: 'website', test: /(课程网站|课程主页|官网|网站|\b(?:websites?|course\s+(?:site|page|website)|homepages?)\b)/i }
]

const KIND_ORDER: Record<ResourceKind, number> = {
  website: 0,
  video: 1,
  textbook: 2,
  assignment: 3,
  other: 4
}

const KIND_LABELS: Record<ResourceKind, { zh: string; en: string }> = {
  website: { zh: '课程官网', en: 'Course website' },
  video: { zh: '课程视频', en: 'Lecture videos' },
  textbook: { zh: '课程教材', en: 'Textbook' },
  assignment: { zh: '作业与实验', en: 'Assignments & labs' },
  other: { zh: '相关资源', en: 'Related resources' }
}

export function resourceKindLabel(kind: ResourceKind, locale: FactLocale): string {
  return KIND_LABELS[kind][locale]
}

function cleanValue(value: string): string {
  return value
    // Inline markdown links and autolinks leak into fact sheet/FAQ/schema otherwise.
    .replace(/\[([^\]]+)\]\((?:https?:\/\/)[^)]*\)/g, '$1')
    .replace(/<(?:https?:\/\/)[^>\s]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[·\-–—:：\s]+/, '')
    .trim()
}

function normalizeLabel(raw: string): string {
  return cleanValue(raw).replace(/[:：]\s*$/, '').toLowerCase()
}

const PREREQUISITE_LABELS = ['先修要求', '先修课程', '先修课', 'prerequisites', 'prerequisite', 'pre-requisites', 'pre-reqs', 'requirements']
const LANGUAGE_LABELS = ['编程语言', '语言', 'programming language', 'programming languages', 'language', 'languages']

export function isUnspecifiedLanguage(value: string): boolean {
  return /^(?:无|暂无|没有|未指定|不指定|none|no|n\/a|not specified|unspecified|—|-)\s*[.。]?$/i.test(value.trim())
}

function matches(label: string, candidates: string[]): boolean {
  return candidates.some(candidate => label === candidate || label.startsWith(candidate))
}

interface ParsedLink {
  label: string
  url: string
}

const TRACKING_PARAMS = ['vd_source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'spm', 'share_source', 'fbclid', 'gclid']

/** Drop share/analytics params so URLs stay short and readable in the FAQ text. */
function cleanUrl(raw: string): string {
  try {
    const url = new URL(raw.trim())
    for (const param of TRACKING_PARAMS) {
      if (url.searchParams.has(param)) url.searchParams.delete(param)
    }
    return url.href
  } catch {
    return raw.trim()
  }
}

function extractLinks(paragraphs: Token[], fallbackLabel: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const visit = (tokens: Token[]) => {
    for (const token of tokens) {
      if (token.type === 'link') {
        const link = token as Tokens.Link
        const markdownLink = link.raw.startsWith('[')
        const bareLink = !markdownLink && !link.raw.startsWith('<')
        // GFM handles ASCII punctuation and balanced parentheses. Chinese
        // punctuation must be trimmed before rendering encodes it, and again
        // afterward when it was expressed as an HTML character reference.
        const renderedHref = courseMarkdownLinkHref(bareLink
          ? { ...link, href: link.href.replace(/[。，；、！？]+$/, '') }
          : link)
        if (!renderedHref || !/^https?:\/\//i.test(renderedHref)) continue
        const href = bareLink ? renderedHref.replace(/[。，；、！？]+$/, '') : renderedHref
        links.push({
          label: markdownLink ? courseMarkdownLinkText(link) : fallbackLabel.slice(0, 60) || 'Link',
          url: cleanUrl(href)
        })
      } else if (token.type !== 'image' && 'tokens' in token && token.tokens) {
        visit(token.tokens)
      }
    }
  }
  // The document lexer has already resolved full, collapsed and shortcut
  // references. Re-lexing a list item's text would lose their definitions.
  visit(paragraphs)
  return links
}

function classifyResource(labelLine: string): ResourceKind {
  for (const pattern of RESOURCE_KIND_PATTERNS) {
    if (pattern.test.test(labelLine)) return pattern.kind
  }
  return 'other'
}

function resourceUnavailable(rawValue: string): boolean {
  const value = cleanValue(rawValue)
  // Keep explicit absence separate from a plain-text book title or directions
  // to the course site. Alternative notes linked after "None" are not videos.
  return /^(?:(?:无|暂无|没有)(?:指定|固定|公开)?(?:教材|课本|视频|录播)?|未公开|none|n\/a|not available|unavailable)(?:$|[\s,，.。;；])/i.test(value)
    || /^(?:there (?:is|are)\s+)?no\s+(?:(?:required|recommended|available|specified|designated)\s+)?(?:textbooks?|text\s+books?|videos?|recordings?)\b/i.test(value)
}

/**
 * Extracts structured, display-ready facts from a course markdown file.
 * Only reads what the markdown actually contains — never invents values.
 */
export function extractCourseFacts(markdown: string, locale: FactLocale = 'zh'): CourseFacts {
  const facts: CourseFacts = { resources: [] }
  if (!markdown) return facts

  type ResourceContext = { kind: ResourceKind; label: string; unavailable: boolean }
  const readResource = (item: Tokens.ListItem, parent?: ResourceContext) => {
    const paragraphs = courseListItemParagraphs(item)
    const bullet = courseListItemText(item)
    // Match the field separator, not the colon inside a URL.
    const field = bullet.match(/^([^:[\]<>]+)[:：](?!\/\/)\s*/)
    const label = field ? cleanValue(field[1]) : cleanValue(bullet.split('[')[0])
    const value = field ? bullet.slice(field[0].length) : bullet
    // Availability depends on what readers see, not reference IDs or Markdown
    // delimiters. Preserve the existing field boundary and child-list scope.
    const visibleBullet = courseMarkdownText(paragraphs)
    const visibleValue = field ? visibleBullet.slice(visibleBullet.search(/[:：]/) + 1) : visibleBullet
    const labelKind = classifyResource(label)
    // Explicit child fields can change roles. Otherwise, inherit the parent
    // before inspecting link titles or URL paths for classification hints.
    const kind = field && labelKind !== 'other' ? labelKind
      : parent ? parent.kind
      : labelKind !== 'other' ? labelKind
      : classifyResource(field ? cleanValue(value).replace(/https?:\/\/\S+/gi, '') : bullet)
    const unavailable = resourceUnavailable(visibleValue) || (kind === parent?.kind && parent.unavailable)
    const availability = unavailable ? { available: false } : {}
    const links = extractLinks(paragraphs, label || parent?.label || '')
    if (links.length === 0) {
      const text = cleanValue(bullet)
      if (text) facts.resources.push({ kind, label: text.slice(0, 80), url: '', ...availability })
    }
    for (const link of links) {
      // A single URL can serve different roles (e.g. website and textbook).
      if (facts.resources.some(resource => resource.kind === kind && resource.url === link.url)) continue
      facts.resources.push({ kind, label: link.label, url: link.url, ...availability })
    }
    // "No required textbook" can introduce optional reference books. Keep
    // those links, but inherit actual absence for alternatives to missing media.
    const supplementaryBooks = kind === 'textbook' && /supplementary|recommended|参考|推荐/i.test(visibleValue)
    const context = { kind, label: label || parent?.label || '', unavailable: unavailable && !supplementaryBooks }
    for (const token of item.tokens) {
      if (token.type === 'list') {
        for (const child of (token as Tokens.List).items) readResource(child, context)
      }
    }
  }

  for (const section of courseMarkdownSections(markdown)) {
    if (section.kind === 'meta') {
      for (const item of courseIntroduction(section).items) {
        const bullet = courseListItemText(item)
        const separator = bullet.search(/[:：]/)
        if (separator === -1) continue
        const label = normalizeLabel(bullet.slice(0, separator))
        const value = cleanValue(bullet.slice(separator + 1))
        // An autolink has no display text after cleanValue, but still carries
        // a resource URL (and an empty resource label may own a child list).
        if (!value && classifyResource(label) === 'other') continue

        if (matches(label, PREREQUISITE_LABELS)) {
          facts.prerequisites ||= value
        } else if (matches(label, LANGUAGE_LABELS)) {
          facts.language ||= value
        } else if (isStudyHoursLabel(label)) {
          facts.hours ||= value
        } else if (classifyResource(label) !== 'other') {
          // Only explicit resource fields are eligible here. A prerequisite
          // or university link must not become an official course resource.
          readResource(item)
        }
      }
    } else {
      for (const token of section.tokens) {
        if (token.type === 'list') {
          for (const item of (token as Tokens.List).items) readResource(item)
        }
      }
    }
  }

  // Keep the complete facts for SEO and FAQ; visual link limits belong in the
  // fact sheet so archived websites cannot hide a textbook from other consumers.
  facts.resources.sort((a, b) => {
    if (Boolean(a.url) !== Boolean(b.url)) return a.url ? -1 : 1
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
  })
  if (locale === 'en' && facts.prerequisites) {
    facts.prerequisites = facts.prerequisites.replace(/^无$/, 'None')
  }

  return facts
}

export interface CourseIdentity {
  slug?: string
  title: string
}

export function courseCode(course: CourseIdentity): string | undefined {
  // Title first: it spells the code the way people search it ("CMU 15-445"), while a slug may
  // only be a folder name ("15445").
  for (const raw of [course.title, course.slug]) {
    if (!raw) continue
    const match = raw.match(
      // A bare five-digit code never starts with 0: `00042 - Some Video` is an ordinal, not a course.
      /((?:CS|COS|EE|STA|STAT|EECS|MIT|CMU|UCB|PKU|NJU|SJTU|USTC|HIT|KAIST)?\s?\d{1,3}(?:[.\-]\d{2,4})+\w*|\b(?:CS|COS|EE|STA|EECS)\s?\d{2,3}[A-Za-z]{0,2}\b|\b[1-9]\d{4}\b)/i
    )
    if (match) return match[0].replace(/\s+/g, ' ').trim()
  }
  return undefined
}

/** Short label people actually type: "CS61B", "6.824", "GAMES101", "Docker". */
/**
 * Publishers put their own name in front of the course name ("Princeton: Bitcoin and …",
 * "MIT Web Development Crash Course"). The publisher is already in the fact sheet and schema,
 * and it eats the title budget, so it is dropped when the label would get too long.
 */
const PUBLISHER_WITH_COLON =
  /^(?:MIT|CMU|ETH(?:\s+Zurich)?|Stanford|Princeton|Cambridge|Oxford|Harvard|Berkeley|UCB|USTC|NJU|PKU|SJTU|Tsinghua|Coursera|edX|Udacity|ASU|HIT|KAIST|UIUC|Caltech|Cornell|Yale|Duke|Michigan|NUS|NTU|University\s+of\s+[^:：]{2,40}?)\s*[:：]\s*/i
const PUBLISHER_BARE =
  /^(?:MIT|CMU|ETH|Stanford|Princeton|Cambridge|Oxford|Harvard|Berkeley|UCB|USTC|NJU|PKU|SJTU|Tsinghua|Coursera|edX|Udacity|ASU|HIT|KAIST|UIUC|Caltech|Cornell|Yale|Duke|Michigan|NUS|NTU)\s+/i
/** A leading course code followed by a colon, e.g. "CSE365: Introduction to Cybersecurity". */
const LEADING_CODE = /^([A-Z]{2,8}\d{2,4}[A-Za-z]?)\s*[:：]/

function shortenTitle(title: string): string {
  if (title.length <= 30) return title
  const withoutPublisher = title.replace(PUBLISHER_WITH_COLON, '').replace(PUBLISHER_BARE, '')
  const candidate = withoutPublisher.trim()
  if (candidate.length < 10) return title
  const code = candidate.match(LEADING_CODE)
  return code ? code[1] : candidate
}

export function courseKey(course: CourseIdentity): string {
  const slug = (course.slug || '').trim()
  const title = (course.title || '').trim()
  // All-digit slugs ("15445") are folder names; the title carries the real code ("15-445").
  const numericSlug = /^\d+$/.test(slug)
  // A slug is a good label when it contains a course number ("CS61B", "MIT6.824") or when it
  // literally appears in the course title ("CS50"). Bare abbreviations ("CA", "ML", "LHY")
  // mean nothing to a searcher, so fall back to the code or the title.
  const slugHasCode = /[0-9]/.test(slug) && !numericSlug
  const slugInTitle = slug.length >= 3 && title.toLowerCase().includes(slug.toLowerCase())
  if (slug.length <= 16 && (slugHasCode || slugInTitle)) return slug
  return courseCode(course) || shortenTitle(title) || slug
}

export function difficultyLabel(difficulty: string | undefined, locale: FactLocale): string | undefined {
  if (!difficulty) return undefined
  const key = difficulty.trim().toLowerCase()
  const map: Record<string, { zh: string; en: string }> = {
    beginner: { zh: '入门', en: 'Beginner' },
    intermediate: { zh: '进阶', en: 'Intermediate' },
    advanced: { zh: '高阶', en: 'Advanced' }
  }
  const hit = map[key]
  if (hit) return hit[locale]
  return difficulty.trim() || undefined
}

export function formatHours(course: Course): string | undefined {
  const duration = course.duration
  if (!duration) return undefined
  if (typeof duration === 'string') {
    return duration.trim() || undefined
  }
  if (duration.originalText) return duration.originalText.trim()
  if (typeof duration.value === 'number') return `${duration.value}`
  return undefined
}

/** Add units only to bare numbers; preserve ranges, bounds and qualitative estimates. */
export function formatStudyHours(value: string, locale: FactLocale): string {
  const text = value.trim()
  return /^\d+(?:\.\d+)?$/.test(text) ? `${text} ${locale === 'zh' ? '小时' : 'hours'}` : text
}

/**
 * 语言版本行。单语课程只写它真正拥有的那个语言；
 * `hasChineseVersion` 缺省时沿用旧行为（按双语处理），避免影响旧调用方与测试夹具。
 */
function languageVersionLabels(course: Course, isZh: boolean): string | undefined {
  const hasEnglish = course.hasEnglishVersion
  const hasChinese = course.hasChineseVersion ?? hasEnglish
  if (!hasEnglish && !hasChinese) return undefined
  if (hasEnglish && hasChinese) return isZh ? '中文 / English' : 'English / Chinese'
  if (hasChinese) return isZh ? '中文' : 'Chinese'
  return 'English'
}

/** Rows rendered in the "at a glance" panel above the course body. */
export function factSheetRows(course: Course, facts: CourseFacts, locale: FactLocale): FactRow[] {
  const rows: FactRow[] = []
  const isZh = locale === 'zh'

  if (course.university) {
    rows.push({ label: isZh ? '所属大学' : 'University', value: course.university })
  }
  if (facts.prerequisites) {
    rows.push({ label: isZh ? '先修要求' : 'Prerequisites', value: facts.prerequisites })
  }
  const language = facts.language || course.programmingLanguage
  if (language) {
    rows.push({ label: isZh ? '编程语言' : 'Language', value: language })
  }
  const level = difficultyLabel(course.difficulty, locale)
  if (level) {
    rows.push({ label: isZh ? '课程难度' : 'Difficulty', value: level })
  }
  const rawHours = (facts.hours || formatHours(course) || '').trim()
  if (rawHours) {
    rows.push({ label: isZh ? '预计学时' : 'Estimated hours', value: formatStudyHours(rawHours, locale) })
  }
  const languageVersions = languageVersionLabels(course, isZh)
  if (languageVersions) {
    rows.push({ label: isZh ? '语言版本' : 'Language versions', value: languageVersions })
  }

  return rows
}

/**
 * FAQ pairs built purely from real course fields.
 * Each answer embeds actual values, so pages do not share boilerplate text.
 */
export function buildCourseFaq(course: Course, facts: CourseFacts, locale: FactLocale): CourseFaqItem[] {
  const isZh = locale === 'zh'
  const items: CourseFaqItem[] = []
  const label = courseKey(course)
  const university = course.university ? `${course.university} ` : ''
  const website = facts.resources.find(item => item.kind === 'website' && item.url)
  const textbook = facts.resources.find(item => item.kind === 'textbook' && item.url && item.available !== false)
  const video = facts.resources.find(item => item.kind === 'video' && item.url && item.available !== false)
  const assignment = facts.resources.find(item => item.kind === 'assignment' && item.url)

  if (facts.prerequisites) {
    items.push({
      q: isZh ? `${label} 的先修要求是什么？` : `What are the prerequisites for ${label}?`,
      a: isZh
        ? `${label} 的课程资料对先修要求的说明是「${facts.prerequisites}」。`
        : `The course notes for ${label} describe the prerequisites as "${facts.prerequisites}".`
    })
  }

  const level = difficultyLabel(course.difficulty, locale)
  const hours = facts.hours || formatHours(course)
  if (level || hours) {
    const parts: string[] = []
    if (level) parts.push(isZh ? `难度定位为${level}` : `difficulty level: ${level}`)
    if (hours) {
      const hoursText = formatStudyHours(hours, locale)
      parts.push(isZh ? `课程资料标注的预计学时为「${hoursText}」` : `estimated study time listed in the course notes: "${hoursText}"`)
    }
    items.push({
      q: isZh
        ? (hours ? `${label} 难吗？大概需要多少时间？` : `${label} 难吗？`)
        : (hours ? `How hard is ${label} and how long does it take?` : `How hard is ${label}?`),
      a: isZh
        ? `${label} ${parts.join('，')}。`
        : `${label}: ${parts.join('; ')}.`
    })
  }

  const language = facts.language || course.programmingLanguage
  if (language) {
    const unspecified = isUnspecifiedLanguage(language)
    items.push({
      q: isZh ? `${label} 用什么编程语言？` : `What programming language does ${label} use?`,
      a: isZh
        ? (unspecified
          ? `${label} 的课程资料未指定编程语言要求。`
          : `${label} 的课程资料对编程语言的说明是「${language}」。`)
        : (unspecified
          ? `The course notes for ${label} do not specify a programming language requirement.`
          : `The course notes for ${label} describe the programming language as "${language}".`)
    })
  }

  if (textbook) {
    items.push({
      q: isZh ? `${label} 有教材吗？在哪看？` : `Is there a textbook for ${label}?`,
      ...(isZh
        ? linkedAnswer`有。${university}这门课配套的教材是《${faqResourceLabel(textbook.label)}》，可以直接访问：${{ url: textbook.url }}。建议按课程进度同步阅读对应章节，比只看视频更容易记住细节。`
        : linkedAnswer`Yes — the textbook linked from the course is "${faqResourceLabel(textbook.label)}": ${{ url: textbook.url }}. Reading the matching chapters alongside the lectures makes the details stick far better than video alone.`)
    })
  }

  if (video) {
    items.push({
      q: isZh ? `${label} 有视频吗？` : `Are there video lectures for ${label}?`,
      ...(isZh
        ? linkedAnswer`有。课程视频是「${faqResourceLabel(video.label)}」：${{ url: video.url }}。如果英文听讲有压力，可以配合中文字幕或本站整理的中文资料一起看。`
        : linkedAnswer`Yes — the lecture recordings are "${faqResourceLabel(video.label)}": ${{ url: video.url }}. Pair them with the assignments rather than watching the whole playlist first.`)
    })
  }

  if (assignment && website) {
    items.push({
      q: isZh ? `${label} 的作业和实验怎么找？` : `Where do I find ${label} assignments and labs?`,
      ...(isZh
        ? linkedAnswer`作业入口见「${faqResourceLabel(assignment.label)}」：${{ url: assignment.url }}；课程主页是 ${{ url: website.url }}。建议先跑通一个 lab 再往下看视频，这门课的作业是理解内容的主要途径。`
        : linkedAnswer`Assignments: "${faqResourceLabel(assignment.label)}" — ${{ url: assignment.url }}; course home: ${{ url: website.url }}. Get one lab working before moving on; the assignments are how the material actually lands.`)
    })
  } else if (website) {
    items.push({
      q: isZh ? `${label} 的官方课程网站在哪？` : `Where is the official ${label} course site?`,
      ...(isZh
        ? linkedAnswer`官方课程主页：${{ url: website.url }}。日历、讲义、作业说明通常都从这里进入，遇到资源失效时以官网最新学期为准。`
        : linkedAnswer`Official course site: ${{ url: website.url }}. Schedules, handouts and assignment specs live there — when a link breaks, trust the latest term on the official site.`)
    })
  }

  return items.slice(0, 5)
}
