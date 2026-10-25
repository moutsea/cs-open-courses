import type { Metadata } from 'next'
import { localizedPath } from './pathUtils'

export { localizedPath } from './pathUtils'

export const SITE_NAME = 'CS61B & Beyond'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cs61bbeyond.com').replace(/\/+$/, '')
export const DEFAULT_OG_IMAGE = '/og.jpg'

export const INDEXABLE_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large'
  }
}

export type SiteLocale = 'en' | 'zh'

export function absoluteUrl(pathname = '/'): string {
  return new URL(pathname, `${SITE_URL}/`).toString()
}

export function pageAlternates(locale: string, pathname = '/', availableLocales: SiteLocale[] = ['en', 'zh']): Metadata['alternates'] {
  return {
    canonical: absoluteUrl(localizedPath(locale, pathname)),
    languages: {
      ...Object.fromEntries(availableLocales.map(language => [language, absoluteUrl(localizedPath(language, pathname))])),
      ...(availableLocales.includes('en') ? { 'x-default': absoluteUrl(localizedPath('en', pathname)) } : {})
    }
  }
}

export function collectionMetadata(locale: string, pathname: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: pageAlternates(locale, pathname),
    openGraph: { title, description, url: absoluteUrl(localizedPath(locale, pathname)), siteName: SITE_NAME, type: 'website', locale: locale === 'zh' ? 'zh_CN' : 'en_US', images: socialImages() },
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl(DEFAULT_OG_IMAGE)] }
  }
}

export function socialImages() {
  return [
    {
      url: absoluteUrl(DEFAULT_OG_IMAGE),
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} - Free Computer Science Courses`
    }
  ]
}
