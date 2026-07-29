import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/features/localization/domain";

// The locale list is not restated here. It comes from the domain, which is
// also what the switcher, the middleware, and the end-to-end suite read, so
// adding a third locale is one edit rather than a hunt.
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
