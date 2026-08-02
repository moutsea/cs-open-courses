import { SITE_URL } from '@/lib/seo';

function robotsContent() {
  return `
# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

User-agent: *
Allow: /

# Block unnecessary paths
Disallow: /api/
Disallow: /private/
`
}

export function GET() {
  return new Response(robotsContent(), {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
