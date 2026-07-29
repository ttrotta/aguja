import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ToolEmptyStateProps =
  | { reason: "no-document" }
  | { reason: "model-loading"; progress: number };

// Every tool that needs a document or the model shows this instead of an
// empty or broken analysis (FR-036) — naming what's missing and where to
// fix it, rather than assuming the reader already knows.
export function ToolEmptyState(props: ToolEmptyStateProps) {
  const t = useTranslations("emptyState");

  if (props.reason === "no-document") {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-text-muted">
        <p>{t("noDocument")}</p>
        <p>
          {t.rich("pasteIn", {
            link: (chunks) => (
              <Link href="/tool/chunks" className="text-violet hover:text-violet-deep">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    );
  }

  const percent = Math.round(props.progress * 100);
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-text-muted">
      <div className="h-[3px] w-32 overflow-hidden bg-text/15">
        <div className="h-full bg-violet transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p>{t("downloading", { percent })}</p>
    </div>
  );
}
