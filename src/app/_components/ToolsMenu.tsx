"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TOOLS = [
  { href: "/tool/chunks", key: "chunks" },
  { href: "/tool/compare", key: "compare" },
  { href: "/tool/queries", key: "queries" },
  { href: "/tool/confusable", key: "confusable" },
] as const;

/**
 * The four tools under one entry, so navigation stays two interactions deep
 * from anywhere (FR-070, SC-026) without spreading four links across the bar.
 *
 * Keyboard operable in full, which quickstart's Story 3 checks explicitly:
 * Enter or Space or ArrowDown opens and focuses the first item, arrows move,
 * Home and End jump, Escape closes and returns focus to the trigger, and Tab
 * leaves. Links carry no locale prefix — the locale-aware Link adds it — so a
 * tool always opens in the language being read.
 */
export function ToolsMenu() {
  const t = useTranslations("nav");
  const tTools = useTranslations("tools");

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // Move real focus, not just a highlight — a menu that only looks focused
  // leaves a screen reader announcing the wrong thing.
  useEffect(() => {
    if (isOpen) itemRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function open(index: number) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function close({ refocus }: { refocus: boolean }) {
    setIsOpen(false);
    if (refocus) triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      open(TOOLS.length - 1);
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % TOOLS.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + TOOLS.length) % TOOLS.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(TOOLS.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        close({ refocus: true });
        break;
      case "Tab":
        // Let focus leave naturally, but do not leave an orphaned open menu.
        close({ refocus: false });
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("toolsMenu")}
        onClick={() => (isOpen ? close({ refocus: false }) : open(0))}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-text-muted transition-colors hover:text-text"
      >
        {t("tools")}
        <span aria-hidden="true" className="text-[0.625rem]">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("tools")}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-2 flex w-56 flex-col rounded-sm border border-text/15 bg-panel-bg p-1 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]"
        >
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.href}
              href={tool.href}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
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
