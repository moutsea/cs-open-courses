import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '../routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` carries the value set by `setRequestLocale` in the locale
  // layout. Reading a `locale` property instead always yields `undefined`,
  // which silently falls back to the default locale and serves the wrong
  // messages to every client component.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
