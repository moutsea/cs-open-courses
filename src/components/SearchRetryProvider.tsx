'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SearchRequest {
  query: string
  locale: string
  page: number
}

interface SearchRetryState extends SearchRequest {
  revision: number
  retry: () => void
}

const SearchRetryContext = createContext<SearchRetryState | null>(null)

/** Share explicit search retries between the header and the results on a search page. */
export default function SearchRetryProvider({ query, locale, page, children }: SearchRequest & { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])
  const value = useMemo(() => ({ query, locale, page, revision, retry }), [query, locale, page, revision, retry])

  return <SearchRetryContext.Provider value={value}>{children}</SearchRetryContext.Provider>
}

export function useSearchRetry() {
  return useContext(SearchRetryContext)
}
