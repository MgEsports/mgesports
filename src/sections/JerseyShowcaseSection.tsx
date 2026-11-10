import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { GoldButton } from "../components/common/GoldButton";
import jerseyFrontImg from "../assets/FRONT.png";
import jerseyBackImg from "../assets/back.png";
import { Sparkles, Shield, Compass, ArrowRight } from "lucide-react";

interface JerseyShowcaseSectionProps {
  onShopJersey: () => void;
  showHeader?: boolean;
}

export const JerseyShowcaseSection = ({
  onShopJersey,
  showHeader = true,
}: JerseyShowcaseSectionProps) => {
  const [activeView, setActiveView] = useState<"front" | "back">("front");

  return (
    <section
      id="jersey"
      className={`relative ${showHeader ? "py-28" : "py-12 sm:py-16"} px-4 sm:px-6 lg:px-8 bg-[#070709] overflow-hidden`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-[#FFBE32]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <SectionHeading
            badge="OFFICIAL STORE"
            title="OFFICIAL MERCHANDISE"
            subtitle="Order the official jersey and print your favorite player's name on it, or your own nickname."
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Interactive Jersey Display (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* View Switcher Controls */}
            <div className="flex items-center gap-3 mb-6 p-1.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setActiveView("front")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-heading text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  activeView === "front"
                    ? "bg-[#FFBE32] text-black shadow-[0_0_15px_rgba(255,190,50,0.35)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                FRONT VIEW
              </button>
              <button
                onClick={() => setActiveView("back")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-heading text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  activeView === "back"
                    ? "bg-[#FFBE32] text-black shadow-[0_0_15px_rgba(255,190,50,0.35)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                BACK VIEW
              </button>
            </div>

            {/* Jersey Card Container */}
            <div className="relative w-full max-w-[480px] rounded-2xl border border-[#FFBE32]/40 bg-gradient-to-b from-[#121216] to-[#08080A] p-3 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,190,50,0.15)] group overflow-hidden">
              
              {/* Corner Badge */}
              {/* <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded bg-black/80 border border-[#FFBE32]/30 text-[9px] sm:text-[10px] font-heading font-bold text-[#FFBE32] uppercase tracking-wider">
                  {activeView === "front" ? "SOUTH TEMPLE ART" : "BEAST 00 ATHLETE PRINT"}
                </span>
              </div> */}

              {/* Jersey Image Switcher with Smooth Crossfade */}
              <div className="relative h-[290px] xs:h-[350px] sm:h-[450px] lg:h-[480px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/50">
                <AnimatePresence mode="wait">
                  {activeView === "front" ? (
                    <motion.img
                      key="front"
                      src={jerseyFrontImg}
                      alt="MG ESPORTS Pro Combat Jersey Front View"
                      loading="lazy"
                      decoding="async"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(255,190,50,0.2)]"
                    />
                  ) : (
                    <motion.img
                      key="back"
                      src={jerseyBackImg}
                      alt="MG ESPORTS Pro Combat Jersey Back View - Athlete Print"
                      loading="lazy"
                      decoding="async"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(255,190,50,0.2)]"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-gray-400 px-1">
                <span>Official Pro Athlete Spec</span>
                <span className="text-[#FFBE32] font-mono">100% Breathable Micro-Poly</span>
              </div>
            </div>
          </div>

          {/* Design Rationale & Identity Story (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-3">
              AUTHENTIC CLAN GEAR
            </div>

            <h3 className="font-display text-3xl sm:text-5xl uppercase tracking-wider text-white leading-tight">
              BLACK. ORANGE. <br />
              <span className="text-gold-gradient">MG.</span>
            </h3>

            <p className="mt-4 text-sm sm:text-lg text-gray-300 font-body leading-relaxed">
              Order the official jersey and print your favorite player's name on it, or your own nickname. Engineered for competition and championship glory.
            </p>

            {/* Feature Bullet Points */}
            <div className="mt-6 space-y-3 sm:space-y-3.5 w-full">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-[#FFBE32]/15 border border-[#FFBE32]/40 flex items-center justify-center text-[#FFBE32] shrink-0 mt-0.5">
                  <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div>
                  <h4 className="font-heading text-xs sm:text-sm font-bold uppercase text-white tracking-wider">
                    Clash of Clans Heritage Design
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-body">
                    Inspired by the legendary Clash of Clans universe, featuring castle architecture, clan emblems, and battle-inspired detailing that celebrates strategy, unity, and victory.
                  </p>
                </div>
              </div>

              {/* <div className="flex items-start gap-3">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-[#FFBE32]/15 border border-[#FFBE32]/40 flex items-center justify-center text-[#FFBE32] shrink-0 mt-0.5">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div>
                  <h4 className="font-heading text-xs sm:text-sm font-bold uppercase text-white tracking-wider">
                    Heritage Sleeve Trim
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-body">
                    Official Tamil script ("தமிழன்") woven into the cuff with the Indian national tricolor.
                  </p>
                </div>
              </div> */}

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-[#FFBE32]/15 border border-[#FFBE32]/40 flex items-center justify-center text-[#FFBE32] shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div>
                  <h4 className="font-heading text-xs sm:text-sm font-bold uppercase text-white tracking-wider">
                    Prismatic Numbering & Custom IGN
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-body">
                    Holographic silver back font that reflects arena broadcast floodlights.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full">
              <GoldButton onClick={onShopJersey} size="lg" className="w-full sm:w-auto">
                SHOP JERSEY 
              </GoldButton>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 hover:border-[#FFBE32] text-xs font-heading font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all bg-white/5 hover:bg-white/10"
              >
                <span>ALL PRODUCTS</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#FFBE32]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
