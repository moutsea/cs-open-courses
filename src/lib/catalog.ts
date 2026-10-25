import { cache } from 'react'
import { getCategoriesForLocale } from './getServerData'
import { slugLabel } from './categoryMapping'
import { universities } from '@/components/UniversitiesData'
import { getUniversityCourses, getUniversityKey } from './universityUtils'
import type { Course, Category } from './courseParser'

export const getCatalog = cache(getCategoriesForLocale)

export function categoryName(slug: string, locale: string) {
  return slugLabel(slug, locale)
}

// Do not serialize complete lesson Markdown into interactive course cards.
export function courseCardData(course: Course): Course {
  return { ...course, content: '', contentEn: undefined, description: '' }
}

export function catalogCardData(categories: Category[]): Category[] {
  return categories.map(category => ({
    ...category,
    courses: category.courses.map(courseCardData),
    subcategories: category.subcategories.map(subcategory => ({ ...subcategory, courses: subcategory.courses.map(courseCardData) }))
  }))
}

export const getUniversityCatalog = cache(async (locale: string) => {
  const courses = (await getCatalog(locale)).flatMap(category => category.courses)
  return universities.flatMap(university => {
    const slug = getUniversityKey(university.name)
    if (!slug) return []
    const selected = getUniversityCourses(courses, slug)
    return selected.length ? [{ ...university, slug, courses: selected }] : []
  })
})
