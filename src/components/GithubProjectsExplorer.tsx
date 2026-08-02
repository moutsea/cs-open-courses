import Link from 'next/link'
import {
  Clock3,
  ExternalLink,
  GitFork,
  Github,
  Search,
  Star,
  TrendingUp
} from 'lucide-react'
import { localizedPath } from '@/lib/pathUtils'
import type {
  GithubProjectCategory,
  GithubProjectFilters,
  GithubProjectsPage,
  GithubProjectStats
} from '@/lib/githubProjects/types'

const CATEGORY_LABELS: Record<GithubProjectCategory, { en: string; zh: string }> = {
  'ai-ml': { en: 'AI & Machine Learning', zh: 'AI 与机器学习' },
  'web-development': { en: 'Web Development', zh: 'Web 开发' },
  'systems-infrastructure': { en: 'Systems & Infrastructure', zh: '系统与基础设施' },
  'developer-tools': { en: 'Developer Tools', zh: '开发者工具' },
  'data-databases': { en: 'Data & Databases', zh: '数据与数据库' },
  'mobile-desktop': { en: 'Mobile & Desktop', zh: '移动与桌面应用' },
  'security-privacy': { en: 'Security & Privacy', zh: '安全与隐私' },
  'learning-resources': { en: 'Learning Resources', zh: '学习资源' },
  other: { en: 'Other', zh: '其他' }
}

const SORT_OPTIONS = [
  { value: 'trending', en: 'Trending', zh: '综合热度' },
  { value: 'stars', en: 'Most stars', zh: 'Star 最多' },
  { value: 'updated', en: 'Recently updated', zh: '最近更新' },
  { value: 'name', en: 'Name', zh: '名称' }
] as const

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value)
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return locale === 'zh' ? '未知' : 'Unknown'
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

function buildPageHref(locale: string, filters: GithubProjectFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.category) params.set('category', filters.category)
  if (filters.language) params.set('language', filters.language)
  if (filters.sort && filters.sort !== 'trending') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `${localizedPath(locale, '/open-source')}${query ? `?${query}` : ''}#projects`
}

