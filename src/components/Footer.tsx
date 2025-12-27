import Link from 'next/link'
import { buildDynamicRoutePath } from '@/lib/pathUtils'

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

const SOCIAL_LINKS = [
  {
    name: 'X (Twitter)',
    href: 'https://x.com/LiangMout95522',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    name: 'GitHub',
    href: 'https://github.com/moutsea/cs-open-courses',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    )
  }
]

const OTHER_PROJECTS = [
  { name: 'Code By AI', href: 'https://www.codebyai.net' },
  { name: 'Claude Code Ide', href: 'https://www.claudeide.net' },
  { name: 'Codex Lab', href: 'https://www.codeilab.com' }
]

const COMPANY_LINKS = [
  { name: 'Fomalhaut Labs', href: 'https://fomalhautlabs.com' }
]

export default function Footer({ locale }: { locale: string }) {
  const isEn = locale === 'en'

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CS61B & Beyond
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Discover and access free computer science courses from top universities worldwide.
              Helping learners access quality educational content for free.
            </p>
            <div className="flex space-x-5">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">{link.name}</span>
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: isEn ? '/' : '/zh' },
                { name: 'Courses', href: isEn ? '/courses' : '/zh/courses' },
                { name: 'CS61B', href: isEn ? '/course/data-structures-algorithms/CS61B' : '/zh/course/data-structures-algorithms/CS61B' },
                { name: 'Universities', href: isEn ? '/universities' : '/zh/universities' },
                { name: 'Tutorial', href: isEn ? '/tutorial' : '/zh/tutorial' },
                { name: 'About', href: isEn ? '/about' : '/zh/about' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Popular Courses</h4>
            <ul className="space-y-3">
              {POPULAR_COURSES.map((course) => (
                <li key={course.id}>
                  <Link
                    href={
                      isEn ?
                        `/course/${buildDynamicRoutePath(course.path).join('/')}` :
                        `/zh/course/${buildDynamicRoutePath(course.path).join('/')}`}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {locale === 'zh' ? course.title : course.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">We Also Build</h4>
            <ul className="space-y-3">
              {OTHER_PROJECTS.map((project) => (
                <li key={project.name}>
                  <a
                    href={isEn ? project.href : `${project.href}/zh`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {project.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CS61B & Beyond. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
