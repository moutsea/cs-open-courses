import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const DEFAULT_BATCH_SIZE = 500
const MAX_BATCH_SIZE = 1000
const beijingDay = "strftime('%Y-%m-%d', occurred_at / 1000 + 28800, 'unixepoch')"

type QueryResult = {
  results: Record<string, unknown>[]
}
type Execute = (sql: string) => Promise<QueryResult>
type Progress = { afterId: number; throughId: number; changed: number }

export interface BackfillOptions {
  batchSize?: number
  afterId?: number
  throughId?: number
  onProgress?: (progress: Progress) => void
}

function integer(value: number, name: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`)
  }
  return value
}

/** Walk the primary key once; every SELECT/UPDATE touches at most batchSize rows. */
export async function backfillAnalyticsDays(execute: Execute, options: BackfillOptions = {}) {
  const batchSize = integer(options.batchSize ?? DEFAULT_BATCH_SIZE, 'batch-size', 1, MAX_BATCH_SIZE)
  let afterId = integer(options.afterId ?? 0, 'after-id')
  if (options.throughId !== undefined) integer(options.throughId, 'through-id')

  const trigger = await execute("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'analytics_events_beijing_day_insert'")
  if (trigger.results.length !== 1) throw new Error('Apply D1 migrations 0006/0007 before running the backfill')

  // A fixed high-water mark lets the command finish while the site keeps writing.
  const snapshot = await execute('SELECT COALESCE(MAX(id), 0) AS last_id FROM analytics_events')
  const maxId = integer(Number(snapshot.results[0]?.last_id), 'database max id')
  const throughId = Math.min(options.throughId ?? maxId, maxId)
  let changed = 0
  let batches = 0

  while (afterId < throughId) {
    const next = await execute(`SELECT MAX(id) AS last_id FROM (
      SELECT id FROM analytics_events WHERE id > ${afterId} AND id <= ${throughId}
      ORDER BY id LIMIT ${batchSize}
    )`)
    const lastId = next.results[0]?.last_id
    if (lastId === null) break // Rows may have been deleted by retention while scanning.
    const endId = integer(Number(lastId), 'batch end id', afterId + 1, throughId)
    const result = await execute(`UPDATE analytics_events SET day = ${beijingDay}
      WHERE id > ${afterId} AND id <= ${endId} AND occurred_at > 0
        AND day <> ${beijingDay} RETURNING id`)
    // Wrangler local JSON omits meta.changes; RETURNING works in both D1 modes.
    const batchChanges = integer(result.results.length, 'updated row count', 0, batchSize)
    changed += batchChanges
    batches += 1
    afterId = endId
    // Only publish a resume cursor after the UPDATE has committed successfully.
    options.onProgress?.({ afterId, throughId, changed })
  }

  return { afterId, throughId, changed, batches }
}

export function parseBackfillArgs(args: string[]) {
  let target: '--local' | '--remote' | undefined
  const options: BackfillOptions = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--local' || arg === '--remote') {
      if (target) throw new Error('Choose exactly one of --local or --remote')
      target = arg
    } else if (arg === '--batch-size' || arg === '--after-id' || arg === '--through-id') {
      const raw = args[++index]
      if (!raw || !/^\d+$/.test(raw)) throw new Error(`${arg} requires a non-negative integer`)
      const value = Number(raw)
      if (arg === '--batch-size') options.batchSize = integer(value, 'batch-size', 1, MAX_BATCH_SIZE)
      else if (arg === '--after-id') options.afterId = integer(value, 'after-id')
      else options.throughId = integer(value, 'through-id')
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!target) throw new Error('Choose exactly one of --local or --remote')
  return { target, options }
}

async function main() {
  const { target, options } = parseBackfillArgs(process.argv.slice(2))
  const require = createRequire(import.meta.url)
  const wrangler = join(dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js')
  const projectRoot = fileURLToPath(new URL('../', import.meta.url))
  const run = promisify(execFile)
  const execute: Execute = async sql => {
    const { stdout } = await run(process.execPath, [wrangler, 'd1', 'execute', 'cs-courses', target, '--json', '--command', sql], {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024,
      timeout: 120_000
    })
    const output: unknown = JSON.parse(stdout)
    if (!Array.isArray(output) || output.length !== 1 || output[0].success !== true || !Array.isArray(output[0].results)) {
      throw new Error('Unexpected or unsuccessful Wrangler D1 JSON result')
    }
    return output[0] as QueryResult
  }
  const result = await backfillAnalyticsDays(execute, {
    ...options,
    onProgress: progress => console.log(`Committed through id ${progress.afterId}/${progress.throughId}; updated ${progress.changed}. Resume: --after-id ${progress.afterId} --through-id ${progress.throughId}`)
  })
  console.log(`Backfill complete (${target}): ${result.batches} batches, ${result.changed} rows updated.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
