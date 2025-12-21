import './globals.css'
import { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'

// app/layout.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL! : 'http://localhost:3001'),
    title: {
      template: '%s | CS61B & Beyond',
      default: 'CS61B & Beyond - Top CS Open Courses'
    },
    description: "Start your computer science journey with the best free open courses. Master CS61B, Algorithms, AI, and Systems with guided learning paths from Berkeley, MIT, and Stanford.",
    keywords: [
      'computer science courses', 'free programming courses', 'learn coding online',
      'cs61b', 'cs61a', 'data structures algorithms', 
      'berkeley cs', 'mit opencourseware', 'stanford cs',
      'computer science roadmap', 'self taught cs', 'developer roadmap',
      'machine learning courses', 'artificial intelligence tutorial'
    ],
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL!,
      languages: {
        'en': `${process.env.NEXT_PUBLIC_SITE_URL}/`,
        'zh': `${process.env.NEXT_PUBLIC_SITE_URL}/zh`
      }
    },
    openGraph: {
      siteName: 'CS61B & Beyond',
      type: 'website',
      title: 'CS61B & Beyond - Top CS Open Courses',
      description: 'Master CS61B, CS61A, CS189 and other top computer science courses from Berkeley, MIT, Stanford',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/og.jpg`,
          width: 1200,
          height: 630,
          alt: 'CS61B & Beyond - Free Computer Science Courses'
        }
      ]
    },

    robots: 'index, follow, max-image-preview:large',

    authors: [{ name: 'CS61B & Beyond Team' }],
    creator: 'CS61B & Beyond',
    publisher: 'CS61B & Beyond',
    category: 'Education',

    twitter: {
      card: 'summary_large_image',
      title: 'CS61B & Beyond - Top CS Open Courses',
      description: 'Master CS61B, CS61A and top computer science courses',
      images: [`${process.env.NEXT_PUBLIC_SITE_URL}/og.jpg`]
    },

    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-site-verification" content="94d0AGhYzngO2upOLwVzqv8bQtfJqo32U5I2dSXDEto" />
        <meta name="msvalidate.01" content="8B900A7AD31AF4E513F58422B9EBA7E5" />
        <meta name="baidu-site-verification" content="codeva-nqGUCGJrBm" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === 'production' && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        )}
      </body>
    </html>
  )
}
