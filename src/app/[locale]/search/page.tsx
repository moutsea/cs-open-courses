import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Suspense } from 'react'
import SearchResults from '@/components/SearchResults'
import SearchRetryProvider from '@/components/SearchRetryProvider'
import { Metadata } from 'next'
import { pageAlternates } from '@/lib/seo'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'

  return {
    title: isZh ? '搜索计算机科学课程' : 'Search CS61B & Top CS Courses',
    description: isZh
      ? '按关键词、大学或技术方向搜索 CS61B 及其他计算机科学开放课程。'
      : 'Search Berkeley CS61B and 120+ CS courses by keyword, university, or tech stack.',
    alternates: pageAlternates(locale, '/search'),
    robots: {
      index: false,
      follow: true
    }
  }
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
          <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="h-5 w-2/3 rounded bg-white/10 mb-3"></div>
            <div className="h-4 w-full rounded bg-white/10 mb-2"></div>
            <div className="h-4 w-3/4 rounded bg-white/10"></div>
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
    <SearchRetryProvider query={query || ''} locale={locale} page={page}>
      <div className="min-h-screen flex flex-col">
        <Header locale={locale} />
        <ImmersivePage>
          <ImmersiveSection className="py-10 text-white">
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResults locale={locale} query={query || ''} page={page} />
            </Suspense>
          </ImmersiveSection>
        </ImmersivePage>
        <Footer locale={locale} />
      </div>
    </SearchRetryProvider>
  )
}
