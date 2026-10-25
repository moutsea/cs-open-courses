import openNextWorker from './.open-next/worker.js'
import { syncPopularGithubProjects } from './src/lib/githubProjects/sync'
import { canonicalRedirect, shouldNoindex } from './src/lib/canonicalRedirect'
import { purgeAnalyticsEvents } from './src/lib/analyticsRetention'

async function runGithubProjectSync(
  env: CloudflareEnv
): Promise<void> {
  const token = env.GITHUB_TOKEN?.trim()
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN')
  }
  if (!env.DB) {
    throw new Error('Missing DB binding')
  }
  await syncPopularGithubProjects(env.DB, token)
}

/** 埋点表没有 TTL，靠每日 cron 按保留期删旧数据。 */
async function runAnalyticsRetention(env: CloudflareEnv): Promise<void> {
  if (!env.DB) return
  const { cutoffDay, deleted } = await purgeAnalyticsEvents(env.DB)
  if (deleted > 0) {
    console.log(JSON.stringify({ message: 'Analytics retention purged', cutoffDay, deleted }))
  }
}

/**
 * 给非正式域名的响应补 `X-Robots-Tag: noindex`。
 *
 * wrangler 已关掉 workers_dev / preview_urls，但只要有别的域名指向同一个 worker
 * （临时预览域、别人的自定义域），内容就会被重复收录。这里统一打标记，避免和正式域抢排名。
 */
function withNoindexOnNonProductionHost(request: Request, response: Response): Response {
  if (!shouldNoindex(new URL(request.url).hostname)) return response
  // 101 是 WebSocket 升级响应，拷贝 body 会把它弄坏。
  if (response.status === 101 || !response.body) return response
  const headers = new Headers(response.headers)
  headers.set('x-robots-tag', 'noindex')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request, env, ctx) {
    const destination = canonicalRedirect(new URL(request.url))
    if (destination) return Response.redirect(destination.toString(), 308)
    return withNoindexOnNonProductionHost(request, await openNextWorker.fetch!(request, env, ctx))
  },
  scheduled(controller, env, ctx) {
    const job = controller.cron === '17 3 * * *'
      ? Promise.all([runGithubProjectSync(env), runAnalyticsRetention(env)])
      : Promise.resolve()
    ctx.waitUntil(job.catch(error => {
      console.error(JSON.stringify({
        message: 'Scheduled website job failed',
        cron: controller.cron,
        error: error instanceof Error ? error.message : String(error)
      }))
      throw error
    }))
  }
} satisfies ExportedHandler<CloudflareEnv>
