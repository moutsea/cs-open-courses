import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import Link from 'next/link'
import { Metadata } from 'next'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { getTutorialSections, TutorialIcon } from '@/components/TutorialContent'
import { getTranslations } from 'next-intl/server'
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo'
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
import TutorialTopicCard from '@/components/TutorialTopicCard'

const sectionIconMap: Record<TutorialIcon, (props: { className?: string }) => JSX.Element> = {
  tools: ToolsIcon,
  math: MathIcon,
  code: CodeIcon,
  systems: SystemsIcon,
  theory: TheoryIcon,
  ai: AiIcon,
  rocket: RocketIcon
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  const title = isZh ? '计算机科学学习路径' : 'CS Learning Path from CS61A to CS61B'
  const description = isZh
    ? '从 CS61A 入门到伯克利 CS61B、系统、算法与 AI，逐阶段列出工具、数学与项目，帮助零基础学习者稳步进阶。'
    : 'Follow a guided roadmap from CS61A fundamentals through Berkeley CS61B, systems, algorithms, and AI with tools, math, and project checkpoints for beginners.'
  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: pageAlternates(locale, '/tutorial'),
    openGraph: {
      title,
      description: isZh
        ? '完整 CS 学习路径：CS61A、CS61B、系统、算法与 AI，含工具与项目建议。'
        : 'Complete CS path from CS61A to CS61B, systems, algorithms, and AI with tool and project tips.',
      url: absoluteUrl(localizedPath(locale, '/tutorial')),
      siteName: SITE_NAME,
      type: 'website',
      locale: isZh ? 'zh_CN' : 'en_US',
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
        url: absoluteUrl(localizedPath(locale, '/tutorial')),
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
          url: absoluteUrl('/'),
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
            item: absoluteUrl(localizedPath(locale))
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: locale === 'zh' ? '学习路径' : 'Learning Path',
            item: absoluteUrl(localizedPath(locale, '/tutorial'))
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

        <ImmersiveSection className="py-16 text-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  {locale === 'zh' ? '学习路线' : 'Learning Roadmap'}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white">
                  {t('title')}
                </h1>
                <p className="text-lg text-white/70 max-w-2xl">{t('subtitle')}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl">
                    <div className="text-3xl font-bold text-white">{sections.length}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">{t('stages')}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl">
                    <div className="text-3xl font-bold text-white">{totalTopics}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                      {locale === 'zh' ? '课程主题' : 'Topics'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl">
                    <div className="text-3xl font-bold text-white">{advancedTopics}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                      {locale === 'zh' ? '进阶内容' : 'Advanced Lessons'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={localizedPath(locale, '/courses')}
                    className="inline-flex items-center gap-3 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    {locale === 'zh' ? '探索课程' : 'Explore courses'}
                  </Link>
                  <Link
                    href={`${localizedPath(locale, '/tutorial')}#learning-path`}
                    className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    {locale === 'zh' ? '路线概览' : 'View roadmap'}
                  </Link>
                  <Link
                    href={localizedPath(locale, '/course/data-structures-algorithms/CS61B')}
                    className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    {locale === 'zh' ? '转到 CS61B 专区' : 'Jump to CS61B Hub'}
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-white mb-4">{t('how_to_start')}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{t('how_to_start_desc')}</p>
                <div className="mt-6 space-y-4">
                  {timelineCards.map(({ title, description, Icon }) => (
                    <div
                      key={title}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                        <Icon />
                      </span>
                      <div>
                        <div className="font-semibold text-white">{title}</div>
                        <p className="text-sm text-white/55">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="learning-path" className="space-y-12">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45 mb-3">
                  {locale === 'zh' ? '循序渐进' : 'Step-by-step'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">{t('sequence_title')}</h2>
                <p className="text-white/70 max-w-3xl mx-auto">{t('sequence_subtitle')}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sections.map((section, index) => {
                  const IconComponent = sectionIconMap[section.icon]
                  return (
                    <Link
                      key={section.title}
                      href={`${localizedPath(locale, '/tutorial')}#stage-${index + 1}`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10"
                    >
                      <span className="mb-3 inline-flex items-center justify-center rounded-xl bg-cyan-400/15 p-2 text-cyan-200">
                        <IconComponent />
                      </span>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/45 mb-2">
                        {locale === 'zh' ? '阶段' : 'Stage'} {index + 1}
                      </p>
                      <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                      <p className="text-sm text-white/55">{section.description}</p>
                    </Link>
                  )
                })}
              </div>

              <div className="space-y-10">
                {sections.map((section, index) => {
                  const IconComponent = sectionIconMap[section.icon]
                  return (
                    <div
                      key={section.title}
                      id={`stage-${index + 1}`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 text-white backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-3">
                            <span className="flex items-center justify-center rounded-2xl bg-cyan-400/15 p-2 text-cyan-200">
                              <IconComponent />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                                {locale === 'zh' ? '阶段' : 'Stage'} {index + 1}
                              </p>
                              <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                            </div>
                          </div>
                          <p className="mt-4 text-white/70 max-w-2xl">{section.description}</p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/55">
                          {section.topics.length} {locale === 'zh' ? '个主题' : 'topics'}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {section.topics.map(topic => (
                          <TutorialTopicCard
                            key={topic.name}
                            topic={topic}
                            locale={locale}
                                                      />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                {t('ready_to_start')}
              </p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-white">{t('ready_to_start_desc')}</h2>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href={localizedPath(locale, '/courses')}
                  className="inline-flex items-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  {t('browse_courses')}
                </Link>
                <Link
                  href={localizedPath(locale, '/tutorial')}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
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
