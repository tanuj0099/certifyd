import WaitlistHero from '@/components/waitlist/WaitlistHero';
import QuickCalculator from '@/components/waitlist/QuickCalculator';
import ToolStatusMatrix from '@/components/waitlist/ToolStatusMatrix';
import TrustSection from '@/components/waitlist/TrustSection';
import FaqAccordion from '@/components/waitlist/FaqAccordion';
import WaitlistForm from '@/components/waitlist/WaitlistForm';

export const metadata = {
  title: 'Join the Certifyd Waitlist',
  description: 'Verify ROI before you buy. Negotiate before you accept.',
};

export default function WaitlistPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <WaitlistHero />
      <QuickCalculator />
      <ToolStatusMatrix />
      <TrustSection />
      <WaitlistForm />
      <FaqAccordion />

      {/* FOOTER SECTION */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-900 dark:text-slate-200">Certifyd Inc.</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
            <span>Incubated at CHRIST CIC</span>
          </div>

          <div className="text-center md:text-left max-w-xl text-slate-500 dark:text-slate-500">
            Disclaimer: ROI figures provided are estimates based on aggregated third-party data and algorithmic modeling. They do not constitute financial or career guarantees.
          </div>

          <div className="flex gap-4">
            <a href="mailto:contact@certifyd.in" className="hover:text-slate-900 dark:hover:text-white transition-colors">contact@certifyd.in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
