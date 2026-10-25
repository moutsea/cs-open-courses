import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import CourseCollectionLayout from '@/components/CourseCollectionLayout'
import CourseComparisonTable, { type ComparisonRow } from '@/components/CourseComparisonTable'
import CourseFaq from '@/components/CourseFaq'
import StructuredData from '@/components/StructuredData'
import { getCatalog, categoryName } from '@/lib/catalog'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { courseListSchema, faqSchema } from '@/lib/courseSeo'
import { courseKey, difficultyLabel, extractCourseFacts, formatHours, formatStudyHours, type CourseFacts, type CourseFaqItem, type FactLocale } from '@/lib/courseFacts'
import { categoryFaqs, categoryGuides } from '@/data/category-guides'
import { collectionMetadata, localizedPath } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; category: string[] }> }

const getCollection = cache(async (locale: string, segments: string[]) => {
  if (segments.length > 2) notFound()
  const categories = await getCatalog(locale)
  const category = categories.find(item => item.slug === segments[0])
  if (!category) notFound()
  const subcategory = segments[1] ? category.subcategories.find(item => item.slug === segments[1]) : undefined
  if (segments[1] && !subcategory) notFound()
  const courses = subcategory?.courses || category.courses
  // Subcategory pages get the subcategory name only — the parent stays in the breadcrumb.
  const name = subcategory ? categoryName(subcategory.slug, locale) : categoryName(category.slug, locale)
  const title = locale === 'zh'
    ? `${name}课程推荐：先修、教材与学习顺序`
    : `${name} Courses: Prerequisites & Study Order`
  // Short course codes ("CS61B", "15-445") read well in a SERP snippet; full course names do not.
  const examples = courses
    .map(course => courseKey(course))
    .filter(key => key.length > 1 && key.length <= 18)
    .slice(0, 3)
    .join(locale === 'zh' ? '、' : ', ')
  const description = locale === 'zh'
    ? (examples
      ? `精选 ${courses.length} 门${name}公开课，含 ${examples}。逐门对比先修要求、编程语言、课程难度与教材视频，按顺序从入门学到进阶。`
      : `精选 ${courses.length} 门${name}公开课，逐门对比先修要求、编程语言、课程难度与教材视频，按顺序从入门学到进阶。`)
    : (examples
      ? `Compare ${courses.length} ${name.toLowerCase()} open courses, including ${examples}, by prerequisites, language, difficulty, and textbooks — then follow a study order from beginner to advanced.`
      : `Compare ${courses.length} ${name.toLowerCase()} open courses by prerequisites, language, difficulty, and textbooks — then follow a study order from beginner to advanced.`)
  return { categories, category, subcategory, courses, name, title, description, pathname: `/courses/${segments.join('/')}` }
})

export async function generateStaticParams() {
  const results = []
  for (const locale of ['en', 'zh']) {
    for (const category of await getCatalog(locale)) {
      results.push({ locale, category: [category.slug] })
      for (const subcategory of category.subcategories) results.push({ locale, category: [category.slug, subcategory.slug] })
    }
  }
  return results
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params
  const collection = await getCollection(locale, category)
  return collectionMetadata(locale, collection.pathname, collection.title, collection.description)
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category: segments } = await params
  const data = await getCollection(locale, segments)
  const factLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const guide = categoryGuides[data.category.slug]?.[factLocale]
  const faq: CourseFaqItem[] = data.subcategory ? [] : categoryFaqs[data.category.slug]?.[factLocale] || []

  const factsByPath = new Map<string, CourseFacts>()
  const comparison: ComparisonRow[] = data.courses.map(course => {
    const facts = extractCourseFacts(course.content || '', factLocale)
    factsByPath.set(course.path, facts)
    return {
      title: course.title,
      routePath: buildDynamicRoutePath(course.path).join('/'),
      university: course.university,
      language: facts.language || course.programmingLanguage,
      level: difficultyLabel(course.difficulty, factLocale),
      hours: formatStudyHours(facts.hours || formatHours(course) || '', factLocale),
      prerequisites: facts.prerequisites ? `${facts.prerequisites.slice(0, 46)}${facts.prerequisites.length > 46 ? '…' : ''}` : undefined
    }
  })

  const breadcrumbs = [{ name: locale === 'zh' ? '所有课程' : 'All courses', pathname: '/courses' }, { name: categoryName(data.category.slug, locale), pathname: `/courses/${data.category.slug}` }]
  if (data.subcategory) breadcrumbs.push({ name: categoryName(data.subcategory.slug, locale), pathname: data.pathname })
  return <CourseCollectionLayout locale={locale} title={data.title} description={data.description} breadcrumbs={breadcrumbs}>
    <StructuredData data={courseListSchema(data.courses, locale, data.title, factsByPath)} />
    {faq.length > 0 && <StructuredData data={faqSchema(faq, locale)} />}
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{locale === 'zh' ? '课程对比：先修、语言与难度' : 'Compare courses: prerequisites, language, and level'}</h2>
      <p className="max-w-4xl leading-relaxed text-white/75">{locale === 'zh'
        ? `下表把本章收录的 ${data.courses.length} 门课程的先修要求、编程语言、难度与预计学时放在一起。零基础可以从「先修要求」为「无」的课程开始；如果已经会一门语言，直接挑先修已满足的课程能省下不少时间。`
        : `The table below lines up prerequisites, programming language, difficulty, and study hours for all ${data.courses.length} courses in this collection. Start with a course that has no prerequisites if you are new; if you already know one language, pick a course whose prerequisites you satisfy.`}</p>
      <CourseComparisonTable rows={comparison} locale={locale} />
    </section>
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-3 text-2xl font-semibold">{locale === 'zh' ? '如何安排学习' : 'Plan your studies'}</h2>
      <p className="max-w-4xl leading-relaxed text-white/75">{guide || (locale === 'zh' ? `先比较上方${data.name}课程的先修要求和作业形式，再选择一门作为主线。完成一个阶段的练习后，使用同主题课程补充薄弱环节。` : `Compare the prerequisites and assignments of the ${data.name.toLowerCase()} courses above, then choose one as your main course. Use other courses to revisit topics after completing the exercises.`)}</p>
      <Link className="mt-4 inline-block text-cyan-200 underline" href={localizedPath(locale, '/tutorial')}>{locale === 'zh' ? '查看完整计算机科学学习路线' : 'Explore the complete computer science roadmap'}</Link>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-4">
      <p className="max-w-2xl text-sm leading-relaxed text-white/60">
        {locale === 'zh'
          ? `上面 ${data.courses.length} 门课程已在对比表中列出，点击课程名即可进入详情页。`
          : `All ${data.courses.length} courses are listed in the table above — click a title to open its page.`}
      </p>
      <Link
        href={localizedPath(locale, '/courses')}
        className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        {locale === 'zh' ? '浏览所有课程' : 'Browse all courses'}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
    {faq.length > 0 && <CourseFaq id="category-faq" items={faq} locale={locale} title={locale === 'zh' ? '关于这些课程，常见的问题' : 'Common questions about these courses'} />}
  </CourseCollectionLayout>
}
