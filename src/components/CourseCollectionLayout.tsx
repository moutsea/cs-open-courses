import type { ReactNode } from 'react'
import Link from 'next/link'
import Header from './Header'
import Footer from './Footer'
import StructuredData from './StructuredData'
import { ImmersivePage, ImmersiveSection } from './layout/ImmersivePage'
import { absoluteUrl, localizedPath } from '@/lib/seo'

export default function CourseCollectionLayout({ locale, title, description, breadcrumbs, children }: {
  locale: string
  title: string
  description: string
  breadcrumbs: { name: string; pathname: string }[]
  children: ReactNode
}) {
  const items = [{ name: locale === 'zh' ? '首页' : 'Home', pathname: '/' }, ...breadcrumbs]
  return <div className="min-h-screen flex flex-col">
    <Header locale={locale} />
    <ImmersivePage>
      <StructuredData data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(localizedPath(locale, item.pathname)) })) }} />
      <ImmersiveSection className="py-12 text-white">
        <div className="mx-auto max-w-screen-2xl space-y-8 px-4 sm:px-6 lg:px-8">
          <nav aria-label={locale === 'zh' ? '面包屑导航' : 'Breadcrumb'}>
            <ol className="flex flex-wrap gap-3 text-sm text-cyan-200">
              {items.map((item, index) => <li key={item.pathname}>
                {index > 0 && <span className="mr-3 text-white/40" aria-hidden="true">/</span>}
                <Link href={localizedPath(locale, item.pathname)} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.name}</Link>
              </li>)}
            </ol>
          </nav>
          <h1 className="max-w-5xl text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
          <p className="max-w-4xl text-lg leading-relaxed text-white/75">{description}</p>
          {children}
        </div>
      </ImmersiveSection>
    </ImmersivePage>
    <Footer locale={locale} />
  </div>
}
