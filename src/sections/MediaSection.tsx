import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { mediaData, type MediaItem } from "../data/media";
import { mediaApi, getStoredMediaList } from "../api/media";
import { Play, Flame } from "lucide-react";
import jerseyPromoImg from "../assets/jersey-promo.jpg";

interface MediaSectionProps {
  onPlayMedia: (item: MediaItem) => void;
  showHeader?: boolean;
}

type MediaTab = "ALL" | "VIDEOS" | "HIGHLIGHTS" | "PHOTOS" | "SHORTS";

export const MediaSection = ({
  onPlayMedia,
  showHeader = true,
}: MediaSectionProps) => {
  const [items, setItems] = useState<MediaItem[]>(getStoredMediaList);
  const [selectedTab, setSelectedTab] = useState<MediaTab>("ALL");

  useEffect(() => {
    const fetchMedia = () => {
      mediaApi
        .getAll()
        .then((data) => {
          if (data && data.length > 0) {
            setItems(data);
          }
        })
        .catch(() => {});
    };

    fetchMedia();

    const handleMediaUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setItems(e.detail);
      } else {
        setItems(getStoredMediaList());
      }
    };

    window.addEventListener("mg_media_updated", handleMediaUpdated);
    window.addEventListener("storage", handleMediaUpdated);
    window.addEventListener("focus", fetchMedia);
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMedia();
      }
    }, 45000);

    return () => {
      window.removeEventListener("mg_media_updated", handleMediaUpdated);
      window.removeEventListener("storage", handleMediaUpdated);
      window.removeEventListener("focus", fetchMedia);
      clearInterval(interval);
    };
  }, []);

  const tabs: MediaTab[] = ["ALL", "VIDEOS", "HIGHLIGHTS", "PHOTOS", "SHORTS"];

  const filteredMedia = items.filter((item) => {
    if (selectedTab === "ALL") return true;
    return item.type === selectedTab;
  });

  const featuredVideo =
    items.find((item) => item.tag === "PREMIERE") ||
    items.find((item) => item.featured) ||
    items[0] ||
    mediaData[0];

  const getThumbnail = (item: MediaItem) => {
    if (item.thumbnail) return item.thumbnail;
    if (item.youtubeId) return `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
    return jerseyPromoImg;
  };

  return (
    <section
      id="media"
      className={`relative ${showHeader ? "py-24" : "py-8 sm:py-12 lg:py-16"} px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden w-full max-w-full`}
    >
      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <SectionHeading
            badge="CINEMATICS & CLUTCHES"
            title="MG MEDIA"
            subtitle="Match replays, clutch compilations, athlete shorts, and broadcast documentaries."
          />
        )}

        {/* Featured Video Highlight Card */}
        {featuredVideo && (
          <div className="mb-12">
            <div
              onClick={() => onPlayMedia(featuredVideo)}
              className="group relative w-full rounded-2xl border border-[#FFBE32]/35 bg-black overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(255,190,50,0.15)] hover:border-[#FFBE32]/70 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[250px] sm:min-h-[340px] lg:min-h-[420px] flex flex-col justify-between p-4 xs:p-5 sm:p-8 lg:p-10 transition-colors"
            >
              {/* Background Graphic Preview */}
              <div className="absolute inset-0 z-0">
                <img
                  src={getThumbnail(featuredVideo)}
                  alt="Featured Stream"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = jerseyPromoImg;
                  }}
                  className="h-full w-full object-cover object-center filter brightness-85 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Clean vignette overlays preserving player visibility in center */}
                <div className="absolute inset-x-0 top-0 h-20 sm:h-28 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 sm:h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
              </div>

              {/* Top Row: Featured Premiere Badge & Duration */}
              <div className="relative z-20 flex items-center justify-between w-full pointer-events-none">
                <span className="px-2.5 sm:px-3 py-1 rounded bg-red-600/90 backdrop-blur-md text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5 shadow-md border border-red-500/30">
                  <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" /> FEATURED PREMIERE
                </span>
                {featuredVideo.duration && (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-black/75 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-mono text-gray-200">
                    {featuredVideo.duration}
                  </span>
                )}
              </div>

              {/* Play Button Center Overlay - Responsively sized to prevent obstruction */}
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 items-center justify-center rounded-full bg-[#FFBE32] text-black shadow-[0_0_25px_rgba(255,190,50,0.5)] group-hover:scale-110 group-hover:shadow-[0_0_35px_rgba(255,190,50,0.8)] transition-all duration-300">
                  <Play className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 fill-current ml-0.5 sm:ml-1" />
                </div>
              </div>

              {/* Bottom Info Overlay - Sized and clamped to prevent overlap with play button */}
              <div className="relative z-20 w-full max-w-3xl mt-auto">
                <h3 className="font-display text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors leading-snug line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {featuredVideo.title}
                </h3>
                <div className="mt-1.5 sm:mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] xs:text-[11px] sm:text-xs font-mono text-gray-300 drop-shadow">
                  <span>{featuredVideo.date}</span>
                  <span>•</span>
                  <span className="text-[#FFBE32] font-semibold">{featuredVideo.game}</span>
                  {featuredVideo.views && (
                    <>
                      <span>•</span>
                      <span>{featuredVideo.views}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 rounded-xl bg-[#0D0D10] border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 sm:px-5 py-2 rounded-lg font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTab === tab
                    ? "bg-[#FFBE32] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMedia.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onPlayMedia(item)}
                className="group relative rounded-xl bg-[#0C0C0E] border border-white/10 hover:border-[#FFBE32]/60 overflow-hidden cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Real YouTube Video Thumbnail */}
                <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={getThumbnail(item)}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = jerseyPromoImg;
                    }}
                  />

                  {/* Play badge */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-black/80 border border-[#FFBE32]/40 text-[#FFBE32] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,190,50,0.4)]">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {item.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                      {item.duration}
                    </div>
                  )}

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FFBE32] text-black font-heading text-[10px] font-bold uppercase tracking-wider">
                    {item.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h4 className="font-display text-lg sm:text-xl uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span className="text-[#FFBE32] font-semibold">{item.game}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
