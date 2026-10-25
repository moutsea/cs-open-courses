const HOURS_LABELS = [
  '预计学时', '学时', 'class hour', 'class hours', 'learning hours',
  'estimated hours', 'estimated study hours', 'estimated study time',
  'estimated time commitment', 'time commitment', 'estimated workload'
]

/** Shared by the catalog parser and the course detail facts. */
export function isStudyHoursLabel(label: string): boolean {
  return HOURS_LABELS.includes(label.trim().toLowerCase())
}

/** Only explicit totals can be localized as a number or emitted as an ISO duration. */
export function totalStudyHours(text: string | undefined): number | undefined {
  const match = text?.trim().match(/^(\d+(?:\.\d+)?)\s*(?:小时|学时|hours?|hrs?|h)?$/i)
  const hours = match ? Number(match[1]) : undefined
  return hours !== undefined && Number.isFinite(hours) && hours > 0 ? hours : undefined
}
