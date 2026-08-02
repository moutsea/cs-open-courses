import type { GithubProjectCategory } from './types'

interface GithubApiRepository {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  owner: {
    login: string
    avatar_url: string | null
  }
  license: {
    spdx_id: string | null
  } | null
}

interface GithubSearchResponse {
  items: GithubApiRepository[]
}

export interface GithubProjectSyncResult {
  jobId: string
  discoveredCount: number
  updatedCount: number
  errorCount: number
}

const SEARCH_QUERIES = [
  { query: 'stars:>10000 archived:false fork:false', perPage: 100 },
  { query: 'topic:artificial-intelligence stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:machine-learning stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:developer-tools stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:database stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:distributed-systems stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:cybersecurity stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:web-development stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:mobile-development stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:self-hosted stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:computer-science stars:>500 archived:false fork:false', perPage: 50 },
  { query: 'topic:programming-language stars:>500 archived:false fork:false', perPage: 50 }
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isGithubRepository(value: unknown): value is GithubApiRepository {
  if (!isRecord(value) || !isRecord(value.owner)) return false
  return typeof value.id === 'number'
    && typeof value.full_name === 'string'
    && typeof value.name === 'string'
    && typeof value.html_url === 'string'
    && typeof value.stargazers_count === 'number'
    && typeof value.forks_count === 'number'
    && typeof value.watchers_count === 'number'
    && typeof value.open_issues_count === 'number'
    && typeof value.created_at === 'string'
    && typeof value.updated_at === 'string'
    && typeof value.pushed_at === 'string'
    && typeof value.owner.login === 'string'
}

function parseSearchResponse(value: unknown): GithubSearchResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error('GitHub returned an invalid search response')
  }
  return { items: value.items.filter(isGithubRepository) }
}

function inferCategory(repository: GithubApiRepository): GithubProjectCategory {
  const text = [
    repository.full_name,
    repository.description || '',
    repository.language || '',
    ...(repository.topics || [])
  ].join(' ').toLowerCase()

  if (/awesome|roadmap|curriculum|tutorial|course|interview|book|algorithm|computer science|education|curated list|collective list/.test(text)) return 'learning-resources'
  if (/security|cyber|hacking|privacy|pentest|vulnerab|cryptograph|malware/.test(text)) return 'security-privacy'
  if (/machine learning|artificial intelligence|\bai\b|\bllm|deep learning|neural|transformer|diffusion|computer vision|rag\b|agentic/.test(text)) return 'ai-ml'
  if (/database|sql|analytics|data warehouse|data engineering|vector database|etl\b|stream processing/.test(text)) return 'data-databases'
  if (/android|ios\b|mobile|desktop app|electron|flutter|react native|tauri/.test(text)) return 'mobile-desktop'
  if (/kubernetes|docker|container|cloud native|devops|infrastructure|distributed system|operating system|kernel|networking|proxy|server/.test(text)) return 'systems-infrastructure'
  if (/editor|terminal|command line|\bcli\b|developer tool|debugger|formatter|linter|package manager|build tool|shell/.test(text)) return 'developer-tools'
  if (/web|frontend|backend|fullstack|javascript|typescript|react|vue|angular|svelte|css|http|api\b/.test(text)) return 'web-development'
  return 'other'
}

function calculateHotScore(repository: GithubApiRepository): number {
  const pushedAt = Date.parse(repository.pushed_at)
  const ageInDays = Number.isFinite(pushedAt) ? Math.max(0, (Date.now() - pushedAt) / 86_400_000) : 3650
  const freshness = Math.max(0, 1 - ageInDays / 365)
  return Number((
    Math.log10(repository.stargazers_count + 1) * 24
    + Math.log10(repository.forks_count + 1) * 6
    + freshness * 20
  ).toFixed(4))
}

async function fetchRepositories(query: string, perPage: number, token: string): Promise<GithubApiRepository[]> {
  const url = new URL('https://api.github.com/search/repositories')
  url.searchParams.set('q', query)
  url.searchParams.set('sort', 'stars')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('per_page', String(perPage))

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'cs61b-beyond-project-radar',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!response.ok) {
    throw new Error(`GitHub search failed (${response.status})`)
  }
  return parseSearchResponse(await response.json()).items
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

