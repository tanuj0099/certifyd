import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SplitFlapText from "@/components/reactbits/SplitFlapText";
import Logos from "@/components/Logos";
import HowItWorks from "@/components/HowItWorks";
import Calculator from "@/components/Calculator";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      
      {/* Divider */}
      <div className="w-full flex justify-center items-center py-6 border-b border-border bg-background overflow-hidden">
        <div className="transform scale-[0.45] sm:scale-75 md:scale-90 lg:scale-100 flex justify-center w-full min-w-max">
          <SplitFlapText 
            words={["500+ CERTIFICATIONS TRACKED", "CITY-CALIBRATED DATA", "REAL OFFER OUTCOMES"]}
            fontSize={16}
            tileColor="var(--background)"
            textColor="var(--text-secondary)"
            className="text-text-secondary"
            padTo={27}
            flipDuration={0.08}
          />
        </div>
      </div>

      <Logos />
      <HowItWorks />
      <Calculator />
      <FAQ limit={3} />
      <CTA />
      <Footer />
    </main>
  );
}
