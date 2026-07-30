import { useTranslations } from "next-intl";

const REPOSITORY_URL = "https://github.com/ttrotta/aguja";

/**
 * Carries the privacy guarantee and the provenance — what is running, under
 * which licence, and where the source is (FR-072, FR-073).
 *
 * Deliberately does not repeat the tool links (FR-074). The navigation's Tools
 * menu already reaches all four from anywhere, and a second copy here would be
 * a second thing to keep in step for no navigational gain.
 */
export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-text/10 bg-panel-inset-bg/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between md:gap-12">
        <div className="flex flex-col gap-2">
          <p className="max-w-md text-sm leading-relaxed text-text-muted">{t("privacy")}</p>
          <p className="text-xs text-text/40">© {new Date().getFullYear()} Aguja</p>
        </div>

        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-violet transition-colors hover:text-violet-deep md:self-center"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          {t("openSource")}
        </a>
      </div>

      {/* Decorative gradient separator */}
      <div className="mx-auto h-px w-full max-w-6xl bg-linear-to from-transparent via-violet/30 to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        <p className="text-center text-xs text-text/30">{t("tagline")}</p>
      </div>
    </footer>
  );
}
