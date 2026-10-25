'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { isTrackedPage } from '@/lib/pageViewPaths'

/**
 * 页面访问上报。只在页面真的展示给用户之后才发请求，且每次浏览用一个新的
 * 随机 eventId —— D1 上的唯一索引会把 StrictMode 重跑、重传、BFCache 恢复产生的
 * 重复事件吞掉，所以计数不会翻倍。
 *
 * 这里刻意**不用** `useSearchParams`：它会要求外层有 Suspense 边界，否则整站
 * 预渲染的课程页会一起退化成客户端渲染。UTM 参数直接从 `window.location.search`
 * 读，反正在 effect 里跑，本来就只有浏览器端才有值。
 */

interface Visit {
  key: string
  eventId: string
  sent: boolean
  referrer: string
}

function originOnly(referrer: string): string {
  try {
    return new URL(referrer).origin
  } catch {
    return ''
  }
}

export default function PageViewTracker() {
  const pathname = usePathname()
  const visit = useRef<Visit | null>(null)

  useEffect(() => {
    if (!isTrackedPage(pathname)) return
    const search = window.location.search

    const key = `${pathname}${search}`
    if (visit.current?.key !== key) {
      visit.current = {
        key,
        eventId: crypto.randomUUID(),
        sent: false,
        // 站内跳转的 referrer 记成自己的 origin，服务端会把它折算成「直接访问」。
        referrer: visit.current ? window.location.origin : originOnly(document.referrer)
      }
    }

    const params = new URLSearchParams(search)
    const send = () => {
      const current = visit.current
      // 标签页切到后台时不算浏览；浏览器预渲染/隐藏时也不发。
      if (document.visibilityState !== 'visible' || !current || current.sent) return
      current.sent = true
      // 只发路径与三个 UTM 字段：筛选参数、订单号之类不进采集请求。
      void fetch('/api/analytics/page-view', {
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
        referrerPolicy: 'no-referrer',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventId: current.eventId,
          pathname,
          referrer: current.referrer,
          utmSource: (params.get('utm_source') ?? '').slice(0, 60),
          utmMedium: (params.get('utm_medium') ?? '').slice(0, 60),
          utmCampaign: (params.get('utm_campaign') ?? '').slice(0, 60)
        })
      }).catch(() => {
        // 统计失败不影响页面本身。
      })
    }

    // 从 BFCache 恢复时要重新计一次浏览（用户确实又看到了这个页面）。
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted || !visit.current) return
      visit.current = { ...visit.current, eventId: crypto.randomUUID(), sent: false, referrer: window.location.origin }
      send()
    }

    send()
    document.addEventListener('visibilitychange', send)
    window.addEventListener('pageshow', restore)
    return () => {
      document.removeEventListener('visibilitychange', send)
      window.removeEventListener('pageshow', restore)
    }
  }, [pathname])

  return null
}
