import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Real universities data based on actual document analysis - 27 universities
const universities = [
  {
    name: "Massachusetts Institute of Technology (MIT)",
    description: "World-renowned for its computer science and engineering programs. MIT offers numerous free online courses through OpenCourseWare.",
    icon: "🏛️",
    courses: 17,
    website: "https://ocw.mit.edu"
  },
  {
    name: "Stanford University",
    description: "Silicon Valley's premier university with exceptional computer science programs and free online course offerings.",
    icon: "🎯",
    courses: 18,
    website: "https://online.stanford.edu"
  },
  {
    name: "University of California, Berkeley",
    description: "Top public university with strong computer science programs and extensive free course offerings.",
    icon: "🌉",
    courses: 14,
    website: "https://online.berkeley.edu"
  },
  {
    name: "Harvard University",
    description: "Ivy League institution with comprehensive computer science education and free online learning resources.",
    icon: "📖",
    courses: 8,
    website: "https://online-learning.harvard.edu"
  },
  {
    name: "Carnegie Mellon University (CMU)",
    description: "Leading computer science school known for robotics, AI, and software engineering excellence.",
    icon: "🎨",
    courses: 6,
    website: "https://www.cs.cmu.edu"
  },
  {
    name: "Princeton University",
    description: "Ivy League research university with outstanding computer science department and online resources.",
    icon: "🔬",
    courses: 4,
    website: "https://www.cs.princeton.edu"
  },
  {
    name: "Cornell University",
    description: "Ivy League institution with strong computer science programs and research opportunities.",
    icon: "🌾",
    courses: 3,
    website: "https://www.cs.cornell.edu"
  },
  {
    name: "University of Michigan",
    description: "Top-tier public university with comprehensive computer science curriculum and free online courses.",
    icon: "🏫",
    courses: 2,
    website: "https://online.umich.edu"
  },
  {
    name: "University of Wisconsin, Madison",
    description: "Leading public research university with strong computer science programs and innovative teaching.",
    icon: "🧀",
    courses: 2,
    website: "https://www.cs.wisc.edu"
  },
  {
    name: "University of Helsinki",
    description: "Finland's top university known for high-quality computer science education and innovative online courses.",
    icon: "🇫🇮",
    courses: 2,
    website: "https://www.helsinki.fi/en/computer-science"
  },
  {
    name: "University of Cambridge",
    description: "World-renowned British university with exceptional computer science programs and research.",
    icon: "🇬🇧",
    courses: 2,
    website: "https://www.cam.ac.uk"
  },
  {
    name: "ETH Zurich",
    description: "Swiss Federal Institute of Technology, known for cutting-edge computer science research and education.",
    icon: "🇨🇭",
    courses: 2,
    website: "https://ethz.ch"
  },
  {
    name: "KAIST",
    description: "Korea's top science and technology university with excellent computer science programs.",
    icon: "🇰🇷",
    courses: 3,
    website: "https://www.kaist.ac.kr"
  },
  {
    name: "Arizona State University",
    description: "Innovative public university with strong computer science programs and online learning initiatives.",
    icon: "🌵",
    courses: 2,
    website: "https://www.asu.edu"
  },
  {
    name: "Duke University",
    description: "Prestigious private university with comprehensive computer science education and research.",
    icon: "🔵",
    courses: 1,
    website: "https://www.duke.edu"
  },
  {
    name: "Peking University",
    description: "China's top university with excellent computer science programs and research contributions.",
    icon: "🇨🇳",
    courses: 2,
    website: "https://www.pku.edu.cn"
  },
  {
    name: "University of Science and Technology of China (USTC)",
    description: "Leading Chinese university known for strong science and technology programs, including computer science.",
    icon: "🔬",
    courses: 2,
    website: "https://www.ustc.edu.cn"
  },
  {
    name: "Nanjing University",
    description: "Prestigious Chinese university with comprehensive computer science education and research.",
    icon: "🏛️",
    courses: 2,
    website: "https://www.nju.edu.cn"
  },
  {
    name: "National Taiwan University",
    description: "Taiwan's top university with excellent computer science programs and research initiatives.",
    icon: "🇹🇼",
    courses: 1,
    website: "https://www.ntu.edu.tw"
  },
  {
    name: "Shanghai Jiao Tong University",
    description: "Leading Chinese university known for strong engineering and computer science programs.",
    icon: "🌊",
    courses: 1,
    website: "https://www.sjtu.edu.cn"
  },
  {
    name: "Harbin Institute of Technology",
    description: "China's top engineering university with excellent computer science and technology programs.",
    icon: "❄️",
    courses: 1,
    website: "https://www.hit.edu.cn"
  },
  {
    name: "University of Chinese Academy of Sciences",
    description: "Premier research university in China, affiliated with the Chinese Academy of Sciences.",
    icon: "🧪",
    courses: 1,
    website: "https://www.ucas.ac.cn"
  },
  {
    name: "Hebrew University of Jerusalem",
    description: "Israel's leading university with strong computer science research and educational programs.",
    icon: "🇮🇱",
    courses: 1,
    website: "https://www.huji.ac.il"
  },
  {
    name: "Amirkabir University of Technology",
    description: "Iran's top technical university with excellent computer science and engineering programs.",
    icon: "🇮🇷",
    courses: 1,
    website: "https://www.aut.ac.ir"
  },
  {
    name: "Syracuse University",
    description: "Private research university with comprehensive computer science education and research opportunities.",
    icon: "🟠",
    courses: 1,
    website: "https://www.syracuse.edu"
  },
  {
    name: "University of California, Santa Barbara (UCSB)",
    description: "Top public research university with strong computer science programs and beautiful campus.",
    icon: "🏖️",
    courses: 2,
    website: "https://www.ucsb.edu"
  }
]

export default async function UniversitiesPage({ locale }: { locale: string }) {
  // Load translations based on locale
  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {messages.home.universities.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100">
                {messages.home.universities.subtitle}
              </p>
              <div className="text-lg">
                <span className="bg-white/20 px-4 py-2 rounded-full">
                  {locale === 'zh' ? '26 所大学' : '26 Universities'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Universities Grid */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map((university, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">{university.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{university.name}</h3>
                    <div className="text-sm text-blue-600 font-semibold mb-3">
                      {university.courses} {locale === 'zh' ? '门免费课程' : 'Free Courses'}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {university.description}
                  </p>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium text-center"
                    >
                      {locale === 'zh' ? '访问官网' : 'Visit Website'} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {locale === 'zh' ? '准备开始学习了吗？' : 'Ready to Start Learning?'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {locale === 'zh' ? '探索这些顶尖大学的课程，提升你的计算机科学知识。' : 'Explore courses from these prestigious universities and advance your computer science knowledge.'}
            </p>
            <a 
              href={locale === 'zh' ? '/zh/courses' : '/courses'} 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {locale === 'zh' ? '浏览所有课程' : 'Browse All Courses'}
            </a>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}