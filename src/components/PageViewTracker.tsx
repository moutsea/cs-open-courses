'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { isTrackedPage } from '@/lib/pageViewPaths'
import { readPageViewAttribution, storePageViewAttribution, type PageViewAttribution } from '@/lib/pageViewAttribution'

/**
 * 页面访问上报。只在页面真的展示给用户之后才发请求，且每次浏览用一个新的
 * 随机 eventId —— D1 上的唯一索引会把 StrictMode 重跑、重传产生的重复事件吞掉。
 * BFCache 恢复算一次新浏览，但继续沿用该页面原有的入口来源。
 *
 * PV 仍按 pathname 变化计数。来源快照由归因模块在 History API 写入时同步，
 * 查询参数、锚点或相同 URL 的导航都不会增加 PV，也不影响页面预渲染。
 */

interface Visit {
  key: string
  eventId: string
  sent: boolean
  inFlight: boolean
  retryRequested: boolean
}

export default function PageViewTracker() {
  const pathname = usePathname()
  const visit = useRef<Visit | null>(null)
  const attribution = useRef<PageViewAttribution | null>(null)

  useEffect(() => {
    if (!isTrackedPage(pathname)) return
    attribution.current ??= readPageViewAttribution()
    const key = pathname
    if (visit.current?.key !== key) {
      visit.current = {
        key,
        eventId: crypto.randomUUID(),
        sent: false,
        inFlight: false,
        retryRequested: false
      }
    }

    const send = (retryIfInFlight = false) => {
      const current = visit.current
      const source = attribution.current
      // 标签页切到后台时不算浏览；浏览器预渲染/隐藏时也不发。
      if (document.visibilityState !== 'visible' || !current || current.sent || !source) return
      // BFCache 恢复先变为可见，再派发 pageshow；路由上下文可能尚未跟上地址栏。
      // 所有恢复入口都等待目标路径，避免把冻结时未展示的旧页计为一次浏览。
      if (current.key !== window.location.pathname || current.key !== pathname) return
      if (current.inFlight) {
        if (retryIfInFlight) current.retryRequested = true
        return
      }
      current.inFlight = true
      storePageViewAttribution(source)
      // 只发路径、来源 origin 与三个 UTM 字段，不携带其它查询参数。
      void (async () => {
        try {
          const response = await fetch('/api/analytics/page-view', {
            method: 'POST',
            credentials: 'omit',
            keepalive: true,
            referrerPolicy: 'no-referrer',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              eventId: current.eventId,
              pathname,
              ...source
            })
          })
          current.sent = response.ok
        } catch {
          // 在线信号若在请求完成前到达，会在 finally 中合并成一次重试；不启动轮询。
        } finally {
          current.inFlight = false
          const shouldRetry = current.retryRequested && !current.sent
          current.retryRequested = false
          if (shouldRetry && visit.current === current && document.visibilityState === 'visible') {
            queueMicrotask(send)
          }
        }
      })()
    }

    // 从 BFCache 恢复时要重新计一次浏览（用户确实又看到了这个页面）。
    const recover = () => send(true)
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted || !visit.current) return
      if (visit.current.key !== window.location.pathname) {
        // BFCache 可恢复到同一文档中较早的 SPA 条目。pageshow 时 Next 的上下文
        // 还可能是冻结前的路径；交给后续 pathname effect 创建目标浏览，避免多报旧页。
        visit.current = null
        return
      }
      visit.current = { ...visit.current, eventId: crypto.randomUUID(), sent: false, inFlight: false, retryRequested: false }
      send()
    }

    const saveSource = () => {
      if (attribution.current) storePageViewAttribution(attribution.current)
    }

    send()
    document.addEventListener('visibilitychange', recover)
    window.addEventListener('pageshow', restore)
    window.addEventListener('online', recover)
    // Hash 跳转和离开文档也可能产生/替换历史状态，但都不应额外增加 PV。
    window.addEventListener('hashchange', saveSource)
    window.addEventListener('pagehide', saveSource)
    return () => {
      document.removeEventListener('visibilitychange', recover)
      window.removeEventListener('pageshow', restore)
      window.removeEventListener('online', recover)
      window.removeEventListener('hashchange', saveSource)
      window.removeEventListener('pagehide', saveSource)
    }
  }, [pathname])

  return null
}
