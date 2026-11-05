import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Handshake,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { partnersApi } from "../api/partners";

// Default / fallback clean logo assets
import logoCleanEsportsPro from "../assets/logo-esportspro-clean.svg";
import logoCleanEspotzLive from "../assets/logo-espotz-clean.svg";
import logoCleanInfinix from "../assets/logo-infinix-clean.svg";
import logoCleanFreeFireMax from "../assets/logo-freefire-clean.svg";
import logoCleanFusionCrystals from "../assets/logo-fusion-clean.svg";
import logoCleanEsportsWorldCup from "../assets/logo-ewc-clean.svg";

import { getApiUrl } from "../api/client";

export interface PartnerItem {
  id: string;
  name: string;
  category?: string;
  tier?: string;
  logoImage?: string | null;
  cardImage?: string | null;
  websiteUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

const defaultFallbackLogos: Record<string, string> = {
  "esports-pro": logoCleanEsportsPro,
  "espotz-live": logoCleanEspotzLive,
  "infinix": logoCleanInfinix,
  "free-fire-max": logoCleanFreeFireMax,
  "fusion-crystals": logoCleanFusionCrystals,
  "esports-world-cup": logoCleanEsportsWorldCup,
};

const KNOWN_PARTNER_LOGOS: Record<string, string> = {
  "free-fire-max": logoCleanFreeFireMax,
  "freefire": logoCleanFreeFireMax,
  "ffmax": logoCleanFreeFireMax,
  "free-fire": logoCleanFreeFireMax,
  "fusion-crystals": logoCleanFusionCrystals,
  "fusion": logoCleanFusionCrystals,
  "fusioncrystals": logoCleanFusionCrystals,
  "esports-world-cup": logoCleanEsportsWorldCup,
  "ewc": logoCleanEsportsWorldCup,
  "worldcup": logoCleanEsportsWorldCup,
  "world-cup": logoCleanEsportsWorldCup,
  "esports-pro": logoCleanEsportsPro,
  "esportspro": logoCleanEsportsPro,
  "espotz-live": logoCleanEspotzLive,
  "espotz": logoCleanEspotzLive,
  "infinix": logoCleanInfinix,
};

export const getKnownPartnerLogo = (nameOrId: string = ""): string | null => {
  if (!nameOrId) return null;
  const lower = nameOrId.toLowerCase().trim();
  const clean = lower.replace(/[^a-z0-9]/g, "");

  if (KNOWN_PARTNER_LOGOS[lower]) return KNOWN_PARTNER_LOGOS[lower];
  if (KNOWN_PARTNER_LOGOS[clean]) return KNOWN_PARTNER_LOGOS[clean];

  if (clean.includes("freefire") || clean.includes("garena")) return logoCleanFreeFireMax;
  if (clean.includes("fusion")) return logoCleanFusionCrystals;
  if (clean.includes("worldcup") || clean.includes("ewc")) return logoCleanEsportsWorldCup;
  if (clean.includes("esportspro")) return logoCleanEsportsPro;
  if (clean.includes("espotz")) return logoCleanEspotzLive;
  if (clean.includes("infinix")) return logoCleanInfinix;

  return null;
};



export const defaultPartners: PartnerItem[] = [];

interface PartnersSectionProps {
  onPartnerWithUs: () => void;
  showHeader?: boolean;
  partners?: PartnerItem[];
}

export const PartnersSection = ({
  onPartnerWithUs,
  showHeader = true,
  partners: initialPartners,
}: PartnersSectionProps) => {
  const [partnerList, setPartnerList] = useState<PartnerItem[]>(initialPartners || []);
  const [loading, setLoading] = useState(!initialPartners);

  useEffect(() => {
    if (!initialPartners) {
      setLoading(true);
      partnersApi
        .getAll()
        .then((data) => {
          if (Array.isArray(data)) {
            const activeOnly = data.filter((d) => d.isActive !== false);
            setPartnerList(activeOnly);
          } else {
            setPartnerList([]);
          }
        })
        .catch(() => {
          setPartnerList([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPartnerList(initialPartners);
      setLoading(false);
    }
  }, [initialPartners]);

  // Resolve logo helper - prioritizes custom uploaded/Cloudinary URLs and validates URLs
  const resolveLogo = (partner: PartnerItem): string | null => {
    // 1. If it's an external CDN or Cloudinary URL (e.g. Cloudinary upload), prioritize it
    if (
      partner.logoImage &&
      (partner.logoImage.startsWith("http://") ||
        partner.logoImage.startsWith("https://") ||
        partner.logoImage.startsWith("data:"))
    ) {
      return partner.logoImage;
    }

    // 2. If it's an uploaded relative path exists, resolve it via getApiUrl
    if (partner.logoImage) {
      return getApiUrl(partner.logoImage);
    }

    // 3. If it's a known brand, its bundled SVG is already present in-app
    const known = getKnownPartnerLogo(partner.name) || getKnownPartnerLogo(partner.id);
    if (known) {
      return known;
    }

    return defaultFallbackLogos[partner.id] || null;
  };

  // Preload all partner logos into memory for zero-lag marquee rendering
  useEffect(() => {
    if (typeof window === "undefined") return;
    partnerList.forEach((p) => {
      const src = resolveLogo(p);
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [partnerList]);

  // Duplicate partner list for seamless infinite loop marquee
  const repeatCount = partnerList.length > 0 ? Math.max(2, Math.ceil(12 / partnerList.length)) : 0;
  const marqueeList = Array.from({ length: repeatCount }, () => partnerList).flat();

  return (
    <section
      id="partners"
      className="relative py-24 sm:py-28 bg-[#050505] border-t border-white/5 overflow-hidden"
    >
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[350px] sm:h-[450px] bg-radial from-[#FFBE32]/8 via-transparent to-transparent blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-amber-600/5 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-600/5 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading & Overview */}
        {showHeader && (
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Tag pill with animated dot */}
              <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FFBE32]/10 border border-[#FFBE32]/30 mb-5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFBE32] animate-ping" />
                <span className="font-heading text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.22em] text-[#FFBE32] uppercase">
                  PARTNERSHIPS &amp; BRAND ALLIANCES
                </span>
              </div>

              {/* Main Section Heading */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-wide text-white leading-[1.12]">
                Associative Games &amp; <br />
                <span className="text-gold-gradient">Event Partners</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-gray-400 font-body leading-relaxed max-w-xl">
                Collaborating with global brands to empower the esports community.
              </p>
            </motion.div>

            {/* CTA action */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-4 shrink-0"
            >
              <button
                onClick={onPartnerWithUs}
                className="inline-flex items-center gap-2 sm:gap-2.5 font-heading text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#050505] bg-[#FFBE32] hover:bg-[#FFA000] py-3 sm:py-3.5 px-5 sm:px-7 rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_25px_rgba(255,190,50,0.35)] hover:shadow-[0_0_35px_rgba(255,190,50,0.5)] group"
              >
                <Handshake className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:scale-110" />
                <span>PARTNER WITH US →</span>
              </button>
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. CONTINUOUS MOVING LOGO MARQUEE (INFINITE CINEMATIC STREAM) */}
        {/* ========================================================================= */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FFBE32]" />
              <span className="font-heading text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-300">
                OFFICIAL BRAND SHOWCASE • CONTINUOUS STREAM
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-gray-500 uppercase">Hover to pause</span>
          </div>

          {/* Marquee Track: Seamless Infinite Stream without Background Rectangles */}
          <div className="relative w-full overflow-hidden py-6 sm:py-8">
            {/* Edge Shadow Gradients for smooth fade in/out on dark page background */}
            <div className="absolute inset-y-0 left-0 w-16 sm:w-44 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 sm:w-44 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="h-6 w-6 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : partnerList.length === 0 ? (
              <div className="py-12 text-center">
                <Handshake className="h-10 w-10 text-[#FFBE32]/40 mx-auto mb-3" />
                <p className="text-gray-400 font-heading text-sm uppercase tracking-wider">
                  Partner announcements coming soon
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Collaborating with global gaming brands and industry leaders.
                </p>
              </div>
            ) : (
              <div className="animate-marquee-smooth flex items-center gap-6 sm:gap-14">
                {marqueeList.map((partner, idx) => {
                  const logo = resolveLogo(partner);

                  return (
                    <div
                      key={`${partner.id}-mq1-${idx}`}
                      onClick={() => partner.websiteUrl && window.open(partner.websiteUrl, "_blank")}
                      title={partner.name}
                      className="relative group shrink-0 h-16 sm:h-24 w-36 sm:w-56 flex items-center justify-center cursor-pointer px-3 sm:px-4 transition-transform duration-300 hover:scale-110"
                    >
                      {/* Brand Logo Only - Pure Floating Transparent Logo */}
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${partner.name} - Official Partner of LORD ESPORTZ`}
                          loading="eager"
                          decoding="async"
                          onError={(e) => {
                            const fallback =
                              getKnownPartnerLogo(partner.name) ||
                              getKnownPartnerLogo(partner.id) ||
                              defaultFallbackLogos[partner.id];
                            if (fallback && e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="max-h-11 sm:max-h-16 max-w-full object-contain filter opacity-85 group-hover:opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(255,190,50,0.45)] transition-all duration-300"
                        />
                      ) : (
                        <span className="font-heading text-sm sm:text-base font-bold text-white/80 group-hover:text-white tracking-wider text-center transition-colors">
                          {partner.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>



        {/* Bottom Banner Stats Strip */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#0C0C10] via-[#111116] to-[#0C0C10] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center shrink-0">
              <Handshake className="h-6 w-6 text-[#FFBE32]" />
            </div>
            <div>
              <h4 className="font-display text-lg uppercase tracking-wider text-white">
                Want to Sponsor LORD ESPORTZ Tournaments?
              </h4>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                Reach over 500,000+ passionate competitive battle royale esports fans across YouTube &amp; Discord.
              </p>
            </div>
          </div>

          <button
            onClick={onPartnerWithUs}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.3)] shrink-0"
          >
            <span>Request Brand Dossier</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
