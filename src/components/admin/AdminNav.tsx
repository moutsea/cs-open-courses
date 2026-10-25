'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: '概览' },
  { href: '/admin/analytics', label: '流量看板' },
  { href: '/admin/gaps', label: '内容缺口' }
] as const

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(link => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={[
              'rounded-full px-3.5 py-1.5 text-sm transition',
              active
                ? 'bg-cyan-400 font-medium text-slate-950'
                : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
            ].join(' ')}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
