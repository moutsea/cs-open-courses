export default function Robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return `
# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

User-agent: *
Allow: /

# Block unnecessary paths
Disallow: /api/
Disallow: /_next/
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