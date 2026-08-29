export default function TrustSection() {
  return (
    <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Badges */}
          <div className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            Incubated at CHRIST CIC
          </div>
          <div className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            Data sourced from AmbitionBox, Payscale India, Naukri
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-500 text-center md:text-right max-w-sm">
          We strictly utilize aggregated, anonymized, and verified third-party datasets. No fabricated numbers, no hidden sponsorships.
        </div>

      </div>
    </section>
  );
}
