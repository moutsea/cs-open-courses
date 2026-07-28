import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import Link from 'next/link'
import { Metadata } from 'next'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { universities } from '@/components/UniversitiesData'
import CourseCard from '@/components/CourseCard'
import { getTranslations } from 'next-intl/server'
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo'
import { buildSearchIndex } from '@/lib/searchIndex'
import { countUniversityCourses, getUniversityCourses, getUniversityKey } from '@/lib/universityUtils'
import type { Course } from '@/lib/courseParser'
import {
  AtomIcon,
  BookIcon,
  BridgeIcon,
  BuildingIcon,
  FlaskIcon,
  LeafIcon,
  ShieldIcon,
  TargetIcon
} from '@/components/icons/UniversityIcons'

const iconMap = {
  shield: ShieldIcon,
  target: TargetIcon,
  bridge: BridgeIcon,
  book: BookIcon,
  flask: FlaskIcon,
  atom: AtomIcon,
  leaf: LeafIcon,
  building: BuildingIcon
} as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  const title = isZh ? '全球计算机科学大学指南' : 'World CS Universities Guide'
  const description = isZh
    ? '对比伯克利、MIT、斯坦福、CMU 等名校的 CS 开放课程：查看排名、课程数量与直达链接，快速选择理想项目。'
    : 'Compare Berkeley, MIT, Stanford, CMU open CS programs, see rankings, course counts, and jump directly into each curriculum.'
  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: pageAlternates(locale, '/universities'),
    openGraph: {
      title: isZh ? '顶尖大学与计算机科学项目' : 'Top Universities & CS Programs',
      description: isZh
        ? '探索全球顶尖 CS 项目，查看大学简介、课程数量与官方链接。'
        : 'Discover global top CS programs with descriptions, course counts, and official links.',
      url: absoluteUrl(localizedPath(locale, '/universities')),
      siteName: SITE_NAME,
      type: 'website',
      locale: isZh ? 'zh_CN' : 'en_US',
      images: socialImages()
    },
    twitter: {
      card: 'summary_large_image',
      title: isZh ? '顶尖大学与计算机科学项目' : 'Top Universities & CS Programs',
      description,
      images: [absoluteUrl('/og.jpg')]
    }
  }
}

