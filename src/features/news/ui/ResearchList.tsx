import { useTranslations } from "next-intl";
import type { Locale } from "@/features/localization/domain";
import type { ResearchPaper } from "../domain/types";

type ResearchListProps = {
  papers: ResearchPaper[];
  loadFailed: boolean;
  locale: Locale;
};

/**
 * Abstracts come back in whatever language arXiv published them in — almost
 * always English, unlike the rest of this page's chrome — so only the date
 * formatting, not the paper text itself, adapts to the reader's locale.
 */
export function ResearchList({ papers, loadFailed, locale }: ResearchListProps) {
  const t = useTranslations("news");
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  if (loadFailed) {
    return <p className="text-sm text-text-muted">{t("unavailable")}</p>;
  }

  if (papers.length === 0) {
    return <p className="text-sm text-text-muted">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {papers.map((paper) => (
        <li
          key={paper.id}
          className="flex flex-col gap-2 border-t-2 border-violet bg-panel-inset-bg p-4"
        >
          <p className="text-xs text-text-muted">
            {t("source")} · {dateFormatter.format(new Date(paper.publishedAt))}
          </p>
          <h2 className="text-lg font-medium leading-snug text-text">{paper.title}</h2>
          <p className="text-[0.9375rem] leading-relaxed text-text/80">{paper.summary}</p>
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 self-start text-sm text-violet transition-colors hover:text-violet-deep"
          >
            {t("readAbstract")}
          </a>
        </li>
      ))}
    </ul>
  );
}
