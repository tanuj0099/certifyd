import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="contact" className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.svg" 
                alt="Certifyd Logo" 
                width={24} 
                height={24} 
                className="w-6 h-6 object-contain"
              />
              <span className="font-display font-semibold text-lg tracking-tight text-text-primary">
                Certifyd
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Verify ROI before you buy. Negotiate before you accept.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/officialcertifyd.in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://www.linkedin.com/in/certifyd-in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <FaLinkedin size={20} />
              </a>
              <a href="https://chat.whatsapp.com/Gi7GZWKTrqI9Pfe4JprJT5" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors" title="Join Community">
                <FaWhatsapp size={20} />
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <a href="mailto:officialcertifyd.in@gmail.com" className="hover:text-text-primary transition-colors">officialcertifyd.in@gmail.com</a>
              <span>&copy; {new Date().getFullYear()} Certifyd.</span>
            </div>
          </div>
          
        </div>
        
      </div>
    </footer>
  );
}
