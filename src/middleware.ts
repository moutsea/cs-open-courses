import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { legacyCatalogRedirect } from './lib/catalogRedirect';
import { allowsAdminHost } from './lib/canonicalRedirect';
import { isBotUserAgent, recordBotPageView } from './lib/pageViews';

const internationalize = createMiddleware(routing);

/**
 * 爬虫的文档请求不执行 JS，浏览器那条上报链路对它们完全没数据，所以在 edge 这里
 * 单独记一笔：`collection_method = 'bot'`，只算「爬虫请求」，不进 PV/UV。
 * 预加载与 RSC 请求一律不计，否则一次客户端跳转会打出好几条。
 */
function isPrefetch(request: NextRequest) {
  return (
    request.headers.has('rsc') ||
    request.headers.has('next-router-prefetch') ||
    /prefetch/i.test(request.headers.get('purpose') ?? '') ||
    /prefetch/i.test(request.headers.get('sec-purpose') ?? '')
  );
}

function trackCrawler(request: NextRequest, event?: NextFetchEvent) {
  const userAgent = request.headers.get('user-agent') ?? '';
  if (request.method !== 'GET' || !userAgent) return;
  if (!isBotUserAgent(userAgent) || isPrefetch(request)) return;
  const task = recordBotPageView({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    referrer: request.headers.get('referer'),
    userAgent,
    ip: request.headers.get('cf-connecting-ip') ?? 'unknown',
    country: request.headers.get('cf-ipcountry') ?? ''
  }).catch(() => {
    // 统计失败绝不能影响页面响应。
  });
  // 测试里直接调用 middleware 时没有 event；线上 Next 一定会传。
  event?.waitUntil?.(task);
}

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

export default function middleware(request: NextRequest, event?: NextFetchEvent) {
  try {
    validatePathEncoding(request.nextUrl.pathname);
    // /admin 不走 i18n 重写，但要在预览副本上彻底隐身（workers_dev / preview_urls 已关，规则保留作纵深防御）。
    if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
      if (!allowsAdminHost(request.nextUrl.hostname)) {
        return new NextResponse('Not Found', { status: 404, headers: { 'content-type': 'text/plain' } });
      }
      return NextResponse.next();
    }
    // 爬虫记账放在重定向之前：308 的那次响应本身也是一次被看到的请求。
    trackCrawler(request, event);
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
