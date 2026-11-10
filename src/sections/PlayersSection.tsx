import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { playersData, type Player } from "../data/players";
import { playersApi } from "../api/players";
import { optimizeCloudinaryUrl } from "../utils/imageOptimizer";
import logoImg from "../assets/lordz-logo.png";
import { Crosshair, Shield, Zap, Target } from "lucide-react";

// Social SVG Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface PlayersSectionProps {
  showHeader?: boolean;
}

const KNOWN_MEMBER_IMAGES: Record<string, string> = {
  aadil: "/members/player-aadhil.png",
  aadhil: "/members/player-aadhil.png",
  norman: "/members/player-norman.png",
  aero: "/members/player-aero.png",
  drago: "/uploads/db-tickerPlayers-4-image-1793023262887-37vld.png",
  kolaya: "/members/player-kolaya.png",
  omkar: "/members/player-omkar.png",
  rudy: "/members/player-rudy.png",
  destro: "/members/player-destro.png",
  leap: "/members/player-leap.png",
};

const getPlayerFallbackImage = (player: Player): string | null => {
  const ign = (player.ign || "").trim().toLowerCase();
  const id = (player.id || "").trim().toLowerCase();

  for (const [key, path] of Object.entries(KNOWN_MEMBER_IMAGES)) {
    if (ign.includes(key) || id.includes(key)) {
      return path;
    }
  }

  if (ign.includes("beast") || id.includes("beast")) return "/players/player-beast.jpg";
  if (ign.includes("falcon") || id.includes("falcon")) return "/players/player-falcon.jpg";
  if (ign.includes("shadow") || id.includes("shadow")) return "/players/player-shadow.jpg";
  if (ign.includes("viper") || id.includes("viper")) return "/players/player-viper.jpg";

  return null;
};

