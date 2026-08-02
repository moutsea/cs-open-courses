import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getAllCourses } from '../src/lib/getServerData'
import { buildDynamicRoutePath } from '../src/lib/pathUtils'
import type { Course } from '../src/lib/courseParser'

interface GeneratedCourseSearchEntry {
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
  duration?: Course['duration']
  summary?: string
  summaryEn?: string
}

function canonicalCoursePath(course: Course): string {
  return buildDynamicRoutePath(course.path).join('/')
}

function descriptionFor(course: Course | undefined): string {
  if (!course) return ''
  return course.description.replace(/\s+/g, ' ').trim()
}

async function main() {
  const [englishCourses, chineseCourses] = await Promise.all([
    getAllCourses('en'),
    getAllCourses('zh')
  ])
  const englishByPath = new Map(englishCourses.map(course => [canonicalCoursePath(course), course]))
  const chineseByPath = new Map(chineseCourses.map(course => [canonicalCoursePath(course), course]))
  const paths = [...new Set([...englishByPath.keys(), ...chineseByPath.keys()])].sort()

  const entries: GeneratedCourseSearchEntry[] = paths.map(coursePath => {
    const english = englishByPath.get(coursePath)
    const chinese = chineseByPath.get(coursePath)
    const preferred = english || chinese
    if (!preferred) throw new Error(`Missing course data for ${coursePath}`)

    const pathParts = coursePath.split('/')
    return {
      id: coursePath.replace(/\//g, '-'),
      title: chinese?.title || english?.title || preferred.title,
      titleEn: english?.title || chinese?.title || preferred.title,
      description: descriptionFor(chinese),
      descriptionEn: descriptionFor(english),
      university: english?.university || chinese?.university || '',
      path: coursePath,
      programmingLanguage: english?.programmingLanguage || chinese?.programmingLanguage || '',
      difficulty: english?.difficulty || chinese?.difficulty || '',
      duration: english?.duration || chinese?.duration,
      category: pathParts[0] || 'unknown',
      subcategory: pathParts.length > 2 ? pathParts[1] : undefined,
      hasChineseVersion: Boolean(chinese),
      hasEnglishVersion: Boolean(english),
      summary: chinese?.summary || '',
      summaryEn: english?.summaryEn || english?.summary || ''
    }
  })

  const outputPath = path.join(process.cwd(), 'src/data/generated/course-search-index.json')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
  console.log(`Generated ${entries.length} course search entries`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
