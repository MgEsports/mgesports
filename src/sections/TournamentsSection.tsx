import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import {
  type Tournament,
  getTournamentBannerUrl,
  DEFAULT_TOURNAMENT_BANNER,
  getDerivedTournamentStatus,
  type DerivedTournamentStatus,
} from "../data/tournaments";
import { tournamentsApi, getMyTournaments, getStoredTournamentsList } from "../api/tournaments";
import { useAuth } from "../context/AuthContext";
import {
  Trophy,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Radio,
  Bell,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatters";

interface TournamentsSectionProps {
  onSelectTournament: (tournament: Tournament) => void;
  showHeader?: boolean;
}

type GameFilter = "ALL" | "FREE FIRE MAX" | "FREE FIRE";
type StatusFilter = "ALL" | "REGISTRATION_OPEN" | "LIVE" | "UPCOMING" | "COMPLETED";

export const TournamentsSection = ({
  onSelectTournament,
  showHeader = true,
}: TournamentsSectionProps) => {
  const { isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>(getStoredTournamentsList);
  const [loading, setLoading] = useState(false);
  const [userTournaments, setUserTournaments] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");

  useEffect(() => {
    let isMounted = true;

    const refreshTournaments = () => {
      tournamentsApi
        .getAll()
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setTournaments(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    refreshTournaments();

    const handleUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setTournaments(e.detail);
      } else {
        setTournaments(getStoredTournamentsList());
      }
    };

    window.addEventListener("mg_tournaments_updated", handleUpdated);
    window.addEventListener("storage", handleUpdated);
    window.addEventListener("focus", refreshTournaments);

    return () => {
      isMounted = false;
      window.removeEventListener("mg_tournaments_updated", handleUpdated);
      window.removeEventListener("storage", handleUpdated);
      window.removeEventListener("focus", refreshTournaments);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getMyTournaments()
        .then((res) => {
          if (Array.isArray(res)) {
            setUserTournaments(res);
          }
        })
        .catch(() => {});
    } else {
      setUserTournaments([]);
    }
  }, [isAuthenticated]);

  // Map user registrations by tournament id or slug
  const userRegistrationMap = useMemo(() => {
    const map = new Map<string, { status: string; paymentStatus?: string; isInvitationPending?: boolean }>();
    userTournaments.forEach((item) => {
      const tId = item.tournament?.id || item.tournamentId;
      const tSlug = item.tournament?.slug;
      const status = item.registration?.status || item.status || "PENDING";
      const paymentStatus = item.registration?.paymentStatus || item.paymentStatus;
      const isInvitationPending = Boolean(item.isInvitationPending);

      const info = { status, paymentStatus, isInvitationPending };
      if (tId) map.set(tId, info);
      if (tSlug) map.set(tSlug, info);
    });
    return map;
  }, [userTournaments]);

  const gameFilters: GameFilter[] = [
    "ALL",
    "FREE FIRE MAX",
    "FREE FIRE",
  ];

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: "ALL", value: "ALL" },
    { label: "REGISTRATION OPEN", value: "REGISTRATION_OPEN" },
    { label: "LIVE NOW", value: "LIVE" },
    { label: "UPCOMING", value: "UPCOMING" },
    { label: "COMPLETED", value: "COMPLETED" },
  ];

  // Base list: only draft tournaments are hidden publicly
  const nonDraftTournaments = useMemo(() => {
    return tournaments.filter((t) => !(t as any).isDraft && t.status !== "DRAFT");
  }, [tournaments]);

  // Sort order: Live, Registration Open, Upcoming, Registration Closed, then Completed (newest first)
  const statusPriority: Record<DerivedTournamentStatus, number> = {
    LIVE: 1,
    REGISTRATION_OPEN: 2,
    UPCOMING: 3,
    REGISTRATION_CLOSED: 4,
    COMPLETED: 5,
  };

  const filteredTournaments = useMemo(() => {
    return nonDraftTournaments
      .filter((t) => {
        const matchGame =
          selectedGame === "ALL" ||
          t.gameCategory === selectedGame ||
          t.game === selectedGame ||
          (selectedGame === "FREE FIRE" && (t.game?.includes("FREE FIRE") || t.gameCategory?.includes("FREE FIRE")));

        const derived = getDerivedTournamentStatus(t);
        let matchStatus = true;
        if (selectedStatus === "ALL") {
          matchStatus = true;
        } else {
          matchStatus = derived === selectedStatus;
        }
        return matchGame && matchStatus;
      })
      .sort((a, b) => {
        const statusA = getDerivedTournamentStatus(a);
        const statusB = getDerivedTournamentStatus(b);
        const priorityDiff = (statusPriority[statusA] || 99) - (statusPriority[statusB] || 99);
        if (priorityDiff !== 0) return priorityDiff;

        const dateA = new Date(a.createdAt || a.startDate || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.startDate || b.date || 0).getTime();
        return dateB - dateA;
      });
  }, [nonDraftTournaments, selectedGame, selectedStatus]);

  const emptyTabInfo = useMemo(() => {
    if (selectedStatus === "COMPLETED") {
      return {
        title: "No Completed Tournaments Yet",
        subtitle: "Tournament results, leaderboards, and champions will appear here once events conclude.",
      };
    }
    if (selectedStatus === "LIVE") {
      return {
        title: "No Live Tournaments Right Now",
        subtitle: "No matches are broadcasting live right now. Check back when the next tournament goes live!",
      };
    }
    if (selectedStatus === "REGISTRATION_OPEN") {
      return {
        title: "No Tournaments Open For Registration",
        subtitle: "All current rosters are closed or full. Stay tuned for upcoming circuit announcements!",
      };
    }
    if (selectedStatus === "UPCOMING") {
      return {
        title: "No Upcoming Tournaments",
        subtitle: "Stay tuned for new tournament circuits, scrims, and championships.",
      };
    }
    return {
      title: "No Tournaments Found",
      subtitle: `No ${selectedGame !== "ALL" ? selectedGame + " " : ""}tournaments found matching this filter combination.`,
    };
  }, [selectedStatus, selectedGame]);

  return (
    <section
      id="tournaments"
      className={`relative ${showHeader ? "py-24" : "py-8 sm:py-12 lg:py-16"} px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden w-full max-w-full`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#fc8100]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <SectionHeading
            badge="COMPETITIVE BRACKETS"
            title="ENTER THE ARENA"
            subtitle="Your next match starts here. Register your roster, compete for verified cash pools, and earn national circuit ranking."
          />
        )}

        {/* Filters Bar */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 w-full max-w-full">
          {/* Game category tabs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 max-w-full">
            {gameFilters.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-3 sm:px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  selectedGame === game
                    ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                    : "bg-[#111113] text-gray-400 hover:text-white hover:bg-[#1A1A1D] border border-white/5"
                }`}
              >
                {game}
              </button>
            ))}
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1 bg-[#0D0D10] p-1 rounded-lg border border-white/10 max-w-full overflow-x-auto">
            {statusFilters.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setSelectedStatus(sf.value)}
                className={`px-3 py-1 text-[11px] font-heading font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  selectedStatus === sf.value
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="rounded-xl bg-[#0C0C0E] border border-white/5 p-4 space-y-4 animate-pulse"
              >
                <div className="h-40 w-full bg-white/5 rounded-lg" />
                <div className="h-6 w-3/4 bg-white/5 rounded" />
                <div className="h-4 w-1/2 bg-white/5 rounded" />
                <div className="h-10 w-full bg-white/5 rounded mt-4" />
              </div>
            ))
          ) : (
            <AnimatePresence mode="popLayout">
            {filteredTournaments.length > 0 ? (
              filteredTournaments.map((t, index) => {
                const derivedStatus = getDerivedTournamentStatus(t);
                const isLive = derivedStatus === "LIVE";
                const isCompleted = derivedStatus === "COMPLETED";
                const isClosed = derivedStatus === "REGISTRATION_CLOSED";
                const isUpcoming = derivedStatus === "UPCOMING";

                const userReg = userRegistrationMap.get(t.id) || (t.slug ? userRegistrationMap.get(t.slug) : undefined);
                const isUserRegistered = Boolean(userReg);

                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group relative flex flex-col justify-between rounded-xl bg-[#0C0C0E] border border-white/10 hover:border-[#fc8100]/60 hover:-translate-y-1.5 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(252, 129, 0,0.15)] overflow-hidden"
                  >
                    {/* Top Banner Image / Accent */}
                    <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#121218] via-[#1a1a24] to-black">
                      <img
                        src={getTournamentBannerUrl(t.bannerImage, t.title)}
                        alt={t.title}
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_TOURNAMENT_BANNER;
                        }}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 filter saturate-125"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-transparent to-black/60 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-widest bg-black/80 border border-white/10 text-gray-300 backdrop-blur-md">
                          <Shield className="h-3 w-3 text-[#fc8100]" />
                          {t.game}
                        </span>

                        {(() => {
                          if (isCompleted) {
                            return (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md bg-zinc-800/95 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                COMPLETED
                              </span>
                            );
                          }
                          if (isLive) {
                            return (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md bg-rose-950/90 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                LIVE NOW
                              </span>
                            );
                          }
                          if (isClosed) {
                            return (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md bg-amber-950/90 text-amber-400 border border-amber-500/40">
                                <AlertCircle className="h-3 w-3 text-amber-400" />
                                REGISTRATION CLOSED
                              </span>
                            );
                          }
                          if (isUpcoming) {
                            return (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md bg-sky-950/90 text-sky-400 border border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                                <Calendar className="h-3 w-3 text-sky-400" />
                                UPCOMING
                              </span>
                            );
                          }
                          return (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              REGISTRATION OPEN
                            </span>
                          );
                        })()}
                      </div>

                      {/* Live Dynamic Registration Count Banner */}
                      <div className="absolute bottom-2 left-3 px-2.5 py-1 rounded bg-black/80 border border-[#fc8100]/40 text-[#fc8100] font-heading font-extrabold text-[10px] uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                        <span>
                          {t.confirmedTeams ?? t.registeredTeams ?? 0} / {t.totalTeams || 32} TEAMS REGISTERED
                        </span>
                        {!isCompleted && !isClosed && t.availableSlots !== undefined && (
                          <span className="text-gray-400 font-mono text-[9px]">
                            ({t.availableSlots} SLOTS LEFT)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-4">
                      {/* Title */}
                      <Link to={`/tournaments/${t.slug || t.id}`}>
                        <h3 className="font-display text-2xl tracking-wide uppercase text-white group-hover:text-[#fc8100] transition-colors leading-tight">
                          {t.title}
                        </h3>
                      </Link>
                      <p className="mt-1.5 text-xs text-gray-400 font-body line-clamp-2">
                        {t.tagline || t.shortDescription}
                      </p>

                      {/* Prize Pool Spotlight */}
                      <div className="mt-4 p-3 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-[#fc8100]" />
                          <span className="text-xs text-gray-400 font-heading uppercase tracking-wider">
                            Prize Pool
                          </span>
                        </div>
                        <span className="font-display text-2xl font-bold text-[#fc8100] tracking-wider">
                          {formatCurrency(t.prizePool)}
                        </span>
                      </div>

                      {/* Metadata Grid */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span className="truncate">{formatDate(t.date || t.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[#fc8100] font-bold">
                            {formatCurrency(t.feeAmount ?? t.entryFee)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-6 pt-0 flex gap-2">
                      {(() => {
                        if (isCompleted) {
                          return (
                            <Link
                              to={`/tournaments/${t.slug || t.id}`}
                              className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 text-center transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                            >
                              <Trophy className="h-3.5 w-3.5 text-[#fc8100]" />
                              <span>VIEW RESULTS</span>
                            </Link>
                          );
                        }

                        if (isUserRegistered) {
                          return (
                            <Link
                              to="/my-tournaments"
                              className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/40 text-center transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>VIEW IN MY TOURNAMENTS</span>
                            </Link>
                          );
                        }

                        if (isLive) {
                          return (
                            <Link
                              to={t.streamUrl || `/tournaments/${t.slug || t.id}`}
                              target={t.streamUrl ? "_blank" : undefined}
                              rel={t.streamUrl ? "noopener noreferrer" : undefined}
                              className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white text-center transition-all duration-200 shadow-[0_0_12px_rgba(244,63,94,0.35)] flex items-center justify-center gap-1.5"
                            >
                              <Radio className="h-3.5 w-3.5 animate-pulse" />
                              <span>VIEW LIVE / WATCH</span>
                            </Link>
                          );
                        }

                        if (isClosed) {
                          return (
                            <button
                              disabled
                              className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed text-center transition-all duration-200 flex items-center justify-center gap-1.5 opacity-70"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>REGISTRATION CLOSED</span>
                            </button>
                          );
                        }

                        if (isUpcoming) {
                          return (
                            <Link
                              to={`/tournaments/${t.slug || t.id}`}
                              className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-center transition-all duration-200 flex items-center justify-center gap-1.5"
                            >
                              <Bell className="h-3.5 w-3.5" />
                              <span>NOTIFY ME / VIEW DETAILS</span>
                            </Link>
                          );
                        }

                        // Registration Open
                        return (
                          <button
                            onClick={() => onSelectTournament(t)}
                            className="flex-1 py-2.5 px-3 rounded font-heading text-xs font-bold uppercase tracking-wider bg-[#fc8100] hover:bg-[#e07200] text-black text-center transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(252, 129, 0,0.25)] font-black"
                          >
                            JOIN / REGISTER
                          </button>
                        );
                      })()}

                      <Link
                        to={`/tournaments/${t.slug || t.id}`}
                        className="py-2.5 px-3.5 rounded font-heading text-xs font-bold uppercase tracking-wider bg-[#141417] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition-all duration-200"
                        title="View Tournament Arena"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : nonDraftTournaments.length === 0 ? (
              <div className="col-span-full py-20 px-6 rounded-2xl bg-[#0D0D10]/80 border border-white/10 text-center max-w-lg mx-auto shadow-2xl backdrop-blur-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fc8100]/10 border border-[#fc8100]/30 flex items-center justify-center text-[#fc8100]">
                  <Trophy className="w-8 h-8 opacity-70" />
                </div>
                <h3 className="font-display text-xl uppercase tracking-wider text-white">
                  NO TOURNAMENTS AVAILABLE
                </h3>
                <p className="font-body text-xs text-gray-400 mt-2 leading-relaxed">
                  There are currently no tournaments available. Check back soon or join our community for upcoming circuit schedules!
                </p>
              </div>
            ) : (
              <div className="col-span-full py-16 px-6 text-center max-w-md mx-auto">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#fc8100]" />
                <h4 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  {emptyTabInfo.title}
                </h4>
                <p className="font-body text-xs text-gray-400 mt-1.5 leading-relaxed">
                  {emptyTabInfo.subtitle}
                </p>
                <button
                  onClick={() => {
                    setSelectedGame("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#fc8100] border border-white/10 cursor-pointer font-heading uppercase tracking-wider transition-colors inline-block"
                >
                  Reset filters
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
        </div>
      </div>
    </section>
  );
};
