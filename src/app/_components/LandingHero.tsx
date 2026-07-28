import { ToolDial } from "./ToolDial";

// A large, dimensional needle — the landing-scale version of the motif.
// Tilted and gently swaying, with a separate drifting thread looping
// through its eye. This is the hero's one authored motion moment.
function BigNeedle() {
  return (
    <svg
      viewBox="0 0 200 420"
      fill="none"
      aria-hidden="true"
      className="needle-sway thread-glow h-auto w-full max-w-[220px]"
    >
      <path
        d="M150 20 40 340a16 16 0 1 0 16 16L200 60"
        stroke="var(--color-text)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="168"
        cy="38"
        rx="9"
        ry="15"
        transform="rotate(45 168 38)"
        stroke="var(--color-text)"
        strokeWidth="5"
        fill="none"
      />
      <path
        className="thread-drift"
        d="M164 46c-30 18-52 8-70 34s6 40-18 56-40-4-46 20"
        stroke="var(--color-violet)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// The typical "scroll to explore" cue — the brief asked for exactly this
// familiar pattern, so it stays recognizable rather than reinvented.
function ScrollCue() {
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
      <span className="flex h-9 w-[22px] items-start justify-center rounded-full border border-text/30 p-1.5">
        <span className="scroll-cue-dot h-1.5 w-1.5 rounded-full bg-violet" />
      </span>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-14 px-6 py-20 md:min-h-[calc(100vh-69px)] md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
      <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-2">
        <div className="flex flex-col items-center gap-8 text-center md:items-start md:text-left">
          <h1 className="font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.92] font-black tracking-tight text-text">
            Aguja
          </h1>
          <p
            className="mt-6 max-w-xl text-balance text-[1.25rem] text-text-muted tracking-wide md:mt-8 md:text-left"
          >
            A debugger for retrieval. Paste a document, see where the cuts fall, and finally
            understand why that sentence doesn&rsquo;t show up.
          </p>
        </div>
        <BigNeedle />
      </div>

      <ToolDial />

      <ScrollCue />
    </section>
  );
}
