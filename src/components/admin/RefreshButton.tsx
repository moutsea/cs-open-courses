'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

/**
 * 重新查一遍当前后台页的数据。router.refresh() 只重跑服务端组件：URL（?days=）、滚动位置、
 * 图表的悬浮 / 聚焦状态都保留；后台页面都是 force-dynamic，所以每次都会重新查 D1。
 */
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      // 不用 disabled：按钮被禁用时键盘焦点会丢到 body 上。
      aria-disabled={pending}
      onClick={() => {
        if (!pending) startTransition(() => router.refresh())
      }}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm transition',
        pending
          ? 'cursor-wait text-slate-500'
          : 'text-slate-300 hover:border-cyan-400/40 hover:text-white'
      ].join(' ')}
    >
      <RefreshCw aria-hidden className={['h-3.5 w-3.5', pending ? 'animate-spin' : ''].join(' ')} />
      {pending ? '刷新中…' : '刷新'}
    </button>
  )
}
