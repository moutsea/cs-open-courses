'use client'

import { Fragment, useMemo, useState } from 'react'
import Image from 'next/image'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, GlobeAltIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation'
import { Link } from '@/navigation'
import SearchBox from './SearchBox'
import { useSimpleTranslations } from '@/lib/translationUtils'

interface LanguageOption {
  code: string
  nativeName: string
}

type Route =
  | '/'
  | '/zh'
  | '/courses'
  | '/zh/courses'
  | '/course/data-structures-algorithms/CS61B'
  | '/zh/course/data-structures-algorithms/CS61B'
  | '/universities'
  | '/zh/universities'
  | '/tutorial'
  | '/zh/tutorial'

interface NavLink {
  id: string
  label: string
  href: Route
}

export default function Header({ locale }: { locale: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const t = useSimpleTranslations(locale)

  const languages: LanguageOption[] = [
    { code: 'en', nativeName: 'English' },
    { code: 'zh', nativeName: '中文' }
  ]

  const baseLinks: NavLink[] = useMemo(() => {
    return [
      { id: 'home', label: locale === 'zh' ? '首页' : 'Home', href: locale === 'zh' ? '/zh' : '/' },
      { id: 'courses', label: t.courses, href: locale === 'zh' ? '/zh/courses' : '/courses' },
      {
        id: 'cs61b',
        label: locale === 'zh' ? 'CS61B 课程' : 'CS61B Course',
        href: locale === 'zh' ? '/zh/course/data-structures-algorithms/CS61B' : '/course/data-structures-algorithms/CS61B'
      },
      { id: 'universities', label: t.universities, href: locale === 'zh' ? '/zh/universities' : '/universities' },
      { id: 'tutorial', label: t.tutorial, href: locale === 'zh' ? '/zh/tutorial' : '/tutorial' }
    ]
  }, [locale, t])

  const aiTools = [
    { label: 'Claude Code', href: locale === 'en' ? 'https://www.claudeide.net' : `https://www.claudeide.net/${locale}` },
    { label: 'Codex', href: locale === 'en' ? 'https://www.codeilab.com' : `https://www.codeilab.com/${locale}` }
  ]

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return

    const currentPath = window.location.pathname
    const currentSearch = window.location.search
    const currentHash = window.location.hash

    let newPath
    if (currentPath === '/' && newLocale === 'zh') {
      newPath = '/zh'
    } else if (currentPath.startsWith('/zh') && newLocale === 'en') {
      newPath = currentPath.replace('/zh', '') || '/'
    } else if (currentPath.startsWith(`/${locale}/`)) {
      newPath = currentPath.replace(`/${locale}`, `/${newLocale}`)
    } else if (currentPath === `/${locale}`) {
      newPath = `/${newLocale}`
    } else {
      newPath = `/${newLocale}${currentPath}`
    }

    router.push(newPath + currentSearch + currentHash)
    setIsMenuOpen(false)
  }

  const isActive = (href: string) => {
    const current = pathname || '/'
    if (href === '/' || href === '/zh') {
      return current === href
    }
    return current.startsWith(href)
  }

  const brandSubtitle = locale === 'zh' ? '跨越顶尖 CS 课程' : 'Across elite CS courses'

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 via-40% to-transparent" aria-hidden="true"></div>
      <div className="mx-auto flex max-w-screen-2xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href={locale === 'zh' ? '/zh' : '/'} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-lg shadow-indigo-500/10 transition hover:border-white/30 min-w-0">
            <Image src="/logo.png" alt="CS Study Hub" width={40} height={40} className="h-10 w-10 flex-shrink-0" priority />
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-semibold text-white truncate">CS Study Hub</span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 truncate">{brandSubtitle}</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {baseLinks.map(link => (
              <Link
                key={link.id}
                href={link.href}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all ${isActive(link.href)
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></span>
                )}
              </Link>
            ))}

            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                AI Coding
                <ChevronDownIcon className="h-4 w-4" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-3 w-48 origin-top-right rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl">
                  {aiTools.map(item => (
                    <Menu.Item key={item.label}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-white/80'}`}
                        >
                          {item.label}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="mr-16 w-44 xl:w-52">
              <SearchBox locale={locale} />
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                <GlobeAltIcon className="h-4 w-4" />
                {languages.find(lang => lang.code === locale)?.nativeName ?? 'English'}
                <ChevronDownIcon className="h-4 w-4" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-3 w-36 origin-top-right rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl">
                  {languages.map(language => (
                    <Menu.Item key={language.code}>
                      {({ active }) => (
                        <button
                          onClick={() => handleLanguageChange(language.code)}
                          className={`w-full rounded-xl px-3 py-2 text-sm font-medium transition ${language.code === locale ? 'bg-blue-500/20 text-white' : active ? 'bg-white/10 text-white' : 'text-white/70'}`}
                        >
                          {language.nativeName}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 p-2 text-white/80 transition hover:border-white/30 hover:text-white xl:hidden"
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        <Transition
          show={isMenuOpen}
          as={Fragment}
          enter="transition duration-200 ease-out"
          enterFrom="transform opacity-0 -translate-y-2"
          enterTo="transform opacity-100 translate-y-0"
          leave="transition duration-150 ease-in"
          leaveFrom="transform opacity-100 translate-y-0"
          leaveTo="transform opacity-0 -translate-y-2"
        >
          <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-black/40 xl:hidden">
            <SearchBox locale={locale} />

            <div className="grid gap-2">
              {baseLinks.map(link => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive(link.href) ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{locale === 'zh' ? 'AI 工具' : 'AI Tools'}</p>
              <div className="mt-3 grid gap-2">
                {aiTools.map(tool => (
                  <a
                    key={tool.label}
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    {tool.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{locale === 'zh' ? '语言' : 'Language'}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${language.code === locale ? 'bg-blue-500/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    {language.nativeName}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href={locale === 'zh' ? '/zh/courses' : '/courses'}
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.02]"
            >
              {locale === 'zh' ? '立即开始' : 'Start learning'}
            </Link>
          </div>
        </Transition>
      </div>
    </header>
  )
}
