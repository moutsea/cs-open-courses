import type { Course } from './courseParser'
import { buildDynamicRoutePath } from './pathUtils'
import { absoluteUrl, localizedPath } from './seo'
import { universities } from '@/components/UniversitiesData'
import { getUniversityKeys, getUniversityKey } from './universityUtils'
import { courseGuides } from '@/data/course-guides'
import { slugLabel } from './categoryMapping'
import { courseCode, courseKey, difficultyLabel, formatHours, isUnspecifiedLanguage, type CourseFacts, type CourseFaqItem, type FactLocale } from './courseFacts'
import { totalStudyHours } from './courseStudyHours'

const MAX_DESCRIPTION = 158

function trimDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= MAX_DESCRIPTION) return clean
  return `${clean.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`
}

function hoursNumber(course: Course, facts?: CourseFacts): number | undefined {
  // duration.value is a legacy first-number extraction; its original text may
  // describe a weekly workload, range or lower bound rather than a total.
  const text = facts?.hours?.trim() || formatHours(course)
  return totalStudyHours(text)
}

export function getCourseSeo(course: Course, locale: string, facts?: CourseFacts) {
  const resolvedLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const isZh = resolvedLocale === 'zh'
  const guide = courseGuides[buildDynamicRoutePath(course.path).join('/')]
  const guideText = guide?.[isZh ? 'zh' : 'en']
  const summary = (isZh ? course.summary : course.summaryEn || course.summary)?.trim()
  const key = courseKey(course)

  const hasTextbook = facts?.resources.some(item => item.kind === 'textbook' && item.available !== false)
  const hasVideo = facts?.resources.some(item => item.kind === 'video' && item.available !== false)
  const hasMedia = hasTextbook || hasVideo
  const mediaTopics = hasTextbook && hasVideo
    ? (isZh ? '先修要求、教材与视频' : 'Prerequisites, Textbook & Videos')
    : hasTextbook
      ? (isZh ? '先修要求与教材' : 'Prerequisites & Textbook')
      : (isZh ? '先修要求与视频' : 'Prerequisites & Videos')

  // Shrink the suffix as the key grows: short keys (course codes) carry the full keyword set,
  // long keys (full course names) only get the "中文课程资料" modifier so the title stays readable.
  const fallbackTitle = isZh
    ? key.length <= 16
      ? hasMedia
        ? `${key} 中文课程资料：${mediaTopics}`
        : `${key} 中文课程资料与学习路线`
      : key.length <= 34
        ? `${key} - 课程资料与先修要求`
        : `${key} 中文课程资料`
    : key.length <= 16
      ? hasMedia
        ? `${key} Study Guide: ${mediaTopics}`
        : `${key} Study Guide: Prerequisites & Study Path`
      : key.length <= 34
        ? `${key} - Course Guide & Prerequisites`
        : `${key} Study Guide`

  const descriptors: string[] = []
  const prerequisites = facts?.prerequisites || undefined
  const language = facts?.language || course.programmingLanguage
  const level = difficultyLabel(course.difficulty, resolvedLocale)
  const hours = hoursNumber(course, facts)

  if (prerequisites) descriptors.push(isZh ? `先修 ${prerequisites}` : `prerequisites: ${prerequisites}`)
  if (language && !isUnspecifiedLanguage(language)) descriptors.push(isZh ? `编程语言：${language}` : `programming language: ${language}`)
  if (level) descriptors.push(isZh ? `难度${level}` : `difficulty: ${level}`)
  if (hours) descriptors.push(isZh ? `约 ${hours} 学时` : `~${hours} hours`)

  const university = course.university?.trim()
  const fallbackDescription = isZh
    ? trimDescription(
        `${course.title}${university ? `（${university}）` : ''}中文课程资料${descriptors.length ? `：${descriptors.join('，')}` : ''}。汇总官方课程网站、课程视频、教材与作业入口，附学习顺序与常见问题，方便自学。`
      )
    : trimDescription(
        `${course.title}${university ? ` (${university})` : ''} study guide${descriptors.length ? `: ${descriptors.join(', ')}` : ''}. Official lectures, textbook and assignment links, plus a study order and FAQ for self-learners.`
      )

  return {
    title: guideText?.title || fallbackTitle,
    description: trimDescription(guideText?.description || summary || fallbackDescription)
  }
}

