import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  CourseAiChannelValidationError,
  normalizeCourseAiChannel,
  readCourseAiChannel,
  saveCourseAiChannel
} from '@/lib/courseAiChannel'

/** Authenticated entry points call this after checking the Admin session. */
export async function persistCourseAiChannelForm(formData: FormData): Promise<void> {
  let db: D1Database | undefined
  try {
    const { env } = await getCloudflareContext({ async: true })
    db = (env as { DB?: D1Database }).DB
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Failed to load the Cloudflare context for the course AI channel',
      error: error instanceof Error ? error.message : String(error)
    }))
    redirect('/admin/settings?error=save-failed')
  }
  if (!db) redirect('/admin/settings?error=unavailable')

  try {
    const current = await readCourseAiChannel(db)
    const submittedKey = String(formData.get('apiKey') ?? '').trim()
    const config = normalizeCourseAiChannel({
      baseUrl: formData.get('baseUrl'),
      model: formData.get('model'),
      // Blank means "keep the current secret"; it never round-trips to the browser.
      apiKey: submittedKey || current?.apiKey || ''
    })
    await saveCourseAiChannel(db, config, { preserveApiKey: !submittedKey && Boolean(current?.apiKey) })
  } catch (error) {
    if (error instanceof CourseAiChannelValidationError) {
      redirect('/admin/settings?error=invalid')
    }
    console.error(JSON.stringify({
      message: 'Failed to save course AI channel',
      error: error instanceof Error ? error.message : String(error)
    }))
    redirect('/admin/settings?error=save-failed')
  }

  revalidatePath('/admin/settings')
  redirect('/admin/settings?status=saved')
}
