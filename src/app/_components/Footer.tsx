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
        <p className="max-w-md text-sm leading-relaxed text-text-muted">{t("privacy")}</p>

        <div className="flex flex-col gap-2 md:items-end">
          <p className="text-xs uppercase tracking-wide text-text/50">{t("builtWith")}</p>
          <ul className="flex flex-col gap-1 text-sm text-text-muted md:items-end">
            <li>{t("model")}</li>
            <li>{t("transformers")}</li>
            <li>{t("next")}</li>
          </ul>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-sm text-violet transition-colors hover:text-violet-deep"
          >
            {t("source")}
          </a>
        </div>
      </div>
    </footer>
  );
}
