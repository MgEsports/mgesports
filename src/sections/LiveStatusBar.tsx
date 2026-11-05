import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import { settingsApi } from "../api/settings";

interface LiveStatusBarProps {
  onViewMatch: () => void;
}

export const LiveStatusBar = ({ onViewMatch }: LiveStatusBarProps) => {
  const [tickerText, setTickerText] = useState("CLASH OF CLANS WORLD CHAMPIONSHIP FINALS • MG ESPORTS VS TRIBE GAMING");

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((settings) => {
        if (settings.liveTicker) {
          setTickerText(settings.liveTicker);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div id="live-status" className="relative z-20 w-full bg-[#0B0B0D] border-y border-[#FFBE32]/25 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Animated Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-red-950/70 border border-red-500/40 px-3 py-1 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-red-400">
              LIVE NOW
            </span>
          </div>

          <div className="h-4 w-px bg-white/15 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <Flame className="h-4 w-4 text-[#FFBE32] animate-pulse shrink-0" />
            <span className="font-display text-base sm:text-lg tracking-wider uppercase text-white font-bold truncate">
              {tickerText}
            </span>
          </div>
        </div>

        {/* Center / Right info */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-gray-300">
          <div className="flex items-center gap-2 font-heading tracking-wider">
            <span className="text-white font-bold font-mono">07</span>
            <span className="text-gray-400 uppercase">TEAMS COMPETING</span>
          </div>

          <div className="h-4 w-px bg-white/15" />

          <motion.button
            whileHover={{ x: 2 }}
            onClick={onViewMatch}
            className="group inline-flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-[#FFBE32] hover:text-[#FFCD59] cursor-pointer transition-colors"
          >
            <span>VIEW LIVE MATCH</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
