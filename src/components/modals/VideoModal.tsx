import { Modal } from "../common/Modal";
import { Play, Flame, ExternalLink } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category?: string;
  game?: string;
  youtubeId?: string;
}

function extractYouTubeId(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : trimmed;
}

export const VideoModal = ({
  isOpen,
  onClose,
  title,
  category = "HIGHLIGHTS",
  game = "CLASH OF CLANS",
  youtubeId,
}: VideoModalProps) => {
  const cleanId = extractYouTubeId(youtubeId);
  const youtubeWatchUrl = cleanId ? `https://www.youtube.com/watch?v=${cleanId}` : "https://www.youtube.com";
  const displayGame = !game || game.toUpperCase().includes("FREE FIRE") ? "CLASH OF CLANS" : game;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MG STREAM BROADCAST"
      subtitle={`${displayGame} • ${category}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Cinematic Video Player Container with Real YouTube Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#fc8100]/40 bg-black shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
          {cleanId && isOpen ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            /* Fallback Graphic if no video link loaded */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070709]">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#fc8100]/20 border border-[#fc8100] text-[#fc8100]">
                <Play className="h-7 w-7 fill-current ml-1" />
              </div>
              <h4 className="font-display text-xl uppercase tracking-wider text-white">
                {title}
              </h4>
              <p className="mt-1 text-xs text-gray-400 font-body">
                Broadcast feed will stream here once YouTube video is connected.
              </p>
            </div>
          )}
        </div>

        {/* Video Info and Controls Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-white/10">
          <div className="flex items-center gap-2 text-gray-300">
            <Flame className="h-4 w-4 text-[#fc8100]" />
            <span className="font-heading font-semibold text-white uppercase tracking-wider">
              {title}
            </span>
          </div>

          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 hover:border-red-500 font-heading text-[11px] font-bold tracking-wider uppercase transition-all duration-200 self-start sm:self-auto cursor-pointer"
          >
            <span>WATCH ON YOUTUBE</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
