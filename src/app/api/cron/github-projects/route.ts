import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { syncPopularGithubProjects } from '@/lib/githubProjects/sync'

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ])
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash))
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const expectedSecret = env.GITHUB_PROJECTS_CRON_SECRET?.trim()
    const providedSecret = request.headers.get('x-github-projects-secret')?.trim() || ''

    if (!expectedSecret) {
      return NextResponse.json({ error: 'Sync secret is not configured' }, { status: 503 })
    }
    if (!providedSecret || !(await secretsMatch(providedSecret, expectedSecret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!env.GITHUB_TOKEN?.trim()) {
      return NextResponse.json({ error: 'GitHub token is not configured' }, { status: 503 })
    }
    if (!env.DB) {
      return NextResponse.json({ error: 'Database binding is unavailable' }, { status: 503 })
    }

    const result = await syncPopularGithubProjects(env.DB, env.GITHUB_TOKEN.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error(JSON.stringify({
      message: 'GitHub project sync route failed',
      error: error instanceof Error ? error.message : String(error)
    }))
    return NextResponse.json({ error: 'GitHub project sync failed' }, { status: 500 })
  }
}
