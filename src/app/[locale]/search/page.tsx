import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Suspense } from 'react'
import SearchResults from '@/components/SearchResults'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search CS61B & Top CS Courses | CS61B & Beyond',
  description: 'Search Berkeley CS61B and 120+ CS courses by keyword, university, or tech stack. Filter paged results to jump straight into labs, projects, and study notes.'
}

interface SearchResultsPageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

function SearchSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="h-5 w-2/3 rounded bg-gray-100 mb-3"></div>
            <div className="h-4 w-full rounded bg-gray-100 mb-2"></div>
            <div className="h-4 w-3/4 rounded bg-gray-100"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function SearchResultsPage({ params, searchParams }: SearchResultsPageProps) {
  const { locale } = await params
  const { q: query, page: pageParam } = await searchParams
  const page = parseInt(pageParam || '1', 10)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header locale={locale} />
      <main className="flex-grow py-10">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults locale={locale} query={query || ''} page={page} />
        </Suspense>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
