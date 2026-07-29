import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupportedLocale } from "@/features/localization/domain";
import { fetchLatestRagPapers } from "@/features/news/arxivClient";
import { ResearchList } from "@/features/news/ui/ResearchList";
import type { ResearchPaper } from "@/features/news/domain/types";
import { Navbar } from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";

export const revalidate = 3600;

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("news");

  let papers: ResearchPaper[] = [];
  let loadFailed = false;
  try {
    papers = await fetchLatestRagPapers();
  } catch {
    loadFailed = true;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:py-16">
        <header className="flex flex-col gap-3 border-b border-text/10 pb-10">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-black leading-none text-text">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-text-muted">{t("subtitle")}</p>
          <p className="text-sm text-text-muted">{t("abstractsLanguageNote")}</p>
        </header>

        <div className="max-w-3xl pt-10">
          <ResearchList papers={papers} loadFailed={loadFailed} locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  );
}
