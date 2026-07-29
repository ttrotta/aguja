"use client";

import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES, type Locale } from "../domain";
import { usePathname, useRouter } from "@/i18n/navigation";

// Names stay in their own language and are never translated: someone looking
// for Spanish scans for "Español", not for "Spanish" rendered in a language
// they cannot read (data-model.md, Locale).
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/**
 * Switches language in place. `usePathname` here returns the path without its
 * locale segment, so replacing it with a new locale lands on the equivalent
 * page rather than a generic entry point (FR-055).
 *
 * Navigation is client-side on purpose. A full reload would rebuild the module
 * context and discard the pasted document and the loaded model — the very thing
 * the session refactor exists to prevent (FR-056).
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={[
              "rounded-full px-2 py-1 text-xs font-medium uppercase transition-colors",
              isActive
                ? "text-violet"
                : "text-text-muted hover:text-text",
            ].join(" ")}
          >
            <span className="sr-only">{LOCALE_LABELS[locale]}</span>
            <span aria-hidden="true">{locale}</span>
          </button>
        );
      })}
    </div>
  );
}
