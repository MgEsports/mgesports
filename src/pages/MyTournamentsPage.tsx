import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  UserPlus,
  ExternalLink,
  CreditCard,
  RefreshCw,
  Check,
  X,
  Copy,
  Key,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/useModals";
import { getMyTournaments, submitPayment, respondToInvitation, tournamentsApi, getMyRoomAccess } from "../api/tournaments";
import { ManageTeamModal } from "../components/modals/ManageTeamModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { SEO } from "../components/common/SEO";

interface RegisteredTournamentItem {
  id: string;
  tournamentId?: string;
  tournament: {
    id: string;
    title: string;
    slug?: string;
    game: string;
    gameMode?: string;
    entryFee?: any;
    feeAmount?: number;
    prizePool?: any;
    startDate?: string;
    date?: string;
    startTime?: string;
    bannerUrl?: string;
    bannerImage?: string;
    rosterLockDate?: string;
    contactInfo?: string;
    status: string;
    entryFeeType?: string;
    checkInEnabled?: boolean;
    checkInStartTime?: string | null;
    checkInEndTime?: string | null;
  };
  teamId?: string;
  teamName?: string;
  teamTag?: string;
  teamLogo?: string;
  isLeader?: boolean;
  isInvitationPending?: boolean;
  userInvitationId?: string | null;
  role?: string;
  isFeePaidByLeader?: boolean;
  entryFeeType?: string;
  leader?: {
    id: string;
    username: string;
    ign?: string;
    fullName?: string;
  };
  team?: {
    id: string;
    name?: string;
    teamName?: string;
    tag?: string;
    leader?: any;
    members?: Array<{
      id: string;
      userId: string;
      role: string;
      ign?: string;
      gameUid?: string;
      invitationStatus?: string;
      user?: {
        id: string;
        username: string;
        ign?: string;
        gameUid?: string;
        avatarUrl?: string;
      };
    }>;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    ign?: string;
    gameUid?: string;
    invitationStatus?: string;
    user?: {
      id: string;
      username: string;
      ign?: string;
      gameUid?: string;
      avatarUrl?: string;
    };
  }>;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  confirmedAt?: string;
  registration?: {
    id: string;
    registrationNumber?: string;
    status: string;
    paymentStatus: string;
    slotNumber?: number;
    payment?: {
      id: string;
      amount?: number;
      status: string;
      utr?: string;
      rejectionReason?: string;
    };
    createdAt?: string;
  } | null;
  payment?: {
    id: string;
    amount?: number;
    status: string;
    utr?: string;
    rejectionReason?: string;
  };
}

