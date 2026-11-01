export const DEFAULT_COURSE_AI_BASE_URL = 'https://cfjwlpro.com/'
export const DEFAULT_COURSE_AI_MODEL = 'claude-opus-5'

export interface CourseAiChannelConfig {
  baseUrl: string
  model: string
  apiKey: string
}

interface CourseAiChannelRow {
  base_url: string
  model: string
  api_key: string
  updated_at: string
}

export class CourseAiChannelValidationError extends Error {}

// Keep Admin validation aligned with scripts/load-course-ai-config.mjs.
const SINGLE_LINE_FORBIDDEN_CHARACTERS = /[\x00-\x1f\x7f\u2028\u2029]/

/** Validate the complete payload once, before storing it or sending it to Actions. */
export function normalizeCourseAiChannel(input: {
  baseUrl: unknown
  model: unknown
  apiKey: unknown
}): CourseAiChannelConfig {
  const rawBaseUrl = typeof input.baseUrl === 'string' ? input.baseUrl.trim() : ''
  const model = typeof input.model === 'string' ? input.model.trim() : ''
  const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : ''

  if (!rawBaseUrl || rawBaseUrl.length > 2_048 || SINGLE_LINE_FORBIDDEN_CHARACTERS.test(rawBaseUrl)) {
    throw new CourseAiChannelValidationError('A valid API base URL is required')
  }
  let baseUrl: URL
  try {
    baseUrl = new URL(rawBaseUrl)
  } catch {
    throw new CourseAiChannelValidationError('A valid API base URL is required')
  }
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new CourseAiChannelValidationError('The API base URL must be an HTTPS URL without credentials, query, or hash')
  }
  if (!model || model.length > 128 || SINGLE_LINE_FORBIDDEN_CHARACTERS.test(model)) {
    throw new CourseAiChannelValidationError('A valid model name is required')
  }
  if (!apiKey || apiKey.length > 512 || SINGLE_LINE_FORBIDDEN_CHARACTERS.test(apiKey)) {
    throw new CourseAiChannelValidationError('A valid API key is required')
  }

  return { baseUrl: baseUrl.toString(), model, apiKey }
}

export async function readCourseAiChannel(db: D1Database): Promise<(CourseAiChannelConfig & { updatedAt: string }) | null> {
  const row = await db.prepare(
    'SELECT base_url, model, api_key, updated_at FROM course_ai_channel WHERE id = 1'
  ).first<CourseAiChannelRow>()
  if (!row) return null
  return {
    baseUrl: row.base_url,
    model: row.model,
    apiKey: row.api_key,
    updatedAt: row.updated_at
  }
}

export async function saveCourseAiChannel(
  db: D1Database,
  config: CourseAiChannelConfig,
  options: { preserveApiKey?: boolean } = {}
): Promise<void> {
  await db.prepare(
    `INSERT INTO course_ai_channel (id, base_url, model, api_key, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       base_url = excluded.base_url,
       model = excluded.model,
       api_key = CASE WHEN ? = 1 THEN course_ai_channel.api_key ELSE excluded.api_key END,
       updated_at = excluded.updated_at`
  ).bind(config.baseUrl, config.model, config.apiKey, new Date().toISOString(), options.preserveApiKey ? 1 : 0).run()
}
