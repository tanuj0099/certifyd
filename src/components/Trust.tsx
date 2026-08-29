export default function Trust() {
  return (
    <section className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest mb-6">
          Data Verified From
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="text-xl font-display font-bold text-text-primary">AmbitionBox</div>
          <div className="text-xl font-display font-bold text-text-primary">Payscale India</div>
          <div className="text-xl font-display font-bold text-text-primary">Naukri</div>
        </div>
      </div>
    </section>
  );
}
