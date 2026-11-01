'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { persistCourseAiChannelForm } from './persistCourseAiChannelForm'

export async function saveCourseAiChannelAction(formData: FormData): Promise<void> {
  await requireAdmin('/admin/settings')
  await persistCourseAiChannelForm(formData)
}
