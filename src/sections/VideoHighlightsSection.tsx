import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { VideoCard } from "../components/common/VideoCard";
import { type MediaItem } from "../data/media";
import { mediaApi, getStoredMediaList } from "../api/media";

const computeFeaturedVideos = (): MediaItem[] => {
  const all = getStoredMediaList();
  const chosen = all.filter((m) => m.featured || m.tag === "PREMIERE");
  return chosen.length > 0 ? chosen.slice(0, 6) : all.slice(0, 3);
};

interface VideoHighlightsSectionProps {
  onPlayVideo: (item: MediaItem) => void;
}

export const VideoHighlightsSection = ({
  onPlayVideo,
}: VideoHighlightsSectionProps) => {
  const [highlights, setHighlights] = useState<MediaItem[]>(computeFeaturedVideos);

  useEffect(() => {
    let isMounted = true;

    const refreshHighlights = () => {
      if (isMounted) {
        setHighlights(computeFeaturedVideos());
      }
    };

    const fetchHighlights = async () => {
      try {
        const data = await mediaApi.getAll();
        if (!isMounted) return;
        if (data && data.length > 0) {
          const chosen = data.filter((m) => m.featured || m.tag === "PREMIERE");
          const finalVideos = chosen.length > 0 ? chosen.slice(0, 6) : data.slice(0, 3);
          setHighlights(finalVideos);
        }
      } catch {
        refreshHighlights();
      }
    };

    fetchHighlights();

    const handleMediaUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        const chosen = e.detail.filter((m: MediaItem) => m.featured || m.tag === "PREMIERE");
        setHighlights(chosen.length > 0 ? chosen.slice(0, 6) : e.detail.slice(0, 3));
      } else {
        refreshHighlights();
      }
    };

    window.addEventListener("mg_media_updated", handleMediaUpdated);
    window.addEventListener("storage", handleMediaUpdated);
    window.addEventListener("focus", refreshHighlights);

    return () => {
      isMounted = false;
      window.removeEventListener("mg_media_updated", handleMediaUpdated);
      window.removeEventListener("storage", handleMediaUpdated);
      window.removeEventListener("focus", refreshHighlights);
    };
  }, []);

  return (
    <section id="highlights" className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[700px] h-[200px] sm:h-[350px] bg-[#FFBE32]/6 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header with "VIEW ALL HIGHLIGHTS →" CTA on right */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[10px] sm:text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-3"
            >
              <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
              CINEMATICS & CLUTCHES
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white font-extrabold"
            >
              VIDEO <span className="text-gold-gradient">HIGHLIGHTS</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-2 text-xs sm:text-sm text-[#9CA3AF] font-body max-w-xl"
            >
              Relive championship-winning clutches, trailer premieres, and tactical breakdowns from India's elite mobile circuit.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to="/media"
              className="group inline-flex items-center gap-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FFBE32] hover:text-[#FFCD59] transition-colors py-2 px-4 rounded-lg bg-[#FFBE32]/10 border border-[#FFBE32]/30 hover:border-[#FFBE32] hover:shadow-[0_0_20px_rgba(255,190,50,0.25)]"
            >
              <span>VIEW ALL HIGHLIGHTS</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </Link>
          </motion.div>
        </div>

        {/* Responsive Grid - Adapts gracefully based on video count */}
        <div
          className={`grid gap-6 ${
            highlights.length === 1
              ? "grid-cols-1 max-w-xl mx-auto"
              : highlights.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {highlights.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <VideoCard item={item} onPlay={onPlayVideo} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
