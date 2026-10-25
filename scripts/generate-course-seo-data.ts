import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getCategoriesForLocale } from '../src/lib/getServerData'
import { getUniversityKey, getUniversityCourses } from '../src/lib/universityUtils'
import { universities } from '../src/components/UniversitiesData'

interface Revision { hash: string; lastModified?: string }

async function main() {
  const directory = path.join(process.cwd(), 'src/data/generated')
  await mkdir(directory, { recursive: true })
  let previous: Record<string, Revision> = {}
  try { previous = JSON.parse(await readFile(path.join(directory, 'course-revisions.json'), 'utf8')) } catch { /* First build. */ }

  const dates = new Map<string, string>()
  let dirtyFiles = new Set<string>()
  let hasGitHistory = false
  try {
    const log = execFileSync('git', ['-c', 'core.quotepath=false', 'log', '--format=@@%cI', '--name-only', '--no-renames', '--', 'course-content'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 })
    let date = ''
    for (const line of log.split('\n')) {
      if (line.startsWith('@@')) date = line.slice(2)
      else if (line.startsWith('course-content/') && !dates.has(line)) dates.set(line, date)
    }
    dirtyFiles = new Set(execFileSync('git', ['-c', 'core.quotepath=false', 'diff', '--name-only', 'HEAD', '--', 'course-content'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n'))
    hasGitHistory = true
  } catch {
    console.warn('Git history unavailable; retaining only content-matched revision dates.')
  }

  const revisions: Record<string, Revision> = {}
  const routes: Record<string, { categories: Record<string, string[]>; universities: string[] }> = {}
  for (const locale of ['en', 'zh']) {
    const categories = await getCategoriesForLocale(locale)
    if (!categories.length) throw new Error(`No categories found for ${locale}`)
    const courses = categories.flatMap(category => category.courses)
    routes[locale] = {
      categories: Object.fromEntries(categories.map(category => [category.slug, category.subcategories.map(subcategory => subcategory.slug)])),
      universities: universities.flatMap(university => {
        const key = getUniversityKey(university.name)
        return key && getUniversityCourses(courses, key).length ? [key] : []
      })
    }
    for (const course of courses) {
      const hash = createHash('sha256').update(course.content).digest('hex')
      const file = `course-content/${course.path}`
      const date = hasGitHistory
        ? (dirtyFiles.has(file) ? undefined : dates.get(file))
        : (previous[course.path]?.hash === hash ? previous[course.path].lastModified : undefined)
      // Never substitute build time or filesystem mtime for a content revision.
      const lastModified = date && Number.isFinite(Date.parse(date)) && Date.parse(date) > 0 ? new Date(date).toISOString() : undefined
      revisions[course.path] = { hash, ...(lastModified ? { lastModified } : {}) }
    }
  }
  await writeFile(path.join(directory, 'course-revisions.json'), `${JSON.stringify(revisions, null, 2)}\n`)
  await writeFile(path.join(directory, 'catalog-routes.json'), `${JSON.stringify(routes, null, 2)}\n`)
  console.log(`Generated SEO routes and ${Object.keys(revisions).length} course revisions`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
