import { getCloudflareContext } from '@opennextjs/cloudflare'
import AdminShell from '@/components/admin/AdminShell'
import { SectionCard } from '@/components/admin/panels'
import { requireAdmin } from '@/lib/adminAuth'
import {
  DEFAULT_COURSE_AI_BASE_URL,
  DEFAULT_COURSE_AI_MODEL,
  readCourseAiChannel
} from '@/lib/courseAiChannel'
import { saveCourseAiChannelAction } from './actions'
import { getSettingsMessage } from './settingsMessages'

export const dynamic = 'force-dynamic'

const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10'

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>
}) {
  await requireAdmin('/admin/settings')
  const [{ status, error }, { env }] = await Promise.all([
    searchParams,
    getCloudflareContext({ async: true }).catch(() => ({ env: {} as { DB?: D1Database; COURSE_SYNC_CONFIG_SECRET?: string } }))
  ])
  const db = (env as { DB?: D1Database }).DB
  const syncSecretConfigured = Boolean((env as { COURSE_SYNC_CONFIG_SECRET?: string }).COURSE_SYNC_CONFIG_SECRET?.trim())

  let config: Awaited<ReturnType<typeof readCourseAiChannel>> = null
  let loadError = ''
  if (db) {
    try {
      config = await readCourseAiChannel(db)
    } catch (cause) {
      loadError = cause instanceof Error ? cause.message : String(cause)
    }
  }

  const message = getSettingsMessage(status, error)

  return (
    <AdminShell>
      <div>
        <h2 className="text-xl font-semibold text-white">课程更新设置</h2>
        <p className="mt-1 text-sm text-slate-400">管理 AI 评审使用的渠道。保存后，下一次 GitHub Actions 自动读取，无需重新发布。</p>
      </div>

      {message ? (
        <p className={`rounded-xl border px-4 py-3 text-sm ${status === 'saved' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200'}`} role="status">
          {message}
        </p>
      ) : null}

      {!syncSecretConfigured ? (
        <SectionCard title="定时任务读取配置尚未启用">
          <p className="text-sm leading-6 text-amber-200">
            请在 Cloudflare 和 GitHub Actions 中配置相同的 <code>COURSE_SYNC_CONFIG_SECRET</code>。未配置时，任务会继续使用现有 GitHub Secrets 回退。
          </p>
        </SectionCard>
      ) : null}

      {!db || loadError ? (
        <SectionCard title="渠道配置暂时不可用" hint="需要 D1 迁移">
          <p className="text-sm leading-6 text-slate-300">
            请执行 <code className="rounded bg-white/10 px-1.5 py-0.5">npm run db:migrate:prod</code>，创建课程 AI 渠道配置表。
          </p>
          {loadError ? <p className="mt-2 font-mono text-xs text-slate-500">{loadError}</p> : null}
        </SectionCard>
      ) : (
        <SectionCard title="AI 模型渠道" hint={config ? '使用 Admin 动态配置' : '尚未覆盖 GitHub Secrets'}>
          <form action={saveCourseAiChannelAction} className="space-y-5">
            <label htmlFor="baseUrl" className="block text-sm font-medium text-slate-200">
              API Base URL
              <input
                id="baseUrl"
                name="baseUrl"
                type="url"
                required
                maxLength={2048}
                defaultValue={config?.baseUrl ?? DEFAULT_COURSE_AI_BASE_URL}
                className={inputClass}
                placeholder="https://your-gateway.example/"
              />
              <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">Anthropic Messages 兼容网关根地址，不要包含 <code>/v1/messages</code>。</span>
            </label>

            <label htmlFor="model" className="block text-sm font-medium text-slate-200">
              模型名称
              <input
                id="model"
                name="model"
                type="text"
                required
                maxLength={128}
                defaultValue={config?.model ?? DEFAULT_COURSE_AI_MODEL}
                className={inputClass}
                placeholder="claude-opus-5"
              />
            </label>

            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-200">
              API Key
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                required={!config}
                maxLength={512}
                className={inputClass}
                placeholder={config ? '留空以保持当前密钥' : '输入 API Key'}
                autoComplete="new-password"
              />
              <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">
                {config ? '密钥已保存。为避免泄露，页面不会回显；留空表示不修改。' : '首次启用动态配置时需要填写。密钥只用于服务端和 GitHub Actions。'}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <button
                type="submit"
                className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                保存渠道配置
              </button>
              <span className="text-xs text-slate-500">下一次任务运行时生效，不触发网站发布。</span>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="配置如何生效">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
          <li>Admin 将渠道保存到 D1，页面不会回显 API Key。</li>
          <li>GitHub Actions 每次运行前，通过带独立密钥的 <code>/api/course-ai/config</code> 接口读取最新值。</li>
          <li>接口未配置或暂时不可用时，自动回退到原有 GitHub Secrets，避免课程更新中断。</li>
        </ol>
      </SectionCard>
    </AdminShell>
  )
}
