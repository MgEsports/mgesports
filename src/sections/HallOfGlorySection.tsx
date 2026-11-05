import { motion } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { hallOfGloryData } from "../data/stats";
import { Trophy, Award, Calendar } from "lucide-react";

interface HallOfGlorySectionProps {
  showHeader?: boolean;
}

export const HallOfGlorySection = ({ showHeader = true }: HallOfGlorySectionProps) => {
  return (
    <section
      id="hall-of-glory"
      className={`relative ${showHeader ? "py-24" : "py-12 sm:py-16"} px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden`}
    >
      {/* Glow Ambience */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#FFBE32]/6 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {showHeader && (
            <SectionHeading
              badge="TROPHY ROOM"
              title="HALL OF GLORY"
              subtitle="Honoring the milestone victories, tournament championships, and historic MVPs in Lord history."
            />
        )}

        {/* Timeline / Horizontal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hallOfGloryData.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-xl bg-[#0B0B0E] border border-white/10 hover:border-[#FFBE32]/60 p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(255,190,50,0.15)]"
            >
              {/* Year & Trophy Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFBE32]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{item.year}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center text-[#FFBE32]">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4">
                  <span className="font-heading text-[11px] uppercase tracking-wider text-gray-400 block">
                    {item.event}
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors mt-1">
                    {item.title}
                  </h3>
                  <div className="mt-2 text-xs font-heading font-bold text-[#FFBE32] uppercase tracking-wider">
                    {item.achievement}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400 font-body line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* MVP & Prize Pool Footer */}
              <div className="mt-6 pt-4 border-t border-white/5">
                {item.mvp && (
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-400 font-heading uppercase flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-[#FFBE32]" /> MVP:
                    </span>
                    <span className="font-display text-base text-white tracking-wider font-bold">
                      {item.mvp}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Prize:</span>
                  <span className="text-[#FFBE32] font-semibold">{item.prize}</span>
                </div>
              </div>

              {/* Gold Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFBE32]/0 to-transparent group-hover:via-[#FFBE32] transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
