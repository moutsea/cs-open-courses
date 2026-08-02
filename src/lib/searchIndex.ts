import generatedSearchIndex from '@/data/generated/course-search-index.json'

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

export interface CourseCatalogEntry {
  id: string
  title: string
  description: string
  path: string
  slug: string
  category: string
  subcategory?: string
  hasChineseVersion: boolean
  hasEnglishVersion: boolean
  university: string
  programmingLanguage: string
  difficulty: string
  duration?: CourseSearchIndex['duration']
  summary?: string
  summaryEn?: string
}

export interface CourseCatalogCategory {
  slug: string
  name: string
  courses: CourseCatalogEntry[]
  subcategories: Array<{
    slug: string
    name: string
    courses: CourseCatalogEntry[]
  }>
}

const searchIndex = generatedSearchIndex as CourseSearchIndex[]

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().trim()
}

export async function buildSearchIndex(): Promise<CourseSearchIndex[]> {
  return searchIndex
}

export function searchCourses(query: string, courses: CourseSearchIndex[], limit?: number): SearchResult[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  const results = courses.flatMap(course => {
    const fields = [
      { value: course.title, weight: 10 },
      { value: course.titleEn, weight: 10 },
      { value: course.university, weight: 7 },
      { value: course.programmingLanguage, weight: 6 },
      { value: course.summary || '', weight: 5 },
      { value: course.summaryEn || '', weight: 5 },
      { value: course.description, weight: 3 },
      { value: course.descriptionEn, weight: 3 },
      { value: course.category, weight: 2 },
      { value: course.subcategory || '', weight: 2 }
    ].map(field => ({ ...field, value: normalize(field.value) }))

    if (!tokens.every(token => fields.some(field => field.value.includes(token)))) return []

    const relevanceScore = tokens.reduce(
      (score, token) => score + fields.reduce(
        (fieldScore, field) => fieldScore + (field.value.includes(token) ? field.weight : 0),
        0
      ),
      0
    )
    return [{ course, relevanceScore }]
  })

  const sorted = results.sort((left, right) =>
    right.relevanceScore - left.relevanceScore || left.course.titleEn.localeCompare(right.course.titleEn)
  )
  return limit === undefined ? sorted : sorted.slice(0, limit)
}

export function buildCourseCatalog(locale: string): CourseCatalogCategory[] {
  const categories = new Map<string, CourseCatalogCategory>()

  for (const course of searchIndex) {
    if (locale === 'en' ? !course.hasEnglishVersion : !course.hasChineseVersion) continue

    const pathParts = course.path.split('/')
    const slug = pathParts.at(-1) || course.id
    const entry: CourseCatalogEntry = {
      id: course.id,
      title: locale === 'zh' ? course.title : course.titleEn,
      description: locale === 'zh' ? course.description : course.descriptionEn,
      path: course.path,
      slug,
      category: course.category,
      subcategory: course.subcategory,
      hasChineseVersion: course.hasChineseVersion,
      hasEnglishVersion: course.hasEnglishVersion,
      university: course.university,
      programmingLanguage: course.programmingLanguage,
      difficulty: course.difficulty,
      duration: course.duration,
      summary: course.summary,
      summaryEn: course.summaryEn
    }

    const category = categories.get(course.category) || {
      slug: course.category,
      name: course.category,
      courses: [],
      subcategories: []
    }

    if (course.subcategory) {
      let subcategory = category.subcategories.find(item => item.slug === course.subcategory)
      if (!subcategory) {
        subcategory = { slug: course.subcategory, name: course.subcategory, courses: [] }
        category.subcategories.push(subcategory)
      }
      subcategory.courses.push(entry)
    }
    category.courses.push(entry)
    categories.set(course.category, category)
  }

  return [...categories.values()].sort((left, right) => left.slug.localeCompare(right.slug))
}
