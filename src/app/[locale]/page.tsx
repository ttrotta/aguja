import { Navbar } from "../_components/Navbar";
import { LandingHero } from "../_components/LandingHero";
import { ScrollCue } from "../_components/ScrollCue";
import { ProblemEvidenceBoard } from "../_components/ProblemEvidenceBoard";
import { ProductWalkthrough } from "../_components/ProductWalkthrough";
import { ClosingCta } from "../_components/ClosingCta";
import { Footer } from "../_components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* The rich halftone-continent field is landing-only (D-021). Every
          other route falls back to <body>'s small, uniform, cheap field
          (globals.css). */}
      <main className="dot-field-landing flex flex-1 flex-col">
        <LandingHero />
        {/* A normal-flow full-width sibling, not an absolutely-positioned
            breakout — see D-027. Its negative top margin pulls it up to
            overlap the hero's own bottom edge without needing `vw` units,
            which is what caused a real horizontal scrollbar in a browser
            with a non-overlay scrollbar (Playwright's headless Chromium
            didn't reproduce it, since it doesn't reserve scrollbar space
            the same way). */}
        <ScrollCue />
        <ProblemEvidenceBoard />
        <ProductWalkthrough />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
