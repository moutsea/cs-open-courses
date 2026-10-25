import type { Metadata } from 'next'
import '../globals.css'

/**
 * /admin 是独立于 [locale] 的一棵路由树：
 * 它自带 html/body（项目没有 src/app/layout.tsx，[locale]/layout.tsx 充当站点根布局），
 * 这样后台不受 next-intl 语言前缀影响，也不会被站点主题误伤。
 */
export const metadata: Metadata = {
  title: '后台 · CS61B & Beyond',
  robots: { index: false, follow: false }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0b1220] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
