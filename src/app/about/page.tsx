import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col">
        <section className="py-24 bg-background relative overflow-hidden flex-1 flex flex-col justify-center">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
                Democratizing <span className="gradient-text">IT Career Data</span>
              </h1>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Certifyd was built to bring radical transparency to the Indian tech certification market. We believe you should know exactly what a certification is worth before you invest your time and money.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div className="bg-card border border-border p-8 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">The Problem</h3>
                <p className="text-text-secondary leading-relaxed">
                  Millions of Indian IT professionals spend months studying and thousands of rupees on certifications every year, flying blind on whether it will actually impact their next offer letter or promotion cycle.
                </p>
              </div>
              <div className="bg-card border border-brand/20 p-8 rounded-xl shadow-[0_0_40px_-15px_rgba(249,115,22,0.1)]">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Our Solution</h3>
                <p className="text-text-secondary leading-relaxed">
                  We aggregate verified market data, parsing thousands of compensation data points across major Indian tech hubs (Bengaluru, Hyderabad, Pune, NCR) to give you the exact ROI and negotiation leverage you need.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
