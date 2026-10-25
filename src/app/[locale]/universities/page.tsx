import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import Link from 'next/link'
import { Metadata } from 'next'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { universities } from '@/components/UniversitiesData'
import { getTranslations } from 'next-intl/server'
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo'
import { buildSearchIndex } from '@/lib/searchIndex'
import { countUniversityCourses, getUniversityKey } from '@/lib/universityUtils'
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
    ? '对比伯克利、MIT、斯坦福、CMU 等名校的 CS 开放课程：查看课程方向、课程数量与直达链接，快速选择理想项目。'
    : 'Compare Berkeley, MIT, Stanford, CMU open CS programs, see subjects, course counts, and jump directly into each curriculum.'
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

export default async function LocaleUniversitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
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
            itemListElement: universitiesWithCounts.filter(uni => uni.courses > 0).map((uni, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: uni.name,
              url: absoluteUrl(localizedPath(locale, `/universities/${getUniversityKey(uni.name)}`))
            }))
          }}
        />

        <ImmersiveSection className="py-16 text-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                {locale === 'zh' ? '全球公开课资源' : 'Open courses worldwide'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white">
                {tHome('universities.directoryTitle')}
              </h1>
              <p className="text-lg text-white/70 max-w-3xl mx-auto">{tHome('universities.directorySubtitle')}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map(stat => (
                  <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {universitiesWithCounts.map((university) => {
                const Icon = iconMap[university.icon]
                const coursesHref = localizedPath(locale, `/universities/${university.key}`)
                return (
                  <div
                    key={university.name}
                    className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                          {locale === 'zh' ? '公开课程来源' : 'Open course provider'}
                        </p>
                        <h3 className="text-xl font-semibold text-white leading-tight">{university.name}</h3>
                      </div>
                    </div>
                    <p className="mt-4 flex-1 text-sm text-white/70 leading-relaxed">{university.description}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                      {university.courses > 0 ? (
                        <Link
                          href={coursesHref}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
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
                        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                      >
                        {locale === 'zh' ? '访问官网' : 'Visit site'}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45 mb-2">
                {locale === 'zh' ? '与顶尖大学同行' : 'Learn with the best'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">
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
                  className="inline-flex items-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
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
