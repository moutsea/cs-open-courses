'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { localizedPath } from '@/lib/pathUtils'
import { useSearchRetry } from './SearchRetryProvider'
import { track } from '@/lib/analytics'

interface SearchBoxProps {
  locale: string
  /** 展开式搜索面板里需要自动聚焦。 */
  autoFocus?: boolean
  /** Notify the containing panel after a nonempty search is submitted. */
  onSearch?: () => void
}

export default function SearchBox({ locale, autoFocus = false, onSearch }: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = useSearchRetry()

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      track('search', { q: query, source: 'search-box' })
      router.push(`${localizedPath(locale, '/search')}?q=${encodeURIComponent(query)}`)
      // Same-URL navigation preserves the results component and does not rerun its request.
      if (currentSearch?.query === query && currentSearch.locale === locale && currentSearch.page === 1) {
        currentSearch.retry()
      }
      onSearch?.()
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        autoFocus={autoFocus}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={locale === 'zh' ? '搜索课程...' : 'Search courses...'}
        aria-label={locale === 'zh' ? '搜索课程' : 'Search courses'}
        className="w-full rounded-full border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 transition focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 text-white/40" />
      </div>
    </form>
  )
}
