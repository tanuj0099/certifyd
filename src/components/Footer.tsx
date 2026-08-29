export default function Footer() {
  return (
    <footer id="contact" className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand flex items-center justify-center font-bold text-white shadow-sm text-xs">
                C
              </div>
              <span className="font-display font-semibold text-lg tracking-tight text-text-primary">
                Certifyd
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Verify ROI before you buy. Negotiate before you accept.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-sm text-text-secondary">
            <a href="mailto:hello@certifyd.in" className="hover:text-brand transition-colors">
              hello@certifyd.in
            </a>
            <div className="flex gap-4">
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
        
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary/70">
          <p>© {new Date().getFullYear()} Certifyd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
