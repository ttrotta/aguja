import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/features/localization/ui/LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { ToolsMenu } from "./ToolsMenu";

export function Navbar() {
  const tDocs = useTranslations("docs");
  const tNews = useTranslations("news");

  return (
    <header className="sticky top-0 z-10 border-b border-text/10 bg-page-bg/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-text overflow-visible">
          {/* Dark-mode browser extensions (Dark Reader, etc.) inject a
              --darkreader-inline-color custom property into inline styles
              before React hydrates, which never matches what the server
              rendered. Same category of expected, one-time mismatch as the
              theme pre-paint script in layout.tsx — not an app bug. */}
          <Image
            src="/logo-dark.webp"
            alt="Aguja"
            width={240}
            height={68}
            priority
            suppressHydrationWarning
            className="theme-logo-dark h-9 w-auto scale-[1.5] origin-left object-contain -ml-6"
          />
          <Image
            src="/logo-light.webp"
            alt="Aguja"
            width={240}
            height={68}
            priority
            suppressHydrationWarning
            className="theme-logo-light h-9 w-auto scale-[1.5] origin-left object-contain -ml-6"
          />
        </Link>
        <nav className="flex items-center gap-1">
          <ToolsMenu />
          <Link
            href="/docs"
            className="rounded-full px-2 py-1 text-sm text-text-muted transition-colors hover:text-text"
          >
            {tDocs("nav")}
          </Link>
          <Link
            href="/news"
            className="rounded-full px-2 py-1 text-sm text-text-muted transition-colors hover:text-text"
          >
            {tNews("nav")}
          </Link>
          {/* Separates what navigates from what configures. */}
          <span aria-hidden="true" className="mx-3 h-4 w-px bg-text/15" />
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
