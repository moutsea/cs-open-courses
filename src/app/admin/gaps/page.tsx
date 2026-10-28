import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import AdminShell from '@/components/admin/AdminShell'
import { BarList, SectionCard, StatCard } from '@/components/admin/panels'
import { formatNumber } from '@/lib/format'
import { loadSearchTerms, normalizeDays } from '@/lib/analyticsReport'
import { requireAdmin } from '@/lib/adminAuth'
import { countSearchHits, getContentIndex } from '@/lib/searchGapIndex'
import { buildSearchIndex } from '@/lib/searchIndex'
import {
  CAPABILITY_LABELS,
  POLICY_CAPABILITIES,
  analyzeSearchGaps,
  type GapRow,
  type GapStatus
} from '@/lib/searchGaps'

export const dynamic = 'force-dynamic'

const RANGES = [7, 30, 90] as const

const STATUS_META: Record<GapStatus, { label: string; className: string }> = {
  covered: { label: '已覆盖', className: 'bg-emerald-400/15 text-emerald-200' },
  page_gap: { label: '页面缺内容', className: 'bg-amber-400/15 text-amber-200' },
  missing_course: { label: '站内没有这门课', className: 'bg-rose-400/15 text-rose-200' },
  missing_page: { label: '没有对应页面', className: 'bg-sky-400/15 text-sky-200' }
}

const PRIORITY_META: Record<string, string> = {
  P0: 'bg-rose-400 text-slate-950',
  P1: 'bg-amber-400 text-slate-950',
  P2: 'bg-white/15 text-slate-300'
}

function StatusChip({ status }: { status: GapStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}

function Row({ row }: { row: GapRow }) {
  const missing = row.missing.map(capability => CAPABILITY_LABELS[capability]).join('、')
  return (
    <tr className="border-t border-white/5 align-top">
      <td className="py-2 pr-3">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${PRIORITY_META[row.priority]}`}
        >
          {row.priority}
        </span>
      </td>
      <td className="py-2 pr-3 text-[13px] text-white">
        <span className="break-all">{row.term}</span>
      </td>
      <td className="py-2 pr-3 text-right text-[13px] tabular-nums text-white">{row.count}</td>
      <td className="py-2 pr-3">
        <StatusChip status={row.status} />
        {row.matched ? (
          <Link
            href={row.matched.path}
            className="ml-2 break-all text-[12px] text-cyan-300/80 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200"
          >
            {row.matched.label}
          </Link>
        ) : null}
        {missing ? <div className="mt-1 text-[11px] text-amber-200/80">缺：{missing}</div> : null}
      </td>
      <td className="py-2 text-[12.5px] leading-relaxed text-slate-400">{row.suggestion}</td>
    </tr>
  )
}

/** 窄屏用卡片，表格在 375px 上只能看到半列。 */
function GapCard({ row }: { row: GapRow }) {
  const missing = row.missing.map(capability => CAPABILITY_LABELS[capability]).join('、')
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${PRIORITY_META[row.priority]}`}
        >
          {row.priority}
        </span>
        <span className="min-w-0 flex-1 break-all text-[13px] text-white">{row.term}</span>
        <span className="shrink-0 text-[12px] tabular-nums text-slate-400">{row.count} 次</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusChip status={row.status} />
        {row.matched ? (
          <Link
            href={row.matched.path}
            className="break-all text-[12px] text-cyan-300/80 underline decoration-cyan-300/30 underline-offset-2"
          >
            {row.matched.label}
          </Link>
        ) : null}
      </div>
      {missing ? <div className="mt-1 text-[11px] text-amber-200/80">缺：{missing}</div> : null}
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{row.suggestion}</p>
    </li>
  )
}

