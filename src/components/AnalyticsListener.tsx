'use client'

import { useEffect } from 'react'
import { attachAnalyticsFlushListeners, trackOutbound } from '@/lib/analytics'

/**
 * 全站出站点击捕获：课程官网、教材、视频、联盟链接都在这一个地方统计，
 * 不用给每个 <a> 单独埋点。捕获阶段监听，任何组件都无法遗漏。
 */
export default function AnalyticsListener() {
  useEffect(() => {
    const detachFlush = attachAnalyticsFlushListeners()

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.hasAttribute('download')) return

      let url: URL
      try {
        url = new URL(anchor.getAttribute('href') || '', window.location.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return
      if (url.hostname === window.location.hostname) return

      const label = (anchor.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      trackOutbound(url, label)
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('auxclick', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('auxclick', handleClick, true)
      detachFlush()
    }
  }, [])

  return null
}
