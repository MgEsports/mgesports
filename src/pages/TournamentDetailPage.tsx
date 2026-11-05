import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { tournamentsApi, getMyTournaments, getMyRoomAccess } from "../api/tournaments";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/useModals";
import {
  type Tournament,
  type TournamentStage,
  type RegistrationItem,
  type LeaderboardEntry,
  getTournamentBannerUrl,
  DEFAULT_TOURNAMENT_BANNER,
  getDerivedTournamentStatus,
} from "../data/tournaments";
import {
  Trophy,
  Calendar,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Flame,
  Crown,
  Award,
  ListOrdered,
  BookOpen,
  Send,
  AlertCircle,
  Copy,
  Check,
  Key,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatCurrency, formatDate } from "../utils/formatters";
import { SEO } from "../components/common/SEO";
import { SITE_URL } from "../config/seo";

export const TournamentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { openLogin, openJoinTournament } = useModals();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stages, setStages] = useState<TournamentStage[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userTournaments, setUserTournaments] = useState<any[]>([]);
  const [roomAccess, setRoomAccess] = useState<any | null>(null);
  const [selectedRoundTab, setSelectedRoundTab] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ABOUT" | "REGISTRATION" | "TEAMS" | "STAGES" | "LEADERBOARD" | "RULES"
  >("ABOUT");

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Registration Form State
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainIgn, setCaptainIgn] = useState("");
  const [captainEmail, setCaptainEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [discordTag, setDiscordTag] = useState("");

  const [players, setPlayers] = useState([
    { name: "", ign: "", playerId: "", role: "IGL", isCaptain: true, isSubstitute: false },
    { name: "", ign: "", playerId: "", role: "Rusher", isCaptain: false, isSubstitute: false },
    { name: "", ign: "", playerId: "", role: "Support", isCaptain: false, isSubstitute: false },
    { name: "", ign: "", playerId: "", role: "Sniper", isCaptain: false, isSubstitute: false },
  ]);

  const [substitutes, setSubstitutes] = useState<
    Array<{ name: string; ign: string; playerId: string; role: string; isCaptain: boolean; isSubstitute: boolean }>
  >([]);

  // Form Status
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    registrationNumber: string;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    tournamentsApi
      .getById(slug)
      .then((data) => {
        if (data) {
          setTournament(data);
          if (data.stages) setStages(data.stages);
          if (data.registrations) setRegistrations(data.registrations);
          if (data.leaderboard) setLeaderboard(data.leaderboard);
        } else {
          setTournament(null);
        }
      })
      .catch(() => {
        setTournament(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Also fetch leaderboard and stages specifically
    tournamentsApi
      .getLeaderboard(slug)
      .then((lb) => {
        if (lb && lb.length > 0) setLeaderboard(lb);
      })
      .catch(() => {});

    tournamentsApi
      .getStages(slug)
      .then((stgs) => {
        if (stgs && stgs.length > 0) setStages(stgs);
      })
      .catch(() => {});
  }, [slug]);

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

  useEffect(() => {
    if (isAuthenticated && tournament?.id) {
      getMyRoomAccess(tournament.id)
        .then((res) => {
          if (res?.success && res?.data) {
            setRoomAccess(res.data);
            setSelectedRoundTab(res.data.roundId || null);
          }
        })
        .catch(() => {});
    } else {
      setRoomAccess(null);
      setSelectedRoundTab(null);
    }
  }, [isAuthenticated, tournament?.id]);

  const activeRoundData = useMemo(() => {
    if (!roomAccess) return null;
    if (roomAccess.allAssignedRounds && roomAccess.allAssignedRounds.length > 0 && selectedRoundTab) {
      const found = roomAccess.allAssignedRounds.find((r: any) => r.roundId === selectedRoundTab);
      if (found) {
        return {
          ...roomAccess,
          ...found,
          hasAccess: found.hasAccess ?? (found.status !== "ELIMINATED" && found.credentialsPublished),
          isEliminated: found.status === "ELIMINATED",
        };
      }
    }
    return roomAccess;
  }, [roomAccess, selectedRoundTab]);

  // Check if current user is registered in this tournament
  const userRegistration = useMemo(() => {
    if (!tournament) return null;
    return (
      userTournaments.find(
        (item) =>
          item.tournament?.id === tournament.id ||
          item.tournamentId === tournament.id ||
          (tournament.slug && item.tournament?.slug === tournament.slug)
      ) || null
    );
  }, [tournament, userTournaments]);

  const registeredCount = tournament?.registeredTeams ?? (tournament?.stats?.total || 0);
  const totalSlots = tournament?.totalTeams || 128;
  const isTournamentFull = registeredCount >= totalSlots;
  const allowWaitlist = Boolean((tournament as any)?.allowWaitlist);
  const feeDisplay = tournament ? formatCurrency(tournament.feeAmount ?? tournament.entryFee) : "";
  const prizeDisplay = tournament ? formatCurrency(tournament.prizePool) : "";
  const derivedStatus = tournament ? getDerivedTournamentStatus(tournament) : "REGISTRATION_OPEN";
  const isCompletedTournament = derivedStatus === "COMPLETED";
  const isRegistrationClosed = derivedStatus === "REGISTRATION_CLOSED";

  const isUserRegistered = Boolean(userRegistration);
  const regStatus = userRegistration?.registration?.status || userRegistration?.status;
  const paymentStatus = userRegistration?.registration?.paymentStatus || userRegistration?.paymentStatus;
  const isConfirmed =
    regStatus === "CONFIRMED" ||
    regStatus === "APPROVED" ||
    userRegistration?.status === "CONFIRMED" ||
    userRegistration?.status === "APPROVED" ||
    paymentStatus === "VERIFIED" ||
    paymentStatus === "PAID" ||
    paymentStatus === "COMPLETED";
  const isPaymentUnderReview =
    !isConfirmed &&
    (regStatus === "PAYMENT_UNDER_REVIEW" ||
      paymentStatus === "UNDER_REVIEW" ||
      paymentStatus === "PENDING_VERIFICATION");
  const isPendingInvitation = Boolean(userRegistration?.isInvitationPending);

  const isCheckInOpen = useMemo(() => {
    if (!tournament?.checkInEnabled) return false;
    const now = new Date().getTime();
    if (tournament.checkInStartTime && now < new Date(tournament.checkInStartTime).getTime()) return false;
    if (tournament.checkInEndTime && now > new Date(tournament.checkInEndTime).getTime()) return false;
    return true;
  }, [tournament]);

  const parsedPrizes = useMemo(() => {
    if (!tournament) return [];
    if (Array.isArray(tournament.prizes)) return tournament.prizes;
    if (typeof tournament.prizes === "string") {
      try {
        const parsed = JSON.parse(tournament.prizes);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    // Fallback to legacy firstPrize / secondPrize / thirdPrize
    const fallback: any[] = [];
    if (tournament.firstPrize) {
      fallback.push({ position: "1st Place", percentage: 50, amount: parseInt(String(tournament.firstPrize).replace(/[^0-9]/g, "")) || 0, formattedAmount: tournament.firstPrize });
    }
    if (tournament.secondPrize) {
      fallback.push({ position: "2nd Place", percentage: 30, amount: parseInt(String(tournament.secondPrize).replace(/[^0-9]/g, "")) || 0, formattedAmount: tournament.secondPrize });
    }
    if (tournament.thirdPrize) {
      fallback.push({ position: "3rd Place", percentage: 20, amount: parseInt(String(tournament.thirdPrize).replace(/[^0-9]/g, "")) || 0, formattedAmount: tournament.thirdPrize });
    }
    return fallback;
  }, [tournament]);

  const parsedSponsors = useMemo(() => {
    if (!tournament) return [];
    if (Array.isArray(tournament.sponsors)) return tournament.sponsors;
    if (typeof tournament.sponsors === "string") {
      try {
        const parsed = JSON.parse(tournament.sponsors);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }, [tournament]);

  const tournamentSchema = useMemo(() => {
    if (!tournament) return null;
    const path = `/tournaments/${tournament.slug || slug}`;
    return {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: tournament.title,
      description:
        tournament.shortDescription ||
        tournament.description ||
        `Official ${tournament.game} tournament hosted by LORD ESPORTZ.`,
      url: `${SITE_URL}${path}`,
      startDate: tournament.startDate || "2026-09-28T18:00:00Z",
      ...(tournament.endDate ? { endDate: tournament.endDate } : {}),
      eventStatus:
        tournament.status === "CANCELLED"
          ? "https://schema.org/EventCancelled"
          : "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: `${SITE_URL}${path}`,
      },
      organizer: {
        "@type": "SportsOrganization",
        name: "LORD ESPORTZ",
        url: SITE_URL,
      },
      offers: {
        "@type": "Offer",
        price: tournament.feeAmount || 0,
        priceCurrency: tournament.currency || "INR",
        availability: isTournamentFull ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: `${SITE_URL}${path}`,
        validFrom: tournament.regStartDate || undefined,
      },
    };
  }, [tournament, slug, isTournamentFull]);

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#FFBE32] font-mono text-sm">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>LOADING TOURNAMENT ARENA...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <SEO title="Tournament Not Found | LORD ESPORTZ" noindex nofollow />
        <Trophy className="h-16 w-16 text-gray-600 mb-4" />
        <h1 className="font-display text-3xl uppercase tracking-wider">Tournament Not Found</h1>
        <p className="text-sm text-gray-400 mt-2">The tournament arena you are looking for may have concluded or been archived.</p>
        <Link
          to="/tournaments"
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#FFBE32] text-black font-heading font-bold text-xs uppercase"
        >
          View All Tournaments
        </Link>
      </div>
    );
  }

  const handleAddSubstitute = () => {
    if (substitutes.length >= (tournament.substituteCount || 2)) {
      alert(`Maximum ${tournament.substituteCount || 2} substitute players allowed.`);
      return;
    }
    setSubstitutes((prev) => [
      ...prev,
      { name: "", ign: "", playerId: "", role: "Substitute", isCaptain: false, isSubstitute: true },
    ]);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!teamName || !captainIgn || !whatsapp) {
      setErrorMessage("Please complete required Team Name, Captain IGN, and WhatsApp number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await tournamentsApi.registerSquad(tournament.id, {
        teamName,
        captainName: captainName || captainIgn,
        captainIgn,
        captainPhone: whatsapp,
        captainEmail,
        whatsapp,
        discordTag,
        players: [
          ...players.map((p) => ({
            name: p.name || p.ign,
            ign: p.ign,
            playerId: p.playerId,
            role: p.role,
            isCaptain: p.isCaptain,
            isSubstitute: false,
          })),
          ...substitutes.map((s) => ({
            name: s.name || s.ign,
            ign: s.ign,
            playerId: s.playerId,
            role: s.role,
            isCaptain: false,
            isSubstitute: true,
          })),
        ],
      });

      if (res?.success) {
        setSubmitSuccess(true);
        setSubmissionResult({
          registrationNumber: res.registrationNumber || res.id || "CONFIRMED",
          status: res.status || "CONFIRMED",
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setErrorMessage(res?.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during registration.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#FFBE32] selection:text-black w-full max-w-full overflow-x-hidden">
      <SEO
        title={`${tournament.title} | LORD ESPORTZ Tournament`}
        description={
          tournament.shortDescription ||
          tournament.description ||
          `Join ${tournament.title}, the official ${tournament.game} championship by LORD ESPORTZ. Total Prize Pool: ${prizeDisplay}. Format: ${tournament.format}.`
        }
        canonicalPath={`/tournaments/${tournament.slug || slug}`}
        ogImage={tournament.bannerImage || "/og-image.jpg"}
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Tournaments", item: "/tournaments" },
          { name: tournament.title, item: `/tournaments/${tournament.slug || slug}` },
        ]}
        structuredData={tournamentSchema || undefined}
      />

      {/* Top Banner Hero */}
      <div className="relative border-b border-white/10 bg-[#08080A] overflow-hidden">
        {/* Background Banner Image */}
        <div className="absolute inset-0 h-96 w-full opacity-35 bg-gradient-to-r from-black via-[#171720] to-black">
          <img
            src={getTournamentBannerUrl(tournament.bannerImage, tournament.title)}
            alt={tournament.title}
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_TOURNAMENT_BANNER;
            }}
            className="w-full h-full object-cover filter saturate-150 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-10 sm:pb-12 z-10">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[#FFBE32]" />
            <span>All Tournaments</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-[10px] font-heading font-extrabold uppercase tracking-widest bg-black/80 border border-white/15 text-white backdrop-blur-md">
                  <Shield className="inline h-3 w-3 text-[#FFBE32] mr-1" />
                  {tournament.game}
                </span>

                {roomAccess?.isEliminated ? (
                  <span className="px-3 py-1 rounded-md text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/40">
                    <XCircle className="w-3 h-3" />
                    TOURNAMENT ENDED (ELIMINATED)
                  </span>
                ) : roomAccess?.hasAccess ? (
                  <span className="px-3 py-1 rounded-md text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                    <Key className="w-3 h-3" />
                    ROOM READY • SLOT #{roomAccess.slotNumber}
                  </span>
                ) : isUserRegistered ? (
                  <span
                    className={`px-3 py-1 rounded-md text-[10px] font-heading font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 ${
                      isConfirmed
                        ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40"
                        : isPendingInvitation
                        ? "bg-amber-500/20 text-[#FFBE32] border border-[#FFBE32]/40"
                        : "bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/40"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {isConfirmed
                      ? "REGISTERED ✓"
                      : isPendingInvitation
                      ? "INVITATION PENDING"
                      : isPaymentUnderReview
                      ? "PAYMENT PENDING"
                      : "REGISTERED"}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-md text-[10px] font-heading font-extrabold uppercase tracking-wider bg-amber-950/60 text-[#FFBE32] border border-[#FFBE32]/40 backdrop-blur-md">
                    {tournament.status === "REGISTRATION_OPEN"
                      ? isTournamentFull
                        ? allowWaitlist
                          ? "WAITLIST OPEN"
                          : "REGISTRATION FULL"
                        : "REGISTRATION OPEN"
                      : tournament.status}
                  </span>
                )}

                {isCheckInOpen && (
                  <span className="px-3 py-1 rounded-md text-[10px] font-heading font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    CHECK-IN ACTIVE
                  </span>
                )}

                <span className="px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider bg-black/60 border border-white/10 text-gray-300">
                  {tournament.format}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase tracking-wider text-white drop-shadow-lg leading-none">
                {tournament.title}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 font-body max-w-2xl leading-relaxed">
                {tournament.tagline || tournament.shortDescription}
              </p>

              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#FFBE32]" />
                  <span className="text-gray-400">Prize Pool:</span>
                  <strong className="text-[#FFBE32] font-display text-lg">{prizeDisplay}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">{formatDate(tournament.date || (tournament as any).startDate)}</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC REGISTRATION CARD */}
            <div className="p-4 xs:p-6 rounded-2xl bg-black/80 border-2 border-[#FFBE32]/40 backdrop-blur-xl shadow-[0_0_30px_rgba(255,190,50,0.15)] flex flex-col justify-between w-full sm:min-w-[280px]">
              <div>
                <div className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-gray-400">
                  REGISTRATION STATUS
                </div>
                <div className="mt-1 font-display text-3xl font-bold text-white">
                  <span className="text-[#FFBE32]">{registeredCount}</span> / {totalSlots}
                </div>
                <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] mt-0.5">
                  TEAMS REGISTERED
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#FFBE32] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (registeredCount / totalSlots) * 100)}%` }}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-[#FFBE32] font-bold">{feeDisplay}</span>
                </div>
              </div>

              {isUserRegistered ? (
                <div className="mt-5 space-y-2">
                  {roomAccess?.isEliminated ? (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>TOURNAMENT ENDED</span>
                      </div>
                      <div className="text-[10px] font-mono text-red-300 mt-1">
                        Eliminated in {roomAccess.eliminatedRound || "earlier round"}
                      </div>
                    </div>
                  ) : roomAccess?.hasAccess ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-heading text-xs font-black uppercase tracking-wider">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>ROOM READY • SLOT #{roomAccess.slotNumber}</span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-300 mt-1">
                        {roomAccess.roundName}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-center">
                      <div className="flex items-center justify-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isConfirmed
                            ? "YOU ARE REGISTERED ✓"
                            : isPendingInvitation
                            ? "INVITATION PENDING"
                            : isPaymentUnderReview
                            ? "PAYMENT UNDER REVIEW"
                            : "REGISTRATION PENDING"}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link
                    to="/my-tournaments"
                    className={`block w-full py-3 rounded-xl font-heading text-xs font-extrabold uppercase tracking-wider text-black text-center transition-all ${
                      roomAccess?.isEliminated
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : roomAccess?.hasAccess
                        ? "bg-[#FFBE32] hover:bg-[#FFA000] shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                        : "bg-[#22C55E] hover:bg-[#16a34a] shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    }`}
                  >
                    {roomAccess?.hasAccess ? "Open Match Lobby Pass" : "View in My Tournaments"}
                  </Link>
                </div>
              ) : (
                <button
                  disabled={isRegistrationClosed && !isCompletedTournament}
                  onClick={() => {
                    if (isCompletedTournament) {
                      setActiveTab("LEADERBOARD");
                      window.scrollTo({ top: 500, behavior: "smooth" });
                      return;
                    }
                    if (isRegistrationClosed) {
                      return;
                    }
                    if (!isAuthenticated) {
                      if (tournament) {
                        openJoinTournament(tournament);
                      } else {
                        openLogin();
                      }
                      return;
                    }
                    setActiveTab("REGISTRATION");
                    window.scrollTo({ top: 500, behavior: "smooth" });
                  }}
                  className={`mt-5 w-full py-3 rounded-xl font-heading text-xs font-extrabold uppercase tracking-wider text-center transition-all ${
                    isCompletedTournament
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      : isRegistrationClosed
                      ? "bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed opacity-70"
                      : isTournamentFull && allowWaitlist
                      ? "bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)] cursor-pointer"
                      : "bg-[#FFBE32] hover:bg-[#FFA000] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)] cursor-pointer"
                  }`}
                >
                  {isCompletedTournament
                    ? "View Tournament Results"
                    : isRegistrationClosed
                    ? "Registration Closed"
                    : isTournamentFull && allowWaitlist
                    ? "Join Priority Waitlist"
                    : isTournamentFull
                    ? "Tournament Full"
                    : "Register Squad Now"}
                </button>
              )}
            </div>
          </div>

          {/* PLAYER ROOM ACCESS & ELIMINATION ENGINE BANNER */}
          {activeRoundData && (
            <div className="mt-8 pt-6 border-t border-white/10">
              {/* Multi-Round / Division Selector (if squad advanced or assigned across multiple rounds) */}
              {roomAccess?.allAssignedRounds && roomAccess.allAssignedRounds.length > 1 && (
                <div className="mb-4 p-3 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase shrink-0 font-bold">
                    SELECT ROUND / DIVISION:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {roomAccess.allAssignedRounds.map((rnd: any) => {
                      const isSelected = (selectedRoundTab || roomAccess.roundId) === rnd.roundId;
                      const isElim = rnd.status === "ELIMINATED";
                      return (
                        <button
                          key={rnd.roundId}
                          type="button"
                          onClick={() => setSelectedRoundTab(rnd.roundId)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-[#FFBE32] text-black shadow-md shadow-[#FFBE32]/20 font-black"
                              : isElim
                              ? "bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/50"
                              : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          <span>{rnd.roundName}</span>
                          {isElim ? (
                            <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-300">Eliminated</span>
                          ) : (
                            <span className="text-[9px] px-1 rounded bg-black/40 text-[#FFBE32]">Slot #{rnd.slotNumber}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeRoundData.isEliminated ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/30 to-black border-2 border-red-500/50 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-black uppercase tracking-wider text-red-400">
                          {activeRoundData.roundName} — SQUAD ELIMINATED
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                          STAGE CONCLUDED
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mt-1">
                        Squad <strong className="text-white">"{activeRoundData.teamName}"</strong> did not qualify from <strong className="text-red-400">{activeRoundData.roundName || activeRoundData.eliminatedRound || "the previous round"}</strong>. Room credentials for subsequent stages are closed.
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                    ELIMINATED
                  </span>
                </div>
              ) : activeRoundData.hasAccess ? (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFBE32]/15 via-[#121218] to-black border-2 border-[#FFBE32]/60 shadow-[0_0_35px_rgba(255,190,50,0.2)] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFBE32]/20 border border-[#FFBE32]/50 flex items-center justify-center text-[#FFBE32]">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-heading font-black uppercase tracking-widest text-[#FFBE32]">
                            FREE FIRE CUSTOM ROOM CREDENTIALS
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            LIVE ACCESS
                          </span>
                        </div>
                        <div className="text-base font-display uppercase tracking-wider text-white mt-0.5">
                          {activeRoundData.roundName} • SQUAD: {activeRoundData.teamName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-black bg-[#FFBE32] text-black shadow-lg">
                        LOBBY SLOT #{activeRoundData.slotNumber}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Room ID */}
                    <div className="p-3.5 rounded-xl bg-black/70 border border-white/15 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-gray-400">ROOM ID</div>
                        <div className="font-mono text-lg font-bold text-white tracking-widest mt-0.5">
                          {activeRoundData.roomId || "PENDING"}
                        </div>
                      </div>
                      {activeRoundData.roomId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activeRoundData.roomId, "detail-roomId")}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Room ID"
                        >
                          {copiedField === "detail-roomId" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Room Password */}
                    <div className="p-3.5 rounded-xl bg-black/70 border border-white/15 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-gray-400">PASSWORD</div>
                        <div className="font-mono text-lg font-bold text-amber-400 tracking-widest mt-0.5">
                          {activeRoundData.roomPassword || "NONE"}
                        </div>
                      </div>
                      {activeRoundData.roomPassword && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activeRoundData.roomPassword, "detail-roomPassword")}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === "detail-roomPassword" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Map */}
                    <div className="p-3.5 rounded-xl bg-black/70 border border-white/15 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FFBE32]/10 border border-[#FFBE32]/20 flex items-center justify-center text-[#FFBE32]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-gray-400">MAP</div>
                        <div className="font-mono text-sm font-bold text-white uppercase mt-0.5">
                          {activeRoundData.map || "BERMUDA"}
                        </div>
                      </div>
                    </div>

                    {/* Match Time */}
                    <div className="p-3.5 rounded-xl bg-black/70 border border-white/15 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FFBE32]/10 border border-[#FFBE32]/20 flex items-center justify-center text-[#FFBE32]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-gray-400">MATCH SCHEDULE</div>
                        <div className="font-mono text-sm font-bold text-white mt-0.5">
                          {activeRoundData.roomTime || "SEE SCHEDULE"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeRoundData.notes && (
                    <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-gray-300 flex items-start gap-2">
                      <span className="text-[#FFBE32] font-bold shrink-0">ADMIN INSTRUCTIONS:</span>
                      <span>{activeRoundData.notes}</span>
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-amber-300/80 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Free Fire Custom Room Rule: Each lobby is capped at 12 squads. Join specifically into <strong>Slot #{activeRoundData.slotNumber}</strong> of <strong>{activeRoundData.roundName}</strong>. Non-assigned squads will be removed.</span>
                  </div>
                </div>
              ) : activeRoundData.isRegistered && activeRoundData.roundName ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-heading font-black uppercase tracking-wider text-amber-400">
                        SQUAD ALLOCATED: {activeRoundData.roundName} (SLOT #{activeRoundData.slotNumber})
                      </div>
                      <p className="text-xs text-gray-300 font-mono mt-1">
                        Your squad is selected for {activeRoundData.roundName}. Room ID and password are kept hidden until the tournament admin publishes them before match kick-off.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    SLOT #{activeRoundData.slotNumber} RESERVED
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-white/10 bg-[#0A0A0D]/90 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto scrollbar-none">
            {(
              [
                { key: "ABOUT", label: "Overview & About", icon: BookOpen },
                { key: "REGISTRATION", label: "Squad Registration", icon: Send },
                { key: "TEAMS", label: `Teams (${registeredCount})`, icon: Shield },
                { key: "STAGES", label: `Stages (${stages.length || 3})`, icon: ListOrdered },
                { key: "LEADERBOARD", label: "Live Leaderboard", icon: Award },
                { key: "RULES", label: "Tournament Rules", icon: BookOpen },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 py-4 px-5 font-heading text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                    active
                      ? "border-[#FFBE32] text-[#FFBE32] bg-[#FFBE32]/5"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-[#FFBE32]" : "text-gray-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ================= TAB 1: ABOUT ================= */}
        {activeTab === "ABOUT" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                <h2 className="font-display text-2xl uppercase tracking-wider text-white">
                  Championship Overview
                </h2>
                <p className="text-sm text-gray-300 font-body leading-relaxed">
                  {tournament.description ||
                    tournament.shortDescription ||
                    "Official competitive tournament organized by LORD ESPORTZ. Squads battle across Bermuda, Purgatory, and Kalahari maps with real-time observer review and anti-cheat monitoring."}
                </p>
              </div>

              {/* Dynamic Prize Distribution */}
              <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl uppercase tracking-wider text-white flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-[#FFBE32]" />
                    Prize Pool Distribution
                  </h2>
                  <span className="text-xs font-mono font-bold text-[#FFBE32] bg-[#FFBE32]/10 px-2.5 py-1 rounded-md border border-[#FFBE32]/30">
                    Total: {prizeDisplay}
                  </span>
                </div>

                {parsedPrizes.length === 1 || (tournament as any).prizeType === "WINNER_TAKES_ALL" ? (
                  <div className="p-8 rounded-2xl bg-gradient-to-b from-[#FFBE32]/20 via-[#171720] to-black border-2 border-[#FFBE32]/50 text-center space-y-3 shadow-[0_0_40px_rgba(255,190,50,0.15)]">
                    <Crown className="h-12 w-12 text-[#FFBE32] mx-auto animate-pulse" />
                    <div>
                      <span className="text-[11px] font-heading font-black uppercase tracking-widest text-[#FFBE32] bg-[#FFBE32]/10 px-3 py-1 rounded-full border border-[#FFBE32]/30">
                        WINNER TAKES ALL • 1ST PLACE
                      </span>
                      <div className="font-display text-4xl sm:text-5xl font-black text-white mt-2">
                        {formatCurrency(parsedPrizes[0]?.amount || (tournament as any).firstPrize || tournament.prizePool)}
                      </div>
                      <p className="text-xs font-mono text-gray-400 mt-1 max-w-sm mx-auto">
                        100% of the tournament prize pool is awarded exclusively to the Grand Champion.
                      </p>
                    </div>
                  </div>
                ) : parsedPrizes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {parsedPrizes.map((tier: any, pIdx: number) => {
                      const isFirst = pIdx === 0;
                      const isSecond = pIdx === 1;
                      const isThird = pIdx === 2;

                      return (
                        <div
                          key={pIdx}
                          className={`p-5 rounded-xl text-center space-y-1 transition-all ${
                            isFirst
                              ? "bg-gradient-to-b from-[#FFBE32]/15 to-transparent border border-[#FFBE32]/40 shadow-[0_0_20px_rgba(255,190,50,0.1)]"
                              : isSecond
                              ? "bg-gradient-to-b from-white/10 to-transparent border border-white/15"
                              : isThird
                              ? "bg-gradient-to-b from-amber-700/15 to-transparent border border-amber-700/30"
                              : "bg-black/40 border border-white/10"
                          }`}
                        >
                          {isFirst ? (
                            <Crown className="h-7 w-7 text-[#FFBE32] mx-auto mb-1" />
                          ) : isSecond ? (
                            <MedalSilver className="h-7 w-7 text-gray-300 mx-auto mb-1" />
                          ) : isThird ? (
                            <Flame className="h-7 w-7 text-amber-500 mx-auto mb-1" />
                          ) : (
                            <Award className="h-7 w-7 text-gray-400 mx-auto mb-1" />
                          )}
                          <div
                            className={`text-[10px] font-heading font-extrabold uppercase tracking-widest ${
                              isFirst
                                ? "text-[#FFBE32]"
                                : isSecond
                                ? "text-gray-300"
                                : isThird
                                ? "text-amber-500"
                                : "text-gray-400"
                            }`}
                          >
                            {tier.position || `RANK #${pIdx + 1}`}
                            {tier.percentage ? ` (${tier.percentage}%)` : ""}
                          </div>
                          <div className="font-display text-2xl font-bold text-white">
                            {formatCurrency(tier.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-mono text-gray-400">
                    Grand prize of {prizeDisplay} awarded based on official competitive tournament rules.
                  </div>
                )}
              </div>

              {/* Sponsors Showcase if available */}
              {parsedSponsors.length > 0 && (
                <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                  <h2 className="font-display text-2xl uppercase tracking-wider text-white flex items-center gap-2">
                    <Award className="h-6 w-6 text-[#FFBE32]" />
                    Championship Sponsors &amp; Partners
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {parsedSponsors.map((sp: any, sIdx: number) => (
                      <a
                        key={sIdx}
                        href={sp.website || "#"}
                        target={sp.website ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[#FFBE32]/40 transition-colors flex flex-col items-center justify-center text-center space-y-2 group"
                      >
                        {sp.logo ? (
                          <img src={sp.logo} alt={sp.name} className="h-10 w-auto object-contain max-w-[120px]" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-display text-xs text-[#FFBE32]">
                            {sp.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <strong className="text-xs font-heading font-bold text-white group-hover:text-[#FFBE32] transition-colors block">
                            {sp.name}
                          </strong>
                          {sp.tier && (
                            <span className="text-[9px] font-mono text-gray-500 uppercase">{sp.tier} PARTNER</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Specifications Rail */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4 text-xs font-mono">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#FFBE32]">
                  Tournament Details
                </h3>

                <div className="space-y-3 divide-y divide-white/5">
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Game Title:</span>
                    <span className="text-white">{tournament.game}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Total Slots:</span>
                    <span className="text-white font-bold">{totalSlots} Squads</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Squad Roster:</span>
                    <span className="text-white">4 Starters + 1 Sub</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Registration Fee:</span>
                    <span className="text-[#FFBE32] font-bold">{feeDisplay}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Payment Gateway:</span>
                    <span className="text-white">Instant UPI</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white">{tournament.format}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PUBLIC SQUAD REGISTRATION FORM ================= */}
        {activeTab === "REGISTRATION" && (
          <div className="max-w-3xl mx-auto">
            {!isAuthenticated ? (
              <div className="p-8 sm:p-10 rounded-2xl bg-[#0D0D12] border-2 border-[#FFBE32]/40 text-center space-y-6 shadow-[0_0_40px_rgba(255,190,50,0.15)]">
                <div className="w-16 h-16 rounded-2xl bg-[#FFBE32]/10 border border-[#FFBE32]/40 flex items-center justify-center text-[#FFBE32] mx-auto shadow-[0_0_20px_rgba(255,190,50,0.2)]">
                  <Shield className="h-8 w-8 text-[#FFBE32]" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full text-[10px] font-heading font-black tracking-widest bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/30 uppercase">
                    ATHLETE VERIFICATION
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
                    LOGIN REQUIRED TO REGISTER
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 font-body leading-relaxed">
                    You must be logged in as an athlete or team captain to register your squad for{" "}
                    <strong className="text-[#FFBE32]">{tournament.title}</strong>. Sign in or create your player profile to reserve your slot.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (tournament) {
                        openJoinTournament(tournament);
                      } else {
                        openLogin();
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,190,50,0.3)] transition-all cursor-pointer"
                  >
                    LOGIN / SIGN UP TO REGISTER
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ABOUT")}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View Tournament Details
                  </button>
                </div>
              </div>
            ) : isUserRegistered ? (
              <div className="p-8 rounded-2xl bg-[#0D0D12] border border-[#22C55E]/40 text-center space-y-5 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                <div className="h-16 w-16 rounded-full bg-[#22C55E]/20 border border-[#22C55E] flex items-center justify-center text-[#22C55E] mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="font-display text-3xl uppercase tracking-wider text-white">
                  YOU ARE ALREADY REGISTERED
                </h2>
                <p className="text-sm text-gray-300 font-body max-w-md mx-auto">
                  Your squad is already on the roster for <strong className="text-[#FFBE32]">{tournament.title}</strong>. 
                  You can track payment verification status, manage your squad roster, or view room access in your athlete dashboard.
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to="/my-tournaments"
                    className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all"
                  >
                    View in My Tournaments
                  </Link>
                  <button
                    onClick={() => setActiveTab("ABOUT")}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Return to Overview
                  </button>
                </div>
              </div>
            ) : submitSuccess && submissionResult ? (
              <div className="p-8 rounded-2xl bg-[#0D0D12] border-2 border-[#FFBE32]/40 text-center space-y-5 shadow-[0_0_40px_rgba(255,190,50,0.15)]">
                <div className="h-16 w-16 rounded-full bg-[#FFBE32]/20 border border-[#FFBE32] flex items-center justify-center text-[#FFBE32] mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="font-display text-3xl uppercase tracking-wider text-white">
                  SLOT RESERVATION CONFIRMED!
                </h2>
                <p className="text-xs text-gray-300 font-body max-w-md mx-auto">
                  Squad <strong className="text-[#FFBE32]">{teamName}</strong> has been registered for {tournament.title}.
                </p>

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registration ID:</span>
                    <span className="text-[#FFBE32] font-bold">{submissionResult.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Captain IGN:</span>
                    <span className="text-white">{captainIgn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dispatch WhatsApp:</span>
                    <span className="text-white">{whatsapp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verification Status:</span>
                    <span className="text-emerald-400 font-bold">{submissionResult.status}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setTeamName("");
                      setCaptainIgn("");
                      setWhatsapp("");
                      setDiscordTag("");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-heading font-bold uppercase text-white"
                  >
                    Register Another Squad
                  </button>
                  <button
                    onClick={() => setActiveTab("ABOUT")}
                    className="px-6 py-2.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black text-xs font-heading font-bold uppercase"
                  >
                    Return to Overview
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                  <h2 className="font-display text-2xl uppercase tracking-wider text-white">
                    Team &amp; Leader Information
                  </h2>

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. DFG ESPORTS"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        Captain / Leader IGN *
                      </label>
                      <input
                        type="text"
                        required
                        value={captainIgn}
                        onChange={(e) => setCaptainIgn(e.target.value)}
                        placeholder="e.g. DFG_MAHESH"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        Captain Real Name
                      </label>
                      <input
                        type="text"
                        value={captainName}
                        onChange={(e) => setCaptainName(e.target.value)}
                        placeholder="Mahesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 99000 88776"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        Discord Tag / ID
                      </label>
                      <input
                        type="text"
                        value={discordTag}
                        onChange={(e) => setDiscordTag(e.target.value)}
                        placeholder="dfg_lead#0001"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block uppercase font-bold text-gray-300 mb-1">
                        Captain Email
                      </label>
                      <input
                        type="email"
                        value={captainEmail}
                        onChange={(e) => setCaptainEmail(e.target.value)}
                        placeholder="captain@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Squad Roster Starters */}
                <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl uppercase tracking-wider text-white">
                      Starting Lineup (4 Players)
                    </h2>
                    <span className="text-[10px] uppercase font-mono text-gray-400">
                      Minimum 4 Starters
                    </span>
                  </div>

                  <div className="space-y-3">
                    {players.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-black/50 border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                      >
                        <div className="sm:col-span-1">
                          <span className="text-[10px] text-gray-500 uppercase block">
                            Player 0{idx + 1} Role
                          </span>
                          <span className="font-bold text-[#FFBE32] text-xs uppercase">{p.role}</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="In-Game Name (IGN) *"
                            value={p.ign}
                            onChange={(e) => {
                              const copy = [...players];
                              copy[idx].ign = e.target.value;
                              setPlayers(copy);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Real Name"
                            value={p.name}
                            onChange={(e) => {
                              const copy = [...players];
                              copy[idx].name = e.target.value;
                              setPlayers(copy);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="UID / Player ID"
                            value={p.playerId}
                            onChange={(e) => {
                              const copy = [...players];
                              copy[idx].playerId = e.target.value;
                              setPlayers(copy);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Substitutes */}
                  {substitutes.length > 0 && (
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <span className="text-xs uppercase font-bold text-gray-400">
                        Substitutes Roster:
                      </span>
                      {substitutes.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-black/50 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                        >
                          <div>
                            <input
                              type="text"
                              placeholder="Substitute IGN"
                              value={sub.ign}
                              onChange={(e) => {
                                const copy = [...substitutes];
                                copy[sIdx].ign = e.target.value;
                                setSubstitutes(copy);
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Real Name"
                              value={sub.name}
                              onChange={(e) => {
                                const copy = [...substitutes];
                                copy[sIdx].name = e.target.value;
                                setSubstitutes(copy);
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="UID / Player ID"
                              value={sub.playerId}
                              onChange={(e) => {
                                const copy = [...substitutes];
                                copy[sIdx].playerId = e.target.value;
                                setSubstitutes(copy);
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddSubstitute}
                    className="text-xs font-heading font-bold text-[#FFBE32] hover:underline"
                  >
                    + Add Substitute Player
                  </button>
                </div>

                {/* Free Pre-Entry Reservation Pass */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0D0D12] via-[#121218] to-black border-2 border-[#FFBE32]/30 space-y-4 shadow-[0_0_30px_rgba(255,190,50,0.08)]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="font-display text-2xl uppercase tracking-wider text-white flex items-center gap-2">
                      <Shield className="h-6 w-6 text-[#FFBE32]" />
                      FREE PRE-ENTRY SQUAD HOLD
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      100% FREE ENTRY • ZERO FEES
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-body leading-relaxed">
                    Tournament slots are strictly allocated on a first-come, first-served pre-entry basis. Once you submit your squad roster, your slot is instantly reserved and the LORD Admin team is directly notified.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="font-heading font-bold text-[#FFBE32] block">1. Instant Slot Lock</span>
                      <p className="text-[11px] text-gray-400">Squad slot count immediately updates on the live board upon submission.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="font-heading font-bold text-white block">2. Admin Verification</span>
                      <p className="text-[11px] text-gray-400">Tournament marshals review your squad IGNs and level eligibility.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="font-heading font-bold text-emerald-400 block">3. WhatsApp Match Link</span>
                      <p className="text-[11px] text-gray-400">Room lobby ID &amp; password sent directly to the Captain's WhatsApp.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl font-heading text-sm font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black transition-all shadow-[0_0_25px_rgba(255,190,50,0.35)] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Reserving Pre-Entry Slot..." : "Confirm Pre-Entry Registration"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB 3: TEAMS ================= */}
        {activeTab === "TEAMS" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl uppercase tracking-wider text-white">
              Registered Participating Squads ({registeredCount})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registrations.length > 0 ? (
                registrations.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                          SLOT #{idx + 1}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">
                          {team.status}
                        </span>
                      </div>
                      <h3 className="font-display text-xl uppercase text-white">{team.teamName}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Captain: <strong className="text-[#FFBE32]">{team.captainIgn}</strong>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                      <span>Roster: 5 Players</span>
                      <span className="text-gray-500 font-mono">{team.registrationNumber}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-gray-500">
                  Be the first squad to register for {tournament.title}!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: STAGES ================= */}
        {activeTab === "STAGES" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl uppercase tracking-wider text-white">
              Championship Tournament Progression
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(stages.length > 0
                ? stages
                : [
                    { id: "1", name: "ROUND 1", order: 1, status: "ONGOING", qualificationCriteria: "Top squads qualify" },
                    { id: "2", name: "ROUND 2", order: 2, status: "UPCOMING", qualificationCriteria: "Semi-finals qualification" },
                    { id: "3", name: "GRAND FINALS", order: 3, status: "UPCOMING", qualificationCriteria: "Championship lobby" },
                  ]
              ).map((stg, i) => (
                <div
                  key={stg.id || i}
                  className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                      <span>STAGE 0{stg.order || i + 1}</span>
                      <span className="text-[#FFBE32] uppercase">{stg.status}</span>
                    </div>
                    <h3 className="font-display text-xl text-white uppercase mt-2">{stg.name}</h3>
                    <p className="text-xs text-gray-400 mt-2 font-body">
                      {stg.qualificationCriteria || "Standard points advance"}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-500 font-mono">
                    Official Competitive Stage
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PUBLIC LEADERBOARD ================= */}
        {activeTab === "LEADERBOARD" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wider text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-[#FFBE32]" />
                  Official Live Leaderboard
                </h2>
                <p className="text-xs text-gray-400">
                  Synchronized in real time with the tournament admin scoring desk.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#FFBE32]/30 bg-[#0D0D12] overflow-x-auto shadow-2xl">
              <table className="w-full text-left text-xs sm:text-sm font-heading">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] sm:text-xs uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-4 w-16">RANK</th>
                    <th className="py-3.5 px-4">TEAM NAME</th>
                    <th className="py-3.5 px-4 text-center">MATCHES</th>
                    <th className="py-3.5 px-4 text-center">WWCD (WINS)</th>
                    <th className="py-3.5 px-4 text-center">KILLS</th>
                    <th className="py-3.5 px-4 text-right text-[#FFBE32] font-bold">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((row, idx) => {
                      const isTop1 = (row.rank || idx + 1) === 1;
                      const isTop3 = (row.rank || idx + 1) <= 3;

                      return (
                        <tr
                          key={row.id || idx}
                          className={`hover:bg-white/[0.02] ${
                            isTop1 ? "bg-[#FFBE32]/5" : isTop3 ? "bg-white/[0.01]" : ""
                          }`}
                        >
                          <td className={`py-4 px-4 font-display text-base ${isTop3 ? "text-[#FFBE32]" : "text-gray-400"}`}>
                            #{row.rank || idx + 1}
                          </td>
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                            {isTop1 && <Crown className="h-4 w-4 text-[#FFBE32]" />}
                            <span>{row.teamName}</span>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-300 font-mono">
                            {row.matchesPlayed}
                          </td>
                          <td className="py-4 px-4 text-center text-amber-300 font-mono font-bold">
                            {row.wins}
                          </td>
                          <td className="py-4 px-4 text-center text-red-400 font-mono font-bold">
                            {row.kills}
                          </td>
                          <td className="py-4 px-4 text-right font-display text-lg font-bold text-[#FFBE32]">
                            {row.totalPoints}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-500 font-mono">
                        Leaderboard scores will be broadcasted once matches commence.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: RULES ================= */}
        {activeTab === "RULES" && (
          <div className="max-w-3xl space-y-6">
            <h2 className="font-display text-2xl uppercase tracking-wider text-white">
              Official Competitive Rulebook
            </h2>

            <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4 text-xs font-mono text-gray-300 whitespace-pre-line leading-relaxed">
              {tournament.rules ||
                `1. General Guidelines:
All players must use standard mobile devices. Emulators, iPads, and third-party script modifiers are strictly prohibited.

2. In-Game Anti-Cheat Telemetry:
Screen recording of player hands and POV may be demanded by tournament marshals at any point.

3. Disqualification Policy:
Unruly conduct, teaming, or exploiting map bugs results in instant forfeit of slots and prizes.

4. Slot Finality:
Slots are non-transferable once verified.`}
            </div>

            {tournament.refundPolicy && (
              <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-3">
                <h3 className="font-display text-xl uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#FFBE32]" />
                  Refund &amp; Cancellation Policy
                </h3>
                <p className="text-xs font-mono text-gray-300 whitespace-pre-line leading-relaxed">
                  {tournament.refundPolicy}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper SVG Icon for Medal
function MedalSilver(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="8" opacity="0.3" />
      <path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5L6 18.5 7.5 12.5 3 8.5 9 8z" />
    </svg>
  );
}