export default async function AdminGapsPage({
  searchParams
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days = normalizeDays(params.days ?? '90')
  const currentPath = `/admin/gaps?days=${days}`
  await requireAdmin(currentPath)

  const { env } = await getCloudflareContext({ async: true }).catch(() => ({
    env: {} as { DB?: D1Database }
  }))
  const db = (env as { DB?: D1Database }).DB

  let terms: Awaited<ReturnType<typeof loadSearchTerms>> = []
  let error = ''
  if (db) {
    try {
      terms = await loadSearchTerms(db, days, 300)
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause)
    }
  }

  // 内容索引和搜索命中数都按部署缓存（见 searchGapIndex.ts），这里只剩 D1 查询和匹配。
  const index = await getContentIndex('zh')

  // 「已覆盖」只代表页面具备该能力，不代表站内搜索能搜到（搜索走的是另一套生成索引）。
  // 这里顺手算一次命中数，让报表能标出「判定覆盖但一条都搜不到」的词。
  const searchIndex = await buildSearchIndex()

  const report = analyzeSearchGaps(
    terms.map(term => ({ term: term.key, count: term.n })),
    index,
    { maxRows: 200, countSearchHits: term => countSearchHits(term, searchIndex) }
  )

  // 「最缺的能力」里把政策能力排到后面并标注：它们不是行动项。
  const actionableCapabilities = report.topMissing.filter(item => !POLICY_CAPABILITIES.has(item.capability))
  const policyCapabilities = report.topMissing.filter(item => POLICY_CAPABILITIES.has(item.capability))

  // 政策缺口（笔记 / 历年题 / 答案 / 下载）单独列，别跟能补的缺口混在一起。
  const actionable = report.rows.filter(row => row.status !== 'covered' && !row.policy)
  const policyRows = report.rows.filter(row => row.policy)
  const searchMissRows = report.rows.filter(row => row.status === 'covered' && row.searchHits === 0)
  const coveredRows = report.rows.filter(row => row.status === 'covered')
  // 「有缺口」只算能动手的：政策缺口（笔记/真题/答案/下载）另有分组。
  const gapCount =
    report.summary.pageGap -
    report.summary.policyGap +
    report.summary.missingCourse +
    report.summary.missingPage
  const noData = !db || terms.length === 0

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">内容缺口</h1>
          <p className="mt-1 text-sm text-slate-400">
            用户搜了、但站内没答上来的词 · 最近 {days} 天 · 匹配{' '}
            {formatNumber(index.entries.length)} 个页面
          </p>
        </div>
        <nav className="flex items-center gap-1.5">
          {RANGES.map(range => (
            <Link
              key={range}
              href={`/admin/gaps?days=${range}`}
              className={[
                'rounded-lg px-3 py-1.5 text-[13px] transition',
                range === days
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 text-slate-300 hover:bg-white/[0.06]'
              ].join(' ')}
            >
              {range} 天
            </Link>
          ))}
        </nav>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          读取搜索词失败：{error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="搜索词"
          value={formatNumber(report.summary.terms)}
          hint={`${formatNumber(report.summary.searches)} 次搜索`}
        />
        <StatCard label="有缺口" value={formatNumber(gapCount)} hint="需要补内容或补页面" />
        <StatCard
          label="页面缺内容"
          value={formatNumber(report.summary.pageGap)}
          hint={`其中 ${formatNumber(report.summary.policyGap)} 个是已决定不做的素材`}
        />
        <StatCard
          label="已覆盖"
          value={formatNumber(report.summary.covered)}
          hint={
            report.summary.searchMiss > 0
              ? `其中 ${formatNumber(report.summary.searchMiss)} 个词站内搜索 0 条`
              : `${formatNumber(report.summary.missingCourse)} 个词指向站内没有的课`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="最缺的能力" hint="按搜索次数 · 带「不做」的几项站内不提供">
          <BarList
            rows={[...actionableCapabilities, ...policyCapabilities].map(item => ({
              key: `${CAPABILITY_LABELS[item.capability]}${
                POLICY_CAPABILITIES.has(item.capability) ? ' · 不做' : ''
              }（${item.terms.slice(0, 2).join(' / ')}）`,
              n: item.searches
            }))}
            empty="没有能力缺口 —— 要么没数据，要么想找的页面都答上了"
          />
        </SectionCard>

        <SectionCard title="站内没有的课程" hint="值得新增的课程页">
          {report.missingCourses.length === 0 ? (
            <p className="text-sm text-slate-500">用户没搜过站外课程码</p>
          ) : (
            <ul className="space-y-2">
              {report.missingCourses.map(item => (
                <li key={item.code} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-mono text-[13px] font-medium text-white">
                      {item.code}
                    </span>
                    <span className="min-w-0 break-all text-[12px] text-slate-500">
                      {item.terms.join(' / ')}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-[13px] tabular-nums text-cyan-300">
                    {item.searches} 次
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="缺口清单"
        hint={
          noData ? '没有搜索数据' : `共 ${formatNumber(actionable.length)} 条可行动项，按优先级排序`
        }
      >
        {noData ? (
          <p className="text-sm text-slate-500">
            {db
              ? '还没有搜索事件。等真实流量进来（或本地灌种子数据）再看这里。'
              : '当前运行环境没有 D1 绑定（本地 next dev 属于这种情况）。'}
          </p>
        ) : actionable.length === 0 ? (
          <p className="text-sm text-slate-500">所有搜索词都命中了能回答它的页面。</p>
        ) : (
          <>
            <ul className="space-y-2 sm:hidden">
              {actionable.map(row => (
                <GapCard key={`${row.term}-${row.status}`} row={row} />
              ))}
            </ul>
            <div className="-mx-1 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.07em] text-slate-500">
                    <th className="whitespace-nowrap pb-2 pr-3 font-medium">优先级</th>
                    <th className="whitespace-nowrap pb-2 pr-3 font-medium">搜索词</th>
                    <th className="whitespace-nowrap pb-2 pr-3 text-right font-medium">次数</th>
                    <th className="whitespace-nowrap pb-2 pr-3 font-medium">判定</th>
                    <th className="whitespace-nowrap pb-2 font-medium">建议动作</th>
                  </tr>
                </thead>
                <tbody>
                  {actionable.map(row => (
                    <Row key={`${row.term}-${row.status}`} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="报表说覆盖，搜索却搜不到"
        hint={`${formatNumber(report.summary.searchMiss)} 个词：能力表判定齐全，但 /api/search 返回 0 条`}
      >
        {searchMissRows.length === 0 ? (
          <p className="text-sm text-slate-500">没有这种情况。</p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {searchMissRows.slice(0, 40).map(row => (
              <li
                key={row.term}
                className="flex min-w-0 items-baseline justify-between gap-2 text-[13px]"
              >
                <span className="min-w-0 truncate text-slate-300">{row.term}</span>
                <span className="shrink-0 text-[12px] tabular-nums text-slate-500">
                  {row.count} 次
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="已决定不做"
        hint={`笔记 / 历年题 / 答案 / 下载 · ${formatNumber(report.summary.policyGap)} 个词，优先级已降一档`}
      >
        {policyRows.length === 0 ? (
          <p className="text-sm text-slate-500">暂无</p>
        ) : (
          <details>
            <summary className="cursor-pointer text-[13px] text-slate-400 hover:text-slate-200">
              展开 {formatNumber(policyRows.length)} 个词
              {report.summary.policyGap > policyRows.length
                ? `（共 ${formatNumber(report.summary.policyGap)} 个，按次数取前 ${formatNumber(policyRows.length)}）`
                : ''}
              （看看用户到底在要什么）
            </summary>
            <ul className="mt-2 space-y-1.5">
              {policyRows.map(row => (
                <li
                  key={row.term}
                  className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[13px]"
                >
                  <span className="font-mono text-[11px] text-slate-500">{row.priority}</span>
                  <span className="min-w-0 break-all text-slate-300">{row.term}</span>
                  <span className="text-[12px] tabular-nums text-slate-500">{row.count} 次</span>
                  <span className="text-[12px] text-slate-600">
                    → {row.matched?.label ?? '—'}（缺
                    {row.missing.map(capability => CAPABILITY_LABELS[capability]).join('、')}）
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </SectionCard>

      <SectionCard title="已覆盖的词" hint="用来确认匹配没跑偏">
        {coveredRows.length === 0 ? (
          <p className="text-sm text-slate-500">暂无</p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {coveredRows
              .slice(0, 40)
              .map(row => (
                <li
                  key={row.term}
                  className="flex min-w-0 items-baseline justify-between gap-2 text-[13px]"
                >
                  <span className="min-w-0 truncate text-slate-300">{row.term}</span>
                  <span className="min-w-0 flex-1 truncate text-right text-[12px] text-slate-500">
                    → {row.matched?.label}
                    <span className="ml-1 text-slate-600">（{row.matched?.via}）</span>
                    {row.searchHits === 0 ? (
                      <span className="ml-1 text-rose-300/90">搜不到</span>
                    ) : null}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </SectionCard>

      <p className="text-[11px] leading-relaxed text-slate-600">
        规则：先认课程码（cs61b / 6.824 /
        15-445），再认完整标题、分类、大学、枢纽页，最后才退回单个词； 意图词（教材 / 视频 / 笔记 /
        lab / 中文 / pdf / 先修 / 难度 / 路线）和落地页已有能力比对，缺什么就报什么。
        笔记、历年题、PDF 下载站内一律没有，这类词恒为缺口 —— 这是有意的（PDF 不做，见
        <Link href="/admin/analytics?days=90" className="mx-1 text-cyan-300/80 hover:text-cyan-200">
          流量看板
        </Link>
        的说明），所以它们被降一档、单独归到「已决定不做」。
        「已覆盖」只代表页面具备该能力，不代表搜索能搜到：搜索走的是另一套生成索引，两者对不上时看
        「报表说覆盖，搜索却搜不到」。
      </p>
    </AdminShell>
  )
}
