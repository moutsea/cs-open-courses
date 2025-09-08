import { defineRouting } from "next-intl/routing";
import { locales, pathnames } from "./config";

export const routing = defineRouting({
  locales: locales,
  defaultLocale: "en",
  localePrefix: "as-needed", 
  pathnames: pathnames,
  localeDetection: false,
  alternateLinks: false,
});