export const MyTournamentsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useModals();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registrations, setRegistrations] = useState<RegisteredTournamentItem[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
    members: any[];
    rosterLockDate?: string;
    maxPlayers?: number;
  } | null>(null);

  // Re-submit payment modal state
  const [resubmitReg, setResubmitReg] = useState<RegisteredTournamentItem | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Invitation response state
  const [respondingInvId, setRespondingInvId] = useState<string | null>(null);

  // Check-In state
  const [checkingInTeamId, setCheckingInTeamId] = useState<string | null>(null);

  // Matches & Room Credentials state
  const [fetchingMatches, setFetchingMatches] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCheckIn = async (tournamentId: string, teamId: string) => {
    setCheckingInTeamId(teamId);
    try {
      await tournamentsApi.checkInTeam(tournamentId, teamId);
      await fetchRegistrations();
    } catch (err: any) {
      alert(err.message || "Failed to check in squad.");
    } finally {
      setCheckingInTeamId(null);
    }
  };

  const [roomAccessByTournament, setRoomAccessByTournament] = useState<Record<string, any>>({});
  const [selectedRoundByTournament, setSelectedRoundByTournament] = useState<Record<string, string>>({});

  const fetchRoomAccess = async (tournamentsList: any[]) => {
    const map: Record<string, any> = {};
    await Promise.all(
      tournamentsList.map(async (item) => {
        const tId = item.tournament?.id || item.tournamentId;
        const slug = item.tournament?.slug;
        const targetId = tId || slug;
        if (targetId) {
          try {
            const res: any = await getMyRoomAccess(targetId);
            const data =
              res?.data !== undefined
                ? res.data
                : res?.roomId !== undefined || res?.hasAccess !== undefined || res?.isRegistered
                ? res
                : null;
            if (data) {
              if (tId) map[tId] = data;
              if (slug) map[slug] = data;
              if (item.tournament?.id) map[item.tournament.id] = data;
              if (item.tournamentId) map[item.tournamentId] = data;
              if (item.id) map[item.id] = data;
            }
          } catch (e) {}
        }
      })
    );
    setRoomAccessByTournament((prev) => ({ ...prev, ...map }));
  };

  const handleLoadMatches = async (tournamentId: string) => {
    setFetchingMatches((prev) => ({ ...prev, [tournamentId]: true }));
    try {
      const roomRes: any = await getMyRoomAccess(tournamentId);
      const data =
        roomRes?.data !== undefined
          ? roomRes.data
          : roomRes?.roomId !== undefined || roomRes?.hasAccess !== undefined || roomRes?.isRegistered
          ? roomRes
          : null;
      if (data) {
        setRoomAccessByTournament((prev) => ({
          ...prev,
          [tournamentId]: data,
          ...(data.tournamentId ? { [data.tournamentId]: data } : {}),
        }));
      }
    } catch (err) {
      console.error("Failed to load match credentials:", err);
    } finally {
      setFetchingMatches((prev) => ({ ...prev, [tournamentId]: false }));
    }
  };

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchRegistrations = async () => {
    try {
      setRefreshing(true);
      const res = await getMyTournaments();
      if (Array.isArray(res)) {
        setRegistrations(res);
        fetchRoomAccess(res);
      }
    } catch (err) {
      console.error("Failed to fetch user tournaments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleResubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitReg || !utrInput.trim()) return;

    setSubmittingPayment(true);
    setPaymentError("");
    try {
      const regId = resubmitReg.registration?.id || resubmitReg.id;
      const amount =
        resubmitReg.tournament.feeAmount ??
        (typeof resubmitReg.tournament.entryFee === "number"
          ? resubmitReg.tournament.entryFee
          : parseInt(String(resubmitReg.tournament.entryFee).replace(/\D/g, ""), 10) || 0);

      const res = await submitPayment(regId, {
        utr: utrInput.trim(),
        amount,
      });

      if (res?.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setResubmitReg(null);
          setPaymentSuccess(false);
          setUtrInput("");
          fetchRegistrations();
        }, 1500);
      } else {
        setPaymentError(res.message || "Failed to submit payment UTR.");
      }
    } catch (err: any) {
      setPaymentError(err.message || "Error submitting payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRespondInvitation = async (invitationId: string, action: "ACCEPT" | "REJECT") => {
    try {
      setRespondingInvId(invitationId);
      const res = await respondToInvitation(invitationId, action);
      if (res?.success) {
        await fetchRegistrations();
      } else {
        alert(res?.message || `Failed to ${action.toLowerCase()} invitation`);
      }
    } catch (err: any) {
      alert(err?.message || `Failed to ${action.toLowerCase()} invitation`);
    } finally {
      setRespondingInvId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <SEO title="My Tournaments | MG ESPORTS Player Hub" noindex nofollow />
        <div className="w-16 h-16 rounded-2xl bg-[#fc8100]/10 border border-[#fc8100]/30 flex items-center justify-center mb-6 text-[#fc8100] shadow-[0_0_20px_rgba(252, 129, 0,0.2)]">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white uppercase tracking-wider mb-3">
          MY <span className="text-[#fc8100]">TOURNAMENTS</span>
        </h1>
        <p className="text-gray-400 max-w-md mb-8 text-sm sm:text-base">
          Sign in with your MG Athlete profile to view your registered tournaments, manage team rosters, track payment verifications, and view match schedules.
        </p>
        <button
          onClick={openLogin}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#fc8100] to-[#e07200] text-black font-heading font-black tracking-widest text-sm uppercase shadow-[0_0_25px_rgba(252, 129, 0,0.35)] hover:scale-105 transition-all cursor-pointer"
        >
          LOGIN TO ATHLETE PASSPORT
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      <SEO title="My Tournaments | MG ESPORTS Player Hub" noindex nofollow />
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#fc8100] uppercase tracking-widest mb-1.5">
            <Trophy className="w-4 h-4" />
            <span>PLAYER ATHLETE DASHBOARD</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-wider">
            MY <span className="text-[#fc8100]">TOURNAMENTS</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
            Track squad rosters, entry confirmations, UPI payment verification status, and room credentials for all registered tournaments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegistrations}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-heading text-xs tracking-wider uppercase transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#fc8100]" : ""}`} />
            <span>{refreshing ? "REFRESHING..." : "REFRESH STATUS"}</span>
          </button>
          <Link
            to="/tournaments"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fc8100] hover:bg-[#FFE082] text-black font-heading font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(252, 129, 0,0.25)]"
          >
            <span>EXPLORE TOURNAMENTS</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-2 border-[#fc8100] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-gray-400 uppercase tracking-widest">LOADING TOURNAMENT DATA...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-20 text-center bg-[#0C0C0F]/60 border border-white/5 rounded-3xl mt-8 p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-500">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl text-white uppercase tracking-wider mb-2">
            NO REGISTERED TOURNAMENTS
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            You haven't joined any tournaments yet. Join our elite weekly and monthly esports events to compete for real cash prizes.
          </p>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#fc8100] text-black font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#FFE082] transition-colors"
          >
            <span>BROWSE UPCOMING EVENTS</span>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {registrations.map((item) => {
            const tournament = item.tournament || ({} as any);
            const teamObj = item.team;
            const teamId = item.teamId || teamObj?.id || item.id;
            const squadName = item.teamName || teamObj?.name || teamObj?.teamName || "UNNAMED";
            const squadTag = item.teamTag || teamObj?.tag;
            const membersList = item.members || teamObj?.members || [];

            const isInvitationPending =
              Boolean(item.isInvitationPending) ||
              item.status === "INVITATION_PENDING" ||
              item.role === "INVITED";

            const invitationId = item.userInvitationId;

            // Registration / payment status reconciliation
            const reg = item.registration || (item as any);
            const regStatus = isInvitationPending
              ? "INVITATION_PENDING"
              : reg?.status || item.status || "PENDING";
            const paymentStatus =
              reg?.paymentStatus || item.paymentStatus || reg?.payment?.status || item.payment?.status;

            const isConfirmed =
              regStatus === "CONFIRMED" ||
              regStatus === "APPROVED" ||
              item.status === "CONFIRMED" ||
              item.status === "APPROVED" ||
              paymentStatus === "VERIFIED" ||
              paymentStatus === "PAID" ||
              paymentStatus === "COMPLETED" ||
              Boolean(item.isFeePaidByLeader);

            const isPaymentUnderReview =
              !isConfirmed &&
              (regStatus === "PAYMENT_UNDER_REVIEW" ||
                paymentStatus === "UNDER_REVIEW" ||
                paymentStatus === "PENDING_VERIFICATION");

            const isRejected =
              !isConfirmed &&
              (regStatus === "PAYMENT_FAILED" ||
                paymentStatus === "REJECTED" ||
                reg?.payment?.status === "REJECTED" ||
                item.payment?.status === "REJECTED");

            const isWaitlisted =
              Boolean(reg?.isWaitlisted) ||
              regStatus === "WAITLISTED" ||
              item.status === "WAITLISTED";
            const waitlistPriority = reg?.waitlistPriority || (item as any).waitlistPriority || 1;

            const isCheckInActive = Boolean(
              tournament.checkInEnabled &&
              (!tournament.checkInStartTime || new Date() >= new Date(tournament.checkInStartTime)) &&
              (!tournament.checkInEndTime || new Date() <= new Date(tournament.checkInEndTime))
            );

            const isCheckedIn =
              reg?.checkInStatus === "CHECKED_IN" ||
              (item as any).checkInStatus === "CHECKED_IN" ||
              (item as any).isCheckedIn;

            const isPending = !isInvitationPending && !isConfirmed && !isPaymentUnderReview && !isRejected && !isWaitlisted;

            // Determine if current logged-in user is Leader of this team
            const currentMember = membersList.find((m) => m.userId === user?.id);
            const isLeader =
              item.isLeader !== undefined
                ? item.isLeader
                : currentMember?.role === "LEADER" || (item.leader && item.leader.id === user?.id);

            // Roster lock check
            const isRosterLocked = tournament.rosterLockDate
              ? new Date() > new Date(tournament.rosterLockDate)
              : false;

            // Fee info
            const feeType = tournament.entryFeeType || item.entryFeeType || "PER_TEAM";
            const isPerTeam = feeType === "PER_TEAM";
            const leaderName =
              item.leader?.ign ||
              item.leader?.username ||
              item.leader?.fullName ||
              teamObj?.leader?.ign ||
              teamObj?.leader?.username ||
              "Team Leader";

            const rawDate = tournament.startDate || tournament.date || "";
            const formattedTournamentDate = formatDate(rawDate, {
              includeTime: true,
              timeStr: tournament.startTime,
            });

            const displayEntryFee = formatCurrency(
              tournament.feeAmount !== undefined ? tournament.feeAmount : tournament.entryFee
            );
            const displayPrizePool = formatCurrency(tournament.prizePool);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#0C0C0F]/90 backdrop-blur-xl overflow-hidden hover:border-[#fc8100]/40 transition-all duration-300 shadow-xl"
              >
                {/* Status Bar */}
                <div
                  className={`px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                    isInvitationPending
                      ? "bg-[#fc8100]/15 border-[#fc8100]/30 text-[#fc8100]"
                      : isWaitlisted
                      ? "bg-amber-500/15 border-amber-500/30 text-[#fc8100]"
                      : isConfirmed
                      ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                      : isPaymentUnderReview
                      ? "bg-[#fc8100]/10 border-[#fc8100]/30 text-[#fc8100]"
                      : isRejected
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider">
                    {isInvitationPending && <UserPlus className="w-4 h-4 shrink-0 animate-pulse text-[#fc8100]" />}
                    {isWaitlisted && <Clock className="w-4 h-4 shrink-0 text-[#fc8100]" />}
                    {!isWaitlisted && isConfirmed && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />}
                    {isPaymentUnderReview && <Clock className="w-4 h-4 shrink-0 animate-pulse" />}
                    {isRejected && <XCircle className="w-4 h-4 shrink-0" />}
                    {isPending && <AlertCircle className="w-4 h-4 shrink-0" />}

                    <span>
                      {isInvitationPending && "TEAM INVITATION PENDING — ACTION REQUIRED"}
                      {isWaitlisted && `PRIORITY WAITLIST — POSITION #${waitlistPriority}`}
                      {!isWaitlisted && isConfirmed && (isCheckedIn ? "SLOT CONFIRMED — CHECKED IN ✓" : "SLOT CONFIRMED — REGISTRATION COMPLETE")}
                      {isPaymentUnderReview && "PAYMENT UNDER REVIEW — VERIFYING UTR"}
                      {isRejected && "PAYMENT REJECTED"}
                      {isPending && "REGISTRATION PENDING"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
                    <span>
                      REG ID: #{((reg?.registrationNumber || reg?.id || item.id) as string).slice(0, 8).toUpperCase()}
                    </span>
                    {item.createdAt && (
                      <>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Team Invitation Pending Action Bar */}
                {isInvitationPending && invitationId && (
                  <div className="px-5 py-4 bg-[#fc8100]/10 border-b border-[#fc8100]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#fc8100] text-black font-heading font-black text-[10px] uppercase tracking-wider">
                          INVITED TO SQUAD
                        </span>
                        <p className="font-heading font-bold text-sm text-white">
                          {leaderName} invited you to join <span className="text-[#fc8100]">{squadName}</span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-300">
                        {isPerTeam
                          ? "✓ Entry fee covered by Team Leader. No additional payment required from you."
                          : `Individual player entry fee applies: ${displayEntryFee}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={respondingInvId === invitationId}
                        onClick={() => handleRespondInvitation(invitationId, "ACCEPT")}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-heading font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{respondingInvId === invitationId ? "ACCEPTING..." : "ACCEPT INVITATION"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={respondingInvId === invitationId}
                        onClick={() => handleRespondInvitation(invitationId, "REJECT")}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 font-heading font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>DECLINE</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Main Body */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Tournament & Team Info */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[10px] uppercase font-bold">
                            {tournament.game || "ESPORTS"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#fc8100]/20 border border-[#fc8100]/30 text-[#fc8100] font-mono text-[10px] uppercase font-bold">
                            {tournament.gameMode || "SQUAD"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] uppercase font-bold">
                            {isPerTeam ? "PER TEAM FEE" : "PER PLAYER FEE"}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl text-white uppercase tracking-wider">
                          {tournament.title}
                        </h3>
                      </div>

                      <Link
                        to={`/tournaments/${tournament.slug || tournament.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#fc8100] hover:text-[#FFE082] uppercase transition-colors shrink-0"
                      >
                        <span>TOURNAMENT DETAILS</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Meta badges: Date, Fee, Prize */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                          <Calendar className="w-3 h-3 text-[#fc8100]" />
                          <span>START DATE</span>
                        </div>
                        <p className="font-heading font-bold text-xs text-white">
                          {formattedTournamentDate}
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                          <CreditCard className="w-3 h-3 text-[#fc8100]" />
                          <span>ENTRY FEE</span>
                        </div>
                        <p className="font-heading font-bold text-xs text-white">
                          {displayEntryFee}
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono uppercase mb-1">
                          <Trophy className="w-3 h-3 text-[#fc8100]" />
                          <span>PRIZE POOL</span>
                        </div>
                        <p className="font-heading font-bold text-xs text-[#fc8100]">
                          {displayPrizePool}
                        </p>
                      </div>
                    </div>

                    {/* Team Roster Preview */}
                    <div className="bg-black/50 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#fc8100]" />
                          <span className="font-heading font-bold text-xs text-white uppercase tracking-wider">
                            SQUAD: <span className="text-[#fc8100]">{squadName}</span>
                          </span>
                          {squadTag && (
                            <span className="text-[10px] font-mono text-gray-400">[{squadTag}]</span>
                          )}
                        </div>

                        {/* Manage Roster Action for Leader */}
                        {isLeader && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTeam({
                                id: teamId,
                                name: squadName,
                                members: membersList,
                                rosterLockDate: tournament.rosterLockDate,
                                maxPlayers: 6,
                              })
                            }
                            className="text-[11px] font-heading font-bold text-[#fc8100] hover:text-[#FFE082] uppercase flex items-center gap-1 cursor-pointer transition-colors bg-[#fc8100]/10 px-2.5 py-1 rounded-lg border border-[#fc8100]/30"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>{isRosterLocked ? "VIEW ROSTER" : "MANAGE ROSTER"}</span>
                          </button>
                        )}
                      </div>

                      {/* Members list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {membersList.map((m) => {
                          const ign = m.ign || m.user?.ign || m.user?.username || "Player";
                          const uid = m.gameUid || m.user?.gameUid;
                          const isMemPending = m.invitationStatus === "PENDING";

                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-[#fc8100]/10 border border-[#fc8100]/20 flex items-center justify-center font-display text-xs text-[#fc8100] shrink-0">
                                  {ign.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-heading font-bold text-xs text-white truncate">{ign}</p>
                                  {uid && (
                                    <p className="font-mono text-[9px] text-gray-400 truncate">UID: {uid}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isMemPending && (
                                  <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    INVITED
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                    m.role === "LEADER"
                                      ? "bg-[#fc8100]/20 text-[#fc8100] border border-[#fc8100]/30 font-bold"
                                      : "bg-white/10 text-gray-400"
                                  }`}
                                >
                                  {m.role}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rejection Notice if applicable */}
                    {isRejected && (
                      <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs">
                        <div className="flex items-center gap-2 font-bold mb-1 text-red-200">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>PAYMENT REJECTION REASON:</span>
                        </div>
                        <p className="font-mono text-[11px] mb-3">
                          {reg?.payment?.rejectionReason ||
                            item.payment?.rejectionReason ||
                            "UTR was invalid or payment could not be reconciled."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setResubmitReg(item);
                            setUtrInput(reg?.payment?.utr || item.payment?.utr || "");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          RESUBMIT VALID UTR / PAYMENT
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Room info & Status Callouts */}
                  <div className="lg:col-span-4 bg-black/60 rounded-2xl p-5 border border-white/10 space-y-4">
                    <h4 className="font-display text-base text-white uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#fc8100]" />
                      <span>MATCH ACCESS</span>
                    </h4>

                    {isInvitationPending ? (
                      <div className="p-3 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/20 text-xs text-[#fc8100] space-y-1">
                        <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5" /> SQUAD INVITATION
                        </p>
                        <p className="text-gray-300 text-[11px]">
                          Accept the team invitation above to join this tournament roster and receive room access.
                        </p>
                      </div>
                    ) : isWaitlisted ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-[#fc8100]/30 text-xs text-[#fc8100] space-y-2">
                        <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> PRIORITY WAITLIST #{waitlistPriority}
                        </p>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          All main tournament slots are filled. Your squad is queued at position #{waitlistPriority}. If a confirmed team forfeits, fails verification, or misses check-in, waitlisted teams are promoted in order.
                        </p>
                      </div>
                    ) : isConfirmed ? (
                      <div className="space-y-3">
                        {/* Check-In module if enabled */}
                        {tournament.checkInEnabled && (
                          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            isCheckedIn
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : isCheckInActive
                              ? "bg-[#fc8100]/10 border-[#fc8100]/30 text-[#fc8100]"
                              : "bg-white/5 border-white/10 text-gray-400"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-black uppercase tracking-wider flex items-center gap-1.5">
                                {isCheckedIn ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    CHECKED IN ✓
                                  </>
                                ) : isCheckInActive ? (
                                  <>
                                    <Clock className="w-4 h-4 text-[#fc8100] animate-pulse" />
                                    CHECK-IN WINDOW ACTIVE
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    CHECK-IN SCHEDULED
                                  </>
                                )}
                              </span>
                              {isCheckInActive && !isCheckedIn && isLeader && (
                                <button
                                  type="button"
                                  disabled={checkingInTeamId === teamId}
                                  onClick={() => handleCheckIn(tournament.id, teamId)}
                                  className="px-3 py-1.5 rounded-lg bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-black text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(252, 129, 0,0.3)] transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {checkingInTeamId === teamId ? "CHECKING IN..." : "CHECK IN SQUAD"}
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-300">
                              {isCheckedIn
                                ? "Squad arrival confirmed for official match contention."
                                : isCheckInActive
                                ? "Please check in your squad before the deadline to prevent slot forfeiture."
                                : `Check-in window opens: ${formatDate(tournament.checkInStartTime || rawDate, { includeTime: true })}`}
                            </p>
                          </div>
                        )}

                        {/* Room Credentials & Match Contender Module */}
                        {(() => {
                          const roomAccess =
                            (tournament?.id ? roomAccessByTournament[tournament.id] : null) ||
                            (tournament?.slug ? roomAccessByTournament[tournament.slug] : null) ||
                            (item?.id ? roomAccessByTournament[item.id] : null) ||
                            ((item as any)?.tournamentId ? roomAccessByTournament[(item as any).tournamentId] : null) ||
                            (teamId ? roomAccessByTournament[teamId] : null);
                          if (!roomAccess) {
                            return (
                              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-mono text-gray-400 uppercase">CUSTOM ROOM CREDENTIALS</p>
                                  <button
                                    type="button"
                                    onClick={() => handleLoadMatches(tournament.id || tournament.slug || item.id)}
                                    disabled={fetchingMatches[tournament.id]}
                                    className="text-[10px] font-heading font-bold text-[#fc8100] hover:underline uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${fetchingMatches[tournament.id] ? "animate-spin" : ""}`} />
                                    <span>{fetchingMatches[tournament.id] ? "Checking..." : "Refresh"}</span>
                                  </button>
                                </div>
                                <div className="text-center py-2">
                                  <p className="font-mono font-bold text-xs text-[#fc8100] tracking-widest">
                                    REVEALING 15 MINS BEFORE START
                                  </p>
                                  <p className="text-[10px] font-mono text-gray-400 mt-1">
                                    Room credentials will be posted here and broadcasted before match lobby opens.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // Derive selected round data if user has multiple rounds/divisions
                          const selRoundId = selectedRoundByTournament[tournament.id] || roomAccess.roundId;
                          let currentRound = roomAccess;
                          if (roomAccess.allAssignedRounds?.length) {
                            const found =
                              roomAccess.allAssignedRounds.find((r: any) => r.roundId === selRoundId) ||
                              roomAccess.allAssignedRounds.find((r: any) => Boolean(r.roomId)) ||
                              roomAccess.allAssignedRounds[0];
                            if (found) {
                              const isPub = Boolean(found.isPublished || found.credentialsPublished || found.roomId);
                              const isElim = found.teamStatus === "ELIMINATED" || found.status === "ELIMINATED" || Boolean(found.isEliminated);
                              currentRound = {
                                ...roomAccess,
                                ...found,
                                hasAccess: found.hasAccess !== undefined ? Boolean(found.hasAccess) : (isPub && !isElim),
                                isEliminated: isElim,
                              };
                            }
                          }

                          const hasRoomCredentials = Boolean(
                            (currentRound.hasAccess || Boolean(currentRound.roomId)) &&
                            !currentRound.isEliminated
                          );

                          return (
                            <div className="space-y-2">
                              {/* Round / Division Selector Tabs if squad has multiple participations */}
                              {roomAccess.allAssignedRounds && roomAccess.allAssignedRounds.length > 1 && (
                                <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex flex-wrap items-center gap-1">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase mr-1 font-bold">
                                    DIVISION:
                                  </span>
                                  {roomAccess.allAssignedRounds.map((rnd: any) => {
                                    const isSel = (selRoundId || roomAccess.roundId) === rnd.roundId;
                                    const isElim = rnd.status === "ELIMINATED" || rnd.teamStatus === "ELIMINATED";
                                    return (
                                      <button
                                        key={rnd.roundId}
                                        type="button"
                                        onClick={() =>
                                          setSelectedRoundByTournament((prev) => ({
                                            ...prev,
                                            [tournament.id]: rnd.roundId,
                                          }))
                                        }
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                          isSel
                                            ? "bg-[#fc8100] text-black font-black"
                                            : isElim
                                            ? "bg-red-950/40 text-red-300 border border-red-500/20"
                                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                                        }`}
                                      >
                                        <span>{rnd.roundName}</span>
                                        {isElim ? (
                                          <span className="text-[8px] text-red-300">✕</span>
                                        ) : (
                                          <span className="text-[8px] opacity-80">#{rnd.slotNumber}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {currentRound.isEliminated ? (
                                <div className="p-4 rounded-xl bg-red-950/40 border-2 border-red-500/50 space-y-2 text-center">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-heading font-black text-xs uppercase tracking-wider border border-red-500/30">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>STAGE CONCLUDED</span>
                                  </div>
                                  <p className="font-heading font-bold text-white text-xs uppercase">
                                    {currentRound.roundName} — Eliminated
                                  </p>
                                  <p className="text-[11px] text-gray-300 font-body leading-relaxed">
                                    Your squad did not qualify from {currentRound.roundName || "the previous round"}. Credentials for next stages are closed.
                                  </p>
                                </div>
                              ) : hasRoomCredentials ? (
                                <div className="p-4 rounded-xl bg-gradient-to-b from-[#fc8100]/15 via-black/80 to-black border-2 border-[#fc8100]/60 shadow-[0_0_25px_rgba(252, 129, 0,0.15)] space-y-3">
                                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                                    <div className="flex items-center gap-1.5 text-[#fc8100] font-heading font-black text-xs uppercase tracking-wider">
                                      <Key className="w-3.5 h-3.5" />
                                      <span>{currentRound.roundName || "ROUND 1"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleLoadMatches(tournament.id)}
                                        disabled={fetchingMatches[tournament.id]}
                                        className="text-[10px] font-heading font-bold text-[#fc8100] hover:underline uppercase flex items-center gap-1 cursor-pointer"
                                        title="Refresh Room Credentials"
                                      >
                                        <RefreshCw className={`w-3 h-3 ${fetchingMatches[tournament.id] ? "animate-spin" : ""}`} />
                                        <span>{fetchingMatches[tournament.id] ? "Updating..." : "Refresh"}</span>
                                      </button>
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[9px] font-bold uppercase animate-pulse">
                                        ROOM LIVE ✓
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 rounded-lg bg-black/80 border border-[#fc8100]/40 flex items-center justify-between text-xs font-mono">
                                    <span className="text-gray-400 uppercase text-[10px]">ASSIGNED SQUAD SLOT:</span>
                                    <span className="px-2 py-0.5 rounded bg-[#fc8100] text-black font-black text-xs font-mono">
                                      SLOT #{currentRound.slotNumber}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-1">
                                      <span className="text-gray-400 text-[9px] uppercase block">ROOM ID:</span>
                                      <div className="flex items-center justify-between">
                                        <span className="text-white font-bold text-sm tracking-wider">{currentRound.roomId}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(`room_${tournament.id}`, currentRound.roomId)}
                                          className="p-1 rounded bg-[#fc8100]/10 hover:bg-[#fc8100] text-[#fc8100] hover:text-black transition-colors cursor-pointer"
                                          title="Copy Room ID"
                                        >
                                          {copiedKey === `room_${tournament.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-1">
                                      <span className="text-gray-400 text-[9px] uppercase block">PASSWORD:</span>
                                      <div className="flex items-center justify-between">
                                        <span className="text-white font-bold text-sm tracking-wider">{currentRound.roomPassword}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(`pass_${tournament.id}`, currentRound.roomPassword)}
                                          className="p-1 rounded bg-[#fc8100]/10 hover:bg-[#fc8100] text-[#fc8100] hover:text-black transition-colors cursor-pointer"
                                          title="Copy Password"
                                        >
                                          {copiedKey === `pass_${tournament.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-300 pt-1 border-t border-white/10">
                                    <span>MAP: <strong className="text-[#fc8100] uppercase">{currentRound.map || "BERMUDA"}</strong></span>
                                    <span>TIME: <strong className="text-white">{currentRound.roomTime || "AS SCHEDULED"}</strong></span>
                                  </div>

                                  {currentRound.notes && (
                                    <p className="text-[10px] font-mono text-gray-400 bg-white/5 p-1.5 rounded">
                                      📌 {currentRound.notes}
                                    </p>
                                  )}
                                </div>
                              ) : currentRound.isRegistered && currentRound.roundName ? (
                                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-xs uppercase text-amber-300 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{currentRound.roundName}</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-black/60 font-mono text-[9px] text-[#fc8100] font-bold border border-[#fc8100]/30">
                                      SLOT #{currentRound.slotNumber}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-300 leading-relaxed font-body">
                                    Your squad is assigned to <strong>{currentRound.roundName}</strong> at <strong>Slot #{currentRound.slotNumber}</strong>. Map: {currentRound.map || "BERMUDA"}.
                                  </p>
                                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-[#fc8100] text-center">
                                    🔒 Room credentials reveal 15 minutes before the match start time.
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-mono text-gray-400 uppercase">CUSTOM ROOM CREDENTIALS</p>
                                    <button
                                      type="button"
                                      onClick={() => handleLoadMatches(tournament.id)}
                                      disabled={fetchingMatches[tournament.id]}
                                      className="text-[10px] font-heading font-bold text-[#fc8100] hover:underline uppercase flex items-center gap-1 cursor-pointer"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${fetchingMatches[tournament.id] ? "animate-spin" : ""}`} />
                                      <span>{fetchingMatches[tournament.id] ? "Checking..." : "Refresh"}</span>
                                    </button>
                                  </div>
                                  <div className="text-center py-2">
                                    <p className="font-mono font-bold text-xs text-[#fc8100] tracking-widest">
                                      REVEALING 15 MINS BEFORE START
                                    </p>
                                    <p className="text-[10px] font-mono text-gray-400 mt-1">
                                      Room credentials will be posted here and broadcasted before match lobby opens.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : isPaymentUnderReview ? (
                      <div className="p-3 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/20 text-xs text-[#fc8100] space-y-2">
                        <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> VERIFICATION IN PROGRESS
                        </p>
                        <p className="text-gray-300 text-[11px]">
                          UTR submitted:{" "}
                          <span className="font-mono text-white font-bold">
                            {reg?.payment?.utr || item.payment?.utr || "Submitted"}
                          </span>
                          . Our admins verify manual UPI payments within 15-30 minutes.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 space-y-2">
                        <p className="font-bold text-white uppercase tracking-wider">PENDING VERIFICATION</p>
                        <p className="text-[11px]">
                          Complete payment submission to secure your spot before slots run out.
                        </p>
                      </div>
                    )}

                    {/* Support Discord / Contact */}
                    {tournament.contactInfo && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">COORDINATION</p>
                        <p className="text-xs text-gray-300 font-mono break-all">{tournament.contactInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Roster Management Modal */}
      {selectedTeam && (
        <ManageTeamModal
          isOpen={true}
          onClose={() => {
            setSelectedTeam(null);
            fetchRegistrations();
          }}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          initialMembers={selectedTeam.members}
          rosterLockDate={selectedTeam.rosterLockDate}
          maxPlayers={selectedTeam.maxPlayers || 6}
          onTeamUpdated={() => fetchRegistrations()}
        />
      )}

      {/* Resubmit Payment Modal */}
      {resubmitReg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0C0C0F] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl text-white uppercase tracking-wider mb-2">
              RESUBMIT UPI PAYMENT
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter the 12-digit UPI Reference / UTR number for your transaction of{" "}
              <span className="text-[#fc8100] font-bold">
                {formatCurrency(
                  resubmitReg.tournament.feeAmount ?? resubmitReg.tournament.entryFee
                )}
              </span>
              .
            </p>

            {paymentError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs mb-4">
                {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/40 text-green-300 text-xs mb-4">
                UTR resubmitted successfully! Reviewing...
              </div>
            )}

            <form onSubmit={handleResubmitPayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1">
                  12-DIGIT UPI REFERENCE / UTR *
                </label>
                <input
                  type="text"
                  required
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. 428190348291"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white font-mono text-sm focus:border-[#fc8100] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResubmitReg(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-heading font-bold uppercase cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !utrInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#fc8100] hover:bg-[#FFE082] text-black text-xs font-heading font-black uppercase cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? "SUBMITTING..." : "SUBMIT UTR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

