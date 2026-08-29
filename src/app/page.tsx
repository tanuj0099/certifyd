import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Calculator from "@/components/Calculator";
import Trust from "@/components/Trust";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      <HowItWorks />
      <Calculator />
      <Trust />
      <FAQ />
      <Footer />
    </main>
  );
}
