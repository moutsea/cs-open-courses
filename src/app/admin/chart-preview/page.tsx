import Link from 'next/link'
import { DailyBarChart } from '@/components/admin/DailyBarChart'
import { requireAdmin } from '@/lib/adminAuth'

// 受后台认证保护的图表交互烟测页，固定数据供键盘、悬停与触屏回归使用。
export default async function ChartPreview() {
  await requireAdmin('/admin/chart-preview')

  const span = (count: number, offset = 0) =>
    Array.from({ length: count }, (_, index) => {
      const time = Date.UTC(2026, 6, 1) + (index + offset) * 86_400_000
      return {
        day: new Date(time).toISOString().slice(0, 10),
        value: 100 + ((index * 37) % 900),
        extras: [{ label: '日 UV', value: 10 + (index % 40) }]
      }
    })

  return (
    <main className="p-6">
      <Link href="/admin" className="text-cyan-300">
        返回后台
      </Link>
      <h1 className="mt-4 mb-3 text-white">90 天</h1>
      <div id="chart-90" className="max-w-[900px]">
        <DailyBarChart points={span(90)} unit="PV" />
      </div>
      <h1 className="mt-8 mb-3 text-white">7 天</h1>
      <div id="chart-7" className="max-w-[900px]">
        <DailyBarChart points={span(7)} unit="PV" />
      </div>
      <Link href="/admin/gaps" id="after-link" className="mt-8 block text-cyan-300">
        后面的链接
      </Link>
    </main>
  )
}
