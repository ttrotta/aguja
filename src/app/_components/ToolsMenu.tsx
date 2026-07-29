"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MenuChevron } from "./MenuChevron";
import { useMenuNavigation } from "./useMenuNavigation";

const TOOLS = [
  { href: "/tool/chunks", key: "chunks" },
  { href: "/tool/compare", key: "compare" },
  { href: "/tool/queries", key: "queries" },
  { href: "/tool/confusable", key: "confusable" },
] as const;

/**
 * The four tools under one entry, so navigation stays two interactions deep
 * from anywhere without spreading four links across the bar.
 *
 * Links carry no locale prefix — the locale-aware Link adds it — so a tool
 * always opens in the language being read.
 */
export function ToolsMenu() {
  const t = useTranslations("nav");
  const tTools = useTranslations("tools");
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
  } = useMenuNavigation<HTMLAnchorElement>(TOOLS.length);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("toolsMenu")}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-text-muted transition-colors hover:text-text"
      >
        {t("tools")}
        <MenuChevron isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("tools")}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-2 flex w-56 flex-col rounded-sm border border-text/15 bg-panel-bg p-1 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]"
        >
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.href}
              href={tool.href}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              ref={registerItem(index)}
              onClick={() => close({ refocus: false })}
              className="rounded-sm px-3 py-2 text-sm text-text-muted transition-colors hover:bg-panel-inset-bg hover:text-text focus:bg-panel-inset-bg focus:text-violet focus:outline-none"
            >
              {tTools(tool.key)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
