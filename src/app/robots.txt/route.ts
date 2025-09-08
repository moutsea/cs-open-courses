export default function Robots() {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: https://cs-courses.vercel.app/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
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