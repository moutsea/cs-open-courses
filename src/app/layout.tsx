import './globals.css'
import { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'

// app/layout.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://cs61b.com' : 'http://localhost:3001'),
    title: {
      template: '%s | CS61B & Beyond | Computer Science Courses',  // 将两者结合
      default: 'CS61B & Beyond - Free Top Computer Science Open Courses'
    },
    description: "CS61B & Beyond - Premier collection of top CS open courses: Berkeley CS61A/CS61B/CS189, Stanford CS224N, MIT 6.824, Games101. Your hub for world-class programming education.",
    keywords: [
      'cs61b', 'cs61a', 'cs189', 'cs224n', 'mit 6.824', 'games101',
      'berkeley computer science', 'stanford cs courses', 'mit courses',
      'data structures algorithms', 'open courses', 'free programming courses'
    ],
    alternates: {
      canonical: 'https://www.cs61bbeyond.com',
      languages: {
        'en': 'https://www.cs61bbeyond.com/',
        'zh': 'https://www.cs61bbeyond.com/zh'
      }
    },
    openGraph: {
      siteName: 'CS61B & Beyond',
      type: 'website',
      title: 'CS61B & Beyond - Top Computer Science Open Courses',
      description: 'Master CS61B, CS61A, CS189 and other top computer science courses from Berkeley, MIT, Stanford',
      url: 'https://www.cs61bbeyond.com/',
      images: [
        {
          url: '/og.jpg',
          width: 1200,
          height: 630,
          alt: 'CS61B & Beyond - Free Computer Science Courses from Top Universities'
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
      images: ['/og.jpg']
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
