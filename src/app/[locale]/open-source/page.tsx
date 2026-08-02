import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Clock3, Database, Github, Radar, RefreshCw, Star } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GithubProjectsExplorer from '@/components/GithubProjectsExplorer'
import StructuredData from '@/components/StructuredData'
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage'
import { getGithubProjectsPage, getGithubProjectStats } from '@/lib/githubProjects/queries'
import type { GithubProjectFilters, GithubProjectSort } from '@/lib/githubProjects/types'
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo'

export const dynamic = 'force-dynamic'

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value)
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  const title = isZh ? 'GitHub 热门开源项目门户' : 'Popular GitHub Open-Source Projects'
  const description = isZh
    ? '浏览 GitHub 热门开源项目，按关键词、分类、编程语言与热度搜索，发现 AI、开发工具、系统、数据库和学习资源。'
    : 'Discover popular GitHub open-source projects with search, categories, language filters, and rankings across AI, developer tools, systems, databases, and learning resources.'
  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: pageAlternates(locale, '/open-source'),
    openGraph: {
      title,
      description,
      url: absoluteUrl(localizedPath(locale, '/open-source')),
      siteName: SITE_NAME,
      type: 'website',
      locale: isZh ? 'zh_CN' : 'en_US',
      images: socialImages()
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/og.jpg')]
    }
  }
}

export default async function OpenSourcePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await connection()
  const [{ locale }, queryParams] = await Promise.all([params, searchParams])
  const isZh = locale === 'zh'
  const requestedSort = firstValue(queryParams.sort)
  const filters: GithubProjectFilters = {
    query: firstValue(queryParams.q).slice(0, 120),
    category: firstValue(queryParams.category).slice(0, 80),
    language: firstValue(queryParams.language).slice(0, 80),
    sort: (['trending', 'stars', 'updated', 'name'].includes(requestedSort)
      ? requestedSort
      : 'trending') as GithubProjectSort,
    page: Math.max(1, Number.parseInt(firstValue(queryParams.page) || '1', 10) || 1),
    pageSize: 24
  }
  const [projectData, stats] = await Promise.all([
    getGithubProjectsPage(filters),
    getGithubProjectStats()
  ])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isZh ? 'GitHub 热门开源项目门户' : 'Popular GitHub Open-Source Projects',
    description: isZh ? '持续更新的 GitHub 热门开源项目目录。' : 'A continuously updated directory of popular GitHub open-source projects.',
    url: absoluteUrl(localizedPath(locale, '/open-source')),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: projectData.total,
      itemListElement: projectData.projects.map((project, index) => ({
        '@type': 'ListItem',
        position: (projectData.page - 1) * projectData.pageSize + index + 1,
        name: project.fullName,
        url: project.htmlUrl
      }))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <ImmersivePage>
        <StructuredData data={structuredData} />

        <ImmersiveSection className="py-16 text-white sm:py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,3fr)_2fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  <Radar className="h-4 w-4" />
                  GitHub Open Source Radar
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {isZh ? '发现真正值得关注的开源项目' : 'Discover open source worth following'}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">
                  {isZh
                    ? '从 GitHub 多个热门主题持续聚合项目，结合 Star、活跃度和增长排序，并支持按名称、组织、简介、分类与语言搜索。'
                    : 'Continuously aggregate projects from popular GitHub topics, rank them by stars, activity, and growth, and search by name, owner, description, category, or language.'}
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <RefreshCw className="h-4 w-4 text-cyan-300" />
                    {isZh ? '每日自动更新' : 'Updated daily'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Database className="h-4 w-4 text-blue-300" />
                    Cloudflare D1
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Github className="h-4 w-4 text-violet-300" />
                    {isZh ? '多主题聚合' : 'Multi-topic discovery'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/12 bg-white/5 p-6 backdrop-blur-xl">
                  <Github className="h-6 w-6 text-cyan-300" />
                  <div className="mt-5 text-4xl font-bold">{stats.total.toLocaleString(isZh ? 'zh-CN' : 'en-US')}</div>
                  <p className="mt-1 text-sm text-white/50">{isZh ? '收录项目' : 'Projects indexed'}</p>
                </div>
                <div className="rounded-[28px] border border-white/12 bg-white/5 p-6 backdrop-blur-xl">
                  <Star className="h-6 w-6 text-amber-300" />
                  <div className="mt-5 text-4xl font-bold">{compactNumber(stats.totalStars)}</div>
                  <p className="mt-1 text-sm text-white/50">{isZh ? '累计 Stars' : 'Combined stars'}</p>
                </div>
                <div className="rounded-[28px] border border-white/12 bg-white/5 p-6 backdrop-blur-xl">
                  <Radar className="h-6 w-6 text-violet-300" />
                  <div className="mt-5 text-4xl font-bold">{stats.categories.length}</div>
                  <p className="mt-1 text-sm text-white/50">{isZh ? '项目分类' : 'Categories'}</p>
                </div>
                <div className="rounded-[28px] border border-white/12 bg-white/5 p-6 backdrop-blur-xl">
                  <Clock3 className="h-6 w-6 text-emerald-300" />
                  <div className="mt-5 text-lg font-semibold">
                    {stats.lastSync?.finishedAt
                      ? new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(stats.lastSync.finishedAt))
                      : (isZh ? '等待首次同步' : 'Waiting for first sync')}
                  </div>
                  <p className="mt-2 text-sm text-white/50">{isZh ? '最近同步' : 'Last synchronized'}</p>
                </div>
              </div>
            </div>
          </div>
        </ImmersiveSection>

        <ImmersiveSection className="pb-20 text-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <GithubProjectsExplorer locale={locale} data={projectData} stats={stats} filters={filters} />
          </div>
        </ImmersiveSection>
      </ImmersivePage>
      <Footer locale={locale} />
    </div>
  )
}
