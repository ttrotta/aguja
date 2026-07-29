import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupportedLocale } from "@/features/localization/domain";
import { docContentFor } from "@/features/documentation/content";
import { DocSections, DocTableOfContents } from "@/features/documentation/ui/DocSections";
import { Navbar } from "../../_components/Navbar";
import { Footer } from "../../_components/Footer";

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("docs");
  const content = docContentFor(locale);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:py-16">
        <header className="flex flex-col gap-3 border-b border-text/10 pb-10">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-black leading-none text-text">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg text-text-muted">{t("subtitle")}</p>
        </header>

        <div className="grid grid-cols-1 gap-12 pt-10 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-16">
          {/* Prose first in the source order, so a narrow viewport gets the
              content rather than a list of links to it. */}
          <article className="min-w-0 md:order-1">
            <DocSections content={content} />
          </article>
          <aside className="md:order-2">
            <div className="flex flex-col gap-3 md:sticky md:top-24">
              <p className="text-xs uppercase tracking-wide text-text/50">{t("onThisPage")}</p>
              <DocTableOfContents content={content} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
