import { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, BookOpen, GraduationCap, Search, Sparkles } from 'lucide-react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import HomeFeaturedCourses from '@/components/HomeFeaturedCourses'
import HomeLearningPanel from '@/components/HomeLearningPanel'
import HomeLearningPaths from '@/components/HomeLearningPaths'
import { universities } from '@/components/UniversitiesData'
import StructuredData from '@/components/StructuredData'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { getCategoriesForLocale } from '@/lib/getServerData'
import { buildDynamicRoutePath, localizedPath } from '@/lib/pathUtils'
import { buildSearchIndex } from '@/lib/searchIndex'
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath as localizedSeoPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo'
import { countUniversityCourses } from '@/lib/universityUtils'

const FEATURED_COURSES = [
  { path: 'data-structures-algorithms/CS61B', role: 'core' },
  { path: 'programming-introduction/python/CS61A', role: 'prerequisite' },
  { path: 'computer-architecture/CS61C', role: 'systems' },
  { path: 'machine-learning/CS189', role: 'popular' }
]

const HOME_UNIVERSITIES = [
  { key: 'mit', shortName: 'MIT' },
  { key: 'stanford', shortName: 'Stanford' },
  { key: 'uc-berkeley', shortName: 'UC Berkeley' },
  { key: 'harvard', shortName: 'Harvard' },
  { key: 'cmu', shortName: 'CMU' },
  { key: 'princeton', shortName: 'Princeton' }
]

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isChinese = locale === 'zh'
  const t = await getTranslations({ locale, namespace: 'home.metadata' })
  const title = t('title')
  const description = t('description')

  return {
    title: { absolute: title },
    description,
    robots: INDEXABLE_ROBOTS,
    keywords: [
      'cs61b',
      'computer science courses',
      'free online courses',
      'learning path',
      'berkeley cs61b',
      'cs61a',
      'cs61c'
    ],
    alternates: pageAlternates(locale),
    openGraph: {
      title,
      description,
      url: absoluteUrl(localizedSeoPath(locale)),
      siteName: SITE_NAME,
      type: 'website',
      locale: isChinese ? 'zh_CN' : 'en_US',
      alternateLocale: isChinese ? ['en_US'] : ['zh_CN'],
      images: socialImages()
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/og.jpg')]
    }
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isChinese = locale === 'zh'
  const [categories, searchIndex, t] = await Promise.all([
    getCategoriesForLocale(locale),
    buildSearchIndex(),
    getTranslations({ locale, namespace: 'home' })
  ])
  const courses = categories.flatMap(category => category.courses)
  const featuredCourses = FEATURED_COURSES.flatMap(featuredCourse => {
    const course = courses.find(course => buildDynamicRoutePath(course.path).join('/') === featuredCourse.path)
    return course ? [{ course, role: t(`featured.roles.${featuredCourse.role}`) }] : []
  })
  const homeUniversities = HOME_UNIVERSITIES.map(homeUniversity => ({
    ...homeUniversity,
    courses: countUniversityCourses(searchIndex, homeUniversity.key)
  }))

  const homeUrl = absoluteUrl(localizedPath(locale))
  const platformStats = [
    {
      value: searchIndex.length,
      label: t('stats.freeCourses'),
      href: localizedPath(locale, '/courses')
    },
    {
      value: categories.length,
      label: t('stats.subjectAreas'),
      href: localizedPath(locale, '/courses')
    },
    {
      value: universities.length,
      label: t('stats.universities'),
      href: localizedPath(locale, '/universities')
    }
  ]

  const benefits = [
    [t('benefits.realCourses.title'), t('benefits.realCourses.description')],
    [t('benefits.clearPaths.title'), t('benefits.clearPaths.description')],
    [t('benefits.freeAccess.title'), t('benefits.freeAccess.description')]
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${absoluteUrl('/')}#website`,
              url: absoluteUrl('/'),
              name: SITE_NAME,
              inLanguage: isChinese ? 'zh-CN' : 'en-US',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${absoluteUrl(localizedPath(locale, '/search'))}?q={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
              }
            },
            {
              '@type': 'EducationalOrganization',
              '@id': `${absoluteUrl('/')}#organization`,
              name: SITE_NAME,
              url: absoluteUrl('/'),
              logo: absoluteUrl('/logo.png')
            },
            {
              '@type': 'CollectionPage',
              '@id': `${homeUrl}#webpage`,
              url: homeUrl,
              name: t('metadata.title'),
              isPartOf: { '@id': `${absoluteUrl('/')}#website` },
              about: { '@id': `${absoluteUrl('/')}#organization` },
              inLanguage: isChinese ? 'zh-CN' : 'en-US'
            }
          ]
        }}
      />
      <Header locale={locale} />
      <ImmersivePage>
        <ImmersiveSection className="px-4 pb-16 pt-16 text-white sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="mx-auto grid max-w-screen-2xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t('hero.badge')}
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  {t('hero.title')}
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-white/75 sm:text-2xl">
                {t('hero.description')}
              </p>

              <form
                action={localizedPath(locale, '/search')}
                method="get"
                className="mt-8 flex max-w-2xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl sm:flex-row"
              >
                <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl bg-slate-950/50 px-4">
                  <Search className="h-5 w-5 text-white/45" aria-hidden="true" />
                  <span className="sr-only">{t('hero.searchLabel')}</span>
                  <input
                    type="search"
                    name="q"
                    placeholder={t('hero.searchPlaceholder')}
                    className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/35"
                  />
                </label>
                <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-bold text-slate-950 transition hover:bg-cyan-100">
                  {t('hero.searchButton')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={localizedPath(locale, '/courses')}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                >
                  {t('hero.browseCourses')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={localizedPath(locale, '/tutorial')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
                >
                  {t('hero.viewLearningPaths')}
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_rgba(8,47,73,0.25)] backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
                    {t('hero.recommendedEyebrow')}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold">CS61B</h2>
                  <p className="mt-3 text-white/65">
                    {t('hero.recommendedDescription')}
                  </p>
                </div>
                <BookOpen className="h-10 w-10 text-cyan-200" aria-hidden="true" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {platformStats.map(stat => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-cyan-200/30 hover:bg-white/10"
                  >
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="mt-1 text-xs leading-relaxed text-white/50">{stat.label}</div>
                  </Link>
                ))}
              </div>
              <Link
                href={localizedPath(locale, '/course/data-structures-algorithms/CS61B')}
                className="mt-6 inline-flex w-full items-center justify-between rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-5 py-4 font-semibold text-cyan-100 transition hover:bg-cyan-200/15"
              >
                {t('hero.openCourse')}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </ImmersiveSection>

        <HomeLearningPanel locale={locale} />

        <HomeLearningPaths locale={locale} />

        <HomeFeaturedCourses courses={featuredCourses} locale={locale} />

        <ImmersiveSection className="px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
                  {t('universities.eyebrow')}
                </p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {t('universities.sourcesTitle')}
                </h2>
              </div>
              <Link href={localizedPath(locale, '/universities')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                {t('universities.viewAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {homeUniversities.map(university => (
                <Link
                  key={university.key}
                  href={`${localizedPath(locale, '/universities')}?university=${encodeURIComponent(university.key)}#university-courses`}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-cyan-200/30 hover:bg-white/10"
                  aria-label={locale === 'zh'
                    ? `查看 ${university.shortName} 的 ${university.courses} 门公开课`
                    : `View ${university.courses} open courses from ${university.shortName}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GraduationCap className="h-5 w-5 flex-none text-cyan-200" aria-hidden="true" />
                    <span className="truncate font-semibold">{university.shortName}</span>
                  </div>
                  <div className="ml-4 flex flex-none items-center gap-2 text-sm text-white/50 transition group-hover:text-cyan-100">
                    <span>{university.courses} {t('universities.courseCount')}</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-screen-2xl rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl sm:p-10">
            <div className="grid gap-5 md:grid-cols-3">
              {benefits.map(([title, description]) => (
                <div key={title}>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{t('cta.title')}</h2>
                <p className="mt-1 text-white/60">{t('cta.description')}</p>
              </div>
              <Link
                href={localizedPath(locale, '/courses')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100"
              >
                {t('cta.button')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </ImmersiveSection>
      </ImmersivePage>
      <Footer locale={locale} />
    </div>
  )
}
