import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplePattern } from "../components/common/TemplePattern";
import logoImg from "../assets/lordz-logo.png";
import aboutTeam from "../assets/hero.png";
import {
  Trophy,
  Shield,
  Users,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Crosshair,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { playersData, type Player } from "../data/players";
import { playersApi } from "../api/players";
import { collectiveMembers } from "../data/teams";

// Social SVG Icon for Instagram
const InstagramIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Social SVG Icon for LinkedIn
const LinkedInIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
  </svg>
);

const getRoleIcon = (role: string) => {
  switch (role) {
    case "IGL":
      return <Shield className="h-3.5 w-3.5 text-[#fc8100]" />;
    case "RUSHER":
      return <Zap className="h-3.5 w-3.5 text-[#fc8100]" />;
    case "SNIPER":
      return <Crosshair className="h-3.5 w-3.5 text-[#fc8100]" />;
    default:
      return <Target className="h-3.5 w-3.5 text-[#fc8100]" />;
  }
};

interface AboutSectionProps {
  showHeader?: boolean;
  defaultTab?: "manifesto" | "players" | "teams";
}

export const AboutSection = ({
  showHeader = true,
  defaultTab = "manifesto",
}: AboutSectionProps) => {
  const [activeTab, setActiveTab] = useState<"manifesto" | "players" | "teams">(defaultTab);
  const [athletes, setAthletes] = useState<Player[]>(playersData);

  useEffect(() => {
    playersApi
      .getAll()
      .then((data) => {
        if (data && data.length > 0) setAthletes(data);
      })
      .catch(() => {});
  }, []);

  const manifesto = [
    { text: "A TEAM WINS FURTHER", gold: false },
    { text: "THAN A PLAYER ALONE.", gold: true },
    { text: "TOGETHER WE CONQUER.", gold: false },
  ];

  const stats = [
    { label: "PRIMARY GLORY", value: "GOLDEN TICKET", icon: Trophy },
    { label: "MAJOR TITLES", value: "3X CHAMPIONS", icon: Award },
    { label: "WIN RATE", value: "84%", icon: Shield },
    { label: "GLOBAL RANKING", value: "TOP 8", icon: Users },
  ];

  return (
    <section
      id="about"
      className={`relative ${showHeader ? "py-24 sm:py-28" : "py-8 sm:py-12 lg:py-16"
        } px-4 sm:px-6 lg:px-8 bg-[#070709] border-t border-white/5 overflow-hidden w-full max-w-full`}
    >
      {/* Background Architectural Gopuram Pattern */}
      <TemplePattern className="opacity-[0.04] scale-150" />

      {/* Atmospheric center gold & cyan glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[400px] bg-[#fc8100]/8 blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10">
        {showHeader && (
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            {/* Crest Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center"
            >
              <img
                src={logoImg}
                alt="MG ESPORTS Official Crest"
                width={56}
                height={56}
                className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(252, 129, 0,0.35)]"
              />
            </motion.div>

            {/* Section Pre-title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#fc8100]/10 border border-[#fc8100]/30 text-[10px] sm:text-xs font-heading font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#fc8100] mb-3"
            >
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#fc8100]" />
              <span>ORGANIZATION HUB</span>
            </motion.div>

            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wider text-white">
              ABOUT <span className="text-gold-gradient">MG ESPORTS</span>
            </h2>

            {/* Interactive Section Switcher Tabs: Manifesto / Players / Teams */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("manifesto")}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === "manifesto"
                    ? "bg-[#fc8100] text-black shadow-[0_0_20px_rgba(252, 129, 0,0.3)] scale-105"
                    : "bg-[#121217] text-gray-400 hover:text-white border border-white/10 hover:border-[#fc8100]/30"
                  }`}
              >
                🏛️ Manifesto & Story
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("players")}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === "players"
                    ? "bg-[#fc8100] text-black shadow-[0_0_20px_rgba(252, 129, 0,0.3)] scale-105"
                    : "bg-[#121217] text-gray-400 hover:text-white border border-white/10 hover:border-[#fc8100]/30"
                  }`}
              >
                ⚡ Pro Athletes (Roster)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("teams")}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === "teams"
                    ? "bg-[#fc8100] text-black shadow-[0_0_20px_rgba(252, 129, 0,0.3)] scale-105"
                    : "bg-[#121217] text-gray-400 hover:text-white border border-white/10 hover:border-[#fc8100]/30"
                  }`}
              >
                🛡️ The Collective & Teams
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Content Based on Tab Selection */}
        <AnimatePresence mode="wait">
          {activeTab === "manifesto" && (
            <motion.div
              key="tab-manifesto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            >
              {/* LEFT: Champion Team Image Presentation (lg:col-span-6) */}
              <div className="lg:col-span-6 relative">
                {/* Ambient Backlight */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#fc8100]/15 via-transparent to-cyan-500/10 blur-2xl pointer-events-none" />

                <div className="relative rounded-2xl overflow-hidden border border-[#fc8100]/35 bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(252, 129, 0,0.15)] group">
                  <div className="aspect-[4/3] w-full overflow-hFidden relative">
                    <img
                      src={aboutTeam}
                      alt="MG ESPORTS Pro Champions on Stage with Trophy"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />

                    {/* Top Badge */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 border border-[#fc8100]/40 backdrop-blur-md">
                      <Trophy className="h-3.5 w-3.5 text-[#fc8100]" />
                      <span className="font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#fc8100]">
                        GOLDEN TICKET WINNERS
                      </span>
                    </div>

                    {/* Bottom Overlay Info */}
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-left">
                      <div>
                        <span className="font-display text-lg sm:text-xl uppercase tracking-wider text-white">
                          CLASH OF CLANS DIVISION
                        </span>
                        <p className="text-[11px] text-gray-300 font-body">
                          World Championship Finals Stage
                        </p>
                      </div>
                      <span className="font-mono text-xs text-[#fc8100] bg-black/80 px-2.5 py-1 rounded border border-[#fc8100]/30">
                        TOP 8 WORLD
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Typography, Story & Stats (lg:col-span-6) */}
              <div className="lg:col-span-6 flex flex-col justify-center text-left">
                {/* Manifesto Typography */}
                <div className="space-y-1 sm:space-y-2">
                  {manifesto.map((item) => (
                    <div
                      key={item.text}
                      className={`font-display text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight font-extrabold ${item.gold ? "text-gold-gradient" : "text-white"
                        }`}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>

                {/* Story Paragraph */}
                <p className="mt-5 text-sm sm:text-base text-gray-300 font-body leading-relaxed">
                  A mobile esports and media organization built around one idea:{" "}
                  <strong className="text-white font-semibold">a team wins further than a player alone</strong>.
                  We field elite athletes on the Clash of Clans World Championship stage, where we earned our Golden Ticket.
                </p>

                <p className="mt-2.5 text-xs sm:text-sm text-gray-400 font-body leading-relaxed">
                  Our premier roster competes on the global championship stage, built on base design, strategy,
                  and absolute trust between players. We train, compete, and win as one team.
                </p>

                {/* Micro Stats Grid */}
                <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {stats.map((s) => {
                    const IconComponent = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="p-2.5 sm:p-3 rounded-xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between"
                      >
                        <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#fc8100] mb-1.5 sm:mb-2" />
                        <span className="font-display text-lg sm:text-2xl font-bold text-white">
                          {s.value}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-heading font-bold uppercase tracking-wider text-gray-500 mt-0.5 sm:mt-1">
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Action Links */}
                <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    to="/about#players"
                    className="inline-flex items-center gap-2 font-heading text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-[#fc8100] text-black hover:bg-[#ff9924] py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg transition-all shadow-[0_0_20px_rgba(252, 129, 0,0.2)]"
                  >
                    <span>MEET THE ATHLETES</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/about#teams"
                    className="inline-flex items-center gap-1.5 font-heading text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#fc8100] py-2 sm:py-2.5 px-3 transition-colors border border-white/10 hover:border-[#fc8100]/40 rounded-lg"
                  >
                    <span>OPERATIONAL TEAM</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PRO ATHLETES SHOWCASE */}
          {activeTab === "players" && (
            <motion.div
              key="tab-players"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                {athletes.slice(0, 4).map((player) => {
                  const cleanIgn = (player.ign || "").trim();
                  const cleanRealName = (player.realName || "").trim();
                  const isBeast = cleanIgn === "BEAST" || player.id === "player-beast";
                  const athleteImg = player.image || player.avatarUrl || (isBeast ? "/players/player-beast.jpg" : null);
                  const rawInsta = (player.instagram || "").replace(/^insta:/i, "").replace(/^@/, "").trim();
                  const instaUrl = rawInsta ? `https://instagram.com/${rawInsta}` : null;
                  const instaHandleDisplay = rawInsta ? `@${rawInsta}` : "@lordesports";

                  return (
                    <div
                      key={player.id}
                      className="group relative rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#141418] via-[#0C0C0E] to-[#070709] border border-white/10 hover:border-[#fc8100]/70 p-2.5 xs:p-3 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_45px_rgba(252, 129, 0,0.2)] transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Gold Strip */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fc8100] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

                      <div>
                        {/* Athlete Role & Team */}
                        <div className="flex items-center justify-between mb-2 sm:mb-3 text-[9px] xs:text-[10px] font-heading font-bold uppercase">
                          <span className="inline-flex items-center gap-1 px-1.5 xs:px-2.5 py-0.5 sm:py-1 rounded bg-black/70 border border-white/10 text-gray-300">
                            {getRoleIcon(player.role)}
                            {player.role}
                          </span>
                          <span className="font-mono text-[#fc8100] bg-[#fc8100]/10 px-1.5 xs:px-2 py-0.5 rounded border border-[#fc8100]/25">
                            #{player.jerseyNumber || "00"}
                          </span>
                        </div>

                        {/* Photo Container */}
                        <div className="aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-b from-[#16161B] via-[#0D0D10] to-[#08080A] border border-white/10 mb-2 sm:mb-3 relative">
                          {athleteImg ? (
                            <img
                              src={athleteImg}
                              alt={`${cleanIgn} (${cleanRealName}) - Pro Clan Athlete for Mg ESPORTS`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover object-top filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.src = "/players/player-beast.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center bg-gradient-to-b from-neutral-900 to-black">
                              <span className="font-display text-xl sm:text-3xl font-bold text-[#fc8100]">{cleanIgn.slice(0, 2) || "LZ"}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between pointer-events-none">
                            <span className="font-display text-sm sm:text-lg uppercase tracking-wider text-white group-hover:text-[#fc8100] transition-colors truncate">
                              {cleanIgn}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-heading uppercase text-gray-400 shrink-0 hidden xs:inline">
                              {cleanRealName}
                            </span>
                          </div>
                        </div>

                        <div className="min-h-[40px] sm:min-h-[48px] flex flex-col justify-center">
                          <p className="text-[10px] xs:text-[11px] sm:text-xs text-gray-400 font-body leading-relaxed line-clamp-2">
                            {player.about || player.featuredQuote || "Pro athlete competing under the banner of MG ESPORTS."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-xs shrink-0">
                        <span className="font-mono text-[9px] sm:text-[10px] text-gray-500">FREE FIRE</span>
                        {instaUrl ? (
                          <a
                            href={instaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-[#fc8100] hover:underline truncate max-w-[110px] sm:max-w-[150px]"
                            title={`Follow ${cleanIgn} on Instagram`}
                          >
                            <InstagramIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                            <span className="truncate">{instaHandleDisplay}</span>
                          </a>
                        ) : (
                          <span className="font-mono text-[9px] sm:text-[10px] text-gray-500">@lordesports</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View Full Roster Button */}
              <div className="text-center pt-2">
                <Link
                  to="/about#players"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fc8100] text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#ff9924] transition-all shadow-[0_0_20px_rgba(252, 129, 0,0.25)]"
                >
                  <span>EXPLORE FULL ROSTER IN ABOUT</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* TAB 3: THE COLLECTIVE SHOWCASE */}
          {activeTab === "teams" && (
            <motion.div
              key="tab-teams"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                {collectiveMembers.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="group relative rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#141418] via-[#0C0C0E] to-[#070709] border border-white/10 hover:border-[#fc8100]/70 p-2.5 xs:p-3 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_45px_rgba(252, 129, 0,0.2)] transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Gold Strip */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fc8100] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Photo / Portrait */}
                      <div className="aspect-[4/5] w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#0A0A0C] border border-white/10 mb-2 sm:mb-3 relative">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center font-display text-xl sm:text-2xl font-black text-white/90">
                            {member.initials || "LZ"}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                          <span className="px-1.5 xs:px-2 py-0.5 rounded bg-black/80 border border-white/10 text-gray-300 truncate max-w-full">
                            //{member.handle}
                          </span>
                          <span className="text-[#fc8100] hidden xs:inline">{member.divisions[0]}</span>
                        </div>
                      </div>

                      <h4 className="font-heading text-xs xs:text-sm sm:text-base font-bold text-white group-hover:text-[#fc8100] transition-colors leading-snug mb-0.5 sm:mb-1 truncate">
                        {member.name}
                      </h4>
                      <p className="text-[10px] xs:text-[11px] text-gray-400 font-body line-clamp-2">
                        {member.primaryRole}
                      </p>
                    </div>

                    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="font-mono text-[9px] sm:text-[10px] text-gray-500">OPERATIONAL</span>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {member.linkedin && (
                          <a
                            href={
                              member.linkedin.startsWith("http")
                                ? member.linkedin
                                : `https://linkedin.com/in/${member.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-[#0A66C2]/20 hover:bg-[#0A66C2]/40 text-[#70B5F9] transition-colors"
                            title="LinkedIn"
                          >
                            <LinkedInIcon className="h-3 w-3" />
                          </a>
                        )}
                        {member.instagram && (
                          <a
                            href={
                              member.instagram.startsWith("http")
                                ? member.instagram
                                : `https://instagram.com/${member.instagram.replace(/^@/, "")}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-[#E1306C] transition-colors"
                            title="Instagram"
                          >
                            <InstagramIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Full Collective Button */}
              <div className="text-center pt-2">
                <Link
                  to="/about#teams"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fc8100] text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#ff9924] transition-all shadow-[0_0_20px_rgba(252, 129, 0,0.25)]"
                >
                  <span>EXPLORE COMPLETE COLLECTIVE IN ABOUT</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
