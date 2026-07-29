"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("nav");
  // Lazy initializer, not an effect: reads the DOM state the blocking
  // init script in layout.tsx already applied, at first client render.
  // Stays null during SSR (no `document`), then resolves on hydration
  // without an extra render pass.
  const [isLight, setIsLight] = useState<boolean | null>(() =>
    typeof document === "undefined" ? null : document.documentElement.classList.contains("light"),
  );

  function toggle() {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("aguja-theme", next ? "light" : "dark");
    setIsLight(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? t("themeToDark") : t("themeToLight")}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-text/20 text-text transition-colors hover:border-violet"
    >
      {isLight ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M14 9.2A6 6 0 0 1 6.8 2 6 6 0 1 0 14 9.2Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
