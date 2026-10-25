import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getCourseContent } from './courseUtils'
import { parseMarkdownFile, type Course } from './courseParser'
import { buildCourseFaq, extractCourseFacts, type FactLocale } from './courseFacts'
import type { SiteLocale } from './seo'

/**
 * 课程详情页的取数与组装。
 *
 * 从 page.tsx 里提出来是为了能测：`course.categorySlug` 之前没人设，
 * 结构化数据的 `about` 因此恒缺，而页面文件不允许额外导出、测不到。
 */
export const loadCourse = cache(async (locale: string, coursePath: string) => {
  const content = await getCourseContent(coursePath.split('/'), locale)
  if (!content.exists) notFound()
  const contentLocale = content.isFallback ? (locale === 'zh' ? 'en' : 'zh') : locale
  const parsed = await parseMarkdownFile(content.filePath, contentLocale)
  const segments = coursePath.split('/')
  const course: Course = {
    ...parsed,
    id: coursePath,
    path: coursePath,
    slug: segments.pop()!,
    description: '',
    hasEnglishVersion: content.hasEnglishVersion,
    hasChineseVersion: content.hasChineseVersion,
    // 结构化数据的 about 需要分类名，之前只有 MDXRenderer 的面包屑拿到过这两段。
    categorySlug: segments[0],
    subcategorySlug: segments.length > 1 ? segments[1] : undefined
  }
  const factLocale: FactLocale = contentLocale === 'zh' ? 'zh' : 'en'
  const facts = extractCourseFacts(parsed.content || '', factLocale)
  const faq = buildCourseFaq(course, facts, factLocale)
  const availableLocales: SiteLocale[] = []
  if (content.hasEnglishVersion) availableLocales.push('en')
  if (content.hasChineseVersion) availableLocales.push('zh')
  return { content, course, contentLocale, factLocale, facts, faq, availableLocales }
})
