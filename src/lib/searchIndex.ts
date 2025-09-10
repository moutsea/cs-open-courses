import { promises as fs } from 'fs'
import path from 'path'
import { parseMarkdownFile } from './courseParser'

export interface CourseSearchIndex {
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

export interface SearchResult {
  course: CourseSearchIndex
  relevanceScore: number
}

// Global search index cache
let searchIndex: CourseSearchIndex[] | null = null

export async function buildSearchIndex(): Promise<CourseSearchIndex[]> {
  if (searchIndex) {
    return searchIndex
  }

  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs-new')
  const courses: CourseSearchIndex[] = []
  
  async function scanLanguageDirectory(langDir: string, locale: string) {
    const langPath = path.join(docsPath, langDir)
    
    async function scanDirectory(dirPath: string, currentPath: string[] = []) {
      try {
        const items = await fs.readdir(dirPath)
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item)
          const stats = await fs.stat(itemPath)
          
          if (stats.isDirectory()) {
            await scanDirectory(itemPath, [...currentPath, item])
          } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
            // This is a course file
            const coursePath = [...currentPath, item.replace('.md', '')]
            
            // Parse the markdown file to extract metadata
            try {
              const courseData = await parseMarkdownFile(itemPath)
              
              // Check if the other language version exists
              const otherLang = locale === 'zh' ? 'en' : 'zh'
              const otherLangPath = path.join(docsPath, otherLang, ...currentPath, item)
              const hasOtherVersion = await fileExists(otherLangPath)
              
              // Parse the other language version if it exists
              let otherLangData = null
              if (hasOtherVersion) {
                otherLangData = await parseMarkdownFile(otherLangPath)
              }
              
              // Determine Chinese and English descriptions/summaries based on file content
              let chineseDescription = ''
              let englishDescription = ''
              let chineseSummary = ''
              let englishSummary = ''
              
              if (locale === 'zh') {
                // This is a Chinese file
                chineseDescription = courseData.content.substring(0, 200) + '...'
                englishDescription = otherLangData?.content?.substring(0, 200) + '...' || ''
                chineseSummary = courseData.summary || ''
                englishSummary = otherLangData?.summaryEn || otherLangData?.summary || ''
              } else {
                // This is an English file
                chineseDescription = otherLangData?.content?.substring(0, 200) + '...' || ''
                englishDescription = courseData.content.substring(0, 200) + '...'
                chineseSummary = otherLangData?.summary || ''
                englishSummary = courseData.summaryEn || courseData.summary || ''
              }
              
              courses.push({
                id: `${locale}-${coursePath.join('-')}`,
                title: locale === 'zh' ? courseData.title : (otherLangData?.title || courseData.title),
                titleEn: locale === 'zh' ? (otherLangData?.title || courseData.title) : courseData.title,
                description: chineseDescription,
                descriptionEn: englishDescription,
                summary: chineseSummary,
                summaryEn: englishSummary,
                university: '', // Not needed since description contains university info
                path: coursePath.join('/'),
                programmingLanguage: courseData.programmingLanguage || '',
                difficulty: courseData.difficulty || '',
                duration: courseData.duration,
                category: coursePath[0] || 'Unknown',
                subcategory: coursePath[1] || undefined,
                hasChineseVersion: locale === 'zh' || hasOtherVersion,
                hasEnglishVersion: locale === 'en' || hasOtherVersion,
              })
            } catch (error) {
              console.error(`Error processing course file ${itemPath}:`, error)
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error)
      }
    }
    
    await scanDirectory(langPath, [])
  }
  
  try {
    // Scan both Chinese and English directories
    await scanLanguageDirectory('zh', 'zh')
    await scanLanguageDirectory('en', 'en')
    
    // Merge courses that exist in both languages
    const mergedCourses: CourseSearchIndex[] = []
    
    courses.forEach(course => {
      const existingIndex = mergedCourses.findIndex(c => c.path === course.path)
      
      if (existingIndex === -1) {
        // New course, add it
        mergedCourses.push(course)
      } else {
        // Course exists, merge language-specific fields
        const existing = mergedCourses[existingIndex]
        
          // Merge fields based on language
        if (course.hasChineseVersion) {
          // Update Chinese fields
          existing.title = course.title
          existing.description = course.description
          existing.summary = course.summary
          existing.programmingLanguage = course.programmingLanguage
          existing.difficulty = course.difficulty
          existing.duration = course.duration
          existing.hasChineseVersion = true
        }
        
        if (course.hasEnglishVersion) {
          // Update English fields
          existing.titleEn = course.titleEn
          existing.descriptionEn = course.descriptionEn
          existing.summaryEn = course.summaryEn // Don't fallback to summary for English
          existing.hasEnglishVersion = true
          
          // If this is an English course, also update the programming language to ensure it's in English
          if (course.programmingLanguage) {
            existing.programmingLanguage = course.programmingLanguage
          }
          if (course.difficulty) {
            existing.difficulty = course.difficulty
          }
          if (course.duration) {
            existing.duration = course.duration
          }
        }
        
        // Keep other fields from the first occurrence
      }
    })
    
    searchIndex = mergedCourses
    return mergedCourses
  } catch (error) {
    console.error('Error building search index:', error)
    return []
  }
}


async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export function searchCourses(query: string, courses: CourseSearchIndex[], limit: number = 20): SearchResult[] {
  if (!query.trim()) {
    return []
  }
  
  const normalizedQuery = query.toLowerCase().trim()
  const results: SearchResult[] = []
  
  for (const course of courses) {
    let relevanceScore = 0
    
    // Search in title (highest weight)
    if (course.title.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 10
    }
    if (course.titleEn.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 10
    }
    
    // Search in description (medium weight)
    if (course.description.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 5
    }
    if (course.descriptionEn.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 5
    }
    
    // Search in university (medium weight)
    if (course.university.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 7
    }
    
    // Search in programming language (medium weight)
    if (course.programmingLanguage.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 6
    }
    
    // Search in category (low weight)
    if (course.category.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 3
    }
    
    // Search in subcategory (low weight)
    if (course.subcategory && course.subcategory.toLowerCase().includes(normalizedQuery)) {
      relevanceScore += 2
    }
    
    // Only include courses with some relevance
    if (relevanceScore > 0) {
      results.push({
        course,
        relevanceScore
      })
    }
  }
  
  // Sort by relevance score (highest first) and limit results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

export function clearSearchIndexCache() {
  searchIndex = null
}

// Clear the cache to ensure changes take effect
if (searchIndex) {
  searchIndex = null;
}