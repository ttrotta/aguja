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
      // The label is deliberately one render ahead of the server on first
      // paint (see the lazy initializer above) — an intentional, one-time
      // mismatch that resolves before the user can act on it, not a bug.
      suppressHydrationWarning
      className="group flex h-9 w-9 items-center justify-center rounded-full border border-text/20 text-text transition-colors hover:border-violet"
    >
      {/*
        A dial on an instrument panel, not another sun and moon: the button's
        own rim is the bezel, and the half-filled disc inside turns 180° so the
        indicator tick swings from the dark half to the lit one. Which theme is
        on reads from the position of a physical control.
      */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        suppressHydrationWarning
        className={[
          "transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none",
          isLight ? "rotate-180" : "",
        ].join(" ")}
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
        <path d="M9 3a6 6 0 0 1 0 12Z" fill="currentColor" />
        <path
          d="M9 1.1v1.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-70 transition-opacity group-hover:opacity-100"
        />
      </svg>
    </button>
  );
}
