import {Pathnames} from 'next-intl/routing';
export const locales = ['en', 'zh'] as const;
export const defaultLocale = 'en';

// Pathnames configuration removed - using automatic routing with localePrefix: 'as-needed'

// Use 'as-needed' to hide locale prefix for default locale (English)
export const localePrefix = 'as-needed';

export const pathnames = {
  '/': '/',
  '/zh': '/zh',
  '/courses': '/courses',
  '/zh/courses': '/zh/courses',
  '/universities': '/universities',
  '/zh/universities': '/zh/universities',
  '/tutorial': '/tutorial',
  '/zh/tutorial': '/zh/tutorial',
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