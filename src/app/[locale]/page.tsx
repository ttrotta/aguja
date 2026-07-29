import { Navbar } from "../_components/Navbar";
import { LandingHero } from "../_components/LandingHero";
import { ProblemEvidenceBoard } from "../_components/ProblemEvidenceBoard";
import { ProductWalkthrough } from "../_components/ProductWalkthrough";
import { ClosingCta } from "../_components/ClosingCta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <ProblemEvidenceBoard />
        <ProductWalkthrough />
        <ClosingCta />
      </main>
    </>
  );
}
