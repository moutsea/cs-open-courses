import type { Metadata } from 'next'
import MDXRenderer from '@/components/MDXRenderer'
import StructuredData from '@/components/StructuredData'
import CourseStudyGuide from '@/components/CourseStudyGuide'
import CourseVideoResources from '@/components/CourseVideoResources'
import CourseFactSheet from '@/components/CourseFactSheet'
import CourseFaq from '@/components/CourseFaq'
import { markdownToHTML } from '@/lib/markdownProcessor'
import { getCatalog, categoryName } from '@/lib/catalog'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { courseSchema, faqSchema, getCourseSeo } from '@/lib/courseSeo'
import { factSheetRows, type FactLocale } from '@/lib/courseFacts'
import { absoluteUrl, collectionMetadata, localizedPath, pageAlternates } from '@/lib/seo'
import { loadCourse } from '@/lib/coursePageData'

interface CoursePageProps {
  params: Promise<{ locale: string; path: string[] }>
}

export async function generateStaticParams() {
  return (await Promise.all(['en', 'zh'].map(async locale =>
    (await getCatalog(locale)).flatMap(category => category.courses.map(course => ({ locale, path: buildDynamicRoutePath(course.path) })))
  ))).flat()
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { locale, path } = await params
  const { content, course, contentLocale, facts, availableLocales } = await loadCourse(locale, path.join('/'))
  const { title, description } = getCourseSeo(course, contentLocale, facts)
  const pathname = `/course/${path.join('/')}`
  return {
    ...collectionMetadata(contentLocale, pathname, title, description),
    alternates: pageAlternates(contentLocale, pathname, availableLocales),
    ...(content.isFallback ? { robots: { index: false, follow: true } } : {})
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, path } = await params
  const coursePath = path.join('/')
  const { content, course, contentLocale, factLocale, facts, faq } = await loadCourse(locale, coursePath)
  const htmlContent = await markdownToHTML(content.content, { coursePath, locale: contentLocale }, { removeFirstHeading: true })
  const { title: seoTitle, description } = getCourseSeo(course, contentLocale, facts)
  const courses = (await getCatalog(contentLocale)).flatMap(category => category.courses)
  const breadcrumbItems = [
    { name: locale === 'zh' ? '首页' : 'Home', pathname: '/' },
    { name: locale === 'zh' ? '课程' : 'Courses', pathname: '/courses' },
    { name: categoryName(path[0], locale), pathname: `/courses/${path[0]}` },
    { name: course.title, pathname: `/course/${coursePath}` }
  ]
  const uiLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const rows = factSheetRows(course, facts, uiLocale)
  return <>
    <StructuredData data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', name: seoTitle, description, url: absoluteUrl(localizedPath(contentLocale, `/course/${coursePath}`)), inLanguage: contentLocale === 'zh' ? 'zh-CN' : 'en' },
      courseSchema(course, contentLocale, facts),
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(localizedPath(locale, item.pathname)) })) }
    ] }} />
    {faq.length > 0 && <StructuredData data={faqSchema(faq, factLocale)} />}
    <MDXRenderer content={htmlContent} locale={locale} title={course.title} coursePath={path}
      categorySlug={path[0]} subcategorySlug={path.length > 2 ? path[1] : undefined}
      hasEnglishVersion={content.hasEnglishVersion} hasChineseVersion={content.hasChineseVersion} isFallback={content.isFallback}
      factSheet={<CourseFactSheet rows={rows} resources={facts.resources} locale={uiLocale} />}
      videoResources={<CourseVideoResources coursePath={coursePath} locale={locale} />}>
      <CourseFaq items={faq} locale={factLocale} variant="flat" />
      <CourseStudyGuide coursePath={coursePath} courses={courses} locale={contentLocale} />
    </MDXRenderer>
  </>
}
