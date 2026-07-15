import type { MetadataRoute } from 'next'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { getAllCourses } from '@/lib/getServerData'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { absoluteUrl, localizedPath, type SiteLocale } from '@/lib/seo'

const locales: SiteLocale[] = ['en', 'zh']

const staticPages = [
  { pathname: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { pathname: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  { pathname: '/courses', changeFrequency: 'weekly' as const, priority: 0.9 },
  { pathname: '/universities', changeFrequency: 'monthly' as const, priority: 0.7 },
  { pathname: '/tutorial', changeFrequency: 'monthly' as const, priority: 0.8 }
]

function languageAlternates(pathname: string, availableLocales: SiteLocale[] = locales) {
  const languages = Object.fromEntries(
    availableLocales.map(locale => [locale, absoluteUrl(localizedPath(locale, pathname))])
  )

  if (availableLocales.includes('en')) {
    languages['x-default'] = absoluteUrl(localizedPath('en', pathname))
  }

  return { languages }
}

async function getLastModified(coursePath: string): Promise<Date | undefined> {
  try {
    const courseFile = path.join(process.cwd(), 'course-content', coursePath)
    return (await stat(courseFile)).mtime
  } catch {
    return undefined
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(page =>
    locales.map(locale => ({
      url: absoluteUrl(localizedPath(locale, page.pathname)),
      changeFrequency: page.changeFrequency,
      priority: locale === 'zh' ? Math.max(0.1, page.priority - 0.05) : page.priority,
      alternates: languageAlternates(page.pathname)
    }))
  )

  try {
    const [enCourses, zhCourses] = await Promise.all([
      getAllCourses('en'),
      getAllCourses('zh')
    ])
    const coursePaths = new Map<string, Partial<Record<SiteLocale, string>>>()

    for (const [locale, courses] of [
      ['en', enCourses],
      ['zh', zhCourses]
    ] as const) {
      for (const course of courses) {
        const pathname = `/course/${buildDynamicRoutePath(course.path).join('/')}`
        const localizedCourses = coursePaths.get(pathname) || {}
        localizedCourses[locale] = course.path
        coursePaths.set(pathname, localizedCourses)
      }
    }

    const courseEntries = await Promise.all(
      Array.from(coursePaths.entries()).flatMap(([pathname, localizedCourses]) => {
        const availableLocales = locales.filter(locale => localizedCourses[locale])

        return availableLocales.map(async locale => ({
          url: absoluteUrl(localizedPath(locale, pathname)),
          lastModified: await getLastModified(localizedCourses[locale]!),
          changeFrequency: 'monthly' as const,
          priority: pathname.endsWith('/data-structures-algorithms/CS61B') ? 0.95 : 0.8,
          alternates: languageAlternates(pathname, availableLocales)
        }))
      })
    )

    return [...staticEntries, ...courseEntries]
  } catch (error) {
    console.error('Error generating course sitemap entries:', error)
    return staticEntries
  }
}
