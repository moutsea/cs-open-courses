/**
 * 站外的自家项目链接。
 *
 * Header 和 Footer 各有一套入口，站点主机名与「中文站要不要挂 /zh」的规则放在这里，
 * 免得两处各写一遍——aiinide 曾经在 Header 里写死正式站，在 Footer 里带 /zh。
 */
export interface ProjectLink {
  name: string
  /** 站点根地址，语言前缀由 `projectHref` 决定。 */
  href: string
  /** 该站点是否有中文版（有才加 /zh）。 */
  localized: boolean
  description?: { en: string; zh: string }
}

export const OTHER_PROJECTS: ProjectLink[] = [
  { name: 'Code By AI', href: 'https://www.codebyai.net', localized: true },
  { name: 'Claude Code Ide', href: 'https://aiinide.com', localized: true },
  { name: 'Codex Lab', href: 'https://www.codeilab.com', localized: true },
  {
    name: 'KimiSeek',
    href: 'https://kimiseek.app',
    localized: false,
    description: { en: 'Chinese AI model hub', zh: '国产模型聚合站' }
  },
  { name: 'blog', href: 'https://coderliang.com', localized: false },
  { name: 'Koinote', href: 'https://koinote.app', localized: false },
  { name: 'WeChatAI', href: 'https://wechatai.app', localized: false }
]

/** 中文站给有中文版的站点挂 `/zh`；英文站一律用根地址。 */
export function projectHref(project: ProjectLink, locale: string): string {
  return locale !== 'en' && project.localized ? `${project.href}/zh` : project.href
}

/** Header 顶部菜单里的四项（与 Footer 的自家项目共用同一张表）。 */
const HEADER_TOOL_NAMES = ['Claude Code Ide', 'Codex Lab', 'Code By AI', 'KimiSeek']

const HEADER_TOOL_LABELS: Record<string, string> = {
  'Claude Code Ide': 'Claude Code',
  'Codex Lab': 'Codex',
  'Code By AI': 'Gemini'
}

export interface AiToolLink {
  label: string
  href: string
  description?: string
}

export function aiToolLinks(locale: string): AiToolLink[] {
  return HEADER_TOOL_NAMES.map(name => {
    const project = OTHER_PROJECTS.find(item => item.name === name)
    if (!project) throw new Error(`Unknown project link: ${name}`)
    return {
      label: HEADER_TOOL_LABELS[name] ?? name,
      href: projectHref(project, locale),
      description: project.description?.[locale === 'zh' ? 'zh' : 'en']
    }
  })
}
