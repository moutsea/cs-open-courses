'use client'

import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, GlobeAltIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/navigation'
import SearchBox from './SearchBox'
import BrandLockup from './brand/BrandLockup'
import { useSimpleTranslations } from '@/lib/translationUtils'
import { track } from '@/lib/analytics'
import { aiToolLinks } from '@/lib/projectLinks'

interface LanguageOption {
  code: string
  nativeName: string
}

type Route =
  | '/'
  | '/courses'
  | '/course/data-structures-algorithms/CS61B'
  | '/universities'
  | '/open-source'
  | '/tutorial'

interface NavLink {
  id: string
  label: string
  href: Route
}

function HeaderNavigationObserver({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    onNavigate()
  }, [pathname, search, onNavigate])

  return null
}

export default function Header({ locale }: { locale: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // 搜索框按需展开：点图标打开，点窗外 / 按 Esc / 切换路由时收起。
  useEffect(() => {
    if (!isSearchOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (searchPanelRef.current?.contains(target) || searchButtonRef.current?.contains(target)) return
      setIsSearchOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsSearchOpen(false)
      searchButtonRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

  // 面板内 Tab 循环，避免焦点跑到面板背后的页面
  useEffect(() => {
    if (!isSearchOpen) return
    const panel = searchPanelRef.current
    if (!panel) return
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(element => element.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isSearchOpen])

  const closePanels = useCallback(() => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
  }, [])

  // 搜索/菜单面板打开时，把页面主体设为 inert：键盘和读屏都不会跑到背景内容
  useEffect(() => {
    if (!isSearchOpen && !isMenuOpen) return
    const targets = Array.from(document.querySelectorAll<HTMLElement>('main, footer'))
    const previous = targets.map(element => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden')
    }))
    for (const { element } of previous) {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    }
    return () => {
      for (const { element, inert, ariaHidden } of previous) {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', ariaHidden)
      }
    }
  }, [isSearchOpen, isMenuOpen])

  // 视口跨过断点时收起面板：否则面板被 CSS 隐藏了，背景滚动锁还留着
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1280px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false)
      else setIsSearchOpen(false)
    }
    desktopQuery.addEventListener('change', handleChange)
    return () => desktopQuery.removeEventListener('change', handleChange)
  }, [])

  // 移动端菜单展开时：Esc 关闭，并锁定背景滚动（面板自身可滚）
  useEffect(() => {
    if (!isMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsMenuOpen(false)
      // 和搜索面板一致：Esc 收起后焦点回到触发按钮，键盘用户不会掉到页面顶端。
      menuButtonRef.current?.focus()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const t = useSimpleTranslations(locale)

  const languages: LanguageOption[] = [
    { code: 'en', nativeName: 'English' },
    { code: 'zh', nativeName: '中文' }
  ]

  const baseLinks: NavLink[] = useMemo(() => {
    return [
      { id: 'home', label: locale === 'zh' ? '首页' : 'Home', href: '/' },
      { id: 'courses', label: t.courses, href: '/courses' },
      {
        id: 'cs61b',
        label: locale === 'zh' ? 'CS61B 课程' : 'CS61B Course',
        href: '/course/data-structures-algorithms/CS61B'
      },
      { id: 'universities', label: t.universities, href: '/universities' },
      { id: 'open-source', label: locale === 'zh' ? '开源项目' : 'Open Source', href: '/open-source' },
      { id: 'tutorial', label: t.tutorial, href: '/tutorial' }
    ]
  }, [locale, t])

  const aiTools = aiToolLinks(locale)

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return
    track('language_switch', { from: locale, to: newLocale })

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
    const normalizedCurrent = locale === 'zh'
      ? current.replace(/^\/zh(?=\/|$)/, '') || '/'
      : current

    if (href === '/') {
      return normalizedCurrent === href
    }
    return normalizedCurrent.startsWith(href)
  }

  const brandSubtitle = locale === 'zh' ? '免费 CS 课程与学习路径' : 'Free CS courses and learning paths'

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      {/* Observe query-only navigation without making the static header wait for search params. */}
      <Suspense fallback={null}>
        <HeaderNavigationObserver onNavigate={closePanels} />
      </Suspense>
      <div className="absolute inset-x-0 top-0 h-px bg-cyan-400/30" aria-hidden="true"></div>
      <div className="mx-auto flex max-w-screen-2xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label={locale === 'zh' ? 'CS61B & Beyond 首页' : 'CS61B & Beyond home'}
            className="group -ml-2 flex min-w-0 items-center rounded-2xl px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
          >
            <BrandLockup size={40} subtitle={brandSubtitle} />
          </Link>

          <div className="ml-auto flex items-center gap-2 xl:gap-3">
            <nav className="hidden items-center gap-1 xl:flex">
            {baseLinks.map(link => (
              <Link
                key={link.id}
                href={link.href}
                className={`relative rounded-full px-3 py-2 text-sm font-semibold transition-all ${isActive(link.href)
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-cyan-400"></span>
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
                          {item.description && (
                            <span className="mt-1 block text-xs font-normal text-white/50">{item.description}</span>
                          )}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <div className="relative">
              <button
                ref={searchButtonRef}
                type="button"
                onClick={() => setIsSearchOpen(open => !open)}
                aria-expanded={isSearchOpen}
                aria-controls="header-search"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isSearchOpen
                    ? 'border-cyan-300/60 bg-cyan-300/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                }`}
              >
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{locale === 'zh' ? '搜索课程' : 'Search courses'}</span>
              </button>

              {isSearchOpen && (
                <div
                  id="header-search"
                  ref={searchPanelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={locale === 'zh' ? '搜索课程' : 'Search courses'}
                  className="absolute right-0 top-full z-50 mt-3 w-[min(86vw,24rem)] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
                >
                  <Suspense fallback={<div className="h-11 w-full rounded-full bg-white/5" />}>
                    <SearchBox locale={locale} autoFocus onSearch={() => {
                      setIsSearchOpen(false)
                      searchButtonRef.current?.focus()
                    }} />
                  </Suspense>
                </div>
              )}
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
                          className={`w-full rounded-xl px-3 py-2 text-sm font-medium transition ${language.code === locale ? 'bg-cyan-400/20 text-white' : active ? 'bg-white/10 text-white' : 'text-white/70'}`}
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
          </div>

          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 p-2 text-white/80 transition hover:border-white/30 hover:text-white xl:hidden"
            aria-label={locale === 'zh' ? '打开导航菜单' : 'Toggle navigation'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
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
          <div id="mobile-menu" className="mt-4 flex max-h-[calc(100dvh-6.5rem)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-xl shadow-black/40 xl:hidden">
            <Suspense fallback={<div className="h-10 w-full rounded-lg bg-white/10" />}>
              <SearchBox locale={locale} onSearch={() => setIsMenuOpen(false)} />
            </Suspense>

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
                    {tool.description && (
                      <span className="mt-1 block text-xs font-normal text-white/50">{tool.description}</span>
                    )}
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
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${language.code === locale ? 'bg-cyan-400/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    {language.nativeName}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/courses"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {locale === 'zh' ? '立即开始' : 'Start learning'}
            </Link>
          </div>
        </Transition>
      </div>
    </header>
  )
}
