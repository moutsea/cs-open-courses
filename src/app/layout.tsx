import './globals.css'

export const metadata = {
  title: 'CS Open Courses - Free Computer Science Learning Resources',
  description: 'Access free computer science courses from top universities. Learn programming, algorithms, machine learning, and more.',
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
