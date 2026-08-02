import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type {
  GithubProjectCategory,
  GithubProjectFilters,
  GithubProjectListItem,
  GithubProjectsPage,
  GithubProjectStats
} from './types'

interface GithubProjectRow {
  id: number
  full_name: string
  owner: string
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  avatar_url: string | null
  language: string | null
  license: string | null
  topics: string
  category: GithubProjectCategory
  stars: number
  forks: number
  watchers: number
  open_issues: number
  stars_delta: number
  hot_score: number
  pushed_at: string | null
  github_updated_at: string | null
}

interface CountRow {
  total: number
}

interface StatsRow {
  total: number
  total_stars: number
}

interface FacetRow {
  value: string
  count: number
}

interface SyncJobRow {
  status: string
  discovered_count: number
  updated_count: number
  started_at: string
  finished_at: string | null
}

const SORT_SQL = {
  trending: 'hot_score DESC, stars_delta DESC, stars DESC',
  stars: 'stars DESC, hot_score DESC',
  updated: 'pushed_at DESC, stars DESC',
  name: 'full_name COLLATE NOCASE ASC'
} as const

async function getDatabase(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true })
  if (!env.DB) throw new Error('Cloudflare D1 binding DB is unavailable')
  return env.DB
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, match => `\\${match}`)
}

function parseTopics(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 8) : []
  } catch {
    return []
  }
}

function mapProject(row: GithubProjectRow): GithubProjectListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    owner: row.owner,
    name: row.name,
    description: row.description,
    htmlUrl: row.html_url,
    homepage: row.homepage,
    avatarUrl: row.avatar_url,
    language: row.language,
    license: row.license,
    topics: parseTopics(row.topics),
    category: row.category,
    stars: row.stars,
    forks: row.forks,
    watchers: row.watchers,
    openIssues: row.open_issues,
    starsDelta: row.stars_delta,
    hotScore: row.hot_score,
    pushedAt: row.pushed_at,
    githubUpdatedAt: row.github_updated_at
  }
}

function emptyPage(filters: GithubProjectFilters): GithubProjectsPage {
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.min(48, Math.max(1, filters.pageSize || 24))
  return { projects: [], total: 0, page, pageSize, totalPages: 0 }
}

export async function getGithubProjectsPage(filters: GithubProjectFilters = {}): Promise<GithubProjectsPage> {
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.min(48, Math.max(1, filters.pageSize || 24))
  const conditions: string[] = []
  const values: unknown[] = []
  const query = filters.query?.trim()

  if (query) {
    const pattern = `%${escapeLike(query)}%`
    conditions.push(`(
      name LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      full_name LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      description LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      topics LIKE ? ESCAPE '\\' COLLATE NOCASE
    )`)
    values.push(pattern, pattern, pattern, pattern)
  }
  if (filters.category) {
    conditions.push('category = ?')
    values.push(filters.category)
  }
  if (filters.language) {
    conditions.push('language = ? COLLATE NOCASE')
    values.push(filters.language)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sort = filters.sort && filters.sort in SORT_SQL ? filters.sort : 'trending'
  const offset = (page - 1) * pageSize

  try {
    const database = await getDatabase()
    const [projectResult, countResult] = await Promise.all([
      database.prepare(`
        SELECT id, full_name, owner, name, description, html_url, homepage, avatar_url,
          language, license, topics, category, stars, forks, watchers, open_issues,
          stars_delta, hot_score, pushed_at, github_updated_at
        FROM github_projects
        ${where}
        ORDER BY ${SORT_SQL[sort]}
        LIMIT ? OFFSET ?
      `).bind(...values, pageSize, offset).all<GithubProjectRow>(),
      database.prepare(`SELECT COUNT(*) AS total FROM github_projects ${where}`)
        .bind(...values)
        .first<CountRow>()
    ])
    const total = countResult?.total || 0
    return {
      projects: projectResult.results.map(mapProject),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  } catch (error) {
    console.error('Failed to query GitHub projects', error)
    return emptyPage(filters)
  }
}

export async function getGithubProjectStats(): Promise<GithubProjectStats> {
  try {
    const database = await getDatabase()
    const [stats, categoryResult, languageResult, lastSync] = await Promise.all([
      database.prepare(`
        SELECT COUNT(*) AS total, COALESCE(SUM(stars), 0) AS total_stars
        FROM github_projects
      `).first<StatsRow>(),
      database.prepare(`
        SELECT category AS value, COUNT(*) AS count
        FROM github_projects
        GROUP BY category
        ORDER BY count DESC, category ASC
      `).all<FacetRow>(),
      database.prepare(`
        SELECT language AS value, COUNT(*) AS count
        FROM github_projects
        WHERE language IS NOT NULL AND language <> ''
        GROUP BY language
        ORDER BY count DESC, language ASC
        LIMIT 30
      `).all<FacetRow>(),
      database.prepare(`
        SELECT status, discovered_count, updated_count, started_at, finished_at
        FROM github_project_sync_jobs
        ORDER BY started_at DESC
        LIMIT 1
      `).first<SyncJobRow>()
    ])

    return {
      total: stats?.total || 0,
      totalStars: stats?.total_stars || 0,
      categories: categoryResult.results,
      languages: languageResult.results,
      lastSync: lastSync ? {
        status: lastSync.status,
        discoveredCount: lastSync.discovered_count,
        updatedCount: lastSync.updated_count,
        startedAt: lastSync.started_at,
        finishedAt: lastSync.finished_at
      } : null
    }
  } catch (error) {
    console.error('Failed to query GitHub project stats', error)
    return { total: 0, totalStars: 0, categories: [], languages: [], lastSync: null }
  }
}