export default function GithubProjectsExplorer({
  locale,
  data,
  stats,
  filters
}: {
  locale: string
  data: GithubProjectsPage
  stats: GithubProjectStats
  filters: GithubProjectFilters
}) {
  const isZh = locale === 'zh'
  const activeCategory = filters.category || ''
  const activeLanguage = filters.language || ''
  const activeSort = filters.sort || 'trending'

  return (
    <div id="projects" className="space-y-8 scroll-mt-28">
      <form
        action={localizedPath(locale, '/open-source')}
        className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-7"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_220px_220px_180px_auto]">
          <label className="relative block">
            <span className="sr-only">{isZh ? '搜索开源项目' : 'Search open-source projects'}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              name="q"
              defaultValue={filters.query || ''}
              placeholder={isZh ? '搜索名称、组织、简介或主题…' : 'Search name, owner, description, or topic…'}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/15"
            />
          </label>

          <label>
            <span className="sr-only">{isZh ? '项目分类' : 'Project category'}</span>
            <select
              name="category"
              defaultValue={activeCategory}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              <option value="">{isZh ? '全部分类' : 'All categories'}</option>
              {stats.categories.map(category => {
                const label = CATEGORY_LABELS[category.value as GithubProjectCategory]
                return (
                  <option key={category.value} value={category.value}>
                    {label ? (isZh ? label.zh : label.en) : category.value} ({category.count})
                  </option>
                )
              })}
            </select>
          </label>

          <label>
            <span className="sr-only">{isZh ? '编程语言' : 'Programming language'}</span>
            <select
              name="language"
              defaultValue={activeLanguage}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              <option value="">{isZh ? '全部语言' : 'All languages'}</option>
              {stats.languages.map(language => (
                <option key={language.value} value={language.value}>
                  {language.value} ({language.count})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">{isZh ? '排序方式' : 'Sort projects'}</span>
            <select
              name="sort"
              defaultValue={activeSort}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {isZh ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02]"
          >
            {isZh ? '搜索项目' : 'Search'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/55">
          <p>
            {isZh
              ? `找到 ${data.total.toLocaleString('zh-CN')} 个项目`
              : `${data.total.toLocaleString('en-US')} projects found`}
          </p>
          {(filters.query || filters.category || filters.language || activeSort !== 'trending') && (
            <Link href={`${localizedPath(locale, '/open-source')}#projects`} className="font-semibold text-cyan-300 hover:text-cyan-200">
              {isZh ? '清除筛选' : 'Clear filters'}
            </Link>
          )}
        </div>
      </form>

      {data.projects.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map(project => {
            const category = CATEGORY_LABELS[project.category]
            return (
              <article
                key={project.id}
                className="group flex min-w-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/45 p-6 shadow-[0_25px_70px_rgba(2,6,23,0.35)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                        {isZh ? category.zh : category.en}
                      </span>
                      {project.language && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/65">
                          {project.language}
                        </span>
                      )}
                    </div>
                    <h2 className="break-words text-xl font-semibold text-white transition group-hover:text-cyan-200">
                      {project.name}
                    </h2>
                    <p className="mt-1 truncate font-mono text-xs text-white/45">{project.fullName}</p>
                  </div>
                  <Github className="h-6 w-6 shrink-0 text-white/35 transition group-hover:text-white/70" />
                </div>

                <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-white/65">
                  {project.description || (isZh ? '该项目暂未提供简介。' : 'No description is available for this project.')}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
                    <div className="flex items-center gap-1.5 text-white/40"><Star className="h-3.5 w-3.5" /> Stars</div>
                    <div className="mt-1 font-mono font-semibold text-amber-200">{compactNumber(project.stars)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
                    <div className="flex items-center gap-1.5 text-white/40"><TrendingUp className="h-3.5 w-3.5" /> {isZh ? '增长' : 'Delta'}</div>
                    <div className="mt-1 font-mono font-semibold text-emerald-200">+{compactNumber(project.starsDelta)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
                    <div className="flex items-center gap-1.5 text-white/40"><GitFork className="h-3.5 w-3.5" /> Forks</div>
                    <div className="mt-1 font-mono font-semibold text-blue-200">{compactNumber(project.forks)}</div>
                  </div>
                </div>

                <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
                  {project.topics.slice(0, 4).map(topic => (
                    <span key={topic} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/8 pt-5 text-xs text-white/45">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{formatDate(project.pushedAt, locale)}</span>
                  </span>
                  <a
                    href={project.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    GitHub <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <Github className="mx-auto h-10 w-10 text-white/25" />
          <h2 className="mt-5 text-2xl font-semibold text-white">
            {stats.total === 0
              ? (isZh ? '项目雷达等待首次同步' : 'The project radar is waiting for its first sync')
              : (isZh ? '没有找到匹配项目' : 'No projects matched your filters')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/55">
            {stats.total === 0
              ? (isZh ? '数据库已经准备好，首次 GitHub 同步完成后项目会显示在这里。' : 'The database is ready. Projects will appear after the first GitHub sync.')
              : (isZh ? '换一个关键词，或者清除分类与语言筛选后再试。' : 'Try another keyword or clear the category and language filters.')}
          </p>
        </div>
      )}

      {data.totalPages > 1 && (
        <nav aria-label={isZh ? '项目分页' : 'Project pagination'} className="flex items-center justify-center gap-4 pt-4">
          {data.page > 1 ? (
            <Link
              href={buildPageHref(locale, filters, data.page - 1)}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
            >
              {isZh ? '上一页' : 'Previous'}
            </Link>
          ) : <span className="w-24" />}
          <span className="text-sm text-white/55">
            {isZh ? `第 ${data.page} / ${data.totalPages} 页` : `Page ${data.page} of ${data.totalPages}`}
          </span>
          {data.page < data.totalPages ? (
            <Link
              href={buildPageHref(locale, filters, data.page + 1)}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
            >
              {isZh ? '下一页' : 'Next'}
            </Link>
          ) : <span className="w-24" />}
        </nav>
      )}
    </div>
  )
}
