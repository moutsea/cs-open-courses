import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CourseCollectionLayout from '@/components/CourseCollectionLayout'
import CourseCard from '@/components/CourseCard'
import CourseFaq from '@/components/CourseFaq'
import StructuredData from '@/components/StructuredData'
import { getUniversityCatalog, categoryName, courseCardData } from '@/lib/catalog'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { courseListSchema, faqSchema } from '@/lib/courseSeo'
import { extractCourseFacts, type CourseFaqItem, type FactLocale } from '@/lib/courseFacts'
import { absoluteUrl, collectionMetadata, localizedPath } from '@/lib/seo'
import { universityChineseNames as chineseNames, universityTitleLabel as titleLabel } from '@/data/university-names'

type Props = { params: Promise<{ locale: string; university: string }> }

async function getCollection(locale: string, slug: string) {
  const university = (await getUniversityCatalog(locale)).find(item => item.slug === slug)
  if (!university) notFound()
  const name = locale === 'zh' ? chineseNames[slug] || university.name : university.name
  const label = titleLabel(slug, university.name, locale === 'zh')
  const zhSpacing = /[A-Za-z0-9]$/.test(label) ? ' ' : ''
  const title = locale === 'zh' ? `${label}${zhSpacing}计算机课程推荐：先修、教材与视频` : `${label} CS Courses: Prerequisites & Materials`
  const examples = university.courses.slice(0, 3).map(course => course.slug).join(locale === 'zh' ? '、' : ', ')
  const description = locale === 'zh'
    ? `本站收录 ${university.courses.length} 门 ${name} 的免费计算机公开课，含 ${examples}，逐门整理先修要求、编程语言、教材、视频与作业入口，可按难度顺序自学。`
    : `Browse ${university.courses.length} free ${name} CS courses, including ${examples}, with prerequisites, programming languages, textbooks, videos, and assignment links to study in order.`
  return { university, name, label, title, description }
}

export async function generateStaticParams() {
  return (await Promise.all(['en', 'zh'].map(async locale => (await getUniversityCatalog(locale)).map(university => ({ locale, university: university.slug }))))).flat()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, university: slug } = await params
  const { title, description } = await getCollection(locale, slug)
  return collectionMetadata(locale, `/universities/${slug}`, title, description)
}

