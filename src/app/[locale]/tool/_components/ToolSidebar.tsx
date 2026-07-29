"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TOOLS = [
  { href: "/tool/chunks", key: "chunks" },
  { href: "/tool/compare", key: "compare" },
  { href: "/tool/queries", key: "queries" },
  { href: "/tool/confusable", key: "confusable" },
] as const;

// A slim strip inside the same floating panel as everything else — DESIGN.md
// commits the whole app to one panel object, so this is not a second panel
// beside it, just its leftmost region (FR-027, FR-028).
export function ToolSidebar() {
  const t = useTranslations("tools");
  // Locale-free pathname, so comparing it to an unlocalised href is correct.
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("sidebarAriaLabel")}
      className="flex w-full shrink-0 flex-row gap-2 overflow-x-auto border-b border-text/10 bg-panel-inset-bg p-3 md:w-52 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:p-4"
    >
      {TOOLS.map((tool) => {
        const isActive = pathname === tool.href;
        return (
          <Link
            key={tool.href}
            href={tool.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "shrink-0 whitespace-nowrap rounded-sm border px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-violet text-violet"
                : "border-transparent text-text-muted hover:border-text/20 hover:text-text",
            ].join(" ")}
          >
            {t(tool.key)}
          </Link>
        );
      })}
    </nav>
  );
}
