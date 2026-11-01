import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { readCourseAiChannel } from '@/lib/courseAiChannel'

export const dynamic = 'force-dynamic'

function configResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, private' }
  })
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ])
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash))
}

/** Machine-only channel configuration. The response contains a secret and is never cached. */
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const expectedSecret = (env as { COURSE_SYNC_CONFIG_SECRET?: string }).COURSE_SYNC_CONFIG_SECRET?.trim()
    const providedSecret = request.headers.get('x-course-sync-secret')?.trim() || ''

    if (!expectedSecret) {
      return configResponse({ error: 'Configuration sync is not configured' }, 503)
    }
    if (!providedSecret || !(await secretsMatch(providedSecret, expectedSecret))) {
      return configResponse({ error: 'Unauthorized' }, 401)
    }
    if (!env.DB) {
      return configResponse({ error: 'Database binding is unavailable' }, 503)
    }

    const config = await readCourseAiChannel(env.DB)
    if (!config) {
      return configResponse({ error: 'No Admin channel override is configured' }, 404)
    }
    return configResponse({ baseUrl: config.baseUrl, model: config.model, apiKey: config.apiKey })
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Course AI configuration route failed',
      error: error instanceof Error ? error.message : String(error)
    }))
    return configResponse({ error: 'Course AI configuration is unavailable' }, 503)
  }
}
