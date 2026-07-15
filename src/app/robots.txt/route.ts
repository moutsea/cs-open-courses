import { SITE_URL } from '@/lib/seo';

export default function Robots() {
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
  return new Response(Robots(), {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