export default async function LocaleUniversitiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ university?: string | string[] }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const requestedUniversityKey = Array.isArray(resolvedSearchParams.university)
    ? resolvedSearchParams.university[0]
    : resolvedSearchParams.university
  const [tHome, courses] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    buildSearchIndex()
  ])
  const universitiesWithCounts = universities.map(university => {
    const key = getUniversityKey(university.name) || university.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    return {
      ...university,
      key,
      courses: countUniversityCourses(courses, key)
    }
  })
  const selectedUniversity = universitiesWithCounts.find(university => university.key === requestedUniversityKey)
  const selectedCourses: Course[] = selectedUniversity
    ? getUniversityCourses(courses, selectedUniversity.key)
        .map(course => ({
          id: course.id,
          title: locale === 'zh' ? course.title : course.titleEn || course.title,
          description: locale === 'zh' ? course.description : course.descriptionEn,
          path: course.path,
          slug: course.path.split('/').pop() || course.id,
          content: '',
          hasEnglishVersion: course.hasEnglishVersion,
          summary: course.summary,
          summaryEn: course.summaryEn,
          university: course.university,
          programmingLanguage: course.programmingLanguage,
          difficulty: course.difficulty,
          duration: course.duration,
          categorySlug: course.category
        }))
        .sort((firstCourse, secondCourse) => firstCourse.title.localeCompare(secondCourse.title, locale))
    : []

  const stats = [
    { label: locale === 'zh' ? '入选大学' : 'Universities', value: universitiesWithCounts.length },
    { label: locale === 'zh' ? '免费课程' : 'Free Courses', value: courses.length },
    { label: locale === 'zh' ? '覆盖地区' : 'Regions', value: new Set(universities.map(university => university.region)).size }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <ImmersivePage>
        <StructuredData
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: locale === 'zh' ? '全球计算机科学大学目录' : 'Global CS Universities Directory',
            itemListElement: universities.map((uni, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: uni.name,
              url: uni.website
            }))
          }}
        />

        <ImmersiveSection className="py-20 text-white">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                {locale === 'zh' ? '全球合作网络' : 'Global Network'}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">{tHome('universities.directoryTitle')}</h1>
              <p className="text-lg text-white/70 max-w-3xl mx-auto">{tHome('universities.directorySubtitle')}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map(stat => (
                  <div key={stat.label} className="rounded-3xl border border-white/15 bg-white/5 p-5">
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="py-16">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {universitiesWithCounts.map((university, index) => {
                const Icon = iconMap[university.icon]
                const isSelected = university.key === selectedUniversity?.key
                const coursesHref = `${localizedPath(locale, '/universities')}?university=${encodeURIComponent(university.key)}#university-courses`
                return (
                  <div
                    key={university.name}
                    className={`rounded-3xl border p-6 text-white shadow-xl transition ${
                      isSelected
                        ? 'border-cyan-200/50 bg-cyan-200/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                          {locale === 'zh' ? '排名' : 'Rank'} #{index + 1}
                        </p>
                        <h3 className="text-lg font-semibold text-white leading-tight">{university.name}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-white/70 leading-relaxed">{university.description}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                      {university.courses > 0 ? (
                        <Link
                          href={coursesHref}
                          aria-current={isSelected ? 'location' : undefined}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100"
                        >
                          {locale === 'zh'
                            ? `查看 ${university.courses} 门公开课`
                            : `View ${university.courses} open courses`}
                        </Link>
                      ) : (
                        <span className="flex-1 text-xs text-white/45">
                          {locale === 'zh' ? '暂未收录公开课' : 'No open courses listed yet'}
                        </span>
                      )}
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
                      >
                        {locale === 'zh' ? '访问官网' : 'Visit site'}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ImmersiveSection>

        {selectedUniversity && (
          <ImmersiveSection id="university-courses" className="scroll-mt-24 py-16 text-white">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-[32px] border border-cyan-200/20 bg-slate-950/35 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="flex flex-col gap-6 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
                      {locale === 'zh' ? '大学公开课合集' : 'University course collection'}
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{selectedUniversity.name}</h2>
                    <p className="mt-3 max-w-3xl text-white/60">
                      {locale === 'zh'
                        ? `这里聚合了本站收录的 ${selectedCourses.length} 门公开课，可直接进入课程详情查看讲义、作业和学习资源。`
                        : `Browse all ${selectedCourses.length} open courses indexed for this university, with direct access to course materials and learning resources.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={selectedUniversity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
                    >
                      {locale === 'zh' ? '大学官网' : 'University website'}
                    </a>
                    <Link
                      href={localizedPath(locale, '/universities')}
                      className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                    >
                      {locale === 'zh' ? '查看全部大学' : 'View all universities'}
                    </Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {selectedCourses.map(course => (
                    <CourseCard key={course.id} course={course} locale={locale} variant="immersive" />
                  ))}
                </div>
              </div>
            </div>
          </ImmersiveSection>
        )}

        <ImmersiveSection className="py-16 text-white">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 p-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70 mb-2">
                {locale === 'zh' ? '与顶尖大学同行' : 'Learn with the best'}
              </p>
              <h2 className="text-3xl font-bold text-white">
                {locale === 'zh' ? '准备好探索课程了吗？' : 'Ready to explore courses?'}
              </h2>
              <p className="mt-4 text-white/70 max-w-2xl mx-auto">
                {locale === 'zh'
                  ? '浏览这些大学的精选课程，构建你自己的学习路径。'
                  : 'Browse curated courses from these universities and build your personalized learning path.'}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href={localizedPath(locale, '/courses')}
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
                >
                  {locale === 'zh' ? '浏览所有课程' : 'Browse all courses'}
                </Link>
              </div>
            </div>
          </div>
        </ImmersiveSection>
      </ImmersivePage>
      <Footer locale={locale} />
    </div>
  )
}
