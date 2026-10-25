import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import '../globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import AnalyticsListener from '@/components/AnalyticsListener';
import PageViewTracker from '@/components/PageViewTracker';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

const locales = ['en', 'zh'] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} - Top CS Open Courses`
  },
  authors: [{ name: `${SITE_NAME} Team` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Education',
  verification: {
    google: '94d0AGhYzngO2upOLwVzqv8bQtfJqo32U5I2dSXDEto',
    other: {
      'msvalidate.01': '8B900A7AD31AF4E513F58422B9EBA7E5',
      'baidu-site-verification': 'codeva-nqGUCGJrBm'
    }
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  manifest: '/manifest.webmanifest'
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as 'en' | 'zh')) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <AnalyticsListener />
        <PageViewTracker />
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN })}
          />
        )}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
