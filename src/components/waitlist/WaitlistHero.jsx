'use client';

export default function WaitlistHero() {
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center text-center">
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
        Know the ROI before you <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-brand-primary to-brand-gradient bg-clip-text text-transparent">
          invest in the certificate.
        </span>
      </h1>

      <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
        Verify ROI before you buy. Negotiate before you accept.
      </p>
      
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
        500+ tracked certifications. City-calibrated data.
      </p>

      <div className="mt-10">
        <a 
          href="#waitlist-section" 
          className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-orange-600 text-white font-medium text-sm rounded-md transition-colors"
        >
          Join the waitlist
        </a>
      </div>
    </section>
  );
}
