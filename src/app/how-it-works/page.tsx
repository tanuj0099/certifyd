import Nav from "@/components/Nav";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Nav />
      <div className="flex-1 flex flex-col pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
            The Engine <span className="gradient-text">Under the Hood</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Certifyd isn't just a survey tool. It's a comprehensive data engine that parses thousands of verified Indian IT salaries to give you precision ROI. Here's exactly how it works.
          </p>
        </div>
        
        {/* The premium scroll interaction */}
        <HowItWorks />

        {/* Additional Details */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-24 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-text-primary">Where does the data come from?</h3>
              <p className="text-text-secondary leading-relaxed">
                We aggregate compensation data directly from verified offer letters, HR disclosures, and anonymous peer submissions across major tech hubs like Bengaluru, Pune, and NCR. Every data point is cross-referenced with local market bands to ensure the salary uplifts we project are realistic and achievable.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-text-primary">How do we calculate ROI?</h3>
              <p className="text-text-secondary leading-relaxed">
                Your ROI isn't just a random percentage. We take the median cost of your selected certification (including exam fees and standard prep materials) and map it against the median salary uplift for professionals in your exact experience bracket who recently earned that specific credential.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
