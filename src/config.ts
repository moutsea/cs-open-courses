import {Pathnames} from 'next-intl/routing';
export const locales = ['en', 'zh'] as const;
export const defaultLocale = 'en';

// Pathnames configuration removed - using automatic routing with localePrefix: 'as-needed'

// Use 'as-needed' to hide locale prefix for default locale (English)
export const localePrefix = 'as-needed';

export const pathnames = {
  '/': '/',
  '/courses': '/courses',
  '/open-source': '/open-source',
  '/universities': '/universities',
  '/tutorial': '/tutorial',
  '/course/[...slug]': '/course/[...slug]',
  '/course/data-structures-algorithms/CS61B': '/course/data-structures-algorithms/CS61B',
} satisfies Pathnames<typeof locales>;

// Type definitions for app pathnames removed with pathnames configuration

export const getLanguageByLang = (lang: string) => {
  const languages = [
    { code: "en-US", lang: "en", language: "English", languageInChineseSimple: "英语" },
    { code: "zh-CN", lang: "zh", language: "简体中文", languageInChineseSimple: "简体中文" }
  ];
  
  for (let i = 0; i < languages.length; i++) {
    if (lang === languages[i].lang) {
      return languages[i];
    }
  }
  return languages[0];
};
