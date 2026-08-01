"use client";

import { useEffect, useState } from "react";

/**
 * The scroll invitation: an ambient glow along the fold, full-width, gone
 * for good on the first scroll — never re-shown if the visitor scrolls back
 * to the top. Same "stops permanently after the first interaction" rule the
 * tool dial already uses.
 */
export function ScrollCue() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setDismissed(true);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      // Rendered as a normal-flow sibling immediately after the hero
      // (src/app/[locale]/page.tsx), not absolutely positioned inside it.
      // `-mt-24` pulls this element's own height (h-24) up to overlap the
      // hero's bottom edge, so it reads as part of the fold without any
      // `position:absolute` + viewport-unit breakout — that technique (D-026)
      // caused a real horizontal scrollbar in browsers with a non-overlay
      // scrollbar, since `100vw` and the true available width disagree by
      // exactly the scrollbar's gutter once the page is tall enough to
      // scroll (D-027). A full-width block-level element needs no `vw` at
      // all: it is already exactly as wide as its parent's real content box.
      className={`hero-glow pointer-events-none -mt-24 h-24 w-full transition-opacity duration-700 ${
        dismissed ? "is-dismissed" : ""
      }`}
    />
  );
}
