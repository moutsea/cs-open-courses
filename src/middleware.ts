import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { NextResponse, type NextRequest } from 'next/server';
import { legacyCatalogRedirect } from './lib/catalogRedirect';
import { allowsAdminHost } from './lib/canonicalRedirect';

const internationalize = createMiddleware(routing);

function validatePathEncoding(pathname: string) {
  // Locale routing, the deployment adapter and Next.js can each decode a path.
  // Check nested escapes too, with a bound on intentionally excessive nesting.
  for (let depth = 0; depth < 8; depth++) {
    const decoded = decodeURIComponent(pathname);
    if (decoded === pathname) return;
    pathname = decoded;
  }
  throw new URIError('Too many URL encoding layers');
}

export default function middleware(request: NextRequest) {
  try {
    validatePathEncoding(request.nextUrl.pathname);
    // /admin 不走 i18n 重写，但要在预览副本上彻底隐身（workers_dev / preview_urls 已关，规则保留作纵深防御）。
    if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
      if (!allowsAdminHost(request.nextUrl.hostname)) {
        return new NextResponse('Not Found', { status: 404, headers: { 'content-type': 'text/plain' } });
      }
      return NextResponse.next();
    }
    const destination = legacyCatalogRedirect(new URL(request.url));
    if (destination) return NextResponse.redirect(destination, 308);
    const response = internationalize(request);
    // next-intl decodes the incoming path. A literal percent can therefore
    // become invalid in its rewrite URL, before the course loader even runs.
    for (const header of ['x-middleware-rewrite', 'location']) {
      const target = response.headers.get(header);
      if (target) validatePathEncoding(new URL(target, request.url).pathname);
    }
    return response;
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
    return new NextResponse('Invalid URL encoding', { status: 400 });
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|txt|xml|webmanifest)).*)']
};
