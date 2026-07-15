import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CS61B & Beyond - Computer Science Courses',
    short_name: 'CS61B & Beyond',
    description: 'Free computer science courses and learning paths from leading universities.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    categories: ['education', 'technology', 'learning'],
    lang: 'en',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  }
}
