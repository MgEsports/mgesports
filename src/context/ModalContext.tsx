import { useState, useEffect, type ReactNode } from "react";
import { type Tournament, getDerivedTournamentStatus } from "../data/tournaments";
import { tournamentsApi } from "../api/tournaments";
import { useAuth } from "./AuthContext";
import type { Match } from "../data/matches";
import type { MediaItem } from "../data/media";
import type { NewsArticle } from "../data/news";
import { TournamentRegistrationStepper } from "../components/tournament/TournamentRegistrationStepper";
import { LoginModal } from "../components/modals/LoginModal";
import { VideoModal } from "../components/modals/VideoModal";
import { JerseyModal } from "../components/modals/JerseyModal";
import { Modal } from "../components/common/Modal";
import { ModalContext, type VideoPayload } from "./modalContextDef";

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  // Modal visibility states
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [jerseyModalOpen, setJerseyModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  // Active payloads
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [pendingTournamentForRegister, setPendingTournamentForRegister] = useState<Tournament | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoPayload>({
    title: "FLAME OF GLORY S2 • OFFICIAL TRAILER",
    category: "OFFICIAL STREAM",
    game: "FREE FIRE MAX",
  });
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // When player successfully logs in, automatically resume pending tournament registration
  useEffect(() => {
    if (isAuthenticated && pendingTournamentForRegister) {
      const derived = getDerivedTournamentStatus(pendingTournamentForRegister);
      if (derived === "COMPLETED" || derived === "REGISTRATION_CLOSED") {
        setPendingTournamentForRegister(null);
        return;
      }
      setSelectedTournament(pendingTournamentForRegister);
      setJoinModalOpen(true);
      setPendingTournamentForRegister(null);
    }
  }, [isAuthenticated, pendingTournamentForRegister]);

  const openJoinTournament = async (tournament?: Tournament) => {
    if (tournament) {
      const derived = getDerivedTournamentStatus(tournament);
      if (derived === "COMPLETED" || derived === "REGISTRATION_CLOSED") {
        if (typeof window !== "undefined") {
          window.location.href = `/tournaments/${tournament.slug || tournament.id}`;
        }
        return;
      }
    }

    // If player is not logged in, prompt them to login first
    if (!isAuthenticated) {
      if (tournament) {
        setSelectedTournament(tournament);
        setPendingTournamentForRegister(tournament);
      } else {
        try {
          const list = await tournamentsApi.getAll();
          const active = (list || []).filter(
            (t) => getDerivedTournamentStatus(t) === "REGISTRATION_OPEN"
          );
          if (active.length > 0) {
            setSelectedTournament(active[0]);
            setPendingTournamentForRegister(active[0]);
          }
        } catch {}
      }
      setLoginModalOpen(true);
      return;
    }

    if (tournament) {
      setSelectedTournament(tournament);
      setJoinModalOpen(true);
      return;
    }

    try {
      const list = await tournamentsApi.getAll();
      const active = (list || []).filter(
        (t) => getDerivedTournamentStatus(t) === "REGISTRATION_OPEN"
      );
      if (active.length > 0) {
        setSelectedTournament(active[0]);
        setJoinModalOpen(true);
      } else {
        if (typeof window !== "undefined") {
          window.location.href = "/tournaments";
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/tournaments";
      }
    }
  };

  const closeJoinTournament = () => {
    setJoinModalOpen(false);
  };

  const openLogin = () => setLoginModalOpen(true);
  const closeLogin = () => setLoginModalOpen(false);

  const openJersey = () => setJerseyModalOpen(true);
  const closeJersey = () => setJerseyModalOpen(false);

  const openVideo = (video: VideoPayload) => {
    setSelectedVideo(video);
    setVideoModalOpen(true);
  };

  const closeVideo = () => setVideoModalOpen(false);

  const watchMatch = (match: Match) => {
    setSelectedVideo({
      title: `${match.teamA.name} VS ${match.teamB.name} • ${match.tournament}`,
      category: match.status === "LIVE" ? "LIVE BROADCAST" : "MATCH VOD",
      game: match.game,
    });
    setVideoModalOpen(true);
  };

  const playMedia = (item: MediaItem) => {
    setSelectedVideo({
      title: item.title,
      category: item.type,
      game: item.game,
      youtubeId: item.youtubeId,
    });
    setVideoModalOpen(true);
  };

  const openArticle = (article: NewsArticle) => setSelectedArticle(article);
  const closeArticle = () => setSelectedArticle(null);

  const openPartner = () => setPartnerModalOpen(true);
  const closePartner = () => setPartnerModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        openJoinTournament,
        closeJoinTournament,
        openLogin,
        closeLogin,
        openJersey,
        closeJersey,
        openVideo,
        closeVideo,
        watchMatch,
        playMedia,
        openArticle,
        closeArticle,
        openPartner,
        closePartner,
      }}
    >
      {children}

      {/* Global 6-Step Tournament Registration Stepper */}
      {selectedTournament && (
        <TournamentRegistrationStepper
          isOpen={joinModalOpen}
          onClose={closeJoinTournament}
          tournament={selectedTournament}
        />
      )}

      <LoginModal isOpen={loginModalOpen} onClose={closeLogin} />

      <VideoModal
        isOpen={videoModalOpen}
        onClose={closeVideo}
        title={selectedVideo.title}
        category={selectedVideo.category}
        game={selectedVideo.game}
        youtubeId={selectedVideo.youtubeId}
      />

      <JerseyModal isOpen={jerseyModalOpen} onClose={closeJersey} />

      {/* News Article Detail Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={closeArticle}
        title={selectedArticle?.title || "NEWS DISPATCH"}
        subtitle={`${selectedArticle?.category} • ${selectedArticle?.date}`}
        maxWidth="lg"
      >
        <div className="space-y-5 text-sm text-gray-300 font-body">
          {/* Announcement Banner Image */}
          {(selectedArticle?.coverImage || selectedArticle?.image || selectedArticle?.bannerImage) && (
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-xl bg-black/80 border border-white/10 shadow-lg">
              <img
                src={selectedArticle.coverImage || selectedArticle.image || selectedArticle.bannerImage}
                alt={selectedArticle.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider border shadow-md backdrop-blur-md ${
                    selectedArticle.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {selectedArticle.category}
                </span>
                <span className="text-[11px] font-mono text-gray-300 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                  {selectedArticle.readTime}
                </span>
              </div>
            </div>
          )}

          {/* Excerpt Summary */}
          {selectedArticle?.excerpt && (
            <p className="text-base sm:text-lg leading-relaxed text-white font-semibold border-l-2 border-[#FFBE32] pl-3 py-0.5">
              {selectedArticle.excerpt}
            </p>
          )}

          {/* Full Announcement Description */}
          {selectedArticle?.content ? (
            <div className="space-y-3 leading-relaxed text-gray-300 whitespace-pre-line text-sm sm:text-base font-body">
              {selectedArticle.content}
            </div>
          ) : selectedArticle?.description ? (
            <div className="space-y-3 leading-relaxed text-gray-300 whitespace-pre-line text-sm sm:text-base font-body">
              {selectedArticle.description}
            </div>
          ) : (
            <p className="leading-relaxed text-gray-400">
              As competitive esports across India enters an unprecedented era of professionalization, MG ESPORTS continues to establish the gold standard for player development, scrim infrastructure, and fair play.
            </p>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center text-xs text-gray-400 font-mono gap-2">
            <span>
              Desk: <strong className="text-white">{selectedArticle?.author || "Lord Editorial"}</strong>
            </span>
            <span>
              Date: <strong className="text-[#FFBE32]">{selectedArticle?.date}</strong>
            </span>
          </div>
        </div>
      </Modal>

      {/* Partner Inquiries Modal */}
      <Modal
        isOpen={partnerModalOpen}
        onClose={closePartner}
        title="PARTNER WITH MG"
        subtitle="Sponsorship, Brand Integrations & Broadcast Rights"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300 font-body">
            Position your brand at the center of Indian youth culture and competitive gaming. MgEsports provides jersey sleeve placements, and broadcast integrations.
          </p>
          <div className="p-4 rounded-lg bg-black/60 border border-white/10 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Commercial Desk:</span>
              <a href="mailto:lordesportz75@gmail.com" className="text-[#FFBE32] hover:underline font-mono">conatct@mgesport.live</a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Headquarters:</span>
              <span className="text-white">Kerala, India</span>
            </div>
          </div>
          <button
            onClick={closePartner}
            className="w-full py-2.5 rounded font-heading text-xs font-bold uppercase tracking-wider bg-[#FFBE32] text-black hover:bg-[#FFCD59] transition-all cursor-pointer"
          >
            REQUEST PARTNERSHIP PROSPECTUS
          </button>
        </div>
      </Modal>
    </ModalContext.Provider>
  );
};

