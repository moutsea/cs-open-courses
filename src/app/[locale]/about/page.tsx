import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about CS61B & Beyond - your trusted platform for discovering and accessing top computer science open courses from world-class universities.'
}

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const { locale } = await params;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {locale === 'zh' ? '关于我们' : 'About Us'}
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                {locale === 'zh' 
                  ? '致力于让优质的计算机科学教育资源对所有人免费开放'
                  : 'Dedicated to making quality computer science education accessible to everyone for free'
                }
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {locale === 'zh' ? '我们的使命' : 'Our Mission'}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {locale === 'zh'
                    ? '我们相信教育应该是公平和可及的。通过汇集世界顶尖大学的计算机科学课程，我们为全球学习者提供了一个免费、高质量的学习平台。无论你身在何处，无论你的背景如何，你都应该有机会获得最好的教育资源。'
                    : 'We believe that education should be fair and accessible. By curating computer science courses from top universities worldwide, we provide a free, high-quality learning platform for global learners. No matter where you are or what your background is, you should have access to the best educational resources.'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'zh' ? '优质内容' : 'Quality Content'}
                  </h3>
                  <p className="text-gray-600">
                    {locale === 'zh'
                      ? '精选全球顶尖大学的计算机科学课程，确保内容质量和教学水平'
                      : 'Carefully selected computer science courses from top universities worldwide, ensuring quality content and teaching standards'
                    }
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'zh' ? '全球社区' : 'Global Community'}
                  </h3>
                  <p className="text-gray-600">
                    {locale === 'zh'
                      ? '来自世界各地的学习者在这里相遇、学习和成长'
                      : 'Learners from around the world meet, learn, and grow together here'
                    }
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'zh' ? '完全免费' : 'Completely Free'}
                  </h3>
                  <p className="text-gray-600">
                    {locale === 'zh'
                      ? '所有课程内容完全免费，没有任何隐藏费用或订阅要求'
                      : 'All course content is completely free with no hidden fees or subscription requirements'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

  
        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {locale === 'zh' ? '联系我们' : 'Contact Us'}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {locale === 'zh'
                  ? '有问题或建议？我们很乐意听到您的声音！'
                  : 'Have questions or suggestions? We\'d love to hear from you!'
                }
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">cfjwlchangji@gmail.com</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600">
                    {locale === 'zh' ? '新加坡' : 'Singapore'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}