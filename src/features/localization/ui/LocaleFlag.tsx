import type { Locale } from "../domain";

/**
 * Flags drawn as SVG rather than written as emoji: the regional-indicator pairs
 * render as bare letters on Windows, and the ones that do render are sized and
 * coloured by the platform instead of by this design system.
 *
 * Purely decorative — the language name always sits next to it in text — so it
 * stays out of the accessibility tree.
 */
export function LocaleFlag({ locale }: { locale: Locale }) {
  return (
    <svg
      width="21"
      height="14"
      viewBox="0 0 60 40"
      aria-hidden="true"
      className="shrink-0 rounded-[1.75px]"
    >
      {locale === "es" ? <SpainFlag /> : <UnitedKingdomFlag />}
      {/* Keeps the flag from bleeding into the surface it sits on, in either theme. */}
      <rect
        width="60"
        height="40"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
    </svg>
  );
}

function SpainFlag() {
  return (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  );
}

function UnitedKingdomFlag() {
  return (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#FFFFFF" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </>
  );
}
