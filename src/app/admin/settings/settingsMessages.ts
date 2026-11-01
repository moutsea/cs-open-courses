export const SETTINGS_MESSAGES = {
  saved: '渠道配置已保存，将在下一次课程更新任务中生效。',
  invalid: '请检查 API 地址、模型名和 API Key。首次保存时必须填写 API Key。',
  unavailable: '当前环境没有 D1 数据库绑定，暂时无法保存。',
  'save-failed': '保存失败，请确认已执行 0008_course_ai_channel.sql 迁移后重试。'
} as const

export function getSettingsMessage(status?: string, error?: string): string | undefined {
  if (status === 'saved') return SETTINGS_MESSAGES.saved
  if (!error || !Object.hasOwn(SETTINGS_MESSAGES, error)) return undefined
  return SETTINGS_MESSAGES[error as keyof typeof SETTINGS_MESSAGES]
}
