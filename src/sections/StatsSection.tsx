import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { statsData } from "../data/stats";
import { useCountUp } from "../hooks/useCountUp";

const StatCard = ({
  item,
  isInView,
}: {
  item: typeof statsData[0];
  isInView: boolean;
}) => {
  const count = useCountUp(item.value, 1600, isInView);

  return (
    <div className="flex flex-col items-center text-center p-3.5 xs:p-4 sm:p-8 rounded-xl bg-[#0B0B0E] border border-white/5 hover:border-[#FFBE32]/30 transition-all duration-300 min-w-0 w-full overflow-hidden">
      <div className="font-display text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-1 sm:mb-2 truncate max-w-full">
        {item.prefix && <span className="text-[#FFBE32]">{item.prefix}</span>}
        <span>{count}</span>
        <span className="text-[#FFBE32]">{item.suffix}</span>
      </div>
      <div className="font-heading text-xs sm:text-base font-bold uppercase tracking-widest text-white truncate max-w-full">
        {item.label}
      </div>
      <div className="mt-1 text-[10px] sm:text-xs text-gray-400 font-body truncate max-w-full">
        {item.sublabel}
      </div>
    </div>
  );
};

export const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#08080A] border-y border-white/5 overflow-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full"
        >
          {statsData.map((stat) => (
            <StatCard key={stat.id} item={stat} isInView={isInView} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
