import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { MediaItem } from "../../data/media";
import jerseyPromoImg from "../../assets/jersey-promo.jpg";

interface VideoCardProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
}

export const VideoCard = ({ item, onPlay }: VideoCardProps) => {
  // Determine thumbnail source: custom thumbnail -> youtube thumbnail -> fallback promo asset
  const thumbnailSrc =
    item.thumbnail ||
    (item.youtubeId
      ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
      : jerseyPromoImg);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => onPlay(item)}
      className="group relative flex flex-col justify-between rounded-xl bg-[#0C0C0E] border border-white/10 hover:border-[#FFBE32]/60 overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(255,190,50,0.18)]"
    >
      {/* 16:9 Video Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/80">
        <img
          src={thumbnailSrc}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center filter brightness-90 contrast-105 transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback if external image fails to load
            (e.currentTarget as HTMLImageElement).src = jerseyPromoImg;
          }}
        />

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-transparent to-black/30" />

        {/* Center Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#FFBE32] text-black shadow-[0_0_20px_#FFBE32] transition-transform duration-300 group-hover:scale-115">
            <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration Badge in Bottom-Right */}
        {item.duration && (
          <div className="absolute bottom-2.5 right-2.5 z-10 px-2 py-0.5 rounded bg-black/85 border border-white/15 text-[11px] font-mono font-semibold text-white tracking-wider">
            {item.duration}
          </div>
        )}

        {/* Category / Game Tag in Top-Left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2.5 py-0.5 rounded bg-black/75 border border-[#FFBE32]/30 text-[10px] font-heading font-bold uppercase tracking-wider text-[#FFBE32]">
            {item.tag || item.type}
          </span>
        </div>
      </div>

      {/* Content Below Thumbnail */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="font-display text-base sm:text-lg uppercase tracking-wide text-white group-hover:text-[#FFBE32] transition-colors line-clamp-2 leading-snug font-bold">
          {item.title}
        </h3>

        {/* Meta Bar */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span>{item.date}</span>
          <span className="text-[#FFBE32] font-semibold">{item.game}</span>
        </div>
      </div>
    </motion.div>
  );
};
