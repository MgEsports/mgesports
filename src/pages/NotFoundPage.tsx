import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Trophy, Users, ShoppingBag, Newspaper } from "lucide-react";
import { GoldButton } from "../components/common/GoldButton";
import { TemplePattern } from "../components/common/TemplePattern";
import { SEO } from "../components/common/SEO";
import logoImg from "../assets/lordz-logo.png";

export const NotFoundPage = () => {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden py-20 w-full max-w-full">
      <SEO
        title="404 — Signal Lost | MG ESPORTS"
        description="The arena coordinates you requested do not exist or have been retired. Return to MG ESPORTS homepage or browse active tournaments."
        noindex
        nofollow
      />

      {/* Background Architectural Patterns */}
      <div className="absolute inset-0 bg-esports-grid opacity-25 pointer-events-none" />
      <TemplePattern className="opacity-[0.05] scale-150" />

      {/* Atmospheric Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#FFBE32]/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto text-center">
        {/* Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0D0D10] border border-[#FFBE32]/30 p-3 shadow-[0_0_30px_rgba(255,190,50,0.2)]"
        >
          <img
            src={logoImg}
            alt="LORD ESPORTZ Emblem"
            width={56}
            height={56}
            className="h-full w-full object-contain drop-shadow-[0_0_10px_#FFBE32]"
          />
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-7xl sm:text-9xl font-extrabold text-gold-gradient tracking-tight leading-none"
        >
          404
        </motion.div>

        {/* Signal Lost */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded bg-red-950/70 border border-red-500/40 text-xs font-heading font-bold uppercase tracking-[0.25em] text-red-400"
        >
          <ShieldAlert className="h-4 w-4" />
          SIGNAL LOST
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-base sm:text-lg text-gray-300 font-body leading-relaxed"
        >
          Looks like you've left the combat zone. The coordinates you requested do not exist on the tactical map.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <Link to="/">
            <GoldButton size="md" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>RETURN TO BASE</span>
            </GoldButton>
          </Link>
        </motion.div>

        {/* Quick Nav Recovery Links */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-3 text-xs font-heading uppercase text-gray-400">
          <Link to="/tournaments" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#FFBE32] transition-colors">
            <Trophy className="h-3.5 w-3.5 text-[#FFBE32]" />
            <span>Tournaments</span>
          </Link>
          <Link to="/players" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#FFBE32] transition-colors">
            <Users className="h-3.5 w-3.5 text-[#FFBE32]" />
            <span>Players</span>
          </Link>
          <Link to="/products" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#FFBE32] transition-colors">
            <ShoppingBag className="h-3.5 w-3.5 text-[#FFBE32]" />
            <span>Merchandise</span>
          </Link>
          <Link to="/news" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#FFBE32] transition-colors">
            <Newspaper className="h-3.5 w-3.5 text-[#FFBE32]" />
            <span>News</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
