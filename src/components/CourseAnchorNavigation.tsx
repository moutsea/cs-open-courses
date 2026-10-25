'use client'

import { useEffect, type RefObject } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { findCourseAnchorFallback } from '@/lib/courseAnchors'

interface CourseAnchorNavigationProps {
  articleRef: RefObject<HTMLElement | null>
  content: string
}

export default function CourseAnchorNavigation({ articleRef, content }: CourseAnchorNavigationProps) {
  const pathname = usePathname()
  // Keep the router's context object: a hash-only pushState also publishes a
  // new instance even though the pathname and serialized query are unchanged.
  const searchParams = useSearchParams()

  useEffect(() => {
    let frame: number | undefined
    const scheduleScroll = (click?: MouseEvent) => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      // Wait until the new body and the browser/router's native scrolling have
      // been applied. Read the current hash, never a stale navigation target.
      frame = window.requestAnimationFrame(() => {
        frame = undefined
        if (click?.defaultPrevented) return
        const article = articleRef.current
        if (article) findCourseAnchorFallback(article, window.location.hash)?.scrollIntoView({ block: 'start' })
      })
    }
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      let destination: URL
      try {
        destination = new URL(link.href, window.location.href)
      } catch {
        return
      }
      if (destination.origin !== window.location.origin || destination.pathname !== window.location.pathname || destination.search !== window.location.search || !destination.hash) return
      // Repeated clicks on the current hash do not emit hashchange. Keep native
      // navigation/history behavior and resolve the target on the next frame.
      scheduleScroll(event)
    }
    const onHashChange = () => scheduleScroll()

    scheduleScroll()
    window.addEventListener('hashchange', onHashChange)
    document.addEventListener('click', onClick)
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', onHashChange)
      document.removeEventListener('click', onClick)
    }
  }, [articleRef, content, pathname, searchParams])

  return null
}
