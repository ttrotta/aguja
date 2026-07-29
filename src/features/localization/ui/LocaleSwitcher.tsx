"use client";

import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES, type Locale } from "../domain";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useMenuNavigation } from "@/app/_components/useMenuNavigation";
import { MenuChevron } from "@/app/_components/MenuChevron";
import { LocaleFlag } from "./LocaleFlag";

// Names stay in their own language and are never translated: someone looking
// for Spanish scans for "Español", not for "Spanish" rendered in a language
// they cannot read.
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/**
 * Switches language in place. `usePathname` here returns the path without its
 * locale segment, so replacing it with a new locale lands on the equivalent
 * page rather than a generic entry point.
 *
 * Navigation is client-side on purpose. A full reload would rebuild the module
 * context and discard the pasted document and the loaded model — the very thing
 * the session refactor exists to prevent.
 *
 * Only the current language is on the bar; the rest live one click down. Two
 * language codes side by side read as a state nobody chose, and the pair does
 * not survive a third language.
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const {
    isOpen,
    activeIndex,
    containerRef,
    triggerRef,
    close,
    toggle,
    registerItem,
    onTriggerKeyDown,
    onMenuKeyDown,
  } = useMenuNavigation<HTMLButtonElement>(SUPPORTED_LOCALES.length);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t("languageMenu")} — ${LOCALE_LABELS[active]}`}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        className="flex h-9 items-center gap-2 rounded-full border border-text/20 px-3 text-xs font-medium uppercase tracking-[0.02em] text-text-muted transition-colors hover:border-violet hover:text-text"
      >
        <LocaleFlag locale={active} />
        <span aria-hidden="true">{active}</span>
        <MenuChevron isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("language")}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-2 flex w-44 flex-col rounded-sm border border-text/15 bg-panel-bg p-1 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]"
        >
          {SUPPORTED_LOCALES.map((locale, index) => {
            const isActive = locale === active;
            return (
              <button
                key={locale}
                type="button"
                lang={locale}
                role="menuitemradio"
                aria-checked={isActive}
                tabIndex={index === activeIndex ? 0 : -1}
                ref={registerItem(index)}
                onClick={() => {
                  close({ refocus: false });
                  router.replace(pathname, { locale });
                }}
                className={[
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-panel-inset-bg focus:bg-panel-inset-bg focus:outline-none",
                  isActive ? "text-violet" : "text-text-muted hover:text-text focus:text-text",
                ].join(" ")}
              >
                <LocaleFlag locale={locale} />
                <span className="flex-1">{LOCALE_LABELS[locale]}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="m2.5 6.3 2.4 2.4 4.6-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
