import Link from 'next/link'
import { buildDynamicRoutePath } from '@/lib/pathUtils'

// Popular courses data - same as homepage
const POPULAR_COURSES = [
  {
    id: 'programming-introduction-python-cs61a',
    title: 'CS61A: Structure and Interpretation of Computer Programs',
    titleEn: 'CS61A: Structure and Interpretation of Computer Programs',
    slug: 'CS61A',
    path: 'programming-introduction/python/CS61A'
  },
  {
    id: 'data-structures-algorithms-cs61b',
    title: 'CS61B: Data Structures and Algorithms',
    titleEn: 'CS61B: Data Structures and Algorithms',
    slug: 'CS61B',
    path: 'data-structures-algorithms/CS61B'
  },
  {
    id: 'machine-learning-cs189',
    title: 'CS189: Introduction to Machine Learning',
    titleEn: 'CS189: Introduction to Machine Learning',
    slug: 'CS189',
    path: 'machine-learning/CS189'
  },
  {
    id: 'deep-learning-cs224n',
    title: 'CS224n: Natural Language Processing',
    titleEn: 'CS224n: Natural Language Processing',
    slug: 'CS224n',
    path: 'deep-learning/CS224n'
  }
]

export default function Footer({ locale }: { locale: string }) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">CS61B & Beyond</h3>
            <p className="text-gray-300 mb-4">
              Discover and access free computer science courses from top universities worldwide. 
              Helping learners access quality educational content for free.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href={`/${locale}`} className="text-gray-300 hover:text-white">Home</Link></li>
              <li><Link href={`/${locale}/courses`} className="text-gray-300 hover:text-white">Courses</Link></li>
              <li><Link href={`/${locale}/universities`} className="text-gray-300 hover:text-white">Universities</Link></li>
              <li><Link href={`/${locale}/tutorial`} className="text-gray-300 hover:text-white">Tutorial</Link></li>
              <li><Link href={`/${locale}/about`} className="text-gray-300 hover:text-white">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Popular Courses</h4>
            <ul className="space-y-2">
              {POPULAR_COURSES.map((course) => (
                <li key={course.id}>
                  <Link 
                    href={`/${locale}/course/${buildDynamicRoutePath(course.path).join('/')}`}
                    className="text-gray-300 hover:text-white"
                  >
                    {locale === 'zh' ? course.title : course.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300">
            © 2025 CS61B & Beyond. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}