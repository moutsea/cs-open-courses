import type { MetadataRoute } from 'next'
import revisions from '@/data/generated/course-revisions.json'
import routes from '@/data/generated/catalog-routes.json'
import { courseGuides } from '@/data/course-guides'
import videos from '@/data/course-videos.json'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { absoluteUrl, localizedPath, type SiteLocale } from '@/lib/seo'

const locales: SiteLocale[] = ['en', 'zh']
const staticPages = ['/', '/about', '/courses', '/open-source', '/universities', '/tutorial']
const videoUpdateDates: Record<string, string> = videos.courseUpdatedAt

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = new Map<string, Partial<Record<SiteLocale, { lastModified?: string }>>>()
  function add(pathname: string, locale: SiteLocale, lastModified?: string) {
    pages.set(pathname, { ...pages.get(pathname), [locale]: { lastModified } })
  }
  for (const locale of locales) {
    for (const pathname of staticPages) add(pathname, locale)
    for (const [category, subcategories] of Object.entries(routes[locale].categories)) {
      add(`/courses/${category}`, locale)
      for (const subcategory of subcategories) add(`/courses/${category}/${subcategory}`, locale)
    }
    for (const university of routes[locale].universities) add(`/universities/${university}`, locale)
  }
  for (const [file, revision] of Object.entries(revisions) as [string, { hash: string; lastModified?: string }][]) {
    const locale = file.split('/')[0] as SiteLocale
    if (!locales.includes(locale)) continue
    const coursePath = buildDynamicRoutePath(file).join('/')
    const guideDate = courseGuides[coursePath]?.updatedAt
    const candidates = [revision.lastModified, guideDate, videoUpdateDates[coursePath]].filter((date): date is string => Boolean(date) && Date.parse(date!) > 0)
    const lastModified = candidates.length ? new Date(Math.max(...candidates.map(date => Date.parse(date)))).toISOString() : undefined
    add(`/course/${coursePath}`, locale, lastModified)
  }
  return [...pages.entries()].flatMap(([pathname, translations]) => {
    const availableLocales = locales.filter(locale => translations[locale])
    const languages: Record<string, string> = Object.fromEntries(availableLocales.map(locale => [locale, absoluteUrl(localizedPath(locale, pathname))]))
    if (availableLocales.includes('en')) languages['x-default'] = absoluteUrl(localizedPath('en', pathname))
    return availableLocales.map(locale => ({ url: absoluteUrl(localizedPath(locale, pathname)), ...translations[locale], alternates: { languages } }))
  })
}
