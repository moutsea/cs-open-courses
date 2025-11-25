'use client'

import { useState } from 'react'
import { Link } from '@/navigation'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import SearchBox from './SearchBox'
import Image from 'next/image'
import { useSimpleTranslations } from '@/lib/translationUtils'

export default function Header({ locale }: { locale: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const t = useSimpleTranslations(locale)

  // Language options
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' }
  ]

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== locale) {
      const currentPath = window.location.pathname
      const currentSearch = window.location.search
      const currentHash = window.location.hash

      // Handle root path (English) and language-specific paths
      let newPath
      if (currentPath === '/' && newLocale === 'zh') {
        // From root English to Chinese
        newPath = '/zh'
      } else if (currentPath.startsWith('/zh/') && newLocale === 'en') {
        // From Chinese to English
        newPath = currentPath.replace('/zh', '') || '/'
      } else if (currentPath.startsWith('/' + locale + '/')) {
        // Between language-specific paths
        newPath = currentPath.replace(`/${locale}`, `/${newLocale}`)
      } else if (currentPath === '/' + locale) {
        // From language root to another language root
        newPath = '/' + newLocale
      } else {
        // Default case: add language prefix
        newPath = `/${newLocale}${currentPath}`
      }

      // Preserve query parameters and hash
      const fullNewPath = newPath + currentSearch + currentHash
      router.push(fullNewPath)
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-black shadow-sm border-b border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={locale === 'zh' ? '/zh' : '/'} className="flex items-center space-x-3" as={locale === 'zh' ? '/zh' : '/'}>
              <Image
                src="/logo.png"
                alt="CS61B & Beyond Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="text-xl font-bold text-white">CS61B & Beyond</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8 items-center">

              <Link href={locale === 'zh' ? '/zh' : '/'} className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium" as={locale === 'zh' ? '/zh' : '/'}>
                Home
              </Link>
              <Link href={locale === 'en' ? '/courses' : '/zh/courses'} className="text-gray-300 hover:text-white block px-3 py-2 text-base 
  font-medium">
                {t.courses}
              </Link>
              <Link href={locale === 'en' ? '/universities' : '/zh/universities'} className="text-gray-300 hover:text-white block px-3 py-2 text-base 
  font-medium">
                {t.universities}
              </Link>
              <Link href={locale === 'en' ? '/tutorial' : '/zh/tutorial'} className="text-gray-300 hover:text-white block px-3 py-2 text-base
  font-medium">
                {t.tutorial}
              </Link>

              {/* AI Coding Dropdown */}
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                    AI Coding
                    <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? 'https://www.claudeide.net' : `https://www.claudeide.net/${locale}`}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Claude Code
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? 'https://www.codeilab.com' : `https://www.codeilab.com/${locale}`}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Codex
                          </a>
                        )}
                      </Menu.Item>

                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <SearchBox locale={locale} />
            </nav>

            {/* Language Dropdown */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  {languages.find(lang => lang.code === locale)?.nativeName || 'English'}
                  <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {languages.map((language) => (
                      <Menu.Item key={language.code}>
                        {({ active }) => (
                          <button
                            onClick={() => handleLanguageChange(language.code)}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block w-full text-left px-4 py-2 text-sm ${language.code === locale ? 'bg-blue-50 text-blue-700 font-medium' : ''
                              }`}
                          >
                            {language.nativeName}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <SearchBox locale={locale} />

              <Link href={locale === 'zh' ? '/zh' : '/'} className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                Home
              </Link>
              {/* <Link href={locale === 'en' ? '/courses' : `/${locale}/courses`} className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                {t.courses}
              </Link>
              <Link href={locale === 'en' ? '/universities' : `/${locale}/universities`} className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                {t.universities}
              </Link>
              <Link href={locale === 'en' ? '/tutorial' : `/${locale}/tutorial`} className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium">
                {t.tutorial}
              </Link> */}

              <Link href={locale === 'en' ? '/courses' : '/zh/courses'} className="text-gray-300 hover:text-white block px-3 py-2 text-base 
  font-medium">
                {t.courses}
              </Link>
              <Link href={locale === 'en' ? '/universities' : '/zh/universities'} className="text-gray-300 hover:text-white block px-3 py-2 text-base 
  font-medium">
                {t.universities}
              </Link>
              <Link href={locale === 'en' ? '/tutorial' : '/zh/tutorial'} className="text-gray-300 hover:text-white block px-3 py-2 text-base
  font-medium">
                {t.tutorial}
              </Link>

              {/* Mobile AI Coding Dropdown */}
              <Menu as="div" className="relative inline-block text-left w-full">
                <div>
                  <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                    AI Coding
                    <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? '/ai-coding/code-generation' : '/zh/ai-coding/code-generation'}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Code Generation
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? '/ai-coding/code-review' : '/zh/ai-coding/code-review'}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Code Review
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? '/ai-coding/debugging' : '/zh/ai-coding/debugging'}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Debugging Assistant
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href={locale === 'en' ? '/ai-coding/documentation' : '/zh/ai-coding/documentation'}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block px-4 py-2 text-sm`}
                          >
                            Documentation
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              {/* Mobile Language Dropdown */}
              <Menu as="div" className="relative inline-block text-left w-full">
                <div>
                  <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    {languages.find(lang => lang.code === locale)?.nativeName || 'English'}
                    <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {languages.map((language) => (
                        <Menu.Item key={language.code}>
                          {({ active }) => (
                            <button
                              onClick={() => handleLanguageChange(language.code)}
                              className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } block w-full text-left px-4 py-2 text-sm ${language.code === locale ? 'bg-blue-50 text-blue-700 font-medium' : ''
                                }`}
                            >
                              {language.nativeName}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}