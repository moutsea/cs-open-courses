import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Suspense } from 'react'
import SearchResults from '@/components/SearchResults'

interface SearchResultsPageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

// Loading fallback component
function SearchResultsLoading() {
  return (
    <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function SearchResultsPage({ params, searchParams }: SearchResultsPageProps) {
  const { locale } = await params
  const { q: query, page: pageParam } = await searchParams
  const page = parseInt(pageParam || '1', 10)

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow bg-gray-50">
        <Suspense fallback={<SearchResultsLoading />}>
          <SearchResults 
            locale={locale} 
            query={query || ''} 
            page={page} 
          />
        </Suspense>
      </main>
      <Footer locale={locale} />
    </div>
  )
}