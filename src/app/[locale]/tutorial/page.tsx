import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import Link from 'next/link'
import { Metadata } from 'next'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { getTutorialSections, TutorialIcon } from '@/components/TutorialContent'
import { getTranslations } from 'next-intl/server'
import {
  AiIcon,
  BookIcon,
  CodeIcon,
  MathIcon,
  RocketIcon,
  SystemsIcon,
  TargetIcon,
  TheoryIcon,
  ToolsIcon
} from '@/components/icons/TutorialIcons'
import { JSX } from 'react'

const sectionIconMap: Record<TutorialIcon, (props: { className?: string }) => JSX.Element> = {
  tools: ToolsIcon,
  math: MathIcon,
  code: CodeIcon,
  systems: SystemsIcon,
  theory: TheoryIcon,
  ai: AiIcon,
  rocket: RocketIcon
}

export const metadata: Metadata = {
  title: 'CS Learning Path for Beginners',
  description: "Complete beginner's guide to computer science learning. Step-by-step roadmap from CS61A basics to advanced topics like algorithms, machine learning, and systems programming.",
  openGraph: {
    title: 'CS Learning Path for Beginners - CS61B & Beyond',
    description: 'Start your computer science journey with our curated learning paths. From Python basics to advanced CS topics, designed for complete beginners.'
  },
  twitter: {
    title: 'CS Learning Path for Beginners',
    description: 'Complete roadmap to learn computer science from scratch'
  }
}

export default async function TutorialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tutorial' })
  const sections = getTutorialSections(locale)

  const totalTopics = sections.reduce((sum, section) => sum + section.topics.length, 0)
  const advancedTopics = sections.reduce(
    (sum, section) => sum + section.topics.filter(topic => topic.level === 'Advanced').length,
    0
  )

  const tutorialStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: locale === 'zh' ? '计算机科学学习路径' : 'CS Learning Path for Beginners',
        description:
          locale === 'zh'
            ? '完整的计算机科学初学者指南。从CS61A基础知识到算法、机器学习和系统编程等高级主题的分步路线图。'
            : "Complete beginner's guide to computer science learning. Step-by-step roadmap from CS61A basics to advanced topics like algorithms, machine learning, and systems programming.",
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/tutorial`,
        inLanguage: locale === 'zh' ? 'zh-CN' : 'en-US',
        educationalLevel: 'Beginner',
        learningResourceType: 'Learning Path',
        teaches: [
          'Computer Science Fundamentals',
          'Programming',
          'Data Structures',
          'Algorithms',
          'Machine Learning',
          'Computer Systems',
          'Operating Systems',
          'Computer Networks'
        ],
        provider: {
          '@type': 'EducationalOrganization',
          name: 'CS61B & Beyond',
          url: process.env.NEXT_PUBLIC_SITE_URL!,
          description: 'Free computer science courses from top universities'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: process.env.NEXT_PUBLIC_SITE_URL!
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: locale === 'zh' ? '学习路径' : 'Learning Path',
            item: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/tutorial`
          }
        ]
      }
    ]
  }

  const timelineCards = [
    { title: t('start_basic'), description: t('start_basic_desc'), Icon: TargetIcon },
    { title: t('progress_gradually'), description: t('progress_gradually_desc'), Icon: BookIcon },
    { title: t('practice_oriented'), description: t('practice_oriented_desc'), Icon: RocketIcon }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <ImmersivePage>
        <StructuredData data={tutorialStructuredData} />

        <ImmersiveSection className="py-20 text-white">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  {locale === 'zh' ? '学习路线' : 'Learning Roadmap'}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
                  {t('title')}
                </h1>
                <p className="text-lg text-white/70 max-w-2xl">{t('subtitle')}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/15 bg-white/5 p-5 text-center">
                    <div className="text-3xl font-bold text-white">{sections.length}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('stages')}</p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/5 p-5 text-center">
                    <div className="text-3xl font-bold text-white">{totalTopics}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {locale === 'zh' ? '课程主题' : 'Topics'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/5 p-5 text-center">
                    <div className="text-3xl font-bold text-white">{advancedTopics}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {locale === 'zh' ? '进阶内容' : 'Advanced Lessons'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/${locale}/courses`}
                    className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
                  >
                    {locale === 'zh' ? '探索课程' : 'Explore courses'}
                  </Link>
                  <Link
                    href={`/${locale}/tutorial#learning-path`}
                    className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/70 hover:text-white"
                  >
                    {locale === 'zh' ? '路线概览' : 'View roadmap'}
                  </Link>
                  <Link
                    href={`/${locale}/course/data-structures-algorithms/CS61B`}
                    className="inline-flex items-center gap-3 rounded-full border border-blue-100/40 px-6 py-3 text-sm font-semibold text-blue-100 transition hover:border-white hover:text-white"
                  >
                    {locale === 'zh' ? '转到 CS61B 专区' : 'Jump to CS61B Hub'}
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-4">{t('how_to_start')}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{t('how_to_start_desc')}</p>
                <div className="mt-6 space-y-4">
                  {timelineCards.map(({ title, description, Icon }) => (
                    <div
                      key={title}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <Icon className="h-10 w-10 text-white" />
                      <div>
                        <div className="font-semibold text-white">{title}</div>
                        <p className="text-sm text-white/60">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="py-16 text-white" id="learning-path">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50 mb-3">
                {locale === 'zh' ? '循序渐进' : 'Step-by-step'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('sequence_title')}</h2>
              <p className="text-white/70 max-w-3xl mx-auto">{t('sequence_subtitle')}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map((section, index) => {
                const IconComponent = sectionIconMap[section.icon]
                return (
                  <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <IconComponent className="mb-3 h-10 w-10 text-white" />
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">
                      {locale === 'zh' ? '阶段' : 'Stage'} {index + 1}
                    </p>
                    <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                    <p className="text-sm text-white/60">{section.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="py-16">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {sections.map((section, index) => {
              const IconComponent = sectionIconMap[section.icon]
              return (
                <div
                  key={section.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-3">
                        <IconComponent className="h-12 w-12 text-white" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                            {locale === 'zh' ? '阶段' : 'Stage'} {index + 1}
                          </p>
                          <h3 className="text-2xl font-bold">{section.title}</h3>
                        </div>
                      </div>
                      <p className="mt-4 text-white/70 max-w-2xl">{section.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
                      {section.topics.length} {locale === 'zh' ? '个主题' : 'topics'}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {section.topics.map(topic => (
                      <div
                        key={topic.name}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-white/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{topic.name}</h4>
                            <p className="text-sm text-white/60">{topic.description}</p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                            {topic.level}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                          <span>{topic.duration}</span>
                          <span>{locale === 'zh' ? '自定进度' : 'Self-paced'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="py-16 text-white">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 p-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                {t('ready_to_start')}
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white">{t('ready_to_start_desc')}</h2>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
                >
                  {t('browse_courses')}
                </Link>
                <Link
                  href={`/${locale}/tutorial`}
                  className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/70 hover:text-white"
                >
                  {locale === 'zh' ? '返回顶部' : 'Back to top'}
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