export async function syncPopularGithubProjects(
  database: D1Database,
  token: string
): Promise<GithubProjectSyncResult> {
  const jobId = crypto.randomUUID()
  const startedAt = new Date().toISOString()
  const session = database.withSession('first-primary')
  await session.prepare(`
    INSERT INTO github_project_sync_jobs (id, status, query_count, started_at)
    VALUES (?, 'running', ?, ?)
  `).bind(jobId, SEARCH_QUERIES.length, startedAt).run()

  const repositories = new Map<number, GithubApiRepository>()
  const errors: string[] = []

  for (const source of SEARCH_QUERIES) {
    try {
      const items = await fetchRepositories(source.query, source.perPage, token)
      for (const repository of items) repositories.set(repository.id, repository)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${source.query}: ${message}`)
      console.error(JSON.stringify({ message: 'GitHub project query failed', query: source.query, error: message }))
    }
  }

  if (repositories.size === 0) {
    const message = errors.join('; ').slice(0, 4000) || 'No repositories returned'
    await session.prepare(`
      UPDATE github_project_sync_jobs
      SET status = 'failed', error_count = ?, error_message = ?, finished_at = ?
      WHERE id = ?
    `).bind(errors.length, message, new Date().toISOString(), jobId).run()
    throw new Error(message)
  }

  const seenAt = new Date().toISOString()
  const repositoryList = [...repositories.values()]
  const upsertSql = `
    INSERT INTO github_projects (
      github_id, full_name, owner, name, description, html_url, homepage, avatar_url,
      language, license, topics, category, stars, forks, watchers, open_issues,
      stars_delta, hot_score, github_created_at, github_updated_at, pushed_at,
      first_seen_at, last_seen_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(github_id) DO UPDATE SET
      full_name = excluded.full_name,
      owner = excluded.owner,
      name = excluded.name,
      description = excluded.description,
      html_url = excluded.html_url,
      homepage = excluded.homepage,
      avatar_url = excluded.avatar_url,
      language = excluded.language,
      license = excluded.license,
      topics = excluded.topics,
      category = excluded.category,
      stars_delta = MAX(0, excluded.stars - github_projects.stars),
      stars = excluded.stars,
      forks = excluded.forks,
      watchers = excluded.watchers,
      open_issues = excluded.open_issues,
      hot_score = excluded.hot_score,
      github_created_at = excluded.github_created_at,
      github_updated_at = excluded.github_updated_at,
      pushed_at = excluded.pushed_at,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at
  `

  for (const batch of chunks(repositoryList, 40)) {
    await session.batch(batch.map(repository => session.prepare(upsertSql).bind(
      repository.id,
      repository.full_name,
      repository.owner.login,
      repository.name,
      repository.description,
      repository.html_url,
      repository.homepage,
      repository.owner.avatar_url,
      repository.language,
      repository.license?.spdx_id || null,
      JSON.stringify(repository.topics || []),
      inferCategory(repository),
      repository.stargazers_count,
      repository.forks_count,
      repository.watchers_count,
      repository.open_issues_count,
      calculateHotScore(repository),
      repository.created_at,
      repository.updated_at,
      repository.pushed_at,
      seenAt,
      seenAt,
      seenAt
    )))
  }

  const syncedProjects = await session.prepare(`
    SELECT id, stars, forks FROM github_projects WHERE last_seen_at = ?
  `).bind(seenAt).all<{ id: number; stars: number; forks: number }>()

  for (const batch of chunks(syncedProjects.results, 80)) {
    await session.batch(batch.map(project => session.prepare(`
      INSERT INTO github_project_snapshots (project_id, stars, forks, captured_at)
      VALUES (?, ?, ?, ?)
    `).bind(project.id, project.stars, project.forks, seenAt)))
  }

  await session.prepare(`
    UPDATE github_project_sync_jobs
    SET status = 'completed', discovered_count = ?, updated_count = ?, error_count = ?,
      error_message = ?, finished_at = ?
    WHERE id = ?
  `).bind(
    repositoryList.length,
    syncedProjects.results.length,
    errors.length,
    errors.length > 0 ? errors.join('; ').slice(0, 4000) : null,
    new Date().toISOString(),
    jobId
  ).run()

  return {
    jobId,
    discoveredCount: repositoryList.length,
    updatedCount: syncedProjects.results.length,
    errorCount: errors.length
  }
}
