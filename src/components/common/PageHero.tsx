import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TemplePattern } from "./TemplePattern";

interface PageHeroProps {
  badge: string;
  title: string;
  titleHighlight?: string;
  subtitle: string;
  children?: ReactNode;
}

export const PageHero = ({
  badge,
  title,
  titleHighlight,
  subtitle,
  children,
}: PageHeroProps) => {
  return (
    <section className="relative pt-20 pb-8 sm:pt-32 sm:pb-14 md:pt-36 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden border-b border-white/5">
      {/* Background Architectural Gopuram Grid */}
      <div className="absolute inset-0 bg-esports-grid opacity-25 pointer-events-none" />
      <TemplePattern className="opacity-[0.04] scale-125 -translate-y-12" />

      {/* Atmospheric Gold Radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#FFBE32]/8 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10 text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FFBE32]/35 bg-[#FFBE32]/10 backdrop-blur-md mb-3 sm:mb-4"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFBE32] animate-pulse" />
          <span className="font-heading text-xs font-bold uppercase tracking-[0.25em] text-[#FFBE32]">
            {badge}
          </span>
        </motion.div>

        {/* Page Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-2xl xs:text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white font-extrabold"
        >
          {title}{" "}
          {titleHighlight && (
            <span className="text-gold-gradient">{titleHighlight}</span>
          )}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-2.5 sm:mt-4 text-xs xs:text-sm sm:text-base md:text-lg text-[#9CA3AF] font-body max-w-2xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Optional Actions / Tabs */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
};
