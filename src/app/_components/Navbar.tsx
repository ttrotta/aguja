import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

function NavbarNeedle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M17 2 5 14a1.8 1.8 0 1 0 1.8 1.8L18.5 4.3"
        stroke="var(--color-text)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="16"
        cy="3.3"
        rx="1"
        ry="1.6"
        transform="rotate(45 16 3.3)"
        stroke="var(--color-text)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-text/10 bg-page-bg/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-text">
          <NavbarNeedle />
          <span className="font-display text-2xl font-black leading-none">Aguja</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/tool"
            className="rounded-full bg-violet px-5 py-2 text-sm font-medium text-page-bg transition-colors hover:bg-violet-deep"
          >
            Abrir el debugger
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