function isoDuration(hours: number | undefined): string | undefined {
  if (!hours || Number.isNaN(hours)) return undefined
  return `PT${hours}H`
}

/**
 * JSON-LD 的语言列表。`hasChineseVersion` 缺省时按双语处理，兼容旧调用方与测试夹具；
 * 单语课程必须显式给出两个标记，否则会凭空声报另一种语言。
 */
function availableLanguages(course: Course, resolvedLocale: FactLocale): string[] {
  const hasEnglish = course.hasEnglishVersion
  const hasChinese = course.hasChineseVersion ?? hasEnglish
  const languages: string[] = []
  if (hasChinese) languages.push('zh-CN')
  if (hasEnglish) languages.push('en')
  return languages.length > 0 ? languages : [resolvedLocale === 'zh' ? 'zh-CN' : 'en']
}

export function courseSchema(course: Course, locale: string, facts?: CourseFacts) {
  const resolvedLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const { description } = getCourseSeo(course, resolvedLocale, facts)
  const keys = course.university ? getUniversityKeys(course.university) : []
  const providers = keys.map(key => {
    const university = universities.find(item => getUniversityKey(item.name) === key)
    return university
      ? { '@type': 'CollegeOrUniversity', name: university.name, url: university.website }
      : { '@type': 'Organization', name: course.university }
  })
  const url = absoluteUrl(localizedPath(locale, `/course/${buildDynamicRoutePath(course.path).join('/')}`))
  const website = facts?.resources?.find(item => item.kind === 'website' && item.url)?.url
  const level = difficultyLabel(course.difficulty, resolvedLocale)
  const timeRequired = isoDuration(hoursNumber(course, facts))
  // `about` 之前恒缺：Course 对象上没有 categorySlug，读到的永远是 undefined。
  const aboutTopics = [course.categorySlug, course.subcategorySlug]
    .filter((slug): slug is string => Boolean(slug))
    .map(slug => ({ '@type': 'Thing' as const, name: slugLabel(slug, resolvedLocale) }))

  return {
    '@type': 'Course',
    name: course.title,
    description,
    url,
    courseCode: courseCode(course),
    availableLanguage: availableLanguages(course, resolvedLocale),
    isAccessibleForFree: true,
    ...(level ? { educationalLevel: level } : {}),
    ...(timeRequired ? { timeRequired } : {}),
    ...(facts?.prerequisites ? { coursePrerequisites: facts.prerequisites } : {}),
    ...(aboutTopics.length > 0 ? { about: aboutTopics.length === 1 ? aboutTopics[0] : aboutTopics } : {}),
    ...(website ? { sameAs: website } : {}),
    offers: {
      '@type': 'Offer',
      category: 'Free',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    ...(providers.length ? { provider: providers.length === 1 ? providers[0] : providers } : {})
  }
}

export function faqSchema(items: CourseFaqItem[], locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  }
}

/**
 * Lightweight ItemList for directory pages: 130+ nested Course objects would add
 * >100KB of JSON-LD to a single page, so list URLs only.
 */
export function courseListSummarySchema(courses: Course[], locale: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: course.title,
      url: absoluteUrl(localizedPath(locale, `/course/${buildDynamicRoutePath(course.path).join('/')}`))
    }))
  }
}

export function courseListSchema(
  courses: Course[],
  locale: string,
  name: string,
  factsByPath?: Map<string, CourseFacts>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => {
      const item = courseSchema(course, locale, factsByPath?.get(course.path))
      return { '@type': 'ListItem', position: index + 1, url: item.url, item }
    })
  }
}
