export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export default async function getRequestConfig({ locale }: { locale: string }) {
  // Default to 'en' if locale is undefined, null, or invalid
  const validLocale = locale && locales.includes(locale as Locale) ? locale : 'en';
  
  // next-intl expects the locale to be returned as well
  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
}