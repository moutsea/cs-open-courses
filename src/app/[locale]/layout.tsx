import type { Metadata } from "next";
import { notFound } from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import '../globals.css';
import LangUpdater from '@/components/LangUpdater';
import { routing } from '@/routing';
import Header from "@/components/Header";

const locales = ['en', 'zh'] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: 'CS Open Courses - Free Computer Science Learning Resources',
    description: 'Access free computer science courses from top universities. Learn programming, algorithms, machine learning, and more.',
    keywords: ['computer science', 'online courses', 'programming', 'algorithms', 'machine learning', 'free education'],
    authors: [{ name: 'CS Open Courses' }],
    openGraph: {
      title: 'CS Open Courses - Free Computer Science Learning Resources',
      description: 'Access free computer science courses from top universities.',
      type: 'website',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CS Open Courses - Free Computer Science Learning Resources',
      description: 'Access free computer science courses from top universities.',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'zh': '/zh',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as 'en' | 'zh')) notFound();
  
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LangUpdater locale={locale} />
      {children}
    </NextIntlClientProvider>
  );
}