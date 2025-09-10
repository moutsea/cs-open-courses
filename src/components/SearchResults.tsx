'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { encodePathParameter } from '@/lib/pathUtils'

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

  if (!query) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'zh' ? '请输入搜索关键词' : 'Please enter a search query'}
          </h1>
          <p className="text-gray-600 mb-4">
            {locale === 'zh' 
              ? '在搜索框中输入课程名称、大学或技术关键词来查找相关课程。'
              : 'Enter course names, universities, or technical keywords in the search box to find relevant courses.'
            }
          </p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'zh' ? '未找到相关课程' : 'No courses found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {locale === 'zh' 
              ? `没有找到与 "${query}" 相关的课程。请尝试其他关键词。`
              : `No courses found matching "${query}". Please try different keywords.`
            }
          </p>
          <Link href={`/${locale}/courses`} className="text-blue-600 hover:text-blue-800">
            {locale === 'zh' ? '浏览所有课程' : 'Browse all courses'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {locale === 'zh' ? `搜索 "${query}" 的结果` : `Search results for "${query}"`}
        </h1>
        <p className="text-gray-600">
          {locale === 'zh' 
            ? `找到 ${total} 个相关课程`
            : `Found ${total} ${total === 1 ? 'course' : 'courses'}`
          }
        </p>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={`${result.course.path}-${index}`} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  href={`/${locale}/course?path=${encodePathParameter(result.course.path)}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                >
                  {locale === 'zh' ? result.course.title : result.course.titleEn}
                </Link>
                <div className="mb-4 space-y-2">
                  {result.course.difficulty && (
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{locale === 'zh' ? '难度' : 'Difficulty'}: </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                        result.course.difficulty.toLowerCase().includes('beginner') || result.course.difficulty.toLowerCase().includes('初级') 
                          ? 'bg-green-100 text-green-800'
                          : result.course.difficulty.toLowerCase().includes('intermediate') || result.course.difficulty.toLowerCase().includes('中级')
                          ? 'bg-yellow-100 text-yellow-800'
                          : result.course.difficulty.toLowerCase().includes('advanced') || result.course.difficulty.toLowerCase().includes('高级')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.course.difficulty}
                      </span>
                    </div>
                  )}
                  
                  {result.course.programmingLanguage && (
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>{locale === 'zh' ? '编程语言' : 'Language'}: </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium ml-1">
                        {result.course.programmingLanguage}
                      </span>
                    </div>
                  )}
                  
                  {result.course.duration && (
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{locale === 'zh' ? '学习时间' : 'Duration'}: </span>
                      <div className="flex items-center ml-2">
                        {(() => {
                          const durationStr = typeof result.course.duration === 'object' 
                            ? result.course.duration.value?.toString() || '0'
                            : result.course.duration?.toString() || '';
                          const style = (() => {
                            const durationNum = parseInt(durationStr);
                            let width, color;
                            
                            if (durationNum <= 50) {
                              width = 'w-8';
                              color = 'bg-green-500';
                            } else if (durationNum <= 60) {
                              width = 'w-12';
                              color = 'bg-green-500';
                            } else if (durationNum <= 100) {
                              width = 'w-16';
                              color = 'bg-yellow-500';
                            } else if (durationNum <= 150) {
                              width = 'w-24';
                              color = 'bg-orange-500';
                            } else {
                              width = 'w-32';
                              color = 'bg-red-500';
                            }
                            
                            return { width, color };
                          })();
                          
                          if (typeof result.course.duration === 'object' && result.course.duration.value) {
                            return (
                              <>
                                <div className={`h-3 ${style.color} rounded-full ${style.width}`}></div>
                                <span className="ml-2 text-xs text-gray-600">
                                  {result.course.duration.value} {locale === 'en' ? 'hours' : '小时'}
                                </span>
                              </>
                            );
                          } else if (typeof result.course.duration === 'string') {
                            return (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {result.course.duration}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                
                {(locale === 'zh' ? result.course.summary : result.course.summaryEn) && (
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {locale === 'zh' ? result.course.summary : result.course.summaryEn}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <Link 
                  href={`/${locale}/course?path=${encodePathParameter(result.course.path)}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {locale === 'zh' ? '查看课程' : 'View Course'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/${locale}/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {pageNum}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}