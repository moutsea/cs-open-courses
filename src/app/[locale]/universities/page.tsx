import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import Link from 'next/link'
import { Metadata } from 'next'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { universities } from '@/components/UniversitiesData'
import { getTranslations } from 'next-intl/server'
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

export const metadata: Metadata = {
  title: 'Top Universities & CS Programs',
  description:
    'Comprehensive directory of world-class universities offering computer science open courses. Explore programs from Berkeley, MIT, Stanford, Carnegie Mellon and more top institutions.',
  openGraph: {
    title: 'Top Universities & CS Programs - CS61B & Beyond',
    description:
      'Discover the best computer science programs from leading universities worldwide. Compare courses, faculty, and learning resources.'
  },
  twitter: {
    title: 'Top Universities & CS Programs',
    description: 'Directory of world-class CS programs and open courses'
  }
}

export default async function LocaleUniversitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const tHome = await getTranslations({ locale, namespace: 'home' })

  const stats = [
    { label: locale === 'zh' ? '入选大学' : 'Universities', value: universities.length },
    { label: locale === 'zh' ? '免费课程' : 'Free Courses', value: universities.reduce((sum, u) => sum + u.courses, 0) },
    { label: locale === 'zh' ? '覆盖地区' : 'Regions', value: 4 }
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">{tHome('universities.title')}</h1>
              <p className="text-lg text-white/70 max-w-3xl mx-auto">{tHome('universities.subtitle')}</p>
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
              {universities.map((university, index) => {
                const Icon = iconMap[university.icon]
                return (
                  <div key={university.name} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl">
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
                    <div className="mt-6 flex items-center justify-between text-sm text-white/60">
                      <span>
                        {university.courses} {locale === 'zh' ? '门课程' : 'Courses'}
                      </span>
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60"
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
                  href={`/${locale}/courses`}
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
