import Nav from "@/components/Nav";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function FAQPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 pt-12 pb-24">
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
