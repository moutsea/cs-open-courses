import { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PopularCourses from '@/components/PopularCourses'
import LearningPathFlow from '@/components/LearningPathFlow'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import Link from 'next/link'
import {
  BadgeDollarSign,
  BookOpen,
  Building2,
  Clock3,
  Crosshair,
  GraduationCap,
  Landmark,
  Lightbulb,
  Palette,
  Rocket,
  Sparkles,
  Target,
  FlaskConical,
  Layers
} from 'lucide-react'
import './hero-animations.css'

const universities = [
  { name: "MIT", Icon: Building2 },
  { name: "Stanford", Icon: Target },
  { name: "Harvard", Icon: BookOpen },
  { name: "Berkeley", Icon: Landmark },
  { name: "CMU", Icon: Palette },
  { name: "Princeton", Icon: FlaskConical }
]

// Real university count based on actual document analysis
const TOTAL_UNIVERSITIES = 26

// Popular courses data
const POPULAR_COURSES = [
  {
    id: 'programming-introduction-python-cs61a',
    title: 'CS61A: Structure and Interpretation of Computer Programs',
    description: '伯克利CS系列入门课，强调程序抽象和原理，最终实现Scheme解释器',
    descriptionEn: 'First course in Berkeley CS61 series, emphasizes abstraction and program construction principles',
    difficultyEn: 'Intermediate',
    duration: '50 小时',
    durationEn: '50 hours',
    programmingLanguage: 'Python, Scheme, SQL',
    slug: 'CS61A',
    path: '/programming-introduction/python/CS61A',
    categorySlug: 'programming-introduction',
    subcategorySlug: 'python'
  },
  {
    id: 'data-structures-algorithms-cs61b',
    title: 'CS61B: Data Structures and Algorithms',
    description: '数据结构与算法，14个Lab + 10个Homework + 3个Project，接触千行级工程代码',
    descriptionEn: 'Data structures and algorithms with 14 Labs, 10 Homework, and 3 Projects',
    difficultyEn: 'Intermediate',
    duration: '60 小时',
    durationEn: '60 hours',
    programmingLanguage: 'Java',
    slug: 'CS61B',
    path: '/data-structures-algorithms/CS61B',
    categorySlug: 'data-structures-algorithms'
  },
  {
    id: 'machine-learning-cs189',
    title: 'CS189: Introduction to Machine Learning',
    description: '理论深入的机器学习入门课，开源所有homework代码和autograder',
    descriptionEn: 'Theoretical machine learning course with open source homework and autograder',
    difficultyEn: 'Advanced',
    duration: '100 小时',
    durationEn: '100 hours',
    programmingLanguage: 'Python',
    slug: 'CS189',
    path: '/machine-learning/CS189',
    categorySlug: 'machine-learning'
  },
  {
    id: 'computer-graphics-games101',
    title: 'GAMES101: 现代计算机图形学入门',
    titleEn: 'GAMES101: Introduction to Modern Computer Graphics',
    description: '国内知名图形学公开课，涵盖光栅化、几何表示、光线传播、动画模拟',
    descriptionEn: 'Popular graphics course covering rasterization, geometry, light transport, and animation',
    difficultyEn: 'Intermediate',
    duration: '80 小时',
    durationEn: '80 hours',
    programmingLanguage: 'C++',
    slug: 'GAMES101',
    path: '/computer-graphics/GAMES101',
    categorySlug: 'computer-graphics'
  },
  {
    id: 'deep-learning-cs224n',
    title: 'CS224n: Natural Language Processing',
    description: 'Chris Manning教授的NLP经典课程，覆盖词向量到Transformer的完整知识体系',
    descriptionEn: 'Classic NLP course by Chris Manning covering word vectors to Transformers',
    difficultyEn: 'Advanced',
    duration: '80 小时',
    durationEn: '80 hours',
    programmingLanguage: 'Python',
    slug: 'CS224n',
    path: '/deep-learning/CS224n',
    categorySlug: 'deep-learning'
  },
  {
    id: 'parallel-distributed-systems-mit6824',
    title: 'MIT6.824: Distributed System',
    description: 'MIT PDOS实验室出品，基于论文精读的分布式系统课程，4个高难度Project',
    descriptionEn: 'MIT PDOS Lab distributed systems course with paper reading and challenging projects',
    difficultyEn: 'Expert',
    duration: '200 小时',
    durationEn: '200 hours',
    programmingLanguage: 'Go',
    slug: 'MIT6.824',
    path: '/parallel-distributed-systems/MIT6.824',
    categorySlug: 'parallel-distributed-systems'
  }
]

function renderSharedSection(content: ReactNode, className = '') {
  return (
    <ImmersiveSection className={className}>
      {content}
    </ImmersiveSection>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs61bbeyond.com'
  const isZh = locale === 'zh'
  const title = isZh
    ? 'CS61B & Beyond - 伯克利 CS61B 在线课程与学习指南'
    : 'CS61B & Beyond | Berkeley CS61B Online Course Hub'
  const description = isZh
    ? '深入掌握伯克利 CS61B 数据结构与算法课程，获取项目资料、实验指导与学习路径。'
    : 'Master Berkeley CS61B data structures & algorithms with labs, projects, and guided study paths.'

  return {
    title,
    description,
    keywords: [
      'cs61b',
      'cs61b berkeley',
      'cs61b online course',
      'uc berkeley data structures',
      'cs61b labs',
      'cs61b projects',
      'cs61b beyond',
      'cs61a',
      'cs61c'
    ],
    alternates: {
      canonical: isZh ? `${baseUrl}/zh` : `${baseUrl}/`,
      languages: {
        en: `${baseUrl}/`,
        zh: `${baseUrl}/zh`
      }
    },
    openGraph: {
      title,
      description,
      url: isZh ? `${baseUrl}/zh` : `${baseUrl}/`,
      siteName: 'CS61B & Beyond'
    },
    twitter: {
      title,
      description
    }
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Use real document counts for both languages
  const totalCourses = locale === 'zh' ? 130 : 128 // Real document counts: Chinese 130, English 128
  const totalCategories = 26 // Same category structure for both languages

  // Load translations
  const tHome = await getTranslations({ locale, namespace: 'home' })
  const tTutorial = await getTranslations({ locale, namespace: 'tutorial' })

  // Prepare popular courses data based on locale
  const popularCourses = POPULAR_COURSES.map(course => ({
    id: course.id,
    title: locale === 'zh' ? course.title : (course.titleEn || course.title),
    description: locale === 'zh' ? course.description : course.descriptionEn,
    summary: locale === 'zh' ? course.description : course.descriptionEn,
    difficulty: course.difficultyEn,
    duration: locale === 'zh' ? course.duration : course.durationEn,
    programmingLanguage: course.programmingLanguage,
    hasEnglishVersion: true,
    content: course.description,
    contentEn: course.descriptionEn,
    path: course.path.replace(/^\//, ''), // Remove leading slash
    slug: course.slug
  }))

  const features = [
    {
      title: tHome('features.universityQuality.title'),
      description: tHome('features.universityQuality.description'),
      Icon: GraduationCap
    },
    {
      title: tHome('features.comprehensiveCoverage.title'),
      description: tHome('features.comprehensiveCoverage.description'),
      Icon: Layers
    },
    {
      title: tHome('features.completelyFree.title'),
      description: tHome('features.completelyFree.description'),
      Icon: BadgeDollarSign
    },
    {
      title: tHome('features.selfPaced.title'),
      description: tHome('features.selfPaced.description'),
      Icon: Clock3
    }
  ]

  const highlightPills = [
    { zh: '目标导向学习', en: 'Goal-Oriented Learning', Icon: Crosshair },
    { zh: '快速技能提升', en: 'Rapid Skill Development', Icon: Rocket },
    { zh: '专家认可', en: 'Expert Recognition', Icon: Sparkles },
    { zh: '创新教学方法', en: 'Innovative Teaching Methods', Icon: Lightbulb }
  ]

  const cs61bHighlights = locale === 'zh'
    ? [
        '完整涵盖 Java、ADT、图、堆、红黑树等核心数据结构',
        '实验与 Project 全部开源，含 Gitlet、世界地图等经典项目',
        '配套学习路径：先修 CS61A，进阶 CS61C、CS170'
      ]
    : [
        'Covers Java, ADTs, graphs, heaps, red-black trees, and testing',
        'Open-source labs & projects including Gitlet and World Maps',
        'Guided pathway: finish CS61A first, then move into CS61C / CS170'
      ]

  const cs61bStats = [
    {
      label: locale === 'zh' ? '项目' : 'Projects',
      value: '4',
      helper: locale === 'zh' ? 'Gitlet、世界地图、BearMaps 等' : 'Gitlet, World Maps, BearMaps'
    },
    {
      label: locale === 'zh' ? '实验 & 作业' : 'Labs & HW',
      value: '20+',
      helper: locale === 'zh' ? '覆盖链表、树、图、排序等' : 'Linked lists, trees, graphs, sorting'
    },
    {
      label: locale === 'zh' ? '推荐先修' : 'Prerequisite',
      value: 'CS61A',
      helper: locale === 'zh' ? '熟悉 Python/Java 编程基础' : 'Solid Python/Java fundamentals'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <ImmersivePage>
          {renderSharedSection(
            (
              <div className="relative min-h-[90vh] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
                <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
              </div>

              <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
                  {/* Left Content */}
                  <div className="text-center lg:text-left space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      {locale === 'zh' ? '全新学习体验' : 'New Learning Experience'}
                    </div>

                    {/* Main Title */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                      <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {tHome('hero.title').split(' ')[0]}
                      </span>
                      <br />
                      <span className="text-white">
                        {tHome('hero.title').split(' ').slice(1).join(' ')}
                      </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-blue-200 font-light max-w-2xl">
                      {tHome('hero.subtitle')}
                    </p>

                    {/* Description */}
                    <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                      {tHome('hero.description')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Link
                        href={`/${locale}/courses`}
                        className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-white via-white to-blue-50 text-blue-600 font-extrabold text-xl rounded-3xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/20 border-2 border-white/50 hover:border-blue-200/50 backdrop-blur-sm overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {tHome('hero.cta')}
                          </span>
                          <svg className="w-6 h-6 ml-3 text-blue-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>

                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-indigo-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                      </Link>

                      <Link
                        href={`/${locale}/course/data-structures-algorithms/CS61B`}
                        className="group relative inline-flex items-center px-10 py-5 bg-transparent border-2 border-white/40 text-white font-bold text-lg rounded-2xl hover:bg-white/10 hover:border-white/60 transition-all duration-500 transform hover:scale-105 shadow-lg hover:shadow-2xl overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {locale === 'zh' ? '立即开始 CS61B' : 'Start CS61B Now'}
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      </Link>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-6 pt-6">
                      <span className="text-sm text-gray-400">{locale === 'zh' ? '关注我们' : 'Follow us'}</span>
                      <div className="flex gap-3">
                        <Link
                          href="https://github.com/moutsea?tab=repositories"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 group border border-white/20"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </Link>

                        <Link
                          href="mailto:cfjwlchangji@gmail.com"
                          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 group border border-white/20"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right Content - Visual Elements */}
                  <div className="relative hidden lg:block">
                    <div className="relative">
                      {/* Floating Cards */}
                      <div className="absolute top-8 -left-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-48 animate-float">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">CS</div>
                            <div>
                              <div className="text-sm font-semibold">{locale === 'zh' ? '数据结构' : 'Data Structures'}</div>
                              <div className="text-xs text-gray-300">{locale === 'zh' ? '基础课程' : 'Foundation'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-300">{locale === 'zh' ? '难度' : 'Level'}</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-32 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-48 animate-float-delayed">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">ML</div>
                            <div>
                              <div className="text-sm font-semibold">{locale === 'zh' ? '机器学习' : 'Machine Learning'}</div>
                              <div className="text-xs text-gray-300">{locale === 'zh' ? '高级课程' : 'Advanced'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-300">{locale === 'zh' ? '难度' : 'Level'}</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-8 -left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-48 animate-float">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">AI</div>
                            <div>
                              <div className="text-sm font-semibold">{locale === 'zh' ? '人工智能' : 'Artificial Intelligence'}</div>
                              <div className="text-xs text-gray-300">{locale === 'zh' ? '前沿领域' : 'Cutting-edge'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-300">{locale === 'zh' ? '难度' : 'Level'}</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        {/* Central Glow */}
                        <div className="w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
            'text-white'
          )}

          {renderSharedSection(
            (
              <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {locale === 'zh' ? '学习平台数据' : 'Platform Statistics'}
                </h2>
                <p className="text-lg text-blue-100/80 max-w-2xl mx-auto">
                  {locale === 'zh' ? '我们为全球学习者提供优质的计算机科学教育资源' : 'Providing quality computer science education for learners worldwide'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Courses Stat */}
                <Link
                  href={`/${locale}/courses`}
                  className="group relative bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border border-white/40 hover:border-blue-200 hover:-translate-y-1.5"
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-blue-100/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>

                    {/* Number */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-5xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {totalCourses}
                      </span>
                      <span className="text-2xl font-semibold text-blue-600">+</span>
                    </div>

                    {/* Label */}
                    <div className="text-lg font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      {tHome('stats.courses')}
                    </div>

                    {/* Description */}
                    <div className="mt-3 text-sm text-gray-500">
                      {locale === 'zh' ? '涵盖各个领域' : 'Covering all fields'}
                    </div>
                  </div>
                </Link>

                {/* Categories Stat */}
                <Link
                  href={`/${locale}/courses`}
                  className="group relative bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border border-white/40 hover:border-purple-200 hover:-translate-y-1.5"
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 to-purple-100/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>

                    {/* Number */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-5xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {totalCategories}
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-lg font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      {tHome('stats.subjects')}
                    </div>

                    {/* Description */}
                    <div className="mt-3 text-sm text-gray-500">
                      {locale === 'zh' ? '专业分类体系' : 'Professional categories'}
                    </div>
                  </div>
                </Link>

                {/* Universities Stat */}
                <Link
                  href={`/${locale}/universities`}
                  className="group relative bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border border-white/40 hover:border-green-200 hover:-translate-y-1.5"
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/90 to-green-100/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    {/* Number */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-5xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {TOTAL_UNIVERSITIES}
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-lg font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      {tHome('stats.universities')}
                    </div>

                    {/* Description */}
                    <div className="mt-3 text-sm text-gray-500">
                      {locale === 'zh' ? '全球顶尖院校' : 'Top global universities'}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Bottom CTA */}
              <div className="text-center mt-12">
                <Link
                  href={`/${locale}/courses`}
                  className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-white via-white to-blue-50 text-blue-600 font-extrabold text-xl rounded-3xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/20 border-2 border-white/50 hover:border-blue-200/50 backdrop-blur-sm overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {locale === 'zh' ? '开始学习' : 'Start Learning'}
                    </span>
                    <svg className="w-6 h-6 ml-3 text-blue-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-indigo-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </Link>
              </div>
              </div>
            ),
            'pt-32 pb-28 text-white'
          )}

          {/* Tutorial Section - Perfect Flow */}
          {renderSharedSection(
            (
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {tTutorial('title').split(' ')[0]}
                  </span>
                  <br />
                  <span className="text-white/90">
                    {tTutorial('title').split(' ').slice(1).join(' ')}
                  </span>
                </h2>
                <p className="text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
                  {tTutorial('subtitle')}
                </p>
              </div>

              {/* Learning Path Container */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-16 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M0 15h30v1H0zM0 0h1v30H0zM14 0h1v30h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>

                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-white mb-3">
                      {locale === 'zh' ? '学习路径' : 'Learning Path'}
                    </h3>
                    <p className="text-blue-100/80 max-w-2xl mx-auto text-lg">
                      {locale === 'zh' ? '从基础到进阶，循序渐进地掌握计算机科学核心知识' : 'Master computer science fundamentals step by step'}
                    </p>
                  </div>

                  <div className="py-8 px-4">
                    <LearningPathFlow
                      steps={[
                        {
                          title: tTutorial('sections.essential_tools.title'),
                        },
                        {
                          title: tTutorial('sections.mathematical_foundations.title'),
                        },
                        {
                          title: tTutorial('sections.programming_fundamentals.title'),
                        },
                        {
                          title: tTutorial('sections.computer_systems.title'),
                        },
                        {
                          title: tTutorial('sections.algorithms_theory.title'),
                        },
                        {
                          title: tTutorial('sections.machine_learning_ai.title'),
                        },
                        {
                          title: tTutorial('sections.specialized_topics.title'),
                        }
                      ]}
                    />
                  </div>
                </div>

                {/* CTA Section */}
                <div className="mt-12 text-center">
                  <div className="mb-6">
                    <p className="text-blue-100/80 mb-4">
                      {locale === 'zh' ? '准备好开始你的学习之旅了吗？' : 'Ready to start your learning journey?'}
                    </p>
                    <Link
                      href={`/${locale}/tutorial`}
                      className="group relative inline-flex items-center gap-3 px-12 py-6 bg-white text-indigo-600 font-extrabold text-xl rounded-3xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-indigo-500/30 border-2 border-white/70 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center">
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {locale === 'zh' ? '开始学习' : 'Start Learning'}
                        </span>
                        <svg className="w-6 h-6 ml-3 text-indigo-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>

                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Link>
                  </div>

                  {/* Alternative CTA for minimal design */}
                  <div className="flex justify-center">
                    <Link
                      href={`/${locale}/tutorial`}
                      className="group relative inline-flex items-center justify-center w-16 h-16 bg-white/10 border-2 border-white/20 text-white rounded-full hover:bg-white hover:text-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    >
                      <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="mt-12 flex flex-wrap justify-center gap-3">
                <div className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-full text-sm font-medium">
                  {locale === 'zh' ? '循序渐进' : 'Step-by-Step'}
                </div>
                <div className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-full text-sm font-medium">
                  {locale === 'zh' ? '实践导向' : 'Practice-Oriented'}
                </div>
                <div className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-full text-sm font-medium">
                  {locale === 'zh' ? '完全免费' : 'Completely Free'}
                </div>
                <div className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-full text-sm font-medium">
                  {locale === 'zh' ? '社区支持' : 'Community Support'}
                </div>
              </div>
              </div>
            ),
            'py-24 text-white'
          )}

          {renderSharedSection(
            (
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-center">
                  <div className="space-y-6 text-white">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-300"></span>
                      {locale === 'zh' ? '伯克利 CS61B 指南' : 'Berkeley CS61B Guide'}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                      {locale === 'zh'
                        ? '掌握 CS61B：数据结构与工程化项目'
                        : 'Own CS61B with data structures + production projects'}
                    </h2>
                    <p className="text-white/70 text-lg leading-relaxed">
                      {locale === 'zh'
                        ? '从实验、Project 到复习资料，我们整理了 CS61B 的全部资源、先修路径与学习建议，帮助你在线完成整门课程。'
                        : 'We organize every CS61B lab, project, and study note—plus prerequisites and pacing—so you can complete Berkeley’s data structures class entirely online.'}
                    </p>
                    <ul className="space-y-3">
                      {cs61bHighlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-white/80">
                          <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/${locale}/course/data-structures-algorithms/CS61B`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
                      >
                        {locale === 'zh' ? '查看 CS61B 课程' : 'Open CS61B Course'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                      <Link
                        href={`/${locale}/tutorial`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
                      >
                        {locale === 'zh' ? '查看学习路径' : 'View Learning Path'}
                      </Link>
                    </div>
                  </div>
                  <div className="rounded-[32px] border border-white/15 bg-white/5 p-6 backdrop-blur-xl shadow-[0_25px_80px_rgba(2,6,23,0.4)] text-white space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                        CS61B {locale === 'zh' ? '关键指标' : 'Key Stats'}
                      </p>
                      <h3 className="text-2xl font-semibold mt-2">
                        {locale === 'zh' ? '项目驱动的数据结构修炼' : 'Project-first data structures training'}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {cs61bStats.map(stat => (
                        <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                          <div className="text-3xl font-bold text-white">{stat.value}</div>
                          <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
                          <p className="text-sm text-white/70 mt-1">{stat.helper}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-blue-200/30 bg-blue-200/10 p-4 text-sm text-blue-100">
                      {locale === 'zh'
                        ? '需要帮助？我们整理了实验环境搭建、评分标准、往年考点与复习节奏，助你更快完成 CS61B。'
                        : 'Need support? We curate lab setup notes, grading policies, past exams, and pacing tips to keep you on track.'}
                    </div>
                  </div>
                </div>
              </div>
            ),
            'py-20 text-white'
          )}

          {/* Popular Courses Section */}
          {renderSharedSection(
            (
              <PopularCourses courses={popularCourses} locale={locale} />
            ),
            'py-0 text-white'
          )}

          {/* Universities Section */}
          {renderSharedSection(
            (
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-full mb-6 text-white/90 text-sm font-semibold">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                  <span>Top Universities</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  {tHome('universities.title')}
                </h2>

                <p className="text-xl text-blue-100/80 max-w-4xl mx-auto leading-relaxed">
                  {tHome('universities.subtitle')}
                </p>
              </div>

              {/* Universities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {universities.map((university, index) => (
                  <div
                    key={index}
                    className="group relative"
                  >
                    {/* University Card */}
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border border-white/50 hover:border-indigo-200/50 overflow-hidden">
                      {/* Background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Number Badge */}
                      <div className="absolute top-6 right-6 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div>

                      <div className="relative">
                        {/* University Icon */}
                        <div className="mb-6">
                          {(() => {
                            const UniversityIcon = university.Icon
                            return (
                              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                                <UniversityIcon className="w-10 h-10 text-indigo-600" aria-hidden="true" />
                              </div>
                            )
                          })()}
                        </div>

                        {/* University Name */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
                          {university.name}
                        </h3>

                        {/* Description placeholder */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                          {locale === 'zh'
                            ? `${university.name} 是全球顶尖的计算机科学教育和研究机构，培养了无数优秀的科技人才。`
                            : `${university.name} is a world-leading institution for computer science education and research, nurturing countless talented tech professionals.`
                          }
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">{15 + index * 2}</div>
                            <div className="text-xs text-gray-500">{locale === 'zh' ? '课程' : 'Courses'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{8 + index}</div>
                            <div className="text-xs text-gray-500">{locale === 'zh' ? '教授' : 'Professors'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-pink-600">{2000 + index * 500}</div>
                            <div className="text-xs text-gray-500">{locale === 'zh' ? '学生' : 'Students'}</div>
                          </div>
                        </div>

                        {/* Explore Button */}
                        <Link
                          href={`/${locale}/universities`}
                          className="group/btn inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-300 font-semibold"
                        >
                          <span>{tHome('universities.learnMore')}</span>
                          <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Explore All Universities Button */}
              <div className="text-center mt-16">
                <Link
                  href={`/${locale}/universities`}
                  className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-white via-white to-indigo-50 text-indigo-600 font-extrabold text-xl rounded-3xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl hover:shadow-indigo-500/20 border-2 border-white/50 hover:border-indigo-200/50 backdrop-blur-sm overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {locale === 'zh' ? '探索所有大学' : 'Explore All Universities'}
                    </span>
                    <svg className="w-6 h-6 ml-3 text-indigo-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </Link>
              </div>
              </div>
            ),
            'py-20 text-white'
          )}

          {/* Features & CTA Section */}
          {renderSharedSection(
            (
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              <div>
                <div className="text-center mb-14">
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm font-semibold uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>{locale === 'zh' ? '选择我们的理由' : 'Why Choose Us'}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    Why Choose CS Study Hub?
                  </h2>
                  <p className="text-lg md:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
                    {tHome('hero.description')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {features.map((feature, index) => {
                    const FeatureIcon = feature.Icon
                    return (
                      <div key={index} className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                        <div className="mb-6 flex justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FeatureIcon className="w-8 h-8 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-blue-100/80 leading-relaxed mb-6">
                          {feature.description}
                        </p>
                        <Link
                          href={`/${locale}/courses`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/15"
                        >
                          <span>{locale === 'zh' ? '了解更多' : 'Learn More'}</span>
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-3">
                  {highlightPills.map((pill, idx) => {
                    const PillIcon = pill.Icon
                    return (
                      <div key={idx} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm font-semibold backdrop-blur">
                        <PillIcon className="w-4 h-4" aria-hidden="true" />
                        <span>{locale === 'zh' ? pill.zh : pill.en}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-8 md:px-10 md:py-10 backdrop-blur-xl shadow-2xl">
                <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-center">
                  <div>
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs uppercase tracking-[0.2em] text-blue-100 mb-6">
                      {locale === 'zh' ? '开始你的旅程' : 'Start Your Journey'}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                      {tHome('cta.title')}
                    </h2>
                    <p className="text-base md:text-lg text-blue-100/90 leading-relaxed">
                      {tHome('cta.subtitle')}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-blue-100/80">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        {locale === 'zh' ? '即时加入' : 'Instant Access'}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
                        {locale === 'zh' ? '100% 免费' : '100% Free'}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-pink-300"></span>
                        {locale === 'zh' ? '社区支持' : 'Community Support'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-blue-100/80 mb-2">
                        {locale === 'zh' ? '下一步' : 'Next Step'}
                      </p>
                      <Link
                        href={`/${locale}/courses`}
                        className="group relative inline-flex items-center justify-between w-full gap-3 px-6 py-4 bg-white text-blue-700 font-extrabold rounded-2xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5"
                      >
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {tHome('cta.button')}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-xs text-blue-100/80">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">24/7</div>
                        <p>{locale === 'zh' ? '支持' : 'Support'}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">100%</div>
                        <p>{locale === 'zh' ? '免费' : 'Free'}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">5k+</div>
                        <p>{locale === 'zh' ? '学习者' : 'Learners'}</p>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
              </div>
            ),
            'py-20 text-white'
          )}
      </ImmersivePage>
      <Footer locale={locale} />
    </div>
  )
}
