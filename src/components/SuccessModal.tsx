import { X, Check, Sparkles, Gift, Users } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface SuccessModalProps {
  onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-sm rounded-3xl shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary bg-background/50 rounded-full hover:bg-elevated transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 flex flex-col items-center text-center">
          {/* Check Icon */}
          <div className="w-12 h-12 bg-positive/10 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-positive" strokeWidth={3} />
          </div>

          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            You're on the Waitlist!
          </h2>
          <p className="text-text-secondary text-sm mb-6 max-w-sm">
            Thank you for joining Certifyd. You have successfully secured early access. Here is what's next:
          </p>

          {/* Perks Card */}
          <div className="w-full bg-elevated/30 border border-border rounded-xl p-4 flex flex-col gap-4 text-left mb-6">
            <div className="flex gap-3">
              <div className="text-brand shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary mb-0.5">Priority Beta Access</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Get invited to use the platform and calculate ROI before the public release.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-brand shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary mb-0.5">Community Updates</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Get regular progress reports and participate in platform surveys.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <a 
              href="https://chat.whatsapp.com/Gi7GZWKTrqI9Pfe4JprJT5" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-sm md:text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 hover:-translate-y-0.5"
            >
              <FaWhatsapp className="w-5 h-5" />
              Join WhatsApp Community
            </a>
            
            <button 
              onClick={onClose}
              className="w-full py-3 px-4 bg-elevated hover:bg-elevated/80 text-text-primary rounded-xl text-sm font-semibold transition-colors"
            >
              Continue exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
