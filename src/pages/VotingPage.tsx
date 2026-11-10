import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "../components/common/PageHero";
import { votingApi, type PublicVotingEvent } from "../api/voting";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/useModals";
import {
  Vote,
  Trophy,
  Shield,
  Zap,
  Crosshair,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Lock,
  Sparkles,
  Video,
  Users,
  Flame,
  ChevronRight,
} from "lucide-react";
import { SEO } from "../components/common/SEO";

export const VotingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useModals();

  // All active voting sections / categories
  const [events, setEvents] = useState<PublicVotingEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNomineeId, setSelectedNomineeId] = useState<string | null>(null);

  // Voting action states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Load All Active Voting Sections
  const loadActiveEvents = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await votingApi.getAllActive();
      setEvents(data);
      if (data && data.length > 0) {
        // Keep current selected event if still present, or pick first
        setActiveEventId((prev) => {
          if (prev && data.some((e) => e.id === prev)) return prev;
          return data[0].id;
        });
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveEvents();
  }, [isAuthenticated, user?.id]);

  // Current active event object
  const activeEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    return events.find((e) => e.id === activeEventId) || events[0];
  }, [events, activeEventId]);

  // Sync selected nominee when switching sections
  useEffect(() => {
    if (activeEvent?.userVotingStatus?.votedNomineeId) {
      setSelectedNomineeId(activeEvent.userVotingStatus.votedNomineeId);
    } else {
      setSelectedNomineeId(null);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [activeEventId, activeEvent?.userVotingStatus?.votedNomineeId]);

  // Real-time Countdown Timer for current section
  useEffect(() => {
    if (!activeEvent?.endDate) return;

    const calculateTime = () => {
      const diff = new Date(activeEvent.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeEvent?.endDate]);

  // Selected Nominee Object
  const selectedNominee = useMemo(() => {
    if (!activeEvent || !selectedNomineeId) return null;
    return activeEvent.nominees.find((n) => n.id === selectedNomineeId) || null;
  }, [activeEvent, selectedNomineeId]);

  // User voting status for current section
  const hasVotedCurrent = Boolean(activeEvent?.userVotingStatus?.hasVoted);
  const votedNomineeCurrent = useMemo(() => {
    if (!activeEvent || !activeEvent.userVotingStatus?.votedNomineeId) return null;
    return activeEvent.nominees.find((n) => n.id === activeEvent.userVotingStatus?.votedNomineeId) || null;
  }, [activeEvent]);

  // Submit Vote Handler for Current Active Section
  const handleCastVote = async () => {
    if (!activeEvent || !selectedNomineeId) return;

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (hasVotedCurrent) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await votingApi.castVote(activeEvent.id, selectedNomineeId);
      const candidateName = res.playerIgn || selectedNominee?.name || "your choice";
      setSuccessMessage(`BOOYAH! Your official vote has been recorded for ${candidateName} in ${activeEvent.title}!`);

      // Refresh events to update status across sections
      await loadActiveEvents();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for category badge and styling
  const getCategoryInfo = (category?: string, title?: string) => {
    const raw = (category || "").toUpperCase();
    const t = (title || "").toUpperCase();

    if (raw.includes("CREATOR") || t.includes("CREATOR")) {
      return {
        label: "Best Creator Section",
        icon: Video,
        chipColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
        activeBorder: "border-purple-500",
        glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      };
    }
    if (raw.includes("COMMUNITY") || t.includes("COMMUNITY")) {
      return {
        label: "Community Awards",
        icon: Users,
        chipColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        activeBorder: "border-emerald-500",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      };
    }
    if (raw.includes("RISING") || t.includes("RISING")) {
      return {
        label: "Rising Star Section",
        icon: Flame,
        chipColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
        activeBorder: "border-cyan-500",
        glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]",
      };
    }
    return {
      label: "Best Player Section",
      icon: Trophy,
      chipColor: "bg-[#fc8100]/20 text-[#fc8100] border-[#fc8100]/40",
      activeBorder: "border-[#fc8100]",
      glow: "shadow-[0_0_20px_rgba(252, 129, 0,0.2)]",
    };
  };

  // Helper for candidate role icon
  const getRoleIcon = (role?: string) => {
    const r = (role || "").toUpperCase();
    if (r.includes("YOUTUBE") || r.includes("STREAMER") || r.includes("CREATOR") || r.includes("VIDEO") || r.includes("EDITOR")) {
      return <Video className="h-3.5 w-3.5 text-purple-400" />;
    }
    if (r.includes("COMMUNITY") || r.includes("DISCORD") || r.includes("STAFF") || r.includes("ARBITER") || r.includes("DESIGNER")) {
      return <Users className="h-3.5 w-3.5 text-emerald-400" />;
    }
    if (r.includes("IGL") || r.includes("CAPTAIN")) {
      return <Shield className="h-3.5 w-3.5 text-[#fc8100]" />;
    }
    if (r.includes("RUSHER") || r.includes("FRAGGER")) {
      return <Zap className="h-3.5 w-3.5 text-[#fc8100]" />;
    }
    if (r.includes("SNIPER")) {
      return <Crosshair className="h-3.5 w-3.5 text-[#fc8100]" />;
    }
    return <Target className="h-3.5 w-3.5 text-[#fc8100]" />;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#fc8100] selection:text-black w-full max-w-full overflow-x-hidden">
      <SEO
        title="MG ESPORTS Fan Awards Voting | Vote for MVP of the Season"
        description="Cast your vote for the MVP of the season, top fraggers, and community awards in official MG ESPORTS fan polls."
        canonicalPath="/voting"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Voting", item: "/voting" },
        ]}
      />

      {/* Hero Section */}
      <PageHero
        badge="MG ESPORTS ANNUAL AWARDS"
        title="COMMUNITY & CREATOR"
        titleHighlight="AWARDS 2026"
        subtitle="Voting is for all: recognize the championship players, viral content creators, and dedicated community heroes who power the MG legacy."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="h-10 w-10 text-[#fc8100] animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
              Loading award categories and nominees...
            </p>
          </div>
        ) : !events || events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-[#0C0C10] rounded-3xl border border-white/5 p-8 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-[#fc8100]">
              <Trophy className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-wider">
              No Active Voting Polls
            </h3>
            <p className="text-sm text-gray-400 font-body">
              The clan awards polls are currently closed or in preparation. Check back soon for the next voting season!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ======================================================== */}
            {/* 1. INTERACTIVE AWARD SECTION / CATEGORY TABS SELECTOR */}
            {/* ======================================================== */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#fc8100] block">
                    AWARD SECTIONS & CATEGORIES
                  </span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
                    Select Voting Category
                  </h2>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  You can cast 1 verified vote in <strong className="text-white">each section</strong>
                </span>
              </div>

              {/* Category Pills Slider / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {events.map((ev) => {
                  const isCurrent = ev.id === activeEvent?.id;
                  const hasVoted = Boolean(ev.userVotingStatus?.hasVoted);
                  const catInfo = getCategoryInfo(ev.category, ev.title);
                  const Icon = catInfo.icon;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        setActiveEventId(ev.id);
                      }}
                      className={`group relative text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isCurrent
                          ? `bg-gradient-to-r from-[#171720] via-[#101015] to-[#0A0A0D] ${catInfo.activeBorder} ${catInfo.glow} shadow-xl`
                          : "bg-[#0A0A0E] border-white/10 hover:border-white/20 hover:bg-[#121218]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isCurrent ? "bg-[#fc8100] text-black border-[#fc8100]" : "bg-white/5 text-gray-400 border-white/10 group-hover:text-white"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 ${catInfo.chipColor}`}>
                              {catInfo.label}
                            </span>
                            <h3 className="font-display font-black text-sm sm:text-base text-white uppercase tracking-wider line-clamp-1 group-hover:text-[#fc8100] transition-colors">
                              {ev.title}
                            </h3>
                          </div>
                        </div>

                        {/* Status Checkmark */}
                        <div className="shrink-0">
                          {hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                              <CheckCircle2 className="h-3 w-3" />
                              VOTED
                            </span>
                          ) : ev.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-black bg-[#fc8100]/20 text-[#fc8100] border border-[#fc8100]/40 uppercase">
                              OPEN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-gray-500/20 text-gray-400 border border-gray-500/40 uppercase">
                              CLOSED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mt-3 pt-2.5 border-t border-white/5">
                        <span>{ev.nominees.length} Nominees</span>
                        <span className="flex items-center gap-1 text-[#fc8100] group-hover:translate-x-0.5 transition-transform">
                          {isCurrent ? "Active Section" : "Switch to Vote"}
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. ACTIVE SECTION BANNER & COUNTDOWN TIMER */}
            {/* ======================================================== */}
            {activeEvent && (
              <motion.div
                key={activeEvent.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl bg-gradient-to-r from-[#14141A] via-[#0E0E12] to-[#0A0A0E] border border-[#fc8100]/35 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(252, 129, 0,0.1)] overflow-hidden"
              >
                {/* Gold neon top glow line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fc8100] to-transparent" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* Left: Event Details */}
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      {activeEvent.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 uppercase tracking-wider">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          LIVE SECTION OPEN
                        </span>
                      ) : activeEvent.isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-rose-500/15 text-rose-400 border border-rose-500/35 uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" />
                          VOTING CONCLUDED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-amber-500/15 text-amber-400 border border-amber-500/35 uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          UPCOMING POLL
                        </span>
                      )}

                      <span className="text-xs font-mono text-gray-400 uppercase tracking-widest px-2.5 py-0.5 rounded bg-black/40 border border-white/10">
                        {activeEvent.nominees.length} NOMINEES REGISTERED
                      </span>
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-wider mb-2">
                      {activeEvent.title}
                    </h2>

                    {activeEvent.description && (
                      <p className="text-sm sm:text-base text-gray-300 font-body leading-relaxed max-w-xl">
                        {activeEvent.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Real-time Countdown Timer */}
                  {activeEvent.isActive && (
                    <div className="bg-black/60 rounded-2xl border border-white/10 p-4 sm:p-5 backdrop-blur-md shrink-0">
                      <span className="text-[10px] font-mono text-[#fc8100] uppercase tracking-[0.2em] block mb-2 text-center">
                        POLL CLOSES IN
                      </span>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-[#141419] px-2.5 py-2 rounded-xl border border-white/5">
                          <span className="font-display font-black text-xl sm:text-2xl text-white block">
                            {timeLeft.days.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase">DAYS</span>
                        </div>
                        <div className="bg-[#141419] px-2.5 py-2 rounded-xl border border-white/5">
                          <span className="font-display font-black text-xl sm:text-2xl text-white block">
                            {timeLeft.hours.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase">HOURS</span>
                        </div>
                        <div className="bg-[#141419] px-2.5 py-2 rounded-xl border border-white/5">
                          <span className="font-display font-black text-xl sm:text-2xl text-white block">
                            {timeLeft.minutes.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase">MINS</span>
                        </div>
                        <div className="bg-[#141419] px-2.5 py-2 rounded-xl border border-white/5">
                          <span className="font-display font-black text-xl sm:text-2xl text-[#fc8100] block">
                            {timeLeft.seconds.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase">SECS</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Notification Banners */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-body shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <span className="font-semibold">{successMessage}</span>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-body shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verified Voted Confirmation State for Active Section */}
            {hasVotedCurrent && votedNomineeCurrent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#fc8100]/15 via-[#131317] to-[#0A0A0D] border border-[#fc8100]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_35px_rgba(252, 129, 0,0.15)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fc8100] text-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(252, 129, 0,0.4)]">
                    <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#fc8100]">
                        OFFICIALLY RECORDED IN THIS SECTION
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-heading font-black uppercase">
                        VERIFIED VOTE
                      </span>
                    </div>
                    <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-wider">
                      You voted for {votedNomineeCurrent.name || votedNomineeCurrent.player?.ign}
                    </h3>
                    <p className="text-xs text-gray-400 font-body">
                      Your vote is locked in for this category. You can also vote in the other sections above!
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block">
                    Candidate Affiliation
                  </span>
                  <span className="font-heading font-black text-sm text-[#fc8100] uppercase">
                    {votedNomineeCurrent.platform || votedNomineeCurrent.team || "MG ESPORTS"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* 3. NOMINEES MATRIX (PLAYERS, CREATORS, COMMUNITY) */}
            {/* ======================================================== */}
            {activeEvent && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#fc8100] block">
                      OFFICIAL NOMINEES
                    </span>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                      Select Your Choice
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    Click a card to pick your candidate
                  </span>
                </div>

                {/* Nominees Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {activeEvent.nominees.map((nominee, index) => {
                    const isSelected = selectedNomineeId === nominee.id;
                    const isUserVotedThis = activeEvent.userVotingStatus?.votedNomineeId === nominee.id;
                    const candidateName = nominee.name || nominee.player?.ign || "Candidate";
                    const candidateRole = nominee.role || nominee.player?.role || "CREATOR";
                    const candidateOrg = nominee.platform || nominee.team || nominee.player?.team || "MG ESPORTS";
                    const candidateBio = nominee.bio || nominee.player?.featuredQuote || nominee.player?.about || "";
                    const imgUrl =
                      nominee.imageUrl ||
                      nominee.player?.avatarUrl ||
                      nominee.player?.image ||
                      "/players/player-beast.jpg";

                    return (
                      <motion.div
                        key={nominee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.06 }}
                        whileHover={!hasVotedCurrent && activeEvent.isActive ? { y: -6 } : {}}
                        onClick={() => {
                          if (!hasVotedCurrent && activeEvent.isActive) {
                            setSelectedNomineeId(nominee.id);
                            setErrorMessage(null);
                          }
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            if (!hasVotedCurrent && activeEvent.isActive) {
                              setSelectedNomineeId(nominee.id);
                              setErrorMessage(null);
                            }
                          }
                        }}
                        className={`group relative flex flex-col justify-between rounded-2xl transition-all duration-300 p-4 sm:p-5 overflow-hidden cursor-pointer outline-none ${
                          isSelected
                            ? "bg-gradient-to-b from-[#181822] via-[#0E0E14] to-[#07070A] border-2 border-[#fc8100] shadow-[0_0_35px_rgba(252, 129, 0,0.35)]"
                            : "bg-gradient-to-b from-[#141418] via-[#0C0C0E] to-[#070709] border border-white/10 hover:border-white/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
                        }`}
                      >
                        {/* Top Gold Accent Strip */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
                            isSelected
                              ? "bg-[#fc8100] opacity-100 shadow-[0_0_12px_rgba(252, 129, 0,0.8)]"
                              : "bg-gradient-to-r from-transparent via-[#fc8100] to-transparent opacity-0 group-hover:opacity-60"
                          }`}
                        />

                        <div>
                          {/* Card Header: Role & Radio Selector */}
                          <div className="flex items-center justify-between mb-3 z-10">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-[10px] font-heading font-bold uppercase tracking-wider text-gray-300">
                              {getRoleIcon(candidateRole)}
                              <span className="line-clamp-1">{candidateRole}</span>
                            </div>

                            {/* Radio Checkmark Circle */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border shrink-0 ${
                                isSelected
                                  ? "bg-[#fc8100] border-[#fc8100] text-black shadow-[0_0_12px_rgba(252, 129, 0,0.5)]"
                                  : "border-white/20 bg-black/50 text-transparent"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                            </div>
                          </div>

                          {/* Candidate Portrait Visual */}
                          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/70 border border-white/5 mb-4 group-hover:border-[#fc8100]/40 transition-all shadow-inner">
                            <img
                              src={imgUrl}
                              alt={`${candidateName} - Nominee`}
                              className="h-full w-full object-cover object-top contrast-105 group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-black/20 to-transparent opacity-90" />

                            {/* Selected or Voted Label */}
                            {isUserVotedThis ? (
                              <div className="absolute bottom-2.5 left-3 right-3 bg-emerald-500 text-black font-heading font-black text-[10px] uppercase tracking-wider py-1 rounded-md text-center shadow-lg">
                                YOUR CHOICE
                              </div>
                            ) : isSelected ? (
                              <div className="absolute bottom-2.5 left-3 right-3 bg-[#fc8100] text-black font-heading font-black text-[10px] uppercase tracking-wider py-1 rounded-md text-center shadow-lg">
                                SELECTED
                              </div>
                            ) : null}
                          </div>

                          {/* Candidate Identity */}
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="font-display font-black text-xl text-white uppercase tracking-wider group-hover:text-[#fc8100] transition-colors line-clamp-1">
                                {candidateName}
                              </h4>
                              <span className="text-[10px] font-mono text-[#fc8100] uppercase shrink-0">
                                {candidateOrg}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-body line-clamp-1">{candidateRole}</p>
                          </div>

                          {/* Candidate Quote / Bio */}
                          {candidateBio && (
                            <p className="mt-3 text-[11px] text-gray-400 font-body line-clamp-2 leading-relaxed italic border-l border-[#fc8100]/40 pl-2">
                              "{candidateBio}"
                            </p>
                          )}
                        </div>

                        {/* Live Results Bar (if enabled) */}
                        {nominee.percentage !== undefined && (
                          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-gray-400">VOTE SHARE</span>
                              <span className="font-bold text-[#fc8100]">{nominee.percentage}%</span>
                            </div>
                            <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-[#fc8100] to-[#e07200] h-full rounded-full transition-all duration-700"
                                style={{ width: `${nominee.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* ======================================================== */}
                {/* 4. FLOATING STICKY VOTE ACTION HUD DOCK */}
                {/* ======================================================== */}
                <div className="sticky bottom-6 z-40 pt-4">
                  <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-[#0B0B0F]/95 backdrop-blur-2xl border border-[#fc8100]/40 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(252, 129, 0,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Selected Candidate Preview */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {selectedNominee ? (
                          <img
                            src={
                              selectedNominee.imageUrl ||
                              selectedNominee.player?.avatarUrl ||
                              selectedNominee.player?.image ||
                              "/players/player-beast.jpg"
                            }
                            alt={selectedNominee.name || "Candidate"}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <Vote className="h-6 w-6 text-[#fc8100]" />
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 block">
                          SELECTION • {activeEvent.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-lg text-white uppercase tracking-wider">
                            {selectedNominee
                              ? selectedNominee.name || selectedNominee.player?.ign
                              : "NO CANDIDATE SELECTED"}
                          </span>
                          {selectedNominee && (
                            <span className="text-xs font-mono text-[#fc8100]">
                              ({selectedNominee.role || "NOMINEE"})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex items-center gap-3">
                      {!isAuthenticated ? (
                        <button
                          type="button"
                          onClick={openLogin}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc8100] to-[#e07200] text-black font-heading font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(252, 129, 0,0.4)] transition-all cursor-pointer"
                        >
                          <Lock className="h-4 w-4" />
                          LOGIN TO VOTE
                        </button>
                      ) : hasVotedCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-gray-400 font-heading font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-white/10"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          VOTED IN THIS CATEGORY
                        </button>
                      ) : !activeEvent.isActive ? (
                        <button
                          type="button"
                          disabled
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-gray-400 font-heading font-bold text-xs uppercase tracking-wider cursor-not-allowed"
                        >
                          POLL CONCLUDED
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCastVote}
                          disabled={!selectedNomineeId || submitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#fc8100] via-[#FFD54F] to-[#e07200] text-black font-heading font-black text-xs uppercase tracking-wider hover:shadow-[0_0_30px_rgba(252, 129, 0,0.5)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              RECORDING VOTE...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 fill-black" />
                              CONFIRM & CAST VOTE
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
