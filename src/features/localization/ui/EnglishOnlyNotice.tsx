import { useTranslations } from "next-intl";

/**
 * States, in the language being read, that the analysis is English-only
 * (FR-061, FR-062).
 *
 * Placed once in the tool shell rather than repeated inside each results
 * component: every surface FR-062 names — the document input, ranked results,
 * sensitivity results, confusable pairs — already lives inside that shell, so
 * one placement covers all of them and cannot fall out of sync
 * (research.md Finding 5).
 *
 * Both locales get identical treatment. D-013 described the notice as "most
 * prominent on /es", but an English reader pasting a German document meets the
 * same gap, and two visual treatments of one sentence is not maintainable.
 *
 * Presentation reuses the callout already established by the chunk-cap notice
 * in ConfusablePairs. The craft floor bans coloured left or right borders above
 * 1px on callouts, so emphasis is carried by the full border and the glyph.
 */
export function EnglishOnlyNotice() {
  const t = useTranslations("notice");

  return (
    <p className="flex items-start gap-2 border-b border-text/10 bg-panel-inset-bg px-5 py-2 text-sm text-text">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-warning">
        ▲
      </span>
      <span>
        <strong className="font-medium">{t("englishOnlyTitle")}</strong>{" "}
        <span className="text-text-muted">{t("englishOnlyBody")}</span>
      </span>
    </p>
  );
}
