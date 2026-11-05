import { motion } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { teamsData } from "../data/teams";
import { Trophy, Shield, ArrowRight } from "lucide-react";
import logoImg from "../assets/lordz-logo.png";

interface TeamsSectionProps {
  onExploreTeams?: () => void;
  showHeader?: boolean;
}

export const TeamsSection = ({
  onExploreTeams,
  showHeader = true,
}: TeamsSectionProps) => {
  return (
    <section
      id="teams"
      className={`relative ${showHeader ? "py-24" : "py-12 sm:py-16"} px-4 sm:px-6 lg:px-8 bg-[#070709]`}
    >
      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <SectionHeading
            badge="DIVISIONS & ORGANIZATIONS"
            title="THE BATTLEFIELD"
            subtitle="Top registered esports lineups clashing across national tournaments and sanctioned circuit leagues."
          />
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamsData.map((team, index) => {
            const isMg = team.name.toUpperCase().includes("MG");

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={`group relative rounded-xl p-6 transition-all duration-300 bg-[#0C0C0F] border ${
                  isMg
                    ? "border-[#FFBE32]/40 shadow-[0_10px_30px_rgba(255,190,50,0.1)]"
                    : "border-white/10 hover:border-[#FFBE32]/40"
                } hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(255,190,50,0.18)]`}
              >
                {/* Gold rim accent on top */}
                <div
                  className={`h-1 w-12 rounded-full mb-4 ${
                    isMg ? "bg-[#FFBE32]" : "bg-white/20 group-hover:bg-[#FFBE32]"
                  } transition-colors`}
                />

                <div className="flex items-start justify-between gap-4">
                  {/* Team Logo / Crest */}
                  <div className="h-16 w-16 rounded-xl bg-black/60 border border-white/10 group-hover:border-[#FFBE32]/50 p-2.5 flex items-center justify-center transition-all group-hover:scale-105 shadow-inner">
                    {isMg ? (
                      <img
                        src={logoImg}
                        alt={team.name}
                        className="h-full w-full object-contain drop-shadow-[0_0_8px_#FFBE32]"
                      />
                    ) : (
                      <Shield className="h-8 w-8 text-gray-500 group-hover:text-[#FFBE32] transition-colors" />
                    )}
                  </div>

                  {/* Rank Badge */}
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-[#FFBE32]">
                      {team.rank}
                    </span>
                    <span className="block text-[10px] font-heading uppercase tracking-wider text-gray-400">
                      CIRCUIT RANK
                    </span>
                  </div>
                </div>

                {/* Team Info */}
                <div className="mt-4">
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-[#FFBE32] transition-colors leading-snug">
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-heading">
                    <span className="text-gray-300 font-semibold uppercase">{team.game}</span>
                    <span>•</span>
                    <span>{team.region}</span>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-center">
                  <div>
                    <span className="block font-mono font-bold text-sm text-white">{team.points}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-heading">Points</span>
                  </div>
                  <div>
                    <span className="block font-mono font-bold text-sm text-[#FFBE32]">{team.winRate}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-heading">Win Rate</span>
                  </div>
                  <div>
                    <span className="block font-mono font-bold text-sm text-white">{team.championships}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-heading">Trophies</span>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-[#FFBE32]" />
                    <span>{team.rosterCount} Athletes Vetted</span>
                  </span>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#FFBE32] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    VIEW SQUAD &rarr;
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Teams CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={onExploreTeams}
            className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-widest text-[#FFBE32] hover:text-[#FFCD59] transition-colors cursor-pointer group"
          >
            <span>VIEW ALL REGISTERED TEAMS</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
