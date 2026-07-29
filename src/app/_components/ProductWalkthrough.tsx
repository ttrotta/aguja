import { useTranslations } from "next-intl";

type Step = {
  /** Message-key suffix; the copy itself lives in the catalogues. */
  key: "step1" | "step2" | "step3" | "step4";
  align: "top" | "bottom";
  leftPct: number;
};

const STEPS: Step[] = [
  { key: "step1", align: "top", leftPct: 8 },
  { key: "step2", align: "bottom", leftPct: 36 },
  { key: "step3", align: "top", leftPct: 64 },
  { key: "step4", align: "bottom", leftPct: 90 },
];

function MiniVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="block h-1 w-16 rounded-full bg-text/20" />
        <span className="block h-1 w-12 rounded-full bg-text/20" />
        <span className="block h-1 w-14 rounded-full bg-text/20" />
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="flex gap-1">
        <span className="rounded-full bg-violet px-2 py-0.5 text-[10px] text-page-bg">size</span>
        <span className="rounded-full border border-text/20 px-2 py-0.5 text-[10px] text-text-muted">
          overlap
        </span>
        <span className="rounded-full border border-text/20 px-2 py-0.5 text-[10px] text-text-muted">
          tokens
        </span>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="flex flex-col gap-1">
        {[80, 45, 20].map((w, i) => (
          <span
            key={i}
            className={`h-1 rounded-full ${i === 0 ? "bg-violet" : "bg-text/20"}`}
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1.5">
      <span className="h-6 w-8 rounded-sm border border-violet/60" />
      <span className="h-6 w-8 rounded-sm border border-text/20" />
    </div>
  );
}

export function ProductWalkthrough() {
  const t = useTranslations("landing");

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-black text-text md:text-5xl">
          {t("walkthroughHeading")}
        </h2>
        <p className="mt-4 text-lg text-text-muted">{t("walkthroughBody")}</p>
      </div>

      <div className="relative mt-8 flex flex-col gap-10 md:mt-24 md:h-[280px] md:flex-row md:gap-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
          aria-hidden="true"
        >
          <path
            d="M0,60 C300,10 300,110 600,60 C900,10 900,110 1200,60"
            stroke="var(--color-violet)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>

        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className="relative flex flex-col gap-2 md:absolute md:w-56 md:-translate-x-1/2"
            style={{
              left: `${step.leftPct}%`,
              top: step.align === "top" ? "0" : undefined,
              bottom: step.align === "bottom" ? "0" : undefined,
            }}
          >
            <span className="h-2 w-2 self-start rounded-full bg-violet md:self-auto" />
            <p className="font-display text-lg font-black text-text">{t(`${step.key}Label`)}</p>
            <p className="text-sm text-text-muted">{t(`${step.key}Text`)}</p>
            <MiniVisual index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
