import { Navbar } from "../_components/Navbar";
import { LandingHero } from "../_components/LandingHero";
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
        <ProblemEvidenceBoard />
        <ProductWalkthrough />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