export default async function UniversityPage({ params }: Props) {
  const { locale, university: slug } = await params
  const { university, name, label, title, description } = await getCollection(locale, slug)
  const factLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const isZh = locale === 'zh'
  const subjects = [...new Set(university.courses.map(course => buildDynamicRoutePath(course.path)[0]))]
  const pageUrl = absoluteUrl(localizedPath(locale, `/universities/${slug}`))

  const factsList = university.courses.map(course => ({ course, facts: extractCourseFacts(course.content || '', factLocale) }))
  const factsByPath = new Map(factsList.map(({ course, facts }) => [course.path, facts]))
  const beginnerCourses = factsList.filter(({ course }) => (course.difficulty || '').trim().toLowerCase().startsWith('beginner'))
  const languageCounts = new Map<string, number>()
  for (const { course, facts } of factsList) {
    const language = facts.language || course.programmingLanguage
    if (!language) continue
    languageCounts.set(language, (languageCounts.get(language) || 0) + 1)
  }
  const topLanguages = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([language]) => language)
  const exampleTitles = university.courses.slice(0, 4).map(course => course.title)

  const faq: CourseFaqItem[] = [{
    q: isZh ? `${name}有哪些免费的计算机课程？` : `Which ${name} CS courses are free?`,
    a: isZh
      ? `本站收录了 ${university.courses.length} 门公开可访问的${name}计算机课程，覆盖 ${subjects.length} 个方向，例如 ${exampleTitles.join('、')}。每门课都整理了官方课程网站、讲义与作业入口，可以按方向或难度挑选。`
      : `This site collects ${university.courses.length} openly accessible ${name} CS courses across ${subjects.length} subjects, such as ${exampleTitles.join(', ')}. Each course page lists the official site, lecture notes, and assignment links so you can pick by subject or difficulty.`
  }]

  if (beginnerCourses.length > 0) {
    faq.push({
      q: isZh ? `零基础可以直接学${name}的课吗？` : `Can a beginner start with a ${name} course?`,
      a: isZh
        ? `可以。${beginnerCourses.length} 门课被标注为入门难度，例如 ${beginnerCourses.slice(0, 3).map(item => item.course.title).join('、')}，先修要求通常较低。建议先完成其中一门再进入进阶课程，或者按照学习路线从编程入门开始补基础。`
        : `Yes. ${beginnerCourses.length} courses are marked beginner level, such as ${beginnerCourses.slice(0, 3).map(item => item.course.title).join(', ')}; their prerequisites are usually light. Finish one of them before moving to advanced courses, or follow the learning path to build fundamentals first.`
    })
  } else {
    faq.push({
      q: isZh ? `零基础可以直接学${name}的课吗？` : `Can a beginner start with a ${name} course?`,
      a: isZh
        ? `${name}在本站收录的课程大多属于进阶难度，直接上手会吃力。建议先完成一门编程入门课与一门数据结构课，再回来学这里的课程。`
        : `Most ${name} courses collected here are advanced, so starting directly is tough. Complete an intro programming course and a data structures course first, then come back.`
    })
  }

  if (topLanguages.length > 0) {
    faq.push({
      q: isZh ? `${name}的计算机课程用什么编程语言？` : `Which programming languages do ${name} CS courses use?`,
      a: isZh
        ? `按课程数量统计，出现最多的语言是 ${topLanguages.join('、')}。多数课程会在讲义或作业中说明环境配置，即使之前没写过这门语言，也可以从第一周的实验开始边做边学。`
        : `By course count the most common languages are ${topLanguages.join(', ')}. Most courses explain environment setup in the notes or assignments, so you can pick up an unfamiliar language while working through the first lab.`
    })
  }

  faq.push({
    q: isZh ? `${name}的官方课程资源在哪找？` : `Where are the official ${name} course materials?`,
    a: isZh
      ? `${name}的官方网站是 ${university.website}，课程也常发布在公开课平台与课程主页上。本站每门课都记录了官方站点链接，建议优先使用同一学期的讲义与作业，避免混用不同版本。`
      : `The official site is ${university.website}; courses are also published on open course platforms and course homepages. Every course page here records the official link — use lectures and assignments from the same term to avoid mixing versions.`
  })

  return <CourseCollectionLayout locale={locale} title={title} description={description} breadcrumbs={[
    { name: isZh ? '大学' : 'Universities', pathname: '/universities' },
    { name, pathname: `/universities/${slug}` }
  ]}>
    <StructuredData data={courseListSchema(university.courses, locale, title, factsByPath)} />
    <StructuredData data={faqSchema(faq, locale)} />
    <StructuredData data={{
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: university.name,
      alternateName: name,
      url: university.website,
      sameAs: university.website,
      mainEntityOfPage: pageUrl,
      description: university.description
    }} />
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
      <h2 className="text-2xl sm:text-3xl font-semibold text-white">{isZh ? '选择学习方向' : 'Choose a subject'}</h2>
      <p className="max-w-4xl leading-relaxed text-white/70">{isZh
        ? `本站收录的 ${university.name} 课程覆盖下列 ${subjects.length} 个方向。先根据先修要求选择一门课程，并使用同一学期的讲义和作业；需要其他大学的替代课程时，可以进入对应专题比较。`
        : `The ${university.name} courses in this collection cover ${subjects.length} subjects. Choose a course that matches your prerequisites and keep its lectures and assignments from the same offering. Visit a subject guide to compare alternatives from other universities.`}</p>
      <div className="flex flex-wrap gap-3">{subjects.map(subject => <Link key={subject} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-white/30 hover:bg-white/10" href={localizedPath(locale, `/courses/${subject}`)}>{categoryName(subject, locale)}</Link>)}</div>
      <a className="inline-block text-cyan-200 underline underline-offset-4 hover:text-cyan-100" href={university.website} target="_blank" rel="noopener noreferrer">{isZh ? '大学官方资源' : 'Official university resources'}</a>
    </section>
    <section>
      <h2 className="mb-6 text-2xl sm:text-3xl font-semibold text-white">{isZh ? '课程与学习资料' : 'Courses and learning resources'}</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{university.courses.map(course => <CourseCard key={course.id} course={courseCardData(course)} locale={locale} variant="immersive" />)}</div>
    </section>
    <CourseFaq id="university-faq" items={faq} locale={locale} title={isZh ? `关于${label}课程，常见的问题` : `Common questions about ${label} courses`} />
  </CourseCollectionLayout>
}
