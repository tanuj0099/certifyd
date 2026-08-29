import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
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
      <Logos />
      <HowItWorks />
      <Calculator />
      <FAQ limit={3} />
      <CTA />
      <Footer />
    </main>
  );
}
