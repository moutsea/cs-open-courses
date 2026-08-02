import openNextWorker from './.open-next/worker.js'
import { syncPopularGithubProjects } from './src/lib/githubProjects/sync'

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

export default {
  fetch: openNextWorker.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(runGithubProjectSync(env).catch(error => {
      console.error(JSON.stringify({
        message: 'Scheduled GitHub project sync failed',
        error: error instanceof Error ? error.message : String(error)
      }))
      throw error
    }))
  }
} satisfies ExportedHandler<CloudflareEnv>
