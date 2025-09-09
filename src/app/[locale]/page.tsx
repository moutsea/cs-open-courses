import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PopularCourses from '@/components/PopularCourses'
import LearningPathFlow from '@/components/LearningPathFlow'
import Link from 'next/link'
// import { buildCourseStructure } from '@/lib/courseParser'
import enMessages from '../../../messages/en.json'
import zhMessages from '../../../messages/zh.json'

const universities = [
  { name: "MIT", icon: "🏛️" },
  { name: "Stanford", icon: "🎯" },
  { name: "Harvard", icon: "📖" },
  { name: "Berkeley", icon: "🌉" },
  { name: "CMU", icon: "🎨" },
  { name: "Princeton", icon: "🔬" }
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
    difficulty: '🌟🌟🌟',
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
    difficulty: '🌟🌟🌟',
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
    difficulty: '🌟🌟🌟🌟',
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
    description: '国内知名图形学公开课，涵盖光栅化、几何表示、光线传播、动画模拟',
    descriptionEn: 'Popular graphics course covering rasterization, geometry, light transport, and animation',
    difficulty: '🌟🌟🌟',
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
    difficulty: '🌟🌟🌟🌟',
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
    difficulty: '🌟🌟🌟🌟🌟🌟',
    difficultyEn: 'Expert',
    duration: '200 小时',
    durationEn: '200 hours',
    programmingLanguage: 'Go',
    slug: 'MIT6.824',
    path: '/parallel-distributed-systems/MIT6.824',
    categorySlug: 'parallel-distributed-systems'
  }
]

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // const categories = await buildCourseStructure()
  
  // Filter courses based on locale
  // For English locale, only show courses that have English versions
  // For Chinese locale, show all courses
  // const filteredCategories = locale === 'en' 
  //   ? categories.map(category => ({
  //       ...category,
  //       courses: category.courses.filter(course => course.hasEnglishVersion)
  //     })).filter(category => category.courses.length > 0)
  //   : categories; // For Chinese, show all categories and courses
  
  // Use real document counts for both languages
  const totalCourses = locale === 'zh' ? 130 : 128 // Real document counts: Chinese 130, English 128
  const totalCategories = locale === 'zh' ? 26 : 26 // Same category structure for both languages
  
  // Load translations
  const messages = locale === 'zh' ? zhMessages : enMessages
  
  // Prepare popular courses data based on locale
  const popularCourses = POPULAR_COURSES.map(course => ({
    id: course.id,
    title: course.title,
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
      title: messages.home.features.universityQuality.title,
      description: messages.home.features.universityQuality.description,
      icon: "🎓"
    },
    {
      title: messages.home.features.comprehensiveCoverage.title,
      description: messages.home.features.comprehensiveCoverage.description,
      icon: "📚"
    },
    {
      title: messages.home.features.completelyFree.title,
      description: messages.home.features.completelyFree.description,
      icon: "🆓"
    },
    {
      title: messages.home.features.selfPaced.title,
      description: messages.home.features.selfPaced.description,
      icon: "⏰"
    }
  ]
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {messages.home.hero.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {messages.home.hero.subtitle}
              </p>
              <p className="text-lg mb-12 text-blue-200 max-w-3xl mx-auto">
                {messages.home.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={`/${locale}/courses`}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  {messages.home.hero.cta}
                </Link>
                <Link 
                  href={`/${locale}/universities`}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  {messages.home.universities.title}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">{totalCourses}+</div>
                <div className="text-gray-600">{messages.home.stats.courses}</div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-purple-600 mb-2">{totalCategories}</div>
                <div className="text-gray-600">{messages.home.stats.subjects}</div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-green-600 mb-2">{TOTAL_UNIVERSITIES}</div>
                <div className="text-gray-600">{messages.home.stats.universities}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tutorial Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="text-6xl mb-6">🌱</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {locale === 'zh' ? 'CS 初学者学习路径' : 'CS Beginner Learning Path'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {locale === 'zh' ? '零基础开始你的 CS 之旅' : '7 stages, start Your CS Journey from Zero'}
              </p>
            </div>

            <div className="bg-white  mx-auto">
              <LearningPathFlow />
              
              <div className="text-center mt-16">
                <Link 
                  href={`/${locale}/tutorial`}
                  className="bg-blue-800 text-white w-16 h-16 rounded-full hover:bg-blue-900 transition-all transform hover:scale-110 flex items-center justify-center mx-auto text-xl font-bold"
                >
                  {locale === 'zh' ? '开始' : 'Go!'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Courses Section */}
        <PopularCourses courses={popularCourses} />

        {/* Universities Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {messages.home.universities.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {messages.home.universities.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {universities.map((university, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{university.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{university.name}</h3>
                  <Link href={`/${locale}/universities`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {messages.home.universities.learnMore}
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href={`/${locale}/universities`} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                {messages.home.hero.cta}
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose {messages.home.hero.title}?</h2>
              <p className="text-lg text-gray-600">{messages.home.hero.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{messages.home.cta.title}</h2>
            <p className="text-xl mb-8 text-blue-100">
              {messages.home.cta.subtitle}
            </p>
            <Link 
              href={`/${locale}/courses`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
            >
              {messages.home.cta.button}
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}