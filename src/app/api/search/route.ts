import { NextRequest, NextResponse } from 'next/server'
import { buildSearchIndex, searchCourses } from '@/lib/searchIndex'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const locale = searchParams.get('locale') || 'en'
    
    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        page: 1,
        totalPages: 0,
        error: 'Query parameter is required'
      }, { status: 400 })
    }
    
    // Build search index
    const courses = await buildSearchIndex()
    
    // Filter courses based on locale preference
    const filteredCourses = courses.filter(course => {
      if (locale === 'en') {
        return course.hasEnglishVersion
      }
      return true // Show all courses for Chinese locale
    })
    
    // Search courses
    const searchResults = searchCourses(query, filteredCourses, limit * 2) // Get more results for pagination
    
    // Calculate pagination
    const total = searchResults.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedResults = searchResults.slice(startIndex, endIndex)
    
    return NextResponse.json({
      results: paginatedResults,
      total,
      page,
      totalPages,
      query,
      locale
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({
      results: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: 'Internal server error'
    }, { status: 500 })
  }
}