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