const resolvePlayerImage = (player: Player): string | null => {
  let img = player.image || player.avatarUrl;
  if (img && typeof img === "string" && img.trim()) {
    let clean = img.trim().replace(/^\/?public\//i, "/");
    if (!clean.startsWith("http") && !clean.startsWith("/")) {
      clean = `/${clean}`;
    }
    return clean;
  }
  return getPlayerFallbackImage(player);
};

export const PlayersSection = ({ showHeader = true }: PlayersSectionProps) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const cached = localStorage.getItem("mg_pro_athletes_cache_v3");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return playersData;
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    playersApi
      .getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setPlayers(data);
          try {
            localStorage.setItem("mg_pro_athletes_cache_v3", JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "IGL":
        return <Shield className="h-4 w-4 text-[#fc8100]" />;
      case "RUSHER":
        return <Zap className="h-4 w-4 text-[#fc8100]" />;
      case "SNIPER":
        return <Crosshair className="h-4 w-4 text-[#fc8100]" />;
      default:
        return <Target className="h-4 w-4 text-[#fc8100]" />;
    }
  };

  return (
    <section
      id="players"
      className={`relative ${showHeader ? "py-24" : "py-12 sm:py-16"} px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden w-full max-w-full`}
    >
      {/* Background Ambience */}
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-[#fc8100]/6 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <SectionHeading
            badge="PRO ROSTER"
            title="MEET THE PLAYERS"
            subtitle="The championship athletes representing MG ESPORTS across premier national mobile stages."
          />
        )}

        {/* Players Sports Card Grid: 2 Columns on Mobile, 2 on Tablet, 4 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-6">
          {players.map((player) => {
            const cleanIgn = (player.ign || "").trim();
            const cleanRealName = (player.realName || "").trim();
            const isImageFailed = failedImages[player.id];
            const fallbackImg = getPlayerFallbackImage(player);
            const resolvedImg = resolvePlayerImage(player);
            const rawImg = isImageFailed ? fallbackImg : (resolvedImg || fallbackImg);
            const athleteImg = rawImg ? optimizeCloudinaryUrl(rawImg, 500) : null;
            const rawInsta = (player.instagram || "").replace(/^insta:/i, "").replace(/^@/, "").trim();
            const instaUrl = rawInsta ? (rawInsta.startsWith("http") ? rawInsta : `https://instagram.com/${rawInsta}`) : null;
            const instaHandleDisplay = rawInsta ? `@${rawInsta.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}` : "@mgesports";

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -8 }}
                className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#141418] via-[#0C0C0E] to-[#070709] border border-white/10 hover:border-[#fc8100]/70 p-2.5 xs:p-3 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_45px_rgba(252, 129, 0,0.25)] transition-all duration-300 overflow-hidden min-w-0"
              >
                {/* Top Chamfer Cut & Gold Strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fc8100] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between z-10 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/70 border border-white/10 text-[9px] xs:text-[10px] font-heading font-bold uppercase tracking-wider text-gray-300">
                      {getRoleIcon(player.role)}
                      <span>{player.role}</span>
                    </div>

                    {/* Indian Region Badge */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 xs:px-2 py-0.5 rounded bg-black/60 border border-white/5 text-[9px] xs:text-[10px] sm:text-[11px] font-mono">
                      <span className="text-[10px] sm:text-xs" title="India">🇮🇳</span>
                      <span className="font-heading font-bold text-gray-400 tracking-wider hidden xs:inline">INDIA</span>
                    </div>
                  </div>

                  {/* Athlete Visual Anchor / Player Image */}
                  <div className="relative aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-b from-[#181820] to-[#0C0C0E] border border-white/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:border-[#fc8100]/40 transition-all shadow-inner">
                    {athleteImg ? (
                      <div className="relative h-full w-full">
                        <img
                          src={athleteImg}
                          alt={`${cleanIgn} (${cleanRealName}) - Pro Athlete for MG ESPORTS`}
                          onError={(e) => {
                            if (fallbackImg && e.currentTarget.src !== fallbackImg && !e.currentTarget.src.endsWith(fallbackImg)) {
                              e.currentTarget.src = fallbackImg;
                            } else {
                              setFailedImages((prev) => ({ ...prev, [player.id]: true }));
                            }
                          }}
                          loading="eager"
                          decoding="async"
                          className="h-full w-full object-cover object-top filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-transparent to-transparent opacity-85 pointer-events-none" />
                        
                        {/* Overlay Role / Captain Badge */}
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-3 sm:right-3 flex items-center justify-between pointer-events-none">
                          {player.isCaptain ? (
                            <span className="font-heading text-[8px] xs:text-[9px] sm:text-[10px] font-black text-black bg-[#fc8100] px-1.5 xs:px-2 sm:px-2.5 py-0.5 rounded uppercase tracking-wider shadow-[0_0_12px_rgba(252, 129, 0,0.6)]">
                              CAPTAIN / IGL
                            </span>
                          ) : (
                            <span className="font-heading text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-white bg-black/70 backdrop-blur-sm border border-white/15 px-1.5 xs:px-2 py-0.5 rounded uppercase tracking-wider">
                              {player.role}
                            </span>
                          )}
                          <img src={logoImg} alt="MG ESPORTS" width={20} height={20} className="h-3.5 w-3.5 sm:h-5 sm:w-5 object-contain drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      // Graphic fallback if no athlete image
                      <div className="relative h-full w-full flex flex-col items-center justify-center p-2 sm:p-4 text-center bg-gradient-to-b from-neutral-900 to-black">
                        <div className="absolute inset-0 bg-esports-grid opacity-20" />
                        <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-full bg-black/80 border border-[#fc8100]/30 flex items-center justify-center text-[#fc8100] mb-1.5 sm:mb-3 shadow-[0_0_20px_rgba(252, 129, 0,0.15)] group-hover:scale-110 transition-transform">
                          <span className="font-display text-lg sm:text-3xl font-bold">{cleanIgn.slice(0, 2) || "MG"}</span>
                        </div>
                        <span className="font-heading text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
                          {player.team || "MG ESPORTS"}
                        </span>
                        <span className="font-heading text-[10px] sm:text-xs text-[#fc8100] font-extrabold uppercase tracking-widest mt-1 sm:mt-2">
                          {player.role}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Player Typography */}
                  <div className="z-10">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-base xs:text-lg sm:text-2xl lg:text-3xl uppercase tracking-wider text-white group-hover:text-[#fc8100] transition-colors leading-tight truncate">
                        {cleanIgn}
                      </h3>
                    </div>
                    <div className="text-[10px] xs:text-xs text-[#9CA3AF] font-body mt-0.5 sm:mt-1 truncate">
                      {cleanRealName} • <span className="text-gray-300 font-semibold">{player.game || "CLASH OF CLANS"}</span>
                    </div>

                    {/* About The Player */}
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-black/50 border border-white/5 min-h-[50px] sm:min-h-[72px] flex flex-col justify-center">
                      <span className="block text-[8px] xs:text-[9px] font-heading font-bold uppercase tracking-widest text-[#fc8100] mb-0.5">
                        ABOUT ATHLETE
                      </span>
                      <p className="text-[10px] xs:text-[11px] sm:text-[11.5px] text-gray-300 font-body leading-snug line-clamp-2">
                        {player.about || player.featuredQuote || "Pro athlete competing under the banner of MG ESPORTS."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instagram Action Button */}
                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/5 z-10 shrink-0">
                  {instaUrl ? (
                    <a
                      href={instaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 sm:gap-2 w-full py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#E1306C]/15 via-[#FD1D1D]/10 to-[#F56040]/15 hover:from-[#E1306C]/30 hover:to-[#F56040]/30 border border-[#E1306C]/30 hover:border-[#E1306C]/80 text-[#FF5B84] hover:text-white transition-all duration-200 group/insta shadow-sm"
                      title={`Follow ${cleanIgn} on Instagram`}
                    >
                      <InstagramIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#E1306C] group-hover/insta:scale-115 transition-transform shrink-0" />
                      <span className="font-mono text-[10px] xs:text-[11px] sm:text-xs font-semibold text-gray-200 group-hover/insta:text-white truncate">
                        {instaHandleDisplay}
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 text-gray-500 text-[10px] xs:text-[11px] sm:text-xs font-mono">
                      <InstagramIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                      <span>@mgesports</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
