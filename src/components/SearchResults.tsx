'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { buildDynamicRoutePath } from '@/lib/pathUtils'

interface CourseSearchIndex {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  university: string
  path: string
  programmingLanguage: string
  difficulty: string
  category: string
  subcategory?: string
  hasChineseVersion: boolean
  hasEnglishVersion: boolean
  duration?: string | { value: number | null; originalText: string }
  summary?: string
  summaryEn?: string
}

interface SearchResult {
  course: CourseSearchIndex
  relevanceScore: number
}

interface SearchResultsProps {
  locale: string
  query: string
  page: number
}

async function searchCoursesAPI(query: string, locale: string, page: number = 1, limit: number = 10): Promise<{
  results: SearchResult[]
  total: number
  page: number
  totalPages: number
}> {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&locale=${locale}`)
    if (!response.ok) {
      throw new Error('Search failed')
    }
    const data = await response.json()
    return {
      results: data.results || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 0
    }
  } catch (error) {
    console.error('Search API error:', error)
    return {
      results: [],
      total: 0,
      page: 1,
      totalPages: 0
    }
  }
}

export default function SearchResults({ locale, query, page }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const formatDuration = (duration: CourseSearchIndex['duration']): string => {
    if (!duration) return ''
    if (typeof duration === 'object') {
      if (duration.value) {
        return `${duration.value} ${locale === 'zh' ? '小时' : 'hours'}`
      }
      return duration.originalText || ''
    }
    return duration
  }

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true)
      try {
        const response = await searchCoursesAPI(query, locale, page)
        setResults(response.results)
        setTotal(response.total)
        setTotalPages(response.totalPages)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
        setTotal(0)
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    }

    if (query) {
      loadResults()
    } else {
      setLoading(false)
    }
  }, [query, page, locale])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-5 w-2/3 rounded bg-gray-100 mb-3"></div>
              <div className="h-4 w-full rounded bg-gray-100 mb-2"></div>
              <div className="h-4 w-3/4 rounded bg-gray-100"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            {locale === 'zh' ? '请输入搜索关键词' : 'Start searching'}
          </h1>
          <p className="text-gray-600">
            {locale === 'zh'
              ? '输入课程名称、大学或关键技术即可获得匹配结果。'
              : 'Enter a course name, university, or keyword to see matching courses.'}
          </p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            {locale === 'zh' ? '未找到相关课程' : 'No matches found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {locale === 'zh'
              ? `没有找到与 “${query}” 匹配的课程，换个关键词试试？`
              : `We couldn’t find results for “${query}”. Try another keyword?`}
          </p>
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            {locale === 'zh' ? '浏览所有课程' : 'Browse all courses'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.35em] text-gray-500">
          {locale === 'zh' ? '搜索结果' : 'Results'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-gray-900">
            {locale === 'zh' ? `“${query}” 的搜索结果` : `Results for “${query}”`}
          </h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {locale === 'zh' ? `共 ${total} 个课程` : `${total} ${total === 1 ? 'course' : 'courses'}`}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {results.map((result, index) => {
          const durationText = formatDuration(result.course.duration)
          return (
          <div
            key={`${result.course.path}-${index}`}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-3">
                <Link
                  href={`/${locale}/course/${buildDynamicRoutePath(result.course.path).join('/')}`}
                  className="block text-lg font-semibold text-gray-900 hover:text-blue-600"
                >
                  {locale === 'zh' ? result.course.title : result.course.titleEn}
                </Link>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {result.course.university && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {result.course.university}
                    </span>
                  )}
                  {result.course.difficulty && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        result.course.difficulty.toLowerCase().includes('beginner') || result.course.difficulty.toLowerCase().includes('初级')
                          ? 'bg-green-50 text-green-700'
                          : result.course.difficulty.toLowerCase().includes('intermediate') || result.course.difficulty.toLowerCase().includes('中级')
                          ? 'bg-yellow-50 text-yellow-700'
                          : result.course.difficulty.toLowerCase().includes('advanced') || result.course.difficulty.toLowerCase().includes('高级')
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {result.course.difficulty}
                    </span>
                  )}
                  {result.course.programmingLanguage && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {result.course.programmingLanguage}
                    </span>
                  )}
                  {durationText && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      {durationText}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/${locale}/course/${buildDynamicRoutePath(result.course.path).join('/')}`}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
              >
                {locale === 'zh' ? '查看课程' : 'View course'}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            {(locale === 'zh' ? result.course.summary : result.course.summaryEn) && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {locale === 'zh' ? result.course.summary : result.course.summaryEn}
              </p>
            )}
          </div>
        )})}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <nav className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
              <Link
                key={pageNum}
                href={`/${locale}/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
                className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  pageNum === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
