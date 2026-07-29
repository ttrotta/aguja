"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * The keyboard and dismissal behaviour every navbar dropdown shares.
 *
 * Enter, Space or ArrowDown opens on the first item and ArrowUp on the last;
 * arrows move, Home and End jump, Escape closes and returns focus to the
 * trigger, Tab leaves without stranding an open menu, and a click outside
 * closes it.
 */
export function useMenuNavigation<Item extends HTMLElement>(itemCount: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<Item | null>>([]);

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

  return {
    isOpen,
    activeIndex,
    containerRef,
    triggerRef,
    close,

    toggle() {
      if (isOpen) close({ refocus: false });
      else open(0);
    },

    registerItem(index: number) {
      return (node: Item | null) => {
        itemRefs.current[index] = node;
      };
    },

    onTriggerKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        open(itemCount - 1);
      }
    },

    onMenuKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((i) => (i + 1) % itemCount);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((i) => (i - 1 + itemCount) % itemCount);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(itemCount - 1);
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
    },
  };
}
