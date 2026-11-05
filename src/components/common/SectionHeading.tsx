import { motion } from "framer-motion";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeading = ({
  badge,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) => {
  const isCenter = align === "center";

  return (
    <div className={`mb-12 ${isCenter ? "text-center mx-auto" : "text-left"} max-w-3xl ${className}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`inline-flex items-center gap-2 px-3 py-1 mb-3 rounded border border-[#FFBE32]/30 bg-[#FFBE32]/10 text-xs font-heading font-semibold uppercase tracking-[0.2em] text-[#FFBE32] ${
            isCenter ? "justify-center" : ""
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFBE32] animate-ping" />
          {badge}
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase text-white font-extrabold"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 text-sm sm:text-base text-[#9CA3AF] font-body tracking-wide font-normal max-w-xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Subtle Gold Accent Divider */}
      <div
        className={`h-[2px] w-16 bg-gradient-to-r from-transparent via-[#FFBE32] to-transparent mt-4 ${
          isCenter ? "mx-auto" : ""
        }`}
      />
    </div>
  );
};
