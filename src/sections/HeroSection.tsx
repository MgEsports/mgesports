import { motion, useTransform } from "framer-motion";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { GoldButton } from "../components/common/GoldButton";
import { OutlineButton } from "../components/common/OutlineButton";
import { TemplePattern } from "../components/common/TemplePattern";
import logoImg from "../assets/lordz-logo.png";
import Hero from "../assets/heroc.png";
import { Trophy, ChevronDown, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onExploreTournaments: () => void;
  onJoinLordz: () => void;
}

export const HeroSection = ({
  onExploreTournaments,
  onJoinLordz,
}: HeroSectionProps) => {
  // Desktop mouse parallax
  const { x: mouseX, y: mouseY } = useMouseParallax(12);

  const lightBlobX = useTransform(mouseX, (v) => v * -1.5);
  const lightBlobY = useTransform(mouseY, (v) => v * -1.5);

  const characterX = useTransform(mouseX, (v) => v * 1.2);
  const characterY = useTransform(mouseY, (v) => v * 1.2);

  return (
    <section
      id="home"
      className="relative min-h-[92vh] sm:min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] pt-24 pb-16"
    >
      {/* HERO BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url(${Hero})`,
        }}
      />

      {/* DARK CINEMATIC OVERLAY */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {/* LEFT DARK GRADIENT FOR TEXT READABILITY */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20 pointer-events-none" />

      {/* BOTTOM DARK GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* ESPORTS GRID */}
      <div className="absolute inset-0 bg-esports-grid opacity-30 pointer-events-none" />

      {/* TEMPLE ARCHITECTURAL PATTERN */}
      <TemplePattern className="opacity-[0.06] scale-125 translate-y-10" />

      {/* GOLD AMBIENT LIGHT */}
      <motion.div
        style={{
          x: lightBlobX,
          y: lightBlobY,
        }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] sm:h-[600px] sm:w-[600px] rounded-full bg-[#fc8100]/10 blur-[90px] pointer-events-none will-change-transform"
      />

      {/* MAIN CONTENT */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[75vh]">

          {/* LEFT: BRANDING AND CONTENT */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start pt-4">

            {/* BRAND BADGE */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#fc8100]/35 bg-[#fc8100]/10 backdrop-blur-md mb-6"
            >
              <img
                src={logoImg}
                alt="MG ESPORTS Official Crest"
                width={16}
                height={16}
                className="h-4 w-4 object-contain drop-shadow-[0_0_8px_#fc8100]"
              />

              <span className="font-heading text-xs font-bold uppercase tracking-[0.25em] text-[#fc8100]">
                MG ESPORTS
              </span>

              <span className="h-1 w-1 rounded-full bg-white/40" />

              <span className="font-heading text-[11px] text-gray-300 tracking-widest">
                GOLDEN TICKET WINNERS • CLASH OF CLANS
              </span>
            </motion.div>

            {/* MAIN HEADLINE */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5.2rem] leading-[1.06] uppercase tracking-tight text-white font-extrabold"
            >
              <span className="sr-only">MG ESPORTS — </span>
              TOGETHER WE <br />
              <span className="text-gold-gradient">
                CONQUER.
              </span>
            </motion.h1>

            {/* SUPPORTING TEXT */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 text-base sm:text-lg md:text-xl text-[#9CA3AF] font-body max-w-lg leading-relaxed"
            >
              A professional mobile esports organization. We train, compete
              and win as one team on the Clash of Clans World Championship stage.
            </motion.p>

            {/* ACHIEVEMENTS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs font-heading font-semibold text-gray-300 tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-[#fc8100]" />
                <span>WORLD CHAMPIONSHIP GOLDEN TICKET</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#fc8100]" />
                <span>TOP 8 WORLDWIDE RANKING</span>
              </div>
            </motion.div>

            {/* CTA BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <GoldButton
                onClick={() => {
                  const el =
                    document.getElementById("players") ||
                    document.getElementById("roster");

                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    onExploreTournaments();
                  }
                }}
                size="lg"
                className="w-full sm:w-auto"
              >
                MEET THE TEAM
              </GoldButton>

              <OutlineButton
                onClick={onJoinLordz}
                size="lg"
                className="w-full sm:w-auto"
                showArrow
              >
                SHOP THE JERSEY
              </OutlineButton>
            </motion.div>
          </div>

          {/* RIGHT: AMBIENT VISUAL SHOWCASE */}
          <div className="lg:col-span-5 flex justify-center items-center relative min-h-[300px] sm:min-h-[400px] lg:min-h-[660px]">

            {/* GOLD AND AMBER GLOW */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 sm:h-[460px] sm:w-[460px] rounded-full bg-gradient-to-tr from-[#fc8100]/15 via-orange-500/20 to-red-500/10 blur-[120px] pointer-events-none" />

            {/* DIAGONAL ENERGY BEAM */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <svg
                className="w-full h-full opacity-70"
                viewBox="0 0 500 600"
                fill="none"
              >
                <defs>
                  <linearGradient
                    id="cyberLineGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#fc8100" stopOpacity="0" />
                    <stop offset="35%" stopColor="#fc8100" stopOpacity="0.9" />
                    <stop offset="65%" stopColor="#f97316" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>

                  <filter
                    id="glowFilter"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="6" result="glow" />
                    <feComposite
                      in="SourceGraphic"
                      in2="glow"
                      operator="over"
                    />
                  </filter>
                </defs>

                <motion.line
                  x1="30"
                  y1="200"
                  x2="480"
                  y2="520"
                  stroke="url(#cyberLineGrad)"
                  strokeWidth="3.5"
                  filter="url(#glowFilter)"
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </svg>
            </div>

            {/* PARALLAX SHOWCASE CONTAINER */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                x: characterX,
                y: characterY,
              }}
              className="relative flex flex-col items-center justify-end z-10 w-full h-full will-change-transform"
            >
              {/* Add character/trophy artwork here if required */}
            </motion.div>
          </div>
        </div>
      </div>

      {/* SCROLL INDICATOR */}
      <a
        href="#jersey"
        className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-[#fc8100] transition-colors z-20 group"
      >
        <span className="font-heading text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-gray-500 group-hover:text-[#fc8100]">
          SCROLL
        </span>

        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce text-[#fc8100]" />
      </a>
    </section>
  );
};
