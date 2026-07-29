import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/features/localization/ui/LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { ToolsMenu } from "./ToolsMenu";

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
  const t = useTranslations("nav");
  const tDocs = useTranslations("docs");

  return (
    <header className="sticky top-0 z-10 border-b border-text/10 bg-page-bg/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-text">
          <NavbarNeedle />
          <span className="font-display text-2xl font-black leading-none">Aguja</span>
        </Link>
        <nav className="flex items-center gap-3">
          <ToolsMenu />
          <Link
            href="/docs"
            className="rounded-full px-2 py-1 text-sm text-text-muted transition-colors hover:text-text"
          >
            {tDocs("nav")}
          </Link>
          <Link
            href="/tool"
            className="ml-1 rounded-full bg-violet px-5 py-2 text-sm font-medium text-page-bg transition-colors hover:bg-violet-deep"
          >
            {t("openDebugger")}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
