import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_COURSE_AI_CONFIG_URL = 'https://www.cs61bbeyond.com/api/course-ai/config'

export class CourseAiConfigWriteError extends Error {
  constructor() {
    super('Failed to write the course AI configuration; refusing to continue with a potentially partial GITHUB_ENV update')
  }
}

const MAX_BASE_URL_LENGTH = 2_048
const MAX_MODEL_LENGTH = 256
const MAX_API_KEY_LENGTH = 4_096
const SINGLE_LINE_FORBIDDEN_CHARACTERS = /[\x00-\x1f\x7f\u2028\u2029]/

function validateSingleLineString(value, name, maximumLength) {
  if (
    typeof value !== 'string'
    || value.trim().length === 0
    || value.length > maximumLength
    || SINGLE_LINE_FORBIDDEN_CHARACTERS.test(value)
  ) {
    throw new Error(`${name} must be a non-empty single-line string of at most ${maximumLength} characters`)
  }
  return value
}

export function validateCourseAiConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Course AI config response must be a JSON object')
  }

  const baseUrl = validateSingleLineString(value.baseUrl, 'baseUrl', MAX_BASE_URL_LENGTH)
  const model = validateSingleLineString(value.model, 'model', MAX_MODEL_LENGTH)
  const apiKey = validateSingleLineString(value.apiKey, 'apiKey', MAX_API_KEY_LENGTH)

  let parsedBaseUrl
  try {
    parsedBaseUrl = new URL(baseUrl)
  } catch {
    throw new Error('baseUrl must be a valid HTTPS URL')
  }

  if (
    parsedBaseUrl.protocol !== 'https:'
    || !parsedBaseUrl.hostname
    || parsedBaseUrl.username
    || parsedBaseUrl.password
    || parsedBaseUrl.search
    || parsedBaseUrl.hash
  ) {
    throw new Error('baseUrl must be HTTPS and must not contain credentials, a query, or a hash')
  }

  return { baseUrl, model, apiKey }
}

function errorMessage(error) {
  return error instanceof Error && error.message ? error.message : 'Unknown error'
}

/**
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   fetchImpl?: (url: string, options: { headers: Record<string, string>, signal: AbortSignal, redirect: 'error' }) => Promise<{ ok: boolean, status: number, json: () => Promise<unknown> }>,
 *   appendFileImpl?: (path: string, contents: string, encoding: string) => Promise<void>,
 *   log?: (message: string) => void,
 *   warn?: (message: string) => void
 * }} [options]
 */
export async function loadCourseAiConfig({
  env = process.env,
  fetchImpl = fetch,
  appendFileImpl = appendFile,
  log = console.log,
  warn = console.warn
} = {}) {
  const secret = env.COURSE_SYNC_CONFIG_SECRET
  if (!secret) {
    warn('::warning::COURSE_SYNC_CONFIG_SECRET is not set; keeping the fallback course AI configuration.')
    return false
  }

  try {
    if (!env.GITHUB_ENV) throw new Error('GITHUB_ENV is not set')

    const response = await fetchImpl(env.COURSE_AI_CONFIG_URL || DEFAULT_COURSE_AI_CONFIG_URL, {
      headers: {
        accept: 'application/json',
        'x-course-sync-secret': secret
      },
      signal: AbortSignal.timeout(20_000),
      // Never forward the configuration sync secret to a redirected origin.
      redirect: 'error'
    })
    if (!response.ok) throw new Error(`Course AI config request failed with HTTP ${response.status}`)

    let responseConfig
    try {
      responseConfig = await response.json()
    } catch {
      // JSON parser messages can quote the response body, which may contain the new API key.
      throw new Error('Course AI config response was not valid JSON')
    }
    const config = validateCourseAiConfig(responseConfig)
    const githubEnv = [
      `COURSE_AI_BASE_URL=${config.baseUrl}`,
      `COURSE_AI_MODEL=${config.model}`,
      `COURSE_AI_API_KEY=${config.apiKey}`,
      ''
    ].join('\n')

    // GitHub workflow commands unescape %25; escape percent signs so the exact key is masked.
    log(`::add-mask::${config.apiKey.replace(/%/g, '%25')}`)
    try {
      await appendFileImpl(env.GITHUB_ENV, githubEnv, 'utf8')
    } catch {
      // A partial append cannot be rolled back. Never combine it with fallback credentials.
      throw new CourseAiConfigWriteError()
    }
    log('Loaded the remote course AI configuration.')
    return true
  } catch (error) {
    if (error instanceof CourseAiConfigWriteError) throw error
    warn(`::warning::Could not load the remote course AI configuration (${errorMessage(error)}); keeping the fallback course AI configuration.`)
    return false
  }
}

export async function main() {
  return loadCourseAiConfig()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(error => {
    console.error(`::error::${errorMessage(error)}`)
    process.exitCode = 1
  })
}
