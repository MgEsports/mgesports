import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModals } from "../../context/useModals";
import { tournamentsApi, type SquadRegistrationInput } from "../../api/tournaments";
import { type Tournament } from "../../data/tournaments";
import { Modal } from "../common/Modal";
import {
  Users,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  Lock,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatCurrency } from "../../utils/formatters";

interface RegistrationStepperProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onSuccess?: (registrationData: any) => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export const TournamentRegistrationStepper: React.FC<RegistrationStepperProps> = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useModals();

  const [step, setStep] = useState<Step>(1);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [discordTag, setDiscordTag] = useState("");

  // Teammates state
  const [players, setPlayers] = useState<
    Array<{
      id?: string;
      name: string;
      ign: string;
      username?: string;
      role: string;
      email?: string;
      gameUid?: string;
      isCaptain?: boolean;
    }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Payment state
  const [utrNumber, setUtrNumber] = useState("");
  const [payerName, setPayerName] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Review & Confirmation state
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [registrationResult, setRegistrationResult] = useState<any | null>(null);
  const [qrImageError, setQrImageError] = useState(false);

  useEffect(() => {
    setQrImageError(false);
  }, [tournament?.id, tournament?.upiQrImage]);

  // Pre-fill Leader info from profile whenever modal opens or user logs in
  useEffect(() => {
    if (user) {
      setPayerName(user.fullName || user.ign || user.username || "");
      setWhatsapp(user.phone || "");
      setDiscordTag(user.discord || "");
      setPlayers([
        {
          id: user.id,
          name: user.fullName || user.ign || user.username || "Team Leader",
          ign: user.ign || user.username || "LEADER",
          username: user.username,
          role: "IGL",
          email: user.email || undefined,
          gameUid: user.gameUid || undefined,
          isCaptain: true,
        },
      ]);
    }
  }, [user, isOpen]);

  // Reset when closing
  const handleClose = () => {
    setStep(1);
    setTeamName("");
    setUtrNumber("");
    setPaymentScreenshot(null);
    setSubmissionError("");
    setRegistrationResult(null);
    onClose();
  };

  if (!tournament) return null;

  const parsedFeeFromText = parseInt(String(tournament.entryFee || "").replace(/[^0-9]/g, ""), 10) || 0;
  const entryFeeType = (tournament as any).entryFeeType || "PER_TEAM";
  const rawBaseFee =
    tournament.feeAmount !== undefined && tournament.feeAmount !== null && Number(tournament.feeAmount) > 0
      ? Number(tournament.feeAmount)
      : parsedFeeFromText;
  const baseFee = entryFeeType === "FREE" ? 0 : rawBaseFee;
  const isPerPlayer = entryFeeType === "PER_PLAYER";

  const teamSize = tournament.teamSize || 4;
  const substitutesAllowed = (tournament as any).substitutesAllowed ?? true;
  const maxSubstitutes = (tournament as any).maxSubstitutes ?? 2;
  const maxTotalPlayers = substitutesAllowed ? teamSize + maxSubstitutes : teamSize;

  const startersCount = Math.max(1, players.filter((p: any) => !p.isSubstitute).length);
  const feeAmount = isPerPlayer ? baseFee * startersCount : baseFee;
  const isFree = entryFeeType === "FREE" || feeAmount === 0;
  const upiId = tournament.upiId || "mgesports@upi";

  // Dynamic slots
  const confirmedCount = tournament.confirmedTeams || tournament.registeredTeams || 0;
  const totalSlots = tournament.totalTeams || 32;
  const availableSlots = tournament.availableSlots !== undefined ? tournament.availableSlots : Math.max(0, totalSlots - confirmedCount);
  const isTournamentFull = availableSlots <= 0;
  const allowWaitlist = Boolean((tournament as any).allowWaitlist);
  const isWaitlisting = isTournamentFull && allowWaitlist;

  // Copy UPI
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Upload screenshot
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const res = await tournamentsApi.uploadImage(file);
      if (res && res.url) {
        setPaymentScreenshot(res.url);
        setUploadingScreenshot(false);
        return;
      }
    } catch {
      // Server upload failed, use universal Base64 data URL
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPaymentScreenshot(reader.result);
      }
      setUploadingScreenshot(false);
    };
    reader.onerror = () => {
      setUploadingScreenshot(false);
    };
    reader.readAsDataURL(file);
  };

  // Search players
  const handleSearchPlayers = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await tournamentsApi.searchPlayers(q, tournament.id);
      setSearchResults(results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Check if player is already added to squad
  const isPlayerAlreadyAdded = (candidate: any) => {
    return players.some((pl) => {
      if (candidate.id && pl.id && candidate.id === pl.id) return true;
      if (candidate.ign && pl.ign && candidate.ign.trim().toLowerCase() === pl.ign.trim().toLowerCase()) return true;
      if (candidate.username && pl.username && candidate.username.trim().toLowerCase() === pl.username.trim().toLowerCase()) return true;
      if (candidate.gameUid && pl.gameUid && candidate.gameUid.trim() === pl.gameUid.trim()) return true;
      if (candidate.email && pl.email && candidate.email.trim().toLowerCase() === pl.email.trim().toLowerCase()) return true;
      return false;
    });
  };

  // Add teammate from search
  const handleAddTeammate = (player: any) => {
    if (isPlayerAlreadyAdded(player)) {
      return;
    }
    if (players.length >= maxTotalPlayers) {
      return;
    }

    const isStarter = players.filter((p: any) => !p.isSubstitute).length < teamSize;

    const newPlayer = {
      id: player.id,
      name: player.fullName || player.ign || player.username,
      ign: player.ign || player.username,
      username: player.username,
      role: isStarter ? "STARTER" : "SUBSTITUTE",
      email: player.email || undefined,
      gameUid: player.gameUid || undefined,
      isCaptain: false,
      isSubstitute: !isStarter,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Remove teammate
  const handleRemoveTeammate = (index: number) => {
    if (index === 0) return; // Cannot remove team leader
    setPlayers((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    if (!agreedToRules) {
      setSubmissionError("Please agree to the tournament rules to proceed.");
      return;
    }

    setSubmitting(true);
    setSubmissionError("");

    try {
      const payload: SquadRegistrationInput = {
        teamName,
        teamLogo: teamLogo || undefined,
        captainIgn: user?.ign || user?.username || "LEADER",
        captainName: user?.fullName || user?.ign || user?.username,
        captainEmail: user?.email,
        captainPhone: user?.phone || whatsapp,
        whatsapp,
        discordTag,
        players: players.map((p: any, idx) => ({
          name: p.name || p.ign || `Player ${idx + 1}`,
          ign: p.ign || `PLAYER_${idx + 1}`,
          role: p.role || (idx === 0 ? "IGL" : p.isSubstitute ? "SUBSTITUTE" : "STARTER"),
          email: p.email || undefined,
          isCaptain: idx === 0,
          isSubstitute: Boolean(p.isSubstitute),
        })),
        payment: !isFree
          ? {
              amount: feeAmount,
              method: "UPI",
              utr: utrNumber.trim().toUpperCase(),
              payerName: payerName || user?.fullName || user?.ign || "Athlete",
              screenshot: paymentScreenshot || undefined,
            }
          : undefined,
      };

      const res = await tournamentsApi.registerSquad(tournament.id, payload);
      const regData = res.data || res;

      if (regData?.status === "CONFIRMED" || regData?.status === "APPROVED") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFBE32", "#22C55E", "#FFFFFF"],
        });
      }

      setRegistrationResult(regData);
      setStep(6);
      if (onSuccess) onSuccess(regData);
    } catch (err: any) {
      setSubmissionError(err.message || "Registration failed. Please check all details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: "Tournament" },
    { num: 2, label: "Team" },
    { num: 3, label: "Players" },
    { num: 4, label: "Payment" },
    { num: 5, label: "Review" },
    { num: 6, label: "Confirmed" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="TOURNAMENT REGISTRATION"
      subtitle={tournament.title}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Stepper progress bar */}
        <div className="grid grid-cols-6 gap-1 border-b border-white/10 pb-4">
          {stepsHeader.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="text-center">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#22C55E]"
                      : isCurrent
                      ? "bg-[#FFBE32]"
                      : "bg-white/10"
                  }`}
                />
                <span
                  className={`text-[9px] font-heading font-bold uppercase tracking-wider block mt-1.5 truncate ${
                    isCurrent
                      ? "text-[#FFBE32]"
                      : isCompleted
                      ? "text-gray-300"
                      : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {submissionError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* ================= STEP 1: TOURNAMENT OVERVIEW ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111115] to-black border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-md text-[10px] font-heading font-black tracking-wider uppercase bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/30">
                  {tournament.game}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  Slots: {confirmedCount} / {totalSlots} Confirmed
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                  {tournament.title}
                </h3>
                <p className="text-xs text-gray-400 font-body mt-1 leading-relaxed">
                  {tournament.tagline || tournament.shortDescription || tournament.description}
                </p>
              </div>

              {/* Tournament quick metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Prize Pool</span>
                  <strong className="text-sm font-display text-[#FFBE32] uppercase">{tournament.prizePool}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Entry Fee</span>
                  <strong className="text-sm font-display text-white uppercase">{tournament.entryFee}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Format</span>
                  <strong className="text-xs font-heading font-bold text-gray-300 uppercase block truncate">
                    {tournament.format}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Slots Remaining</span>
                  <strong className={`text-sm font-display uppercase ${availableSlots > 0 ? "text-[#22C55E]" : "text-red-400"}`}>
                    {availableSlots} Available
                  </strong>
                </div>
              </div>
            </div>

            {/* Guest Authentication Gate */}
            {!isAuthenticated ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border-2 border-[#FFBE32]/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FFBE32]/20 border border-[#FFBE32] flex items-center justify-center text-[#FFBE32] mx-auto">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-lg uppercase tracking-wider text-white">
                    Login Required to Join Tournament
                  </h4>
                  <p className="text-xs text-gray-300 font-body max-w-md mx-auto">
                    You need to login to join this tournament. Your selected tournament and progress will be saved.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openLogin()}
                    className="px-6 py-2.5 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)] transition-all cursor-pointer"
                  >
                    Login to Continue
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isTournamentFull && !allowWaitlist ? (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
                <span className="px-3 py-1 rounded text-xs font-heading font-black bg-red-500 text-white uppercase tracking-wider">
                  TOURNAMENT FULL
                </span>
                <p className="text-xs text-gray-300 font-mono">
                  All slots for this championship have been verified and confirmed.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {isWaitlisting && (
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-[#FFBE32]/40 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FFBE32] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-heading font-black uppercase text-[#FFBE32] tracking-wider">
                        CHAMPIONSHIP SLOTS FULL — PRIORITY WAITLIST OPEN
                      </p>
                      <p className="text-[11px] font-mono text-gray-300 mt-1">
                        All main tournament slots have been filled. Registering now places your squad on the Priority Waitlist. If any active team is disqualified or withdraws, waitlisted teams are promoted in order.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>{isWaitlisting ? "Join Priority Waitlist" : "Continue to Team Details"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: TEAM DETAILS ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#FFBE32]" />
                Step 2: Team & Clan Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Team / Clan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MG WARRIORS"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-heading font-bold focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Team Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LZ"
                    value={teamTag}
                    onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-heading font-bold focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Team Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={teamLogo}
                    onChange={(e) => setTeamLogo(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    WhatsApp Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Discord Tag / Guild ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. player#1234"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>
              </div>

              {/* Pre-filled Leader Profile Card */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#FFBE32] uppercase tracking-widest">
                    DESIGNATED TEAM LEADER (AUTOFILLED FROM PROFILE)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#22C55E]/20 text-[#22C55E]">
                    VERIFIED
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-gray-300">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Name:</span>
                    <strong>{user?.fullName || user?.username}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">IGN:</span>
                    <strong className="text-[#FFBE32]">{user?.ign || user?.username}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Game UID:</span>
                    <strong>{user?.gameUid || "Configured"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Email:</span>
                    <strong className="truncate block">{user?.email}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!teamName.trim() || !whatsapp.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] transition-all"
              >
                <span>Continue to Roster</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: TEAM MEMBERS ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#FFBE32]" />
                    Team Roster ({players.length} / {teamSize} Players)
                  </h3>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                    Search and invite registered players by username, IGN, or Game UID.
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                    players.length >= teamSize
                      ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40"
                      : "bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/40"
                  }`}
                >
                  {players.length >= teamSize ? "ROSTER COMPLETE" : `${teamSize - players.length} MORE NEEDED`}
                </span>
              </div>

              {/* Player Search Bar */}
              {players.length < teamSize && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search athletes by username, IGN, or Game UID..."
                      value={searchQuery}
                      onChange={(e) => handleSearchPlayers(e.target.value)}
                      className="w-full bg-[#0D0D10] border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
                    />
                    {searching && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="rounded-xl border border-white/15 bg-[#0A0A0D] divide-y divide-white/5 max-h-48 overflow-y-auto shadow-2xl">
                      {searchResults.map((p) => {
                        const alreadyAdded = isPlayerAlreadyAdded(p);

                        return (
                          <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                            <div className="min-w-0">
                              <span className="text-xs font-heading font-bold text-white uppercase block truncate">
                                {p.ign || p.username}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                @{p.username} {p.gameUid ? `• UID: ${p.gameUid}` : ""}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={alreadyAdded || p.isRegisteredInTournament}
                              onClick={() => handleAddTeammate(p)}
                              className={`px-3 py-1 rounded text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                                alreadyAdded
                                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                  : p.isRegisteredInTournament
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
                                  : "bg-[#FFBE32] hover:bg-[#FFA000] text-black cursor-pointer shadow-[0_0_10px_rgba(255,190,50,0.3)]"
                              }`}
                            >
                              {alreadyAdded ? "Added" : p.isRegisteredInTournament ? "Already in Team" : "Add Player"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Roster list */}
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                {players.map((p, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-display text-xs font-black text-white shrink-0">
                        P{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-heading font-bold text-white uppercase">{p.ign}</span>
                          {idx === 0 ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-heading font-black bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/30 uppercase">
                              TEAM LEADER
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-heading font-bold bg-white/10 text-gray-400 uppercase">
                              {p.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 block mt-0.5">{p.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30">
                        ACCEPTED
                      </span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(idx)}
                          className="p-1 rounded text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={players.length < teamSize}
                onClick={() => setStep(isFree ? 5 : 4)}
                className="px-6 py-2.5 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] transition-all"
              >
                <span>{isFree ? "Proceed to Review" : "Proceed to Payment"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PAYMENT ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#FFBE32]" />
                Step 4: Tournament Entry Payment
              </h3>

              {/* UPI Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#171720] to-black border border-[#FFBE32]/30 space-y-4 shadow-[0_0_30px_rgba(255,190,50,0.1)]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                      Tournament Entry Fee {isPerPlayer ? "(Per Player)" : "(Per Squad)"}
                    </span>
                    <div className="font-display text-3xl font-black text-[#FFBE32]">
                      {formatCurrency(feeAmount)}
                    </div>
                    {isPerPlayer ? (
                      <span className="text-[10px] font-mono text-[#FFBE32] block mt-0.5">
                        {formatCurrency(baseFee)} × {startersCount} Starter Athletes = {formatCurrency(feeAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                        Full Squad Fee (Covers entire team)
                      </span>
                    )}
                  </div>

                  {/* Copy UPI Button */}
                  <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block">Official UPI ID</span>
                      <strong className="text-xs font-mono text-white select-all">{upiId}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="p-2 rounded-lg bg-[#FFBE32]/20 hover:bg-[#FFBE32] text-[#FFBE32] hover:text-black transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* QR Code instructions */}
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {(() => {
                    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(tournament.title || "MG ESPORTS")}&am=${feeAmount}&cu=INR&tn=${encodeURIComponent(`Entry Fee - ${tournament.title || "Tournament"}`)}`;
                    const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiIntentUri)}`;
                    const customQrUrl = tournament.upiQrImage && !tournament.upiQrImage.includes("partner-ewc") ? tournament.upiQrImage : null;
                    const resolvedQrUrl = !qrImageError && customQrUrl ? customQrUrl : dynamicQrCodeUrl;

                    return (
                      <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
                        <img
                          src={resolvedQrUrl}
                          alt="Official UPI Payment QR Code"
                          className="w-36 h-36 object-contain rounded-lg"
                          onError={() => {
                            if (!qrImageError) {
                              setQrImageError(true);
                            }
                          }}
                        />
                        <div className="mt-1.5 text-[9px] font-mono font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Scan &amp; Pay via UPI
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 text-xs font-mono text-gray-300">
                    <p className="font-heading font-bold text-white uppercase text-xs">Payment Steps:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-400">
                      <li>Scan the official QR code using GPay, PhonePe, Paytm or BHIM.</li>
                      <li>Pay the exact entry fee of <strong className="text-[#FFBE32]">{formatCurrency(feeAmount)}</strong>.</li>
                      <li>Copy the 12-digit UTR or Transaction Reference number.</li>
                      <li>Enter the UTR number and upload the screenshot proof below.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Payment Details Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    UTR / Transaction Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 408512345678"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.trim().toUpperCase())}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFBE32] transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                    Payer Name / UPI Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name shown on payment app"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
                  />
                </div>
              </div>

              {/* Payment Screenshot Upload */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400 uppercase block">
                  Payment Screenshot (Recommended for instant verification)
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-[#FFBE32]/50 transition-colors bg-black/30">
                  {paymentScreenshot ? (
                    <div className="flex items-center justify-between gap-3">
                      <img src={paymentScreenshot} alt="Screenshot" className="h-12 w-12 object-cover rounded-lg border border-white/20" />
                      <span className="text-xs font-mono text-[#22C55E] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Screenshot attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentScreenshot(null)}
                        className="text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-1">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs font-heading font-bold uppercase text-[#FFBE32]">
                        {uploadingScreenshot ? "Uploading..." : "Click to upload screenshot"}
                      </span>
                      <p className="text-[10px] font-mono text-gray-500">PNG, JPG or WEBP up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!utrNumber.trim()}
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] transition-all"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW & SUMMARY ================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FFBE32]" />
                Step 5: Review & Confirm Entry
              </h3>

              {/* Summary card */}
              <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 divide-y divide-white/10 space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-mono text-gray-400">Tournament</span>
                  <strong className="text-sm font-display uppercase text-white">{tournament.title}</strong>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-mono text-gray-400">Team Name</span>
                  <strong className="text-sm font-heading font-bold uppercase text-[#FFBE32]">{teamName}</strong>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-mono text-gray-400">Team Leader</span>
                  <strong className="text-xs font-mono text-white">@{user?.ign || user?.username} ({user?.fullName || "Athlete"})</strong>
                </div>

                <div className="py-2 space-y-1.5">
                  <span className="text-[11px] font-mono text-gray-400 block">Roster Starters ({players.length} Players):</span>
                  <div className="flex flex-wrap gap-2">
                    {players.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-gray-300"
                      >
                        {p.ign} ({idx === 0 ? "IGL" : p.role})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-mono text-gray-400">Entry Fee</span>
                  <strong className="text-base font-display text-[#FFBE32]">{isFree ? "FREE ENTRY" : `₹${feeAmount}`}</strong>
                </div>

                {!isFree && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-mono text-gray-400">Submitted UTR</span>
                    <strong className="text-xs font-mono text-[#22C55E]">{utrNumber}</strong>
                  </div>
                )}
              </div>

              {/* Mandatory Rules Agreement Checkbox */}
              <label className="flex items-start gap-3 p-4 rounded-xl bg-black/40 border border-white/10 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#FFBE32] cursor-pointer"
                />
                <span className="text-xs font-body text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                  I confirm that all information provided is correct and I agree to the tournament rules, anti-cheat policy, and competitive code of conduct.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(isFree ? 3 : 4)}
                className="px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!agreedToRules || submitting}
                onClick={handleFinalSubmit}
                className="px-8 py-3 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.4)] transition-all"
              >
                {submitting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isWaitlisting ? "Joining Waitlist..." : "Confirming..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isWaitlisting ? "Join Priority Waitlist" : "Confirm Registration"}</span>
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: DEDICATED CONFIRMATION ================= */}
        {step === 6 && (
          <div className="py-6 text-center space-y-6">
            {registrationResult?.isWaitlisted || registrationResult?.status === "WAITLISTED" ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-[#FFBE32] flex items-center justify-center text-[#FFBE32] mx-auto shadow-[0_0_30px_rgba(255,190,50,0.3)]">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FFBE32] bg-[#FFBE32]/10 px-3 py-1 rounded-full border border-[#FFBE32]/30">
                    SLOT FULL • ADDED TO PRIORITY WAITLIST (POSITION #{registrationResult?.waitlistPriority || 1})
                  </span>
                  <h3 className="font-display text-3xl uppercase tracking-wider text-white mt-3">
                    WAITLIST QUEUE CONFIRMED
                  </h3>
                  <p className="text-xs text-gray-300 font-mono mt-1 max-w-md mx-auto">
                    Your squad is queued at priority position #{registrationResult?.waitlistPriority || 1}. If any verified team is disqualified or unregisters, waitlisted teams are promoted in order.
                  </p>
                </div>
              </div>
            ) : (registrationResult?.status === "CONFIRMED" || registrationResult?.status === "APPROVED") ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full border border-[#22C55E]/30">
                    PAYMENT SUCCESSFUL ✓ • REGISTRATION CONFIRMED ✓
                  </span>
                  <h3 className="font-display text-3xl uppercase tracking-wider text-white mt-3">
                    YOU HAVE JOINED THE TOURNAMENT
                  </h3>
                  <p className="text-xs text-gray-300 font-mono mt-1">
                    Your roster is locked in for competitive contention.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFBE32]/20 border-2 border-[#FFBE32] flex items-center justify-center text-[#FFBE32] mx-auto shadow-[0_0_30px_rgba(255,190,50,0.3)]">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FFBE32] bg-[#FFBE32]/10 px-3 py-1 rounded-full border border-[#FFBE32]/30">
                    PAYMENT SUBMITTED • VERIFICATION PENDING
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-3">
                    PAYMENT UNDER REVIEW
                  </h3>
                  <p className="text-xs text-gray-300 font-mono mt-1 max-w-md mx-auto">
                    Your payment details have been submitted and are waiting for admin verification. You will receive an in-app alert as soon as verification is complete.
                  </p>
                </div>
              </div>
            )}

            {/* Registration Certificate Card */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/15 max-w-lg mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">REGISTRATION ID:</span>
                <strong className="text-[#FFBE32] text-sm font-black">
                  {registrationResult?.registrationNumber || registrationResult?.id || "REG-2026-CONFIRMED"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tournament:</span>
                <span className="text-white font-bold">{tournament.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team:</span>
                <span className="text-white font-bold">{teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Leader:</span>
                <span className="text-gray-300">@{user?.ign || user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`font-bold uppercase ${
                    (registrationResult?.status === "CONFIRMED" || registrationResult?.status === "APPROVED") ? "text-[#22C55E]" : "text-[#FFBE32]"
                  }`}
                >
                  {registrationResult?.status || "CONFIRMED"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/my-tournaments");
                }}
                className="px-6 py-3 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black shadow-[0_0_20px_rgba(255,190,50,0.3)] transition-all cursor-pointer"
              >
                View My Tournaments
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
