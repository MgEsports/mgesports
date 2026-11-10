import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { tournamentsApi } from "../api/tournaments";
import {
  type Tournament,
  type TournamentStage,
  type TournamentRound,
  type RegistrationItem,
  type LeaderboardEntry,
  getTournamentBannerUrl,
  DEFAULT_TOURNAMENT_BANNER,
} from "../data/tournaments";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  Shield,
  Users,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  ExternalLink,
  Search,
  Upload,
  ArrowRight,
  Layers,
  Award,
  CreditCard,
  Settings,
  ListOrdered,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  History,
  Trophy,
  Clock,
  Radio,
  Key,
  Lock,
  Edit,
  Copy,
  Sparkles,
} from "lucide-react";

type TabType =
  | "OVERVIEW"
  | "REGISTRATIONS"
  | "WAITLIST"
  | "CHECKIN"
  | "MATCHES"
  | "TEAMS"
  | "STAGES"
  | "LEADERBOARD"
  | "PAYMENTS"
  | "SETTINGS";

export const AdminTournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regFilterStatus, setRegFilterStatus] = useState("ALL");
  const [regFilterPayment, setRegFilterPayment] = useState("ALL");
  const [regFilterStage, setRegFilterStage] = useState("ALL");
  const [regSearchQuery, setRegSearchQuery] = useState("");
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [activeRegDetail, setActiveRegDetail] = useState<RegistrationItem | null>(null);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Stages state
  const [stages, setStages] = useState<TournamentStage[]>([]);

  // Rounds & Divisions state
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string>("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | "ALL">("ALL");
  const [newRoundModalOpen, setNewRoundModalOpen] = useState(false);
  const [batchDivisionsModalOpen, setBatchDivisionsModalOpen] = useState(false);
  const [autoDistributeLoading, setAutoDistributeLoading] = useState(false);
  const [eligibleTabFilter, setEligibleTabFilter] = useState<"ALL" | "UNASSIGNED" | "OTHER_DIVISIONS">("ALL");
  const [copiedCredentialsKey, setCopiedCredentialsKey] = useState<string | null>(null);

  // Batch Division creator state
  const [batchStageName, setBatchStageName] = useState("ROUND 1");
  const [batchRoundNumber, setBatchRoundNumber] = useState(1);
  const [batchDivisionsList, setBatchDivisionsList] = useState<string[]>(["DIVISION A", "DIVISION B", "DIVISION C"]);
  const [batchCreating, setBatchCreating] = useState(false);

  const [newRoundData, setNewRoundData] = useState({
    name: "ROUND 1 - DIVISION A",
    roundStage: "ROUND 1",
    divisionLetter: "DIVISION A",
    roundNumber: 1,
    roundType: "BATTLE_ROYALE",
    maxTeams: 12,
    selectionMethod: "MANUAL",
    startDate: "",
    startTime: "",
    description: "",
  });
  const [eligibleModalOpen, setEligibleModalOpen] = useState(false);
  const [eligibleTeams, setEligibleTeams] = useState<any[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedEligibleIds, setSelectedEligibleIds] = useState<string[]>([]);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceSourceRoundId, setAdvanceSourceRoundId] = useState<string>("");
  const [advanceTargetRoundId, setAdvanceTargetRoundId] = useState<string>("");
  const [selectedAdvanceTeamIds, setSelectedAdvanceTeamIds] = useState<string[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTeamName, setHistoryTeamName] = useState<string>("");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Custom Room Credentials state per round
  const [markUnselectedAsEliminated, setMarkUnselectedAsEliminated] = useState(true);
  const [roomForm, setRoomForm] = useState({
    roomId: "",
    roomPassword: "",
    map: "BERMUDA",
    roomTime: "",
    credentialsPublished: false,
    customNotes: "",
  });
  const [savingRoomCredentials, setSavingRoomCredentials] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [savingLb, setSavingLb] = useState(false);
  const [lbSaveSuccess, setLbSaveSuccess] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamTag, setNewTeamTag] = useState("");

  // Tournament settings state
  const [settingsForm, setSettingsForm] = useState<Partial<Tournament>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Waitlist state
  const [waitlist, setWaitlist] = useState<RegistrationItem[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Check-In state
  const [checkInStats, setCheckInStats] = useState<{ total: number; checkedIn: number; pending: number; noShows: number; teams: any[] }>({
    total: 0,
    checkedIn: 0,
    pending: 0,
    noShows: 0,
    teams: [],
  });
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Matches state
  const [tournamentMatches, setTournamentMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [matchFormData, setMatchFormData] = useState({
    roundId: "",
    matchNumber: 1,
    stage: "ROUND 1",
    game: "FREE FIRE MAX",
    map: "BERMUDA",
    serverRegion: "INDIA",
    status: "UPCOMING",
    teamAName: "MG ESPORTS",
    teamATag: "LORDZ",
    teamAScore: 0,
    teamBName: "OPPONENT",
    teamBTag: "OPP",
    teamBScore: 0,
    startTime: "",
    roomId: "",
    roomPassword: "",
    credentialsReleaseTime: "",
    streamUrl: "",
  });

  const loadWaitlist = async () => {
    if (!tournamentId) return;
    setWaitlistLoading(true);
    try {
      const data = await tournamentsApi.getWaitlist(tournamentId);
      setWaitlist(data || []);
    } catch (e) {
      console.warn("Failed to load waitlist:", e);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const loadCheckIn = async () => {
    if (!tournamentId) return;
    setCheckInLoading(true);
    try {
      const data = await tournamentsApi.getCheckInStatus(tournamentId);
      setCheckInStats(data || { total: 0, checkedIn: 0, pending: 0, noShows: 0, teams: [] });
    } catch (e) {
      console.warn("Failed to load check in status:", e);
    } finally {
      setCheckInLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!tournamentId) return;
    setMatchesLoading(true);
    try {
      const data = await tournamentsApi.getMatches({ tournamentId });
      setTournamentMatches(data || []);
    } catch (e) {
      console.warn("Failed to load matches:", e);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handlePromoteWaitlist = async (regId: string) => {
    if (!tournament) return;
    try {
      await tournamentsApi.promoteWaitlistTeam(tournament.id, regId);
      alert("Team successfully promoted to official tournament slot!");
      loadWaitlist();
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to promote team");
    }
  };

  const handleRemoveWaitlist = async (regId: string) => {
    if (!tournament || !confirm("Remove this team from the waitlist?")) return;
    try {
      await tournamentsApi.removeWaitlistTeam(tournament.id, regId);
      loadWaitlist();
    } catch (err: any) {
      alert(err.message || "Failed to remove team");
    }
  };

  const handleAdminCheckIn = async (regId: string) => {
    if (!tournament) return;
    try {
      await tournamentsApi.checkInTeam(tournament.id, regId);
      loadCheckIn();
    } catch (err: any) {
      alert(err.message || "Failed to check in team");
    }
  };

  const handleRunNoShows = async () => {
    if (!tournament || !confirm("Run no-show timeout? Any team that has NOT checked in will be marked as NO_SHOW.")) return;
    try {
      const res = await tournamentsApi.handleNoShows(tournament.id);
      alert(res.message || "No-shows processed successfully.");
      loadCheckIn();
    } catch (err: any) {
      alert(err.message || "Failed to process no-shows");
    }
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;
    try {
      if (editingMatch) {
        await tournamentsApi.updateMatch(editingMatch.id, {
          ...matchFormData,
          tournamentId: tournament.id,
          tournamentName: tournament.title,
        });
      } else {
        await tournamentsApi.createMatch({
          ...matchFormData,
          tournamentId: tournament.id,
          tournamentName: tournament.title,
        });
      }
      setMatchModalOpen(false);
      setEditingMatch(null);
      loadMatches();
    } catch (err: any) {
      alert(err.message || "Failed to save match");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Delete this match?")) return;
    try {
      await tournamentsApi.deleteMatch(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.message || "Failed to delete match");
    }
  };

  // Load tournament data
  const loadData = async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const data = await tournamentsApi.getById(tournamentId);
      if (data) {
        setTournament(data);
        setSettingsForm(data);
        if (data.stages) setStages(data.stages);
        if (data.registrations) setRegistrations(data.registrations);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      }
    } catch {
      // not found
    } finally {
      // Fetch fresh registrations, stages, leaderboard, rounds, waitlist, check-in, matches in parallel
      try {
        const [regs, stgs, lb, rnds, wt, ck, mt] = await Promise.all([
          tournamentsApi.getRegistrations({ tournamentId }),
          tournamentsApi.getStages(tournamentId),
          tournamentsApi.getLeaderboard(tournamentId),
          tournamentsApi.getRounds(tournamentId),
          tournamentsApi.getWaitlist(tournamentId),
          tournamentsApi.getCheckInStatus(tournamentId),
          tournamentsApi.getMatches({ tournamentId }),
        ]);
        if (regs && regs.length > 0) setRegistrations(regs);
        if (stgs && stgs.length > 0) setStages(stgs);
        if (lb && lb.length > 0) setLeaderboard(lb);
        if (rnds && rnds.length > 0) {
          setRounds(rnds);
          setActiveRoundId((prev) => prev || rnds[0].id);
        }
        if (wt) setWaitlist(wt);
        if (ck) setCheckInStats(ck);
        if (mt) setTournamentMatches(mt);
      } catch (err) {
        console.warn("Secondary data fetch failed:", err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  // Sync active round credentials into roomForm (called unconditionally at top level)
  useEffect(() => {
    const cur = rounds.find((r) => r.id === activeRoundId) || rounds[0];
    if (cur) {
      setRoomForm({
        roomId: cur.roomId || "",
        roomPassword: cur.roomPassword || "",
        map: cur.map || "BERMUDA",
        roomTime: cur.roomTime || cur.startTime || "",
        credentialsPublished: Boolean(cur.credentialsPublished),
        customNotes: cur.customNotes || "",
      });
    }
  }, [activeRoundId, rounds]);

  if (loading && !tournament) {
    return (
      <div className="p-12 text-center text-gray-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#fc8100] mb-3" />
        <p className="font-heading text-sm uppercase tracking-wider">Loading Tournament Management Hub...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-12 text-center text-gray-400 space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="font-display text-2xl uppercase text-white">Tournament Not Found</h2>
        <Link
          to="/admin/tournaments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fc8100] text-black font-heading font-bold text-xs uppercase"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tournaments
        </Link>
      </div>
    );
  }

  // Registrations filtering
  const filteredRegistrations = registrations.filter((r) => {
    const matchStatus = regFilterStatus === "ALL" || r.status === regFilterStatus;
    const matchPayment = regFilterPayment === "ALL" || r.paymentStatus === regFilterPayment;
    const matchStage = regFilterStage === "ALL" || r.currentStageId === regFilterStage;
    const q = regSearchQuery.toLowerCase();
    const matchQuery =
      !regSearchQuery ||
      r.teamName.toLowerCase().includes(q) ||
      r.captainIgn.toLowerCase().includes(q) ||
      (r.captainName && r.captainName.toLowerCase().includes(q)) ||
      (r.whatsapp && r.whatsapp.includes(q)) ||
      (r.payment?.utr && r.payment.utr.toLowerCase().includes(q));
    return matchStatus && matchPayment && matchStage && matchQuery;
  });

  // Calculate live statistics
  const statsTotal = registrations.length;
  const statsApproved = registrations.filter((r) => r.status === "APPROVED" || r.status === "CONFIRMED").length;
  const statsPending = registrations.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length;
  const statsPaymentPending = registrations.filter(
    (r) => r.status === "PAYMENT_PENDING" || r.paymentStatus === "PENDING"
  ).length;
  const statsPaymentVerified = registrations.filter((r) => r.paymentStatus === "VERIFIED").length;
  const statsRejected = registrations.filter((r) => r.status === "REJECTED" || r.status === "PAYMENT_FAILED").length;

  // Handlers for Registration actions
  const handleUpdateRegStatus = async (regId: string, status: string) => {
    try {
      await tournamentsApi.updateRegistrationStatus(regId, status);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status, approvedAt: status === "APPROVED" ? new Date().toISOString() : r.approvedAt } : r))
      );
      if (activeRegDetail && activeRegDetail.id === regId) {
        setActiveRegDetail((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update registration status");
    }
  };

  const handleUpdatePayment = async (regId: string, paymentStatus: string, autoApprove = false) => {
    try {
      if (paymentStatus === "VERIFIED") {
        await tournamentsApi.verifyPayment(regId);
        alert("Payment verified and squad approved successfully!");
      } else if (paymentStatus === "REJECTED") {
        const reason = window.prompt("Enter rejection reason for player (e.g. Invalid UTR, transaction mismatch):", "Invalid UTR reference code");
        if (reason === null) return; // cancelled prompt
        await tournamentsApi.rejectPayment(regId, reason || "Payment verification failed");
      } else {
        await tournamentsApi.updatePaymentStatus(regId, paymentStatus, undefined, autoApprove);
      }

      setRegistrations((prev) =>
        prev.map((r) => {
          if (r.id === regId) {
            return {
              ...r,
              paymentStatus,
              status: paymentStatus === "VERIFIED" ? "APPROVED" : paymentStatus === "REJECTED" ? "REJECTED" : r.status,
              approvedAt: paymentStatus === "VERIFIED" ? new Date().toISOString() : r.approvedAt,
              payment: r.payment ? { ...r.payment, status: paymentStatus } : null,
            };
          }
          return r;
        })
      );
      if (activeRegDetail && activeRegDetail.id === regId) {
        setActiveRegDetail((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus,
                status: paymentStatus === "VERIFIED" ? "APPROVED" : paymentStatus === "REJECTED" ? "REJECTED" : prev.status,
                approvedAt: paymentStatus === "VERIFIED" ? new Date().toISOString() : prev.approvedAt,
                payment: prev.payment ? { ...prev.payment, status: paymentStatus } : null,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update payment status");
    }
  };

  const handleBulkAction = async (action: "APPROVE" | "REJECT" | "VERIFY_PAYMENT") => {
    if (selectedRegIds.length === 0) return;
    try {
      await tournamentsApi.bulkActionRegistrations(selectedRegIds, action);
      setRegistrations((prev) =>
        prev.map((r) => {
          if (selectedRegIds.includes(r.id)) {
            if (action === "APPROVE") return { ...r, status: "APPROVED" };
            if (action === "REJECT") return { ...r, status: "REJECTED" };
            if (action === "VERIFY_PAYMENT") return { ...r, paymentStatus: "VERIFIED" };
          }
          return r;
        })
      );
      setSelectedRegIds([]);
    } catch (err: any) {
      alert(err.message || "Bulk action failed");
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await tournamentsApi.exportRegistrationsCsv(
        tournament.id,
        regFilterStage !== "ALL" ? regFilterStage : undefined,
        regFilterStatus !== "ALL" ? regFilterStatus : undefined
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lordz-${tournament.slug || tournament.id}-registrations.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || "Failed to export registrations");
    }
  };

  // Rounds Management Handlers
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || !newRoundData.name) return;
    try {
      const created = await tournamentsApi.createRound(tournamentId, {
        ...newRoundData,
        maxTeams: Number(newRoundData.maxTeams) || 12,
        roundNumber: Number(newRoundData.roundNumber) || 1,
      });
      setRounds((prev) => [...prev, created]);
      setActiveRoundId(created.id);
      setSelectedStageFilter(created.roundNumber);
      setNewRoundModalOpen(false);
      setNewRoundData({
        name: "ROUND 1 - DIVISION A",
        roundStage: "ROUND 1",
        divisionLetter: "DIVISION A",
        roundNumber: 1,
        roundType: "BATTLE_ROYALE",
        maxTeams: 12,
        selectionMethod: "MANUAL",
        startDate: "",
        startTime: "",
        description: "",
      });
    } catch (err: any) {
      alert(err.message || "Failed to create round");
    }
  };

  const handleCreateBatchDivisions = async () => {
    if (!tournamentId || batchDivisionsList.length === 0) return;
    setBatchCreating(true);
    try {
      const res = await tournamentsApi.createBatchDivisions(tournamentId, {
        stageName: batchStageName,
        roundNumber: Number(batchRoundNumber) || 1,
        divisionNames: batchDivisionsList,
        maxTeamsPerDivision: 12,
        roundType: "BATTLE_ROYALE",
      });
      if (res?.success) {
        const updated = await tournamentsApi.getRounds(tournamentId);
        if (updated && updated.length > 0) {
          setRounds(updated);
          setActiveRoundId(updated[0].id);
          setSelectedStageFilter(Number(batchRoundNumber) || 1);
        }
        setBatchDivisionsModalOpen(false);
        alert(`Successfully created ${batchDivisionsList.length} divisions for ${batchStageName}!`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create divisions");
    } finally {
      setBatchCreating(false);
    }
  };

  const handleAutoDistributeSquads = async (stageRoundNumber: number) => {
    if (!tournamentId) return;
    const stageRounds = rounds.filter((r) => r.roundNumber === stageRoundNumber);
    if (stageRounds.length === 0) {
      alert("No divisions found for this stage. Please create divisions first.");
      return;
    }

    const divisionNames = stageRounds.map((r) => r.name).join(", ");
    if (
      !window.confirm(
        `Auto-split unassigned squads into ${stageRounds.length} division(s) (${divisionNames})?\n\nMaximum 12 squads per custom match lobby.`
      )
    ) {
      return;
    }

    setAutoDistributeLoading(true);
    try {
      const res = await tournamentsApi.autoDistributeSquads(tournamentId, {
        roundIds: stageRounds.map((r) => r.id),
        capacityPerDivision: 12,
      });
      if (res?.success) {
        const updated = await tournamentsApi.getRounds(tournamentId);
        if (updated && updated.length > 0) setRounds(updated);
        alert(res.message || "Squads successfully distributed across divisions!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to auto-distribute squads");
    } finally {
      setAutoDistributeLoading(false);
    }
  };

  const handleCopyAnnouncement = (round: any) => {
    const text = `🎮 MG ESPORTS • FREE FIRE CUSTOM MATCH
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 TOURNAMENT: ${tournament?.title || "MG ESPORTS"}
📌 ROUND / DIVISION: ${round.name}
🔢 FREE FIRE LOBBY SLOTS: 1 to 12
🔑 ROOM ID: ${roomForm.roomId || "Will be shared before match"}
🔒 PASSWORD: ${roomForm.roomPassword || "None"}
🗺️ MAP: ${roomForm.map || "BERMUDA"}
⏰ MATCH TIME: ${roomForm.roomTime || "See Schedule"}
📝 NOTE: ${roomForm.customNotes || "Strictly join your assigned Slot # (1 to 12). Non-assigned slot players will be kicked."}
━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    navigator.clipboard.writeText(text);
    setCopiedCredentialsKey(round.id);
    setTimeout(() => setCopiedCredentialsKey(null), 3000);
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!tournamentId || !window.confirm("Are you sure you want to delete this round?")) return;
    try {
      await tournamentsApi.deleteRound(tournamentId, roundId);
      setRounds((prev) => prev.filter((r) => r.id !== roundId));
      if (activeRoundId === roundId) {
        const remaining = rounds.filter((r) => r.id !== roundId);
        setActiveRoundId(remaining[0]?.id || "");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete round");
    }
  };

  const handleSaveRoomCredentials = async (targetRoundId?: string) => {
    const roundIdToUse = targetRoundId || activeRoundId || rounds[0]?.id;
    if (!tournamentId) return;

    if (!roundIdToUse && rounds.length === 0) {
      alert("No division found. Please create a round or division first.");
      return;
    }

    // Ensure credentials are marked as published and send payload synchronously
    const payload = {
      ...roomForm,
      credentialsPublished: true,
    };
    setRoomForm(payload);
    setSavingRoomCredentials(true);
    try {
      const targetTournamentId = tournament?.id || tournamentId;
      const res: any = await tournamentsApi.updateRoundCredentials(targetTournamentId, roundIdToUse || "default", payload);
      if (res?.success || res?.id || res?.roomId || res?.data || (res && !res.error && res.message?.toLowerCase().includes("success"))) {
        const updatedRounds = await tournamentsApi.getRounds(targetTournamentId);
        if (updatedRounds && updatedRounds.length > 0) {
          setRounds(updatedRounds);
          if (!activeRoundId) setActiveRoundId(roundIdToUse || updatedRounds[0].id);
        }
        alert("Custom Room credentials saved and published to squads successfully!");
      } else {
        alert(res?.message || "Failed to save room credentials");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save room credentials");
    } finally {
      setSavingRoomCredentials(false);
    }
  };

  const handleOpenSelectTeams = async (roundId: string) => {
    if (!tournamentId) return;
    setActiveRoundId(roundId);
    setEligibleLoading(true);
    setEligibleModalOpen(true);
    setEligibleTabFilter("ALL");
    try {
      const res = await tournamentsApi.getEligibleTeamsForRound(tournament?.id || tournamentId, roundId);
      if (res && res.data && res.data.length > 0) {
        setEligibleTeams(res.data);
        const alreadySelected = res.data.filter((t: any) => t.alreadySelected).map((t: any) => t.teamId || t.id);
        setSelectedEligibleIds(alreadySelected);
      } else {
        // Fallback to registrations loaded on this page
        const roundObj = rounds.find((r) => r.id === roundId);
        const currentRoundTeamIds = (roundObj?.roundTeams || []).map((rt) => rt.teamId);
        const fallback = (registrations || []).map((r) => {
          const tKey = (r as any).teamId || r.id;
          const isSelected = currentRoundTeamIds.includes(tKey) || currentRoundTeamIds.includes(r.id);
          return {
            id: r.id,
            teamId: tKey,
            teamName: r.teamName,
            captainName: r.captainName || r.captainIgn || "Captain",
            captainPhone: r.captainPhone || r.whatsapp,
            status: r.status,
            paymentStatus: r.paymentStatus,
            alreadySelected: Boolean(isSelected),
            assignedRoundName: null,
            isAssignedToOtherDivisionInStage: false,
            otherDivisionName: null,
            isUnassignedInStage: !isSelected,
            previousRoundStatus: "CONFIRMED_REGISTRATION",
            previousRoundName: "All Registrations",
          };
        });
        setEligibleTeams(fallback);
        setSelectedEligibleIds(fallback.filter((t) => t.alreadySelected).map((t) => t.teamId || t.id));
      }
    } catch (err: any) {
      console.warn("Failed to load eligible teams via API, falling back to local registrations:", err);
      const roundObj = rounds.find((r) => r.id === roundId);
      const currentRoundTeamIds = (roundObj?.roundTeams || []).map((rt) => rt.teamId);
      const fallback = (registrations || []).map((r) => {
        const tKey = (r as any).teamId || r.id;
        const isSelected = currentRoundTeamIds.includes(tKey) || currentRoundTeamIds.includes(r.id);
        return {
          id: r.id,
          teamId: tKey,
          teamName: r.teamName,
          captainName: r.captainName || r.captainIgn || "Captain",
          captainPhone: r.captainPhone || r.whatsapp,
          status: r.status,
          paymentStatus: r.paymentStatus,
          alreadySelected: Boolean(isSelected),
          assignedRoundName: null,
          isAssignedToOtherDivisionInStage: false,
          otherDivisionName: null,
          isUnassignedInStage: !isSelected,
          previousRoundStatus: "CONFIRMED_REGISTRATION",
          previousRoundName: "All Registrations",
        };
      });
      setEligibleTeams(fallback);
      setSelectedEligibleIds(fallback.filter((t) => t.alreadySelected).map((t) => t.teamId || t.id));
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleSaveSelectedTeams = async () => {
    if (!tournamentId || !activeRoundId) return;
    try {
      await tournamentsApi.selectTeamsForRound(tournamentId, activeRoundId, selectedEligibleIds);
      const updatedRounds = await tournamentsApi.getRounds(tournamentId);
      if (updatedRounds && updatedRounds.length > 0) setRounds(updatedRounds);
      setEligibleModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save selected teams");
    }
  };

  const handleOpenAdvanceModal = (sourceRoundId: string) => {
    const roundIdx = rounds.findIndex((r) => r.id === sourceRoundId);
    const nextRound = rounds[roundIdx + 1];

    // Filter out eliminated / disqualified teams before opening modal
    const currentRound = rounds.find((r) => r.id === sourceRoundId);
    const roundTeams = currentRound?.roundTeams || [];
    const validIds = selectedAdvanceTeamIds.filter((id) => {
      const rt = roundTeams.find((team) => team.teamId === id);
      return rt && rt.status !== "ELIMINATED" && rt.status !== "DISQUALIFIED";
    });

    if (validIds.length === 0) {
      alert("Please select at least one qualified squad for advancement. Eliminated or disqualified squads cannot be promoted.");
      return;
    }

    setSelectedAdvanceTeamIds(validIds);
    setAdvanceSourceRoundId(sourceRoundId);
    setAdvanceTargetRoundId(nextRound?.id || "");
    setAdvanceModalOpen(true);
  };

  const handleConfirmAdvance = async () => {
    if (!tournamentId || !advanceSourceRoundId || !advanceTargetRoundId) {
      alert("Please select target round and at least one team");
      return;
    }

    const currentRound = rounds.find((r) => r.id === advanceSourceRoundId);
    const roundTeams = currentRound?.roundTeams || [];
    const validTeamsToAdvance = selectedAdvanceTeamIds.filter((id) => {
      const rt = roundTeams.find((t) => t.teamId === id);
      return !rt || (rt.status !== "ELIMINATED" && rt.status !== "DISQUALIFIED");
    });

    if (validTeamsToAdvance.length === 0) {
      alert("No qualified teams selected for promotion. Eliminated squads cannot be advanced.");
      return;
    }

    try {
      await tournamentsApi.advanceTeams(
        tournamentId,
        advanceSourceRoundId,
        validTeamsToAdvance,
        advanceTargetRoundId,
        markUnselectedAsEliminated
      );
      const updatedRounds = await tournamentsApi.getRounds(tournamentId);
      if (updatedRounds && updatedRounds.length > 0) setRounds(updatedRounds);
      setAdvanceModalOpen(false);
      setSelectedAdvanceTeamIds([]);
      setActiveRoundId(advanceTargetRoundId);
    } catch (err: any) {
      alert(err.message || "Failed to advance teams");
    }
  };

  const handleUpdateRoundTeam = async (roundId: string, teamId: string, data: { status?: string; score?: number }) => {
    if (!tournamentId) return;
    if (data.status === "ELIMINATED" || data.status === "DISQUALIFIED") {
      setSelectedAdvanceTeamIds((prev) => prev.filter((id) => id !== teamId));
    }
    try {
      await tournamentsApi.updateRoundTeamStatus(tournamentId, roundId, teamId, data);
      setRounds((prev) =>
        prev.map((r) => {
          if (r.id === roundId) {
            return {
              ...r,
              roundTeams: (r.roundTeams || []).map((rt) =>
                rt.teamId === teamId ? { ...rt, ...data } : rt
              ),
            };
          }
          return r;
        })
      );
    } catch (err: any) {
      console.warn("Update round team failed:", err);
    }
  };

  const handleViewHistory = async (teamId: string, teamName: string) => {
    if (!tournamentId) return;
    setHistoryTeamName(teamName);
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    try {
      const res = await tournamentsApi.getTeamRoundHistory(tournamentId, teamId);
      if (res && res.data) setHistoryData(res.data);
    } catch (err: any) {
      alert(err.message || "Failed to load team round history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Leaderboard Handlers
  const handleLeaderboardCellChange = (index: number, field: keyof LeaderboardEntry, value: any) => {
    setLeaderboard((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };
      const kills = Number(field === "kills" ? value : row.kills) || 0;
      const placementPoints = Number(field === "placementPoints" ? value : row.placementPoints) || 0;
      const bonusPoints = Number(field === "bonusPoints" ? value : row.bonusPoints) || 0;

      // Auto compute total points
      if (field === "kills" || field === "placementPoints" || field === "bonusPoints") {
        row.totalPoints = placementPoints + kills + bonusPoints;
      }
      copy[index] = row;
      return copy;
    });
    setLbSaveSuccess(false);
  };

  const handleSaveLeaderboard = async () => {
    setSavingLb(true);
    try {
      // Sort rows descending by total points, then kills
      const sorted = [...leaderboard].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.kills - a.kills;
      });
      sorted.forEach((row, idx) => {
        row.rank = idx + 1;
      });

      await tournamentsApi.updateLeaderboardBatch(tournament.id, sorted);
      setLeaderboard(sorted);
      setLbSaveSuccess(true);
      setTimeout(() => setLbSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save leaderboard");
    } finally {
      setSavingLb(false);
    }
  };

  const handleAddLeaderboardRow = async () => {
    if (!newTeamName.trim()) return;
    try {
      const created = await tournamentsApi.addLeaderboardEntry(tournament.id, {
        teamName: newTeamName.trim().toUpperCase(),
        tag: newTeamTag.trim().toUpperCase() || undefined,
        matchesPlayed: 0,
        wins: 0,
        kills: 0,
        placementPoints: 0,
        bonusPoints: 0,
      });
      setLeaderboard((prev) => [...prev, created]);
      setNewTeamName("");
      setNewTeamTag("");
    } catch (err: any) {
      alert(err.message || "Failed to add team to leaderboard");
    }
  };

  const handleDeleteLeaderboardRow = async (id: string) => {
    try {
      await tournamentsApi.deleteLeaderboardEntry(tournament.id, id);
      setLeaderboard((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to remove entry");
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await tournamentsApi.update(tournament.id, settingsForm);
      setTournament(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update tournament configuration");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileUpload = async (file: File, targetField: "bannerImage" | "upiQrImage") => {
    try {
      const res = await tournamentsApi.uploadImage(file);
      setSettingsForm((prev) => ({ ...prev, [targetField]: res.url }));
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "LIVE":
      case "ONGOING":
        return "bg-red-950/80 text-red-400 border-red-500/40 animate-pulse";
      case "REGISTRATION_OPEN":
      case "UPCOMING":
        return "bg-amber-950/60 text-[#fc8100] border-[#fc8100]/40";
      case "COMPLETED":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-500/40";
      case "DRAFT":
        return "bg-neutral-800 text-gray-300 border-white/10";
      default:
        return "bg-black/50 text-gray-400 border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/tournaments"
          className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[#fc8100]" />
          <span>Back to Tournaments</span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={`/tournaments/${tournament.slug || tournament.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold text-gray-300 uppercase tracking-wider"
          >
            <span>Public Website Page</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#fc8100]" />
          </a>
          <button
            onClick={async () => {
              if (confirm("Duplicate this tournament configuration?")) {
                const dup = await tournamentsApi.duplicate(tournament.id);
                navigate(`/admin/tournaments/${dup.id}`);
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 hover:bg-white/5 text-xs font-heading font-bold text-gray-400 hover:text-white uppercase"
          >
            Duplicate
          </button>
        </div>
      </div>

      {/* ================= COMMAND HEADER ================= */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-hidden shadow-2xl">
        {/* Banner Backdrop */}
        <div className="relative h-44 sm:h-52 w-full bg-gradient-to-r from-black via-[#141419] to-black overflow-hidden">
          <img
            src={getTournamentBannerUrl(tournament.bannerImage, tournament.title)}
            alt={tournament.title}
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_TOURNAMENT_BANNER;
            }}
            className="h-full w-full object-cover opacity-50 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-[#0C0C0E]/70 to-transparent" />

          {/* Top Info overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-widest bg-black/70 border border-white/10 text-white backdrop-blur-md">
              <Shield className="h-3 w-3 text-[#fc8100]" />
              {tournament.game}
            </span>

            <span
              className={`px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusBadge(
                tournament.status
              )}`}
            >
              {tournament.status.replace("_", " ")}
            </span>
          </div>

          {/* Banner Quick Stats Bar */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-4xl uppercase tracking-wider text-white drop-shadow-md">
                {tournament.title}
              </h1>
              <p className="text-xs text-gray-300 font-body mt-1 max-w-2xl line-clamp-1">
                {tournament.tagline}
              </p>
            </div>

            {/* DYNAMIC REGISTRATION COUNTERS */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-black/80 border border-[#fc8100]/40 backdrop-blur-md text-right shadow-[0_0_15px_rgba(252, 129, 0,0.15)]">
                <div className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#fc8100]">
                  TEAMS REGISTERED
                </div>
                <div className="font-display text-xl sm:text-2xl text-white font-bold">
                  <span className="text-[#fc8100]">{statsTotal}</span> / {tournament.totalTeams}
                </div>
              </div>

              <div className="hidden sm:block px-4 py-2 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md text-right">
                <div className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-400">
                  PRIZE POOL
                </div>
                <div className="font-display text-xl text-white font-bold text-[#fc8100]">
                  {formatCurrency(tournament.prizePool)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center overflow-x-auto border-t border-white/10 bg-[#09090B] px-4 scrollbar-none">
          {(
            [
              { key: "OVERVIEW", label: "Overview", icon: Layers },
              { key: "REGISTRATIONS", label: `Registrations (${statsTotal})`, icon: Users },
              { key: "WAITLIST", label: `Waitlist (${waitlist.length})`, icon: Clock },
              { key: "CHECKIN", label: "Check-In", icon: CheckCircle2 },
              { key: "MATCHES", label: `Matches (${tournamentMatches.length})`, icon: Radio },
              { key: "TEAMS", label: `Teams (${statsApproved})`, icon: Shield },
              { key: "STAGES", label: `Rounds (${rounds.length || stages.length})`, icon: ListOrdered },
              { key: "LEADERBOARD", label: "Leaderboard", icon: Award },
              { key: "PAYMENTS", label: `Payments (${statsPaymentVerified})`, icon: CreditCard },
              { key: "SETTINGS", label: "Settings", icon: Settings },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3.5 px-4 font-heading text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  active
                    ? "border-[#fc8100] text-[#fc8100] bg-[#fc8100]/5"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#fc8100]" : "text-gray-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-white/10">
              <div className="text-[10px] font-heading uppercase tracking-wider text-gray-400">Total Registered</div>
              <div className="mt-1 font-display text-2xl font-bold text-white">{statsTotal}</div>
              <div className="text-[10px] text-gray-500 mt-1">Cap: {tournament.totalTeams} Teams</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-emerald-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-emerald-400">Approved</div>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-400">{statsApproved}</div>
              <div className="text-[10px] text-emerald-500/60 mt-1">Confirmed Slots</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-amber-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-amber-400">Under Review</div>
              <div className="mt-1 font-display text-2xl font-bold text-amber-400">{statsPending}</div>
              <div className="text-[10px] text-amber-500/60 mt-1">Awaiting Decision</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-amber-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-amber-400">Payment Pending</div>
              <div className="mt-1 font-display text-2xl font-bold text-amber-400">{statsPaymentPending}</div>
              <div className="text-[10px] text-amber-500/60 mt-1">Unpaid / No UTR</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-cyan-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-cyan-400">Payment Verified</div>
              <div className="mt-1 font-display text-2xl font-bold text-cyan-400">{statsPaymentVerified}</div>
              <div className="text-[10px] text-cyan-500/60 mt-1">Verified on Bank/UPI</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-red-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-red-400">Rejected</div>
              <div className="mt-1 font-display text-2xl font-bold text-red-400">{statsRejected}</div>
              <div className="text-[10px] text-red-500/60 mt-1">Ineligible / Disqualified</div>
            </div>
          </div>

          {/* Quick Overview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Stages Progression Flow */}
              <div className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-[#fc8100]" />
                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                      Tournament Stages Pipeline
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("STAGES")}
                    className="text-xs text-[#fc8100] hover:underline font-heading uppercase font-bold"
                  >
                    Manage Stages &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {stages.map((stg) => (
                    <div
                      key={stg.id}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>STAGE 0{stg.order}</span>
                          <span className="text-amber-400">{stg.status}</span>
                        </div>
                        <h4 className="font-display text-base text-white uppercase mt-1">{stg.name}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                          {stg.qualificationCriteria || "Standard points advance"}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Squads:</span>
                        <span className="font-bold text-white">
                          {registrations.filter((r) => r.currentStageId === stg.id).length} Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament Description & Rules */}
              <div className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                  Description & Rules Summary
                </h3>
                <p className="text-xs text-gray-300 font-body leading-relaxed">
                  {tournament.description || tournament.shortDescription || "No detailed description provided."}
                </p>

                {tournament.rules && (
                  <div className="mt-4 p-3.5 rounded-xl bg-black/60 border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-line">
                    <span className="text-[#fc8100] font-heading font-bold uppercase block mb-1">
                      Official Tournament Rules:
                    </span>
                    {tournament.rules}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Info Rail */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4 text-xs">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#fc8100]">
                  Tournament Specifications
                </h3>

                <div className="space-y-2.5 divide-y divide-white/5">
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white font-medium">{tournament.format}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Entry Fee:</span>
                    <span className="text-[#fc8100] font-bold">
                      {tournament.feeAmount && tournament.feeAmount > 0 ? `₹${tournament.feeAmount}` : tournament.entryFee}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">UPI Receiver ID:</span>
                    <span className="text-white font-mono">{tournament.upiId || "None"}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Roster Capacity:</span>
                    <span className="text-white">
                      {tournament.teamSize || 4} Starters + {tournament.substituteCount || 1} Subs
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Start Date:</span>
                    <span className="text-white">{formatDate(tournament.date || (tournament as any).startDate)}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setActiveTab("SETTINGS")}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-heading font-bold uppercase text-white flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-[#fc8100]" /> Edit Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REGISTRATIONS ================= */}
      {activeTab === "REGISTRATIONS" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                Squads Registered for {tournament.title}
              </h2>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                Displaying <strong>{filteredRegistrations.length}</strong> of <strong>{registrations.length}</strong> total registered squads.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-heading font-bold uppercase text-gray-200 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#fc8100]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Registration Status filter */}
              <select
                value={regFilterStatus}
                onChange={(e) => setRegFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-black/60 border border-white/10 text-white cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Payment status filter */}
              <select
                value={regFilterPayment}
                onChange={(e) => setRegFilterPayment(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-black/60 border border-white/10 text-white cursor-pointer"
              >
                <option value="ALL">Payment: All</option>
                <option value="VERIFIED">Payment Verified</option>
                <option value="SUBMITTED">Payment Submitted</option>
                <option value="PENDING">Payment Pending</option>
              </select>

              {/* Stage filter */}
              <select
                value={regFilterStage}
                onChange={(e) => setRegFilterStage(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-black/60 border border-white/10 text-white cursor-pointer"
              >
                <option value="ALL">Stage: All Stages</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                value={regSearchQuery}
                onChange={(e) => setRegSearchQuery(e.target.value)}
                placeholder="Search team, captain, UTR..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#fc8100]"
              />
            </div>
          </div>

          {/* Bulk actions banner if checked */}
          {selectedRegIds.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <span className="font-heading font-bold text-amber-300">
                {selectedRegIds.length} squads selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("APPROVE")}
                  className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold uppercase text-[11px]"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkAction("VERIFY_PAYMENT")}
                  className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold uppercase text-[11px]"
                >
                  Verify Payment
                </button>
                <button
                  onClick={() => handleBulkAction("REJECT")}
                  className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold uppercase text-[11px]"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => setSelectedRegIds([])}
                  className="px-2 py-1 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs font-heading">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredRegistrations.length > 0 &&
                        selectedRegIds.length === filteredRegistrations.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRegIds(filteredRegistrations.map((r) => r.id));
                        } else {
                          setSelectedRegIds([]);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">TEAM / REG NUMBER</th>
                  <th className="py-3 px-3">CAPTAIN / LEADER</th>
                  <th className="py-3 px-3">PLAYERS</th>
                  <th className="py-3 px-3">PAYMENT</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">STAGE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((r) => {
                    const isSelected = selectedRegIds.includes(r.id);
                    const currentStageName =
                      stages.find((s) => s.id === r.currentStageId)?.name || "Round 1";
                    const isApproved = r.status === "APPROVED";
                    const isPending = r.status === "PENDING" || r.status === "UNDER_REVIEW";

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isSelected ? "bg-[#fc8100]/5" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRegIds((prev) => [...prev, r.id]);
                              } else {
                                setSelectedRegIds((prev) => prev.filter((id) => id !== r.id));
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{r.teamName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {r.registrationNumber || r.id}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white font-mono text-xs">{r.captainIgn}</div>
                          <div className="text-[10px] text-gray-400">{r.captainName || r.whatsapp}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/5 text-[11px] text-gray-300 font-mono">
                            {r.players && r.players.length > 0
                              ? `${r.players.length} Players`
                              : r.playerNames
                              ? `${r.playerNames.split(",").map((s) => s.trim()).filter(Boolean).length} Players`
                              : "4 Players"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              r.paymentStatus === "FREE" || r.paymentStatus === "VERIFIED"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                : r.paymentStatus === "SUBMITTED"
                                ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30"
                                : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {r.paymentStatus === "FREE" ? "FREE PRE-ENTRY" : r.paymentStatus}
                          </span>
                          {r.payment?.utr && (
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              UTR: {r.payment.utr.slice(0, 10)}...
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                : isPending
                                ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                : "bg-red-950/60 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300">
                            {currentStageName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveRegDetail(r)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#fc8100] text-gray-300 hover:text-black border border-white/10 hover:border-[#fc8100] text-[11px] font-bold uppercase transition-all cursor-pointer"
                            >
                              View
                            </button>
                            {!isApproved && (
                              <button
                                onClick={() => handleUpdateRegStatus(r.id, "APPROVED")}
                                title="Approve Registration"
                                className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {r.status !== "REJECTED" && (
                              <button
                                onClick={() => handleUpdateRegStatus(r.id, "REJECTED")}
                                title="Reject Registration"
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No registered teams found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: WAITLIST ================= */}
      {activeTab === "WAITLIST" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#fc8100]" />
                Tournament Waitlist Queue ({waitlist.length})
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Teams registered after all slots were confirmed. If a confirmed team forfeits or fails check-in, promote the next waitlisted team.
              </p>
            </div>
            <button
              onClick={loadWaitlist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold text-gray-300 uppercase"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${waitlistLoading ? "animate-spin" : ""}`} /> Refresh Queue
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 bg-black/40 text-[10px] font-heading font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3 px-4">Queue #</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Captain IGN</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Joined At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {waitlist.length > 0 ? (
                  waitlist.map((w, idx) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#fc8100]/10 border border-[#fc8100]/30 text-[#fc8100] font-bold text-xs">
                          #{w.waitlistPriority || idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white uppercase">{w.teamName}</td>
                      <td className="py-3 px-4 text-[#fc8100]">{w.captainIgn}</td>
                      <td className="py-3 px-4 text-gray-400">{w.whatsapp || w.captainPhone || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          w.paymentStatus === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {w.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{formatDate(w.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handlePromoteWaitlist(w.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-heading font-bold uppercase transition-all"
                          >
                            Promote to Slot
                          </button>
                          <button
                            onClick={() => handleRemoveWaitlist(w.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-all"
                            title="Remove from waitlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No teams currently on the waitlist.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: CHECK-IN ================= */}
      {activeTab === "CHECKIN" && (
        <div className="space-y-4">
          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-white/10">
              <div className="text-[10px] font-heading uppercase tracking-wider text-gray-400">Total Confirmed</div>
              <div className="mt-1 font-display text-2xl font-bold text-white">{checkInStats.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-emerald-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-emerald-400">Checked In</div>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-400">{checkInStats.checkedIn}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-amber-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-amber-400">Awaiting Check-In</div>
              <div className="mt-1 font-display text-2xl font-bold text-amber-400">{checkInStats.pending}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0D12] border border-rose-500/20">
              <div className="text-[10px] font-heading uppercase tracking-wider text-rose-400">No-Shows</div>
              <div className="mt-1 font-display text-2xl font-bold text-rose-400">{checkInStats.noShows}</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div className="text-xs text-gray-400 font-mono">
              Check-In Mode: <strong className="text-white">{tournament.checkInEnabled ? "ENABLED" : "DISABLED"}</strong>
              {tournament.checkInStartTime && ` • Window: ${formatDate(tournament.checkInStartTime)} to ${formatDate(tournament.checkInEndTime)}`}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadCheckIn}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold text-gray-300 uppercase flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkInLoading ? "animate-spin" : ""}`} /> Refresh
              </button>

              <button
                onClick={handleRunNoShows}
                className="px-4 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-heading font-bold uppercase transition-all"
              >
                Run No-Show Timeout
              </button>
            </div>
          </div>

          {/* Teams Table */}
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 bg-black/40 text-[10px] font-heading font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Check-In Status</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4 text-right">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {checkInStats.teams && checkInStats.teams.length > 0 ? (
                  checkInStats.teams.map((tm) => (
                    <tr key={tm.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-white uppercase">{tm.teamName}</td>
                      <td className="py-3 px-4 text-[#fc8100]">{tm.captainIgn}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          tm.checkInStatus === "CHECKED_IN"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : tm.checkInStatus === "NO_SHOW"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {tm.checkInStatus || "NOT_CHECKED_IN"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {tm.checkInTime ? formatDate(tm.checkInTime) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tm.checkInStatus !== "CHECKED_IN" && (
                          <button
                            onClick={() => handleAdminCheckIn(tm.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-heading font-bold uppercase transition-all"
                          >
                            Mark Checked In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      No confirmed teams to check in.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: MATCHES ================= */}
      {activeTab === "MATCHES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#fc8100]" />
                Tournament Match Center & Custom Rooms ({tournamentMatches.length})
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Manage live games, maps, server region, and custom room credentials with timed release to approved teams.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadMatches}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold text-gray-300 uppercase flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${matchesLoading ? "animate-spin" : ""}`} /> Refresh
              </button>

              <button
                onClick={() => {
                  setEditingMatch(null);
                  setMatchFormData({
                    roundId: activeRoundId || (rounds[0]?.id || ""),
                    matchNumber: tournamentMatches.length + 1,
                    stage: "ROUND 1",
                    game: "FREE FIRE MAX",
                    map: "BERMUDA",
                    serverRegion: "INDIA",
                    status: "UPCOMING",
                    teamAName: "MG ESPORTS",
                    teamATag: "LORDZ",
                    teamAScore: 0,
                    teamBName: "OPPONENT",
                    teamBTag: "OPP",
                    teamBScore: 0,
                    startTime: "",
                    roomId: "",
                    roomPassword: "",
                    credentialsReleaseTime: "",
                    streamUrl: "",
                  });
                  setMatchModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Match
              </button>
            </div>
          </div>

          {/* Match List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournamentMatches.length > 0 ? (
              tournamentMatches.map((m) => (
                <div key={m.id} className="p-5 rounded-2xl border border-white/10 bg-[#0C0C0E] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-black border border-white/10 text-[10px] font-mono font-bold text-[#fc8100] uppercase">
                        {m.map || "BERMUDA"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase ${
                        m.status === "LIVE" ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-neutral-800 text-gray-300"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMatch(m);
                          setMatchFormData({
                            roundId: m.roundId || "",
                            matchNumber: m.matchNumber || 1,
                            stage: m.stage || "ROUND 1",
                            game: m.game || "FREE FIRE MAX",
                            map: m.map || "BERMUDA",
                            serverRegion: m.serverRegion || "INDIA",
                            status: m.status || "UPCOMING",
                            teamAName: m.teamAName || "",
                            teamATag: m.teamATag || "",
                            teamAScore: m.teamAScore || 0,
                            teamBName: m.teamBName || "",
                            teamBTag: m.teamBTag || "",
                            teamBScore: m.teamBScore || 0,
                            startTime: m.startTime || "",
                            roomId: m.roomId || "",
                            roomPassword: m.roomPassword || "",
                            credentialsReleaseTime: m.credentialsReleaseTime ? m.credentialsReleaseTime.slice(0, 16) : "",
                            streamUrl: m.streamUrl || "",
                          });
                          setMatchModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Edit Match / Set Room ID"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400"
                        title="Delete Match"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Teams / Scoreboard */}
                  <div className="flex items-center justify-between px-2 font-display text-lg text-white uppercase">
                    <div>{m.teamAName}</div>
                    <div className="text-[#fc8100] font-mono text-base px-3 py-1 rounded bg-black/60 border border-white/10">
                      {m.teamAScore} : {m.teamBScore}
                    </div>
                    <div>{m.teamBName}</div>
                  </div>

                  {/* Custom Room Credentials Pill */}
                  <div className="p-3 rounded-xl bg-black/70 border border-white/10 space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1"><Key className="h-3 w-3 text-[#fc8100]" /> Room Credentials:</span>
                      <span>Region: {m.serverRegion || "INDIA"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-white">ID: <strong className="text-[#fc8100]">{m.roomId || "Not Set"}</strong></span>
                      <span className="text-white">Pass: <strong className="text-[#fc8100]">{m.roomPassword || "Not Set"}</strong></span>
                    </div>
                    {m.credentialsReleaseTime && (
                      <div className="text-[10px] text-gray-500 pt-1">
                        Release Timer: {formatDate(m.credentialsReleaseTime)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-gray-500 rounded-2xl border border-white/5 bg-[#0C0C0E]">
                No matches scheduled yet. Click "Create Match" above.
              </div>
            )}
          </div>

          {/* Match Modal */}
          {matchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-lg rounded-2xl bg-[#0D0D12] border border-[#fc8100]/40 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg uppercase text-white">
                    {editingMatch ? "Edit Match & Room Credentials" : "Create Tournament Match"}
                  </h3>
                  <button onClick={() => setMatchModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">Map</label>
                      <select
                        value={matchFormData.map}
                        onChange={(e) => setMatchFormData({ ...matchFormData, map: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white"
                      >
                        <option value="BERMUDA">BERMUDA</option>
                        <option value="PURGATORY">PURGATORY</option>
                        <option value="KALAHARI">KALAHARI</option>
                        <option value="ALPINE">ALPINE</option>
                        <option value="NEXTERRA">NEXTERRA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">Status</label>
                      <select
                        value={matchFormData.status}
                        onChange={(e) => setMatchFormData({ ...matchFormData, status: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white"
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE</option>
                        <option value="RESULT">RESULT / COMPLETED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">Team A Name</label>
                      <input
                        type="text"
                        value={matchFormData.teamAName}
                        onChange={(e) => setMatchFormData({ ...matchFormData, teamAName: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">Team B Name</label>
                      <input
                        type="text"
                        value={matchFormData.teamBName}
                        onChange={(e) => setMatchFormData({ ...matchFormData, teamBName: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Room Credentials Section */}
                  <div className="p-3 rounded-xl border border-white/10 bg-black/60 space-y-3">
                    <span className="text-xs font-heading font-bold uppercase text-[#fc8100] flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Custom Room Credentials
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-gray-400 mb-1">Room ID</label>
                        <input
                          type="text"
                          value={matchFormData.roomId}
                          onChange={(e) => setMatchFormData({ ...matchFormData, roomId: e.target.value })}
                          placeholder="e.g. 98127394"
                          className="w-full rounded-xl border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-gray-400 mb-1">Room Password</label>
                        <input
                          type="text"
                          value={matchFormData.roomPassword}
                          onChange={(e) => setMatchFormData({ ...matchFormData, roomPassword: e.target.value })}
                          placeholder="e.g. lordz123"
                          className="w-full rounded-xl border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-400 mb-1">Timed Credentials Release Time</label>
                      <input
                        type="datetime-local"
                        value={matchFormData.credentialsReleaseTime}
                        onChange={(e) => setMatchFormData({ ...matchFormData, credentialsReleaseTime: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading font-bold text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase"
                    >
                      Save Match
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: TEAMS ================= */}
      {activeTab === "TEAMS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white">
              Approved Participating Squads ({statsApproved})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registrations
              .filter((r) => r.status === "APPROVED" || r.status === "CONFIRMED")
              .map((team) => (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 hover:border-[#fc8100]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded bg-[#fc8100]/10 text-[#fc8100] border border-[#fc8100]/20 text-[10px] font-bold">
                        SLOT #{team.slotNumber || 1}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {team.registrationNumber}
                      </span>
                    </div>

                    <h3 className="font-display text-xl text-white uppercase">{team.teamName}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Captain: <span className="text-[#fc8100]">{team.captainIgn}</span>
                    </p>

                    {/* Players Roster */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                        Active Roster:
                      </div>
                      {team.players && team.players.length > 0 ? (
                        team.players.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs font-mono text-gray-300"
                          >
                            <span>{p.ign}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{p.role}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 font-mono">{team.playerNames}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> VERIFIED ENTRY
                    </span>
                    <button
                      onClick={() => setActiveRegDetail(team)}
                      className="text-xs text-[#fc8100] hover:underline font-bold"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: ROUNDS & TEAM PROGRESSION ================= */}
      {/* ================= TAB 4: ROUNDS & TEAM PROGRESSION ================= */}
      {activeTab === "STAGES" && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0D0D12] border border-white/10 shadow-lg">
            <div>
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#fc8100]" />
                Tournament Rounds &amp; Divisions Engine
              </h2>
              <p className="text-xs text-gray-400 font-body mt-1">
                Free Fire Custom Rooms cap at 12 squads per match. Create multiple divisions (Div A, Div B, Div C) for Round 1 &amp; Round 2, auto-distribute squads, manage independent room credentials, and advance qualified squads.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBatchDivisionsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer border border-white/10 hover:border-[#fc8100]/40 transition-all"
              >
                <Sparkles className="h-4 w-4 text-[#fc8100]" /> Quick Setup Divisions
              </button>
              <button
                type="button"
                onClick={() => {
                  const maxRoundNum = rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) : 1;
                  setNewRoundData({
                    name: `ROUND ${maxRoundNum} - DIVISION A`,
                    roundStage: `ROUND ${maxRoundNum}`,
                    divisionLetter: "DIVISION A",
                    roundNumber: maxRoundNum,
                    roundType: "BATTLE_ROYALE",
                    maxTeams: 12,
                    selectionMethod: "MANUAL",
                    startDate: "",
                    startTime: "",
                    description: "",
                  });
                  setNewRoundModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.2)] transition-all"
              >
                <Plus className="h-4 w-4" /> Add Division / Round
              </button>
            </div>
          </div>

          {rounds.length === 0 ? (
            <div className="p-12 rounded-2xl border border-white/10 bg-[#0C0C0E] text-center space-y-4 shadow-xl">
              <div className="h-16 w-16 rounded-2xl bg-[#fc8100]/10 border border-[#fc8100]/30 flex items-center justify-center text-[#fc8100] mx-auto shadow-[0_0_20px_rgba(252, 129, 0,0.15)]">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-display text-xl text-white uppercase">No Rounds or Divisions Configured</h3>
                <p className="text-xs text-gray-400 font-body">
                  For Free Fire tournaments (32, 24, or 48 squads), set up multiple divisions (A, B, C) where each custom room has a 12-squad limit.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setBatchStageName("ROUND 1");
                    setBatchRoundNumber(1);
                    setBatchDivisionsList(["DIVISION A", "DIVISION B", "DIVISION C"]);
                    setBatchDivisionsModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.2)] inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Quick Setup 32-Squad Divisions (A, B, C)
                </button>
                <button
                  onClick={() => setNewRoundModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer border border-white/10 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Create Single Custom Division
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stage Filter Selector */}
              {(() => {
                const uniqueStageNumbers = Array.from(new Set(rounds.map((r) => r.roundNumber))).sort((a, b) => a - b);
                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedStageFilter("ALL")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all cursor-pointer whitespace-nowrap border ${
                        selectedStageFilter === "ALL"
                          ? "bg-[#fc8100] text-black border-[#fc8100] shadow-[0_0_12px_rgba(252, 129, 0,0.3)]"
                          : "bg-black/50 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      All Divisions ({rounds.length})
                    </button>
                    {uniqueStageNumbers.map((sNum) => {
                      const stageRounds = rounds.filter((r) => r.roundNumber === sNum);
                      const totalSquads = stageRounds.reduce((acc, r) => acc + (r.roundTeams?.length || 0), 0);
                      const isSelected = selectedStageFilter === sNum;
                      return (
                        <button
                          key={sNum}
                          type="button"
                          onClick={() => {
                            setSelectedStageFilter(sNum);
                            const firstInStage = stageRounds[0];
                            if (firstInStage) setActiveRoundId(firstInStage.id);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all cursor-pointer whitespace-nowrap border flex items-center gap-2 ${
                            isSelected
                              ? "bg-[#fc8100] text-black border-[#fc8100] shadow-[0_0_12px_rgba(252, 129, 0,0.3)]"
                              : "bg-black/50 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <span>ROUND {sNum}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              isSelected ? "bg-black/20 text-black font-black" : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {stageRounds.length} Divs • {totalSquads} Squads
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Division Selector Ribbon */}
              {(() => {
                const visibleRounds =
                  selectedStageFilter === "ALL"
                    ? rounds
                    : rounds.filter((r) => r.roundNumber === selectedStageFilter);

                const currentStageNum =
                  selectedStageFilter === "ALL"
                    ? (rounds.find((r) => r.id === activeRoundId)?.roundNumber || 1)
                    : selectedStageFilter;

                return (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-heading font-bold uppercase text-gray-400">
                          {selectedStageFilter === "ALL" ? "All Configured Divisions" : `Round ${selectedStageFilter} Divisions`}:
                        </span>
                        <span className="text-[10px] font-mono text-[#fc8100]">
                          ({visibleRounds.length} custom match lobbies)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={autoDistributeLoading}
                          onClick={() => handleAutoDistributeSquads(currentStageNum)}
                          className="px-2.5 py-1 rounded-lg bg-[#fc8100]/10 hover:bg-[#fc8100] text-[#fc8100] hover:text-black border border-[#fc8100]/30 text-[10px] font-heading font-bold uppercase cursor-pointer transition-all inline-flex items-center gap-1 disabled:opacity-50"
                          title="Evenly distribute confirmed squads into these divisions (12 squads max each)"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{autoDistributeLoading ? "Distributing..." : `Auto-Split Squads into Round ${currentStageNum}`}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewRoundData({
                              name: `ROUND ${currentStageNum} - DIVISION ${String.fromCharCode(65 + visibleRounds.length)}`,
                              roundStage: `ROUND ${currentStageNum}`,
                              divisionLetter: `DIVISION ${String.fromCharCode(65 + visibleRounds.length)}`,
                              roundNumber: currentStageNum,
                              roundType: "BATTLE_ROYALE",
                              maxTeams: 12,
                              selectionMethod: "MANUAL",
                              startDate: "",
                              startTime: "",
                              description: "",
                            });
                            setNewRoundModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 text-[10px] font-heading font-bold uppercase cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Division
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {visibleRounds.map((round) => {
                        const isActive = activeRoundId === round.id;
                        const roundTeamCount = (round.roundTeams || []).length;
                        const isPublished = Boolean(round.credentialsPublished);

                        return (
                          <button
                            key={round.id}
                            type="button"
                            onClick={() => setActiveRoundId(round.id)}
                            className={`flex flex-col gap-1 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 text-left ${
                              isActive
                                ? "bg-[#fc8100]/15 border-[#fc8100] shadow-[0_0_15px_rgba(252, 129, 0,0.25)]"
                                : "bg-[#0C0C0E] border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-display text-sm uppercase ${isActive ? "text-white" : "text-gray-300"}`}>
                                {round.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  roundTeamCount >= (round.maxTeams || 12)
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-white/10 text-gray-300"
                                }`}
                              >
                                {roundTeamCount}/{round.maxTeams || 12}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  isPublished
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-white/5 text-gray-400 border border-white/10"
                                }`}
                              >
                                {isPublished ? `✓ Room: ${round.roomId || "Live"}` : "🔒 Room Draft"}
                              </span>
                              <span
                                className={`uppercase font-bold ${
                                  round.status === "ONGOING"
                                    ? "text-rose-400"
                                    : round.status === "COMPLETED"
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {round.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Active Round / Division Card */}
              {(() => {
                const currentRound = rounds.find((r) => r.id === activeRoundId) || rounds[0];
                if (!currentRound) return null;

                const roundTeams = currentRound.roundTeams || [];
                const eligibleTeams = roundTeams.filter(
                  (rt) => rt.status !== "ELIMINATED" && rt.status !== "DISQUALIFIED"
                );
                const allSelected =
                  eligibleTeams.length > 0 &&
                  eligibleTeams.every((rt) => selectedAdvanceTeamIds.includes(rt.teamId));

                return (
                  <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-hidden shadow-2xl space-y-4">
                    {/* Active Round Header */}
                    <div className="p-5 bg-white/[0.02] border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/30 text-[#fc8100] font-display text-lg">
                          {currentRound.roundNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-2xl text-white uppercase">
                              {currentRound.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-gray-300 border border-white/10">
                              {currentRound.roundType.replace("_", " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#fc8100]/10 text-[#fc8100] border border-[#fc8100]/30">
                              LOBBY: {roundTeams.length} / {currentRound.maxTeams || 12} SQUADS MAX
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-body mt-0.5">
                            {(() => {
                              const desc = currentRound.description;
                              if (!desc || (typeof desc === "string" && desc.trim().startsWith("{"))) {
                                return currentRound.customNotes || "Tournament qualification bracket division";
                              }
                              return desc;
                            })()}
                            {currentRound.startDate && ` • Starts: ${currentRound.startDate} ${currentRound.startTime || ""}`}
                          </p>
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Round Status Dropdown */}
                        <select
                          value={currentRound.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            await tournamentsApi.updateRound(tournament.id, currentRound.id, {
                              status: newStatus,
                            });
                            setRounds((prev) =>
                              prev.map((r) => (r.id === currentRound.id ? { ...r, status: newStatus } : r))
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl border border-white/15 bg-black/60 text-xs font-heading font-bold text-white uppercase focus:border-[#fc8100] focus:outline-none cursor-pointer"
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="ONGOING">ONGOING</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>

                        <button
                          onClick={() => handleOpenSelectTeams(currentRound.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer transition-all inline-flex items-center gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5 text-[#fc8100]" />
                          Select Squads ({roundTeams.length}/{currentRound.maxTeams || 12})
                        </button>

                        {selectedAdvanceTeamIds.length > 0 && (
                          <button
                            onClick={() => handleOpenAdvanceModal(currentRound.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(252, 129, 0,0.3)] transition-all inline-flex items-center gap-1.5"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            Advance {selectedAdvanceTeamIds.length} Teams
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteRound(currentRound.id)}
                          title="Delete this division"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* ================= CUSTOM ROOM CREDENTIALS CARD ================= */}
                    <div className="p-4 mx-5 my-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#fc8100]/5 to-black border border-[#fc8100]/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-[#fc8100]/10 border border-[#fc8100]/30 text-[#fc8100]">
                            <Key className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-display text-sm uppercase text-white tracking-wider flex items-center gap-2">
                              <span>Custom Room Credentials</span>
                              <span className="text-[10px] font-mono text-[#fc8100] font-normal">
                                ({currentRound.name})
                              </span>
                            </h4>
                            <p className="text-[11px] text-gray-400 font-body">
                              Separate credentials for {currentRound.name}. Only squads assigned to this division will see these credentials.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleCopyAnnouncement(currentRound)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 border border-white/15"
                            title="Copy match credentials formatted for WhatsApp / Discord announcement"
                          >
                            <Copy className="h-3.5 w-3.5 text-[#fc8100]" />
                            <span>{copiedCredentialsKey === currentRound.id ? "✓ Copied to Clipboard!" : "Copy Announcement"}</span>
                          </button>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 ${
                              roomForm.credentialsPublished
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                roomForm.credentialsPublished ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                              }`}
                            />
                            {roomForm.credentialsPublished ? "Published to Squads ✓" : "Hidden (Draft)"}
                          </span>

                          <button
                            type="button"
                            disabled={savingRoomCredentials}
                            onClick={() => handleSaveRoomCredentials(currentRound.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(252, 129, 0,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>{savingRoomCredentials ? "Saving..." : "Save Credentials"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
                        <div>
                          <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1 text-[11px]">
                            Room ID
                          </label>
                          <input
                            type="text"
                            value={roomForm.roomId}
                            onChange={(e) => setRoomForm({ ...roomForm, roomId: e.target.value })}
                            placeholder="e.g. 8492019"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1 text-[11px]">
                            Room Password
                          </label>
                          <input
                            type="text"
                            value={roomForm.roomPassword}
                            onChange={(e) => setRoomForm({ ...roomForm, roomPassword: e.target.value })}
                            placeholder="e.g. 1234"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1 text-[11px]">
                            Map
                          </label>
                          <select
                            value={roomForm.map}
                            onChange={(e) => setRoomForm({ ...roomForm, map: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-heading font-bold uppercase focus:border-[#fc8100] focus:outline-none cursor-pointer"
                          >
                            <option value="BERMUDA">BERMUDA</option>
                            <option value="PURGATORY">PURGATORY</option>
                            <option value="KALAHARI">KALAHARI</option>
                            <option value="ALPINE">ALPINE</option>
                            <option value="NEXTERRA">NEXTERRA</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1 text-[11px]">
                            Match Time
                          </label>
                          <input
                            type="text"
                            value={roomForm.roomTime}
                            onChange={(e) => setRoomForm({ ...roomForm, roomTime: e.target.value })}
                            placeholder="e.g. 18:30 IST"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:border-[#fc8100]/40 transition-colors">
                            <input
                              type="checkbox"
                              checked={roomForm.credentialsPublished}
                              onChange={(e) => setRoomForm({ ...roomForm, credentialsPublished: e.target.checked })}
                              className="rounded text-[#fc8100] focus:ring-[#fc8100] h-4 w-4 cursor-pointer"
                            />
                            <span className="font-heading font-bold uppercase text-[10px] text-gray-200">
                              Publish to Squads
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 font-heading font-bold uppercase tracking-wider mb-1 text-[10px]">
                          Custom Notes / Instructions for Squads in {currentRound.name}
                        </label>
                        <input
                          type="text"
                          value={roomForm.customNotes}
                          onChange={(e) => setRoomForm({ ...roomForm, customNotes: e.target.value })}
                          placeholder="e.g. Strictly join your assigned Free Fire Slot # (1 to 12). Non-assigned slot players will be kicked."
                          className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-gray-300 font-body focus:border-[#fc8100] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Round Teams Table */}
                    <div className="overflow-x-auto">
                      {roundTeams.length > 0 ? (
                        <table className="w-full text-left text-xs font-heading">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-400 bg-black/40">
                              <th className="py-3 px-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  disabled={eligibleTeams.length === 0}
                                  title={eligibleTeams.length === 0 ? "No eligible squads to advance" : "Select all eligible squads"}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAdvanceTeamIds(eligibleTeams.map((rt) => rt.teamId));
                                    } else {
                                      setSelectedAdvanceTeamIds([]);
                                    }
                                  }}
                                  className={eligibleTeams.length === 0 ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                                />
                              </th>
                              <th className="py-3 px-3 w-24">SLOT #</th>
                              <th className="py-3 px-4">TEAM NAME</th>
                              <th className="py-3 px-3">CAPTAIN / LEADER</th>
                              <th className="py-3 px-3">STATUS IN DIVISION</th>
                              <th className="py-3 px-3">SCORE / PTS</th>
                              <th className="py-3 px-4 text-right">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {roundTeams.map((team, idx) => {
                              const isEliminated = team.status === "ELIMINATED" || team.status === "DISQUALIFIED";
                              const isChecked = selectedAdvanceTeamIds.includes(team.teamId) && !isEliminated;
                              return (
                                <tr
                                  key={team.id || team.teamId}
                                  className={`hover:bg-white/[0.02] transition-colors ${
                                    isChecked ? "bg-[#fc8100]/5" : isEliminated ? "opacity-60 bg-red-950/10" : ""
                                  }`}
                                >
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isEliminated}
                                      title={isEliminated ? "Eliminated squads cannot be advanced" : undefined}
                                      onChange={(e) => {
                                        if (isEliminated) return;
                                        if (e.target.checked) {
                                          setSelectedAdvanceTeamIds((prev) => [...prev, team.teamId]);
                                        } else {
                                          setSelectedAdvanceTeamIds((prev) =>
                                            prev.filter((id) => id !== team.teamId)
                                          );
                                        }
                                      }}
                                      className={isEliminated ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                                    />
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-[#fc8100]">
                                      SLOT #{team.seed || idx + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white uppercase text-sm">
                                      {team.teamName || team.team?.name || team.teamId}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                      ID: {team.teamId}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-gray-300 font-mono">
                                    {team.captainName || "Team Leader"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <select
                                      value={team.status}
                                      onChange={(e) =>
                                        handleUpdateRoundTeam(currentRound.id, team.teamId, {
                                          status: e.target.value,
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-xs font-heading font-bold uppercase border cursor-pointer focus:outline-none ${
                                        team.status === "QUALIFIED"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : team.status === "ADVANCED"
                                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                          : team.status === "ELIMINATED" || team.status === "DISQUALIFIED"
                                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      }`}
                                    >
                                      <option value="QUALIFIED">QUALIFIED</option>
                                      <option value="ADVANCED">ADVANCED</option>
                                      <option value="PENDING">PENDING</option>
                                      <option value="ELIMINATED">ELIMINATED (ENDED)</option>
                                      <option value="DISQUALIFIED">DISQUALIFIED</option>
                                    </select>
                                  </td>
                                  <td className="py-3 px-3">
                                    <input
                                      type="number"
                                      defaultValue={team.score || 0}
                                      onBlur={(e) =>
                                        handleUpdateRoundTeam(currentRound.id, team.teamId, {
                                          score: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-20 px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-white font-mono text-center focus:border-[#fc8100] focus:outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() =>
                                        handleViewHistory(
                                          team.teamId,
                                          team.teamName || team.team?.name || team.teamId
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#fc8100] text-gray-300 hover:text-black border border-white/10 hover:border-[#fc8100] text-[11px] font-bold uppercase transition-all cursor-pointer"
                                    >
                                      <History className="h-3 w-3" /> History
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-12 text-center text-xs text-gray-500 font-mono space-y-2">
                          <p>No squads currently assigned to {currentRound.name}.</p>
                          <button
                            onClick={() => handleOpenSelectTeams(currentRound.id)}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer"
                          >
                            + Select Eligible Squads
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= MODAL: CREATE ROUND / DIVISION ================= */}
          {newRoundModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
              <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-4 my-8">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-display text-xl uppercase text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#fc8100]" />
                    Create Tournament Round / Division
                  </h3>
                  <button
                    onClick={() => setNewRoundModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateRound} className="space-y-4 text-xs">
                  {/* Quick Format Presets */}
                  <div>
                    <span className="text-gray-400 font-heading font-bold uppercase text-[10px] block mb-1.5">
                      Quick Group / Division Presets (12 Squads per Room):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "ROUND 1 - DIVISION A",
                        "ROUND 1 - DIVISION B",
                        "ROUND 1 - DIVISION C",
                        "ROUND 2 - DIVISION A",
                        "ROUND 2 - DIVISION B",
                        "SEMI FINALS",
                        "GRAND FINALS",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const rNum = preset.includes("ROUND 2") ? 2 : preset.includes("SEMI") ? 3 : preset.includes("GRAND") ? 4 : 1;
                            setNewRoundData((prev) => ({
                              ...prev,
                              name: preset,
                              roundNumber: rNum,
                              maxTeams: 12,
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#fc8100]/20 hover:text-[#fc8100] border border-white/10 text-[10px] font-heading font-bold uppercase transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Stage & Division Pickers */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        1. Select Stage:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Round 1", num: 1 },
                          { label: "Round 2", num: 2 },
                          { label: "Round 3", num: 3 },
                          { label: "Semi Finals", num: 4 },
                          { label: "Grand Finals", num: 5 },
                        ].map((stage) => {
                          const isSel = newRoundData.roundNumber === stage.num;
                          return (
                            <button
                              key={stage.num}
                              type="button"
                              onClick={() => {
                                const stagePrefix = stage.label.toUpperCase();
                                const currentDiv = newRoundData.divisionLetter || "DIVISION A";
                                const updatedName = currentDiv === "SINGLE" ? stagePrefix : `${stagePrefix} - ${currentDiv}`;
                                setNewRoundData((prev) => ({
                                  ...prev,
                                  roundStage: stagePrefix,
                                  roundNumber: stage.num,
                                  name: updatedName,
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase border cursor-pointer transition-all ${
                                isSel
                                  ? "bg-[#fc8100] text-black border-[#fc8100]"
                                  : "bg-black/40 text-gray-300 border-white/10 hover:border-white/20"
                              }`}
                            >
                              {stage.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        2. Select Division / Lobby:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Division A", code: "DIVISION A" },
                          { label: "Division B", code: "DIVISION B" },
                          { label: "Division C", code: "DIVISION C" },
                          { label: "Division D", code: "DIVISION D" },
                          { label: "Single Room (No Div)", code: "SINGLE" },
                        ].map((div) => {
                          const isSel = newRoundData.divisionLetter === div.code;
                          return (
                            <button
                              key={div.code}
                              type="button"
                              onClick={() => {
                                const stagePrefix = newRoundData.roundStage || "ROUND 1";
                                const updatedName = div.code === "SINGLE" ? stagePrefix : `${stagePrefix} - ${div.code}`;
                                setNewRoundData((prev) => ({
                                  ...prev,
                                  divisionLetter: div.code,
                                  name: updatedName,
                                  maxTeams: 12,
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase border cursor-pointer transition-all ${
                                isSel
                                  ? "bg-[#fc8100] text-black border-[#fc8100]"
                                  : "bg-black/40 text-gray-300 border-white/10 hover:border-white/20"
                              }`}
                            >
                              {div.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Round / Division Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newRoundData.name}
                        onChange={(e) => setNewRoundData({ ...newRoundData, name: e.target.value })}
                        placeholder="e.g. ROUND 1 - DIVISION A"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-heading font-bold uppercase focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Round Stage Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newRoundData.roundNumber}
                        onChange={(e) =>
                          setNewRoundData({
                            ...newRoundData,
                            roundNumber: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Format / Match Type
                      </label>
                      <select
                        value={newRoundData.roundType}
                        onChange={(e) => setNewRoundData({ ...newRoundData, roundType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-heading font-bold uppercase focus:border-[#fc8100] focus:outline-none"
                      >
                        <option value="BATTLE_ROYALE">BATTLE ROYALE</option>
                        <option value="KNOCKOUT">KNOCKOUT</option>
                        <option value="CUSTOM">CUSTOM BRACKET</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Max Teams Capacity (Free Fire Lobby = 12)
                      </label>
                      <input
                        type="number"
                        min="2"
                        required
                        value={newRoundData.maxTeams}
                        onChange={(e) =>
                          setNewRoundData({
                            ...newRoundData,
                            maxTeams: parseInt(e.target.value) || 12,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={newRoundData.startDate}
                        onChange={(e) => setNewRoundData({ ...newRoundData, startDate: e.target.value })}
                        placeholder="e.g. 2026-09-28"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Start Time
                      </label>
                      <input
                        type="text"
                        value={newRoundData.startTime}
                        onChange={(e) => setNewRoundData({ ...newRoundData, startTime: e.target.value })}
                        placeholder="e.g. 18:00 IST"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                      Description / Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={newRoundData.description}
                      onChange={(e) => setNewRoundData({ ...newRoundData, description: e.target.value })}
                      placeholder="e.g. Opening battle royale bracket with 12 squads per custom room. Top 6 qualify for Round 2."
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setNewRoundModalOpen(false);
                        setBatchDivisionsModalOpen(true);
                      }}
                      className="text-[11px] text-[#fc8100] hover:underline font-heading font-bold uppercase text-left"
                    >
                      ⚡ Create Multiple Divisions at Once &rarr;
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRoundModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white font-heading font-bold uppercase tracking-wider text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(252, 129, 0,0.3)] cursor-pointer"
                      >
                        Create Division
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL: BATCH CREATE DIVISIONS ================= */}
          {batchDivisionsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
              <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-4 my-8">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-display text-xl uppercase text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#fc8100]" />
                    Quick Setup Round Divisions
                  </h3>
                  <button
                    onClick={() => setBatchDivisionsModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-gray-400 font-body">
                    Because Free Fire custom matches support a maximum of <strong>12 squads per lobby</strong>, create all divisions for your stage in one click.
                  </p>

                  {/* Format Preset Buttons */}
                  <div>
                    <span className="text-gray-300 font-heading font-bold uppercase text-[10px] block mb-1.5">
                      Tournament Opening &amp; Stage Presets:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBatchStageName("ROUND 1");
                          setBatchRoundNumber(1);
                          setBatchDivisionsList(["DIVISION A", "DIVISION B", "DIVISION C"]);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          batchRoundNumber === 1 && batchDivisionsList.length === 3
                            ? "bg-[#fc8100]/15 border-[#fc8100] text-white"
                            : "bg-black/40 border-white/10 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div className="font-heading font-bold uppercase text-xs text-[#fc8100]">
                          Round 1: 32 Squads (3 Divs)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Creates Division A (12), Division B (12), Division C (8)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBatchStageName("ROUND 2");
                          setBatchRoundNumber(2);
                          setBatchDivisionsList(["DIVISION A", "DIVISION B"]);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          batchRoundNumber === 2 && batchDivisionsList.length === 2
                            ? "bg-[#fc8100]/15 border-[#fc8100] text-white"
                            : "bg-black/40 border-white/10 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div className="font-heading font-bold uppercase text-xs text-[#fc8100]">
                          Round 2: 24 Squads (2 Divs)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Creates Division A (12) &amp; Division B (12)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBatchStageName("ROUND 1");
                          setBatchRoundNumber(1);
                          setBatchDivisionsList(["DIVISION A", "DIVISION B", "DIVISION C", "DIVISION D"]);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          batchRoundNumber === 1 && batchDivisionsList.length === 4
                            ? "bg-[#fc8100]/15 border-[#fc8100] text-white"
                            : "bg-black/40 border-white/10 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div className="font-heading font-bold uppercase text-xs text-[#fc8100]">
                          Mega 48 Squads (4 Divs)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Creates Division A, B, C, D (12 each)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBatchStageName("GRAND FINALS");
                          setBatchRoundNumber(3);
                          setBatchDivisionsList(["FINALS ROOM"]);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          batchDivisionsList.length === 1
                            ? "bg-[#fc8100]/15 border-[#fc8100] text-white"
                            : "bg-black/40 border-white/10 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div className="font-heading font-bold uppercase text-xs text-[#fc8100]">
                          Grand Finals (1 Room)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Top 12 qualified squads championship
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Stage Name
                      </label>
                      <input
                        type="text"
                        value={batchStageName}
                        onChange={(e) => setBatchStageName(e.target.value.toUpperCase())}
                        placeholder="e.g. ROUND 1"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-heading font-bold uppercase focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                        Round Stage Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={batchRoundNumber}
                        onChange={(e) => setBatchRoundNumber(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-[#fc8100] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Divisions to generate */}
                  <div>
                    <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                      Divisions to Generate (12 Squads Each):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["DIVISION A", "DIVISION B", "DIVISION C", "DIVISION D", "DIVISION E", "DIVISION F"].map((div) => {
                        const isIncluded = batchDivisionsList.includes(div);
                        return (
                          <button
                            key={div}
                            type="button"
                            onClick={() => {
                              if (isIncluded) {
                                setBatchDivisionsList(batchDivisionsList.filter((d) => d !== div));
                              } else {
                                setBatchDivisionsList([...batchDivisionsList, div]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase border cursor-pointer transition-all ${
                              isIncluded
                                ? "bg-[#fc8100] text-black border-[#fc8100] shadow-[0_0_10px_rgba(252, 129, 0,0.3)]"
                                : "bg-black/50 text-gray-400 border-white/10 hover:border-white/20"
                            }`}
                          >
                            {isIncluded ? `✓ ${div}` : `+ ${div}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="p-3 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/30 text-xs font-mono text-gray-300 space-y-1">
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#fc8100]" />
                      <span>Ready to create {batchDivisionsList.length} divisions for {batchStageName}:</span>
                    </div>
                    <p className="text-[11px] text-gray-400 pl-5">
                      {batchDivisionsList.map((d) => `${batchStageName} - ${d}`).join(" • ")}
                    </p>
                    <p className="text-[10px] text-amber-300 pl-5">
                      Total capacity: {batchDivisionsList.length * 12} squads (12 squads max per Free Fire lobby).
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setBatchDivisionsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white font-heading font-bold uppercase tracking-wider text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={batchCreating || batchDivisionsList.length === 0}
                      onClick={handleCreateBatchDivisions}
                      className="px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(252, 129, 0,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {batchCreating ? "Generating Divisions..." : `Create ${batchDivisionsList.length} Divisions Now`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: SELECT ELIGIBLE SQUADS ================= */}
          {eligibleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                  <div>
                    <h3 className="font-display text-xl uppercase text-white">
                      Select Squads for {rounds.find((r) => r.id === activeRoundId)?.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-body">
                      Free Fire Room Limit: Exactly 12 squads per match. Unassigned squads are highlighted below.
                    </p>
                  </div>
                  <button
                    onClick={() => setEligibleModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {eligibleLoading ? (
                  <div className="py-16 text-center text-gray-400 font-mono text-xs animate-pulse">
                    Evaluating eligible squads and room divisions...
                  </div>
                ) : eligibleTeams.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-mono space-y-2">
                    <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                    <p>No eligible squads found for this round.</p>
                    <p className="text-[11px] text-gray-600">
                      Ensure registrations are approved and payments verified in earlier rounds.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Filter Tabs for Easy Division Separation */}
                    {(() => {
                      const unassignedList = eligibleTeams.filter((t) => t.isUnassignedInStage || (!t.alreadySelected && !t.isAssignedToOtherDivisionInStage));
                      const otherDivList = eligibleTeams.filter((t) => t.isAssignedToOtherDivisionInStage);

                      const displayedTeams =
                        eligibleTabFilter === "UNASSIGNED"
                          ? unassignedList
                          : eligibleTabFilter === "OTHER_DIVISIONS"
                          ? otherDivList
                          : eligibleTeams;

                      return (
                        <>
                          <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-heading shrink-0">
                            <button
                              type="button"
                              onClick={() => setEligibleTabFilter("ALL")}
                              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                                eligibleTabFilter === "ALL"
                                  ? "bg-white/15 text-white"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              All Squads ({eligibleTeams.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setEligibleTabFilter("UNASSIGNED")}
                              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                                eligibleTabFilter === "UNASSIGNED"
                                  ? "bg-[#fc8100] text-black font-black"
                                  : "text-[#fc8100] hover:bg-[#fc8100]/10"
                              }`}
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Unassigned ({unassignedList.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEligibleTabFilter("OTHER_DIVISIONS")}
                              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                                eligibleTabFilter === "OTHER_DIVISIONS"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              In Other Divisions ({otherDivList.length})
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 shrink-0 text-xs font-heading gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300 font-bold">
                                {selectedEligibleIds.length} squads selected
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                                  selectedEligibleIds.length === 12
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : selectedEligibleIds.length > 12
                                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                    : "bg-[#fc8100]/10 text-[#fc8100] border-[#fc8100]/30"
                                }`}
                              >
                                Room Lobby: {selectedEligibleIds.length} / 12 Max
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Pick unassigned squads first, up to 12
                                  const unassignedIds = unassignedList.map((t) => t.teamId || t.id);
                                  const fill12 = unassignedIds.slice(0, 12);
                                  setSelectedEligibleIds(fill12);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#fc8100]/15 hover:bg-[#fc8100] text-[#fc8100] hover:text-black border border-[#fc8100]/30 text-[11px] font-bold uppercase cursor-pointer transition-colors"
                              >
                                Select Next 12 Unassigned
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEligibleIds([])}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] font-bold uppercase cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          {selectedEligibleIds.length > 12 && (
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                              <span>Warning: Free Fire custom rooms support 12 squads max. You have selected {selectedEligibleIds.length}.</span>
                            </div>
                          )}

                          <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/40 divide-y divide-white/5">
                            {displayedTeams.map((team) => {
                              const tId = team.teamId || team.id;
                              const isChecked = selectedEligibleIds.includes(tId);
                              const otherDivName = team.otherDivisionName;

                              return (
                                <label
                                  key={tId}
                                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                                    isChecked ? "bg-[#fc8100]/5" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedEligibleIds((prev) => [...prev, tId]);
                                        } else {
                                          setSelectedEligibleIds((prev) => prev.filter((id) => id !== tId));
                                        }
                                      }}
                                      className="cursor-pointer"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-heading font-bold text-white text-sm uppercase">
                                          {team.teamName}
                                        </span>
                                        {otherDivName ? (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                            In {otherDivName}
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Unassigned
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-gray-400 font-mono">
                                        Captain: {team.captainName} {team.captainPhone ? `• ${team.captainPhone}` : ""}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        team.status === "APPROVED" || team.status === "CONFIRMED" || team.status === "QUALIFIED"
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      }`}
                                    >
                                      {team.status}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}

                    <div className="flex justify-end gap-3 pt-3 border-t border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEligibleModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white font-heading font-bold uppercase tracking-wider text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSelectedTeams}
                        className="px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(252, 129, 0,0.3)] cursor-pointer"
                      >
                        Save Squad Selection ({selectedEligibleIds.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================= MODAL: ADVANCE TEAMS ================= */}
          {advanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-display text-xl uppercase text-white flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-[#fc8100]" />
                    Advance Squads to Next Division
                  </h3>
                  <button
                    onClick={() => setAdvanceModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-300 font-heading font-bold uppercase tracking-wider mb-1">
                      Destination Division / Round
                    </label>
                    <select
                      value={advanceTargetRoundId}
                      onChange={(e) => setAdvanceTargetRoundId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-heading font-bold uppercase focus:border-[#fc8100] focus:outline-none cursor-pointer"
                    >
                      <option value="">Select destination division...</option>
                      {rounds
                        .filter((r) => r.id !== advanceSourceRoundId)
                        .map((r) => {
                          const currentTeamsCount = (r.roundTeams || []).length;
                          return (
                            <option key={r.id} value={r.id}>
                              {r.name} (Current: {currentTeamsCount}/12 Squads)
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {advanceTargetRoundId && (
                    <div className="p-2.5 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/30 text-[11px] font-mono text-gray-300 flex items-center justify-between">
                      <span className="text-gray-400">Projected Lobby Capacity:</span>
                      {(() => {
                        const destRound = rounds.find((r) => r.id === advanceTargetRoundId);
                        const cur = (destRound?.roundTeams || []).length;
                        const total = cur + selectedAdvanceTeamIds.length;
                        return (
                          <span
                            className={`font-bold ${
                              total <= 12 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {cur} + {selectedAdvanceTeamIds.length} = {total} / 12 Slots
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  <div>
                    <span className="text-gray-400 font-heading font-bold uppercase tracking-wider block mb-1">
                      Squads Selected for Promotion ({selectedAdvanceTeamIds.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 divide-y divide-white/5 font-mono text-xs text-gray-300">
                      {selectedAdvanceTeamIds.map((tId) => {
                        const roundTeams = rounds.find((r) => r.id === advanceSourceRoundId)?.roundTeams || [];
                        const match = roundTeams.find((rt) => rt.teamId === tId);
                        const isEliminated = match?.status === "ELIMINATED" || match?.status === "DISQUALIFIED";
                        return (
                          <div key={tId} className="py-1 flex items-center justify-between">
                            <span className="text-white font-bold">{match?.teamName || tId}</span>
                            {isEliminated ? (
                              <span className="text-rose-400 text-[10px] font-bold">ELIMINATED (INELIGIBLE)</span>
                            ) : (
                              <span className="text-emerald-400 text-[10px] font-bold">QUALIFIED</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markUnselectedAsEliminated}
                      onChange={(e) => setMarkUnselectedAsEliminated(e.target.checked)}
                      className="mt-0.5 rounded text-red-500 focus:ring-red-400 h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-heading font-bold uppercase tracking-wider text-[11px] block text-red-200">
                        Mark unselected squads as ELIMINATED (Tournament Ended)
                      </span>
                      <span className="text-[10px] text-gray-400 font-body">
                        Unselected squads in this division will see &ldquo;Tournament Ended - Eliminated&rdquo; on their dashboard and will not receive subsequent room credentials.
                      </span>
                    </div>
                  </label>

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setAdvanceModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white font-heading font-bold uppercase tracking-wider text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAdvance}
                      disabled={!advanceTargetRoundId || selectedAdvanceTeamIds.length === 0}
                      className="px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold uppercase tracking-wider text-xs disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                    >
                      Confirm Advancement &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: TEAM ROUND HISTORY ================= */}
          {historyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-display text-xl uppercase text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-[#fc8100]" />
                      Squad Progression History
                    </h3>
                    <p className="text-xs text-[#fc8100] font-heading font-bold uppercase">
                      {historyTeamName}
                    </p>
                  </div>
                  <button
                    onClick={() => setHistoryModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {historyLoading ? (
                  <div className="py-12 text-center text-gray-400 font-mono text-xs animate-pulse">
                    Retrieving bracket trajectory...
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 font-mono">
                    No round participation records found for this squad.
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden divide-y divide-white/5 font-mono text-xs">
                    {historyData.map((h, i) => (
                      <div key={h.id || i} className="p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold uppercase font-heading text-sm">
                            {h.round?.name || `Round ${i + 1}`}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Format: {h.round?.roundType || "Battle Royale"}
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              h.status === "ADVANCED" || h.status === "QUALIFIED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : h.status === "ELIMINATED"
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : "bg-white/10 text-gray-300 border border-white/10"
                            }`}
                          >
                            {h.status}
                          </span>
                          <div className="text-[11px] text-gray-400">
                            Points: <strong className="text-white">{h.score || 0}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setHistoryModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: LEADERBOARD ================= */}
      {activeTab === "LEADERBOARD" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-[#fc8100]" />
                Tournament Leaderboard: {tournament.title}
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Manage points, kills, placements, and ranking. Formula: <strong>Total = Placement + Kills + Bonus</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveLeaderboard}
                disabled={savingLb}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)] disabled:opacity-50"
              >
                {savingLb ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : lbSaveSuccess ? (
                  <Check className="h-4 w-4 text-black" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{lbSaveSuccess ? "Saved & Ranked!" : "Save & Recalculate"}</span>
              </button>
            </div>
          </div>

          {/* Quick Add Team to Leaderboard */}
          <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-wrap items-center gap-3">
            <span className="text-xs font-heading font-bold uppercase text-gray-400">
              Add Squad to Board:
            </span>
            <input
              type="text"
              placeholder="Team Name (e.g. MG ESPORTS)"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Tag (e.g. LZ)"
              value={newTeamTag}
              onChange={(e) => setNewTeamTag(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white w-24"
            />
            <button
              onClick={handleAddLeaderboardRow}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-heading font-bold uppercase text-white cursor-pointer"
            >
              Add Entry
            </button>
          </div>

          {/* Leaderboard Editable Table */}
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs font-heading">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase text-gray-400">
                  <th className="py-3 px-3 w-12 text-center">RANK</th>
                  <th className="py-3 px-4">TEAM NAME</th>
                  <th className="py-3 px-3 text-center">MATCHES</th>
                  <th className="py-3 px-3 text-center">WINS (WWCD)</th>
                  <th className="py-3 px-3 text-center">KILLS</th>
                  <th className="py-3 px-3 text-center">POS PTS</th>
                  <th className="py-3 px-3 text-center">BONUS</th>
                  <th className="py-3 px-4 text-right text-[#fc8100] font-bold">TOTAL POINTS</th>
                  <th className="py-3 px-3 text-center w-12">DEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.length > 0 ? (
                  leaderboard.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-center font-display text-sm text-[#fc8100]">
                        #{row.rank || idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.teamName}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "teamName", e.target.value)
                          }
                          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-white font-bold text-sm w-full outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          value={row.matchesPlayed}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "matchesPlayed", e.target.value)
                          }
                          className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-white w-12 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          value={row.wins}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "wins", e.target.value)
                          }
                          className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-amber-300 w-12 outline-none font-bold"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          value={row.kills}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "kills", e.target.value)
                          }
                          className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-red-400 w-14 outline-none font-bold"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          value={row.placementPoints}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "placementPoints", e.target.value)
                          }
                          className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-white w-14 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          value={row.bonusPoints}
                          onChange={(e) =>
                            handleLeaderboardCellChange(idx, "bonusPoints", e.target.value)
                          }
                          className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-[#fc8100] text-gray-300 w-12 outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-display text-base font-bold text-[#fc8100]">
                        {row.totalPoints}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteLeaderboardRow(row.id)}
                          className="text-gray-600 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      No leaderboard data yet. Add squads above or sync from registered teams.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: PAYMENTS ================= */}
      {activeTab === "PAYMENTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#fc8100]" />
                Tournament Payment Verification Desk
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Verify UPI transactions, inspect UTR reference codes, and view payment screenshots.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs font-heading">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase text-gray-400">
                  <th className="py-3 px-4">TEAM / REG NUMBER</th>
                  <th className="py-3 px-3">PAYER NAME</th>
                  <th className="py-3 px-3">AMOUNT</th>
                  <th className="py-3 px-3">UTR NUMBER</th>
                  <th className="py-3 px-3">SCREENSHOT</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-4 text-right">VERIFY / ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registrations.filter((r) => r.payment !== null || r.paymentStatus !== "PENDING").length > 0 ? (
                  registrations
                    .filter((r) => r.payment !== null || r.paymentStatus !== "PENDING")
                    .map((reg) => {
                      const p = reg.payment;
                      const isVerified = reg.paymentStatus === "VERIFIED";

                      return (
                        <tr key={reg.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{reg.teamName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {reg.registrationNumber}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-300">
                            {p?.payerName || reg.captainName || reg.captainIgn}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            ₹{p?.amount || tournament.feeAmount || 499}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-[#fc8100]">
                            {p?.utr || <span className="text-gray-500">Not provided</span>}
                          </td>
                          <td className="py-3 px-3">
                            {p?.screenshot ? (
                              <button
                                onClick={() => setPreviewScreenshot(p.screenshot || null)}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-[#fc8100] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" /> View Proof
                              </button>
                            ) : (
                              <span className="text-gray-500 text-[10px]">No image</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isVerified
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                  : reg.paymentStatus === "SUBMITTED"
                                  ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30"
                                  : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {reg.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isVerified ? (
                                <button
                                  onClick={() => handleUpdatePayment(reg.id, "VERIFIED", true)}
                                  className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-[11px] font-bold uppercase cursor-pointer transition-all"
                                >
                                  Verify &amp; Approve
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Verified
                                </span>
                              )}
                              <button
                                onClick={() => handleUpdatePayment(reg.id, "REJECTED")}
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold uppercase cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No payment submissions recorded for this tournament.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: SETTINGS & BANNER UPLOAD ================= */}
      {activeTab === "SETTINGS" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0D0D12] border border-white/10">
            <div>
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                Tournament Configuration &amp; Media Assets
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Update tournament title, rules, fee, UPI payment info, and upload official banner.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)] disabled:opacity-50"
            >
              {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{settingsSuccess ? "Configuration Saved!" : "Save Changes"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Banner & Media Column */}
            <div className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#fc8100]">
                Tournament Banner &amp; Media
              </h3>

              {/* Banner Upload Box */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-2">
                  Tournament Banner (Recommended aspect ratio 16:9 or 21:9)
                </label>
                {settingsForm.bannerImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/15 h-44 mb-3">
                    <img
                      src={settingsForm.bannerImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, bannerImage: null })}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-36 rounded-xl border-2 border-dashed border-white/15 bg-black/40 flex flex-col items-center justify-center p-4 text-center mb-3">
                    <Upload className="h-6 w-6 text-gray-500 mb-2" />
                    <span className="text-xs text-gray-400">No banner uploaded</span>
                    <span className="text-[10px] text-gray-600">JPG, PNG, WEBP up to 10MB</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], "bannerImage");
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-heading file:font-bold file:bg-[#fc8100] file:text-black cursor-pointer"
                />
              </div>

              {/* UPI Payment Configuration */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h4 className="font-heading text-xs font-bold uppercase text-white">
                  Payment Setup (UPI ID &amp; QR Code)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                      Registration Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.feeAmount || 0}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          feeAmount: parseInt(e.target.value) || 0,
                          entryFee: parseInt(e.target.value) > 0 ? `₹${e.target.value} / SQUAD` : "FREE ENTRY",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                      UPI ID (e.g. mgesports@upi)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.upiId || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    UPI QR Code Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], "upiQrImage");
                      }
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-heading file:font-bold file:bg-white/10 file:text-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* General Info Column */}
            <div className="p-5 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#fc8100]">
                Basic Information &amp; Schedule
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">Tournament Title</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.title || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">Game</label>
                    <input
                      type="text"
                      value={settingsForm.game || "FREE FIRE MAX"}
                      onChange={(e) => setSettingsForm({ ...settingsForm, game: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">Status</label>
                    <select
                      value={settingsForm.status || "REGISTRATION_OPEN"}
                      onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white cursor-pointer font-bold uppercase"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                      <option value="REGISTRATION_CLOSED">REGISTRATION CLOSED</option>
                      <option value="ONGOING">ONGOING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">Prize Pool</label>
                    <input
                      type="text"
                      value={settingsForm.prizePool || "₹50,000"}
                      onChange={(e) => setSettingsForm({ ...settingsForm, prizePool: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">Max Teams Capacity</label>
                    <input
                      type="number"
                      value={settingsForm.totalTeams || 32}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          totalTeams: parseInt(e.target.value) || 32,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">Rules</label>
                  <textarea
                    rows={4}
                    value={settingsForm.rules || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, rules: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= SQUAD REGISTRATION DETAILS MODAL ================= */}
      {activeRegDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-[#fc8100]">
                  {activeRegDetail.registrationNumber}
                </span>
                <h3 className="font-display text-2xl uppercase text-white">
                  {activeRegDetail.teamName}
                </h3>
              </div>
              <button
                onClick={() => setActiveRegDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Captain & Contact */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-gray-400">Team Leader / Captain Info</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px]">Captain IGN:</span>
                  <span className="text-white font-bold">{activeRegDetail.captainIgn}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Full Name:</span>
                  <span className="text-white">{activeRegDetail.captainName || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">WhatsApp:</span>
                  <span className="text-white">{activeRegDetail.whatsapp}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Discord:</span>
                  <span className="text-white">{activeRegDetail.discordTag || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Email:</span>
                  <span className="text-white">{activeRegDetail.captainEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Current Stage:</span>
                  <span className="text-[#fc8100] font-bold">
                    {stages.find((s) => s.id === activeRegDetail.currentStageId)?.name || "Round 1"}
                  </span>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-bold text-gray-400">Squad Roster</div>
              <div className="rounded-xl border border-white/10 bg-black/40 divide-y divide-white/5 text-xs font-mono">
                {(() => {
                  const rosterPlayers = (activeRegDetail.players && activeRegDetail.players.length > 0)
                    ? activeRegDetail.players
                    : (activeRegDetail.playerNames ? activeRegDetail.playerNames.split(",").map((s) => s.trim()).filter(Boolean) : []).map((ign, idx) => ({
                        id: `p-${idx}`,
                        ign,
                        name: ign,
                        role: idx === 0 ? "IGL" : "STARTER",
                        isCaptain: idx === 0,
                        isSubstitute: false,
                        playerId: "N/A",
                      }));

                  if (rosterPlayers.length === 0) {
                    return <div className="p-3 text-gray-400">No players listed in roster</div>;
                  }

                  return rosterPlayers.map((p, idx) => (
                    <div key={p.id || idx} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">0{idx + 1}</span>
                        <span className="font-bold text-white">{p.ign}</span>
                        {p.isCaptain && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[#fc8100] text-[9px] font-bold">
                            IGL
                          </span>
                        )}
                        {p.isSubstitute && (
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-gray-400 text-[9px]">
                            SUB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                        <span>ID: {p.playerId || "N/A"}</span>
                        <span className="text-amber-400 uppercase">{p.role}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Payment Details */}
            {(() => {
              const payment = activeRegDetail.payment;
              const utr = payment?.utr || (activeRegDetail as any).utr || (activeRegDetail as any).paymentUtr;
              const screenshot = payment?.screenshot || (activeRegDetail as any).screenshot || (activeRegDetail as any).paymentScreenshot;
              const amount = payment?.amount ?? (activeRegDetail as any).feeAmount ?? tournament?.feeAmount ?? 49;
              const method = payment?.method || "UPI";
              const paymentStatus = payment?.status || activeRegDetail.paymentStatus || "PENDING";

              return (
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Payment Verification Proof
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        paymentStatus === "VERIFIED"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                          : paymentStatus === "SUBMITTED" || paymentStatus === "UNDER_REVIEW"
                          ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                          : "bg-red-950/60 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Fee Amount:</span>
                      <span className="text-[#fc8100] font-bold text-sm">₹{amount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Method:</span>
                      <span className="text-white">{method}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">UTR / Transaction:</span>
                      <span className="text-cyan-400 font-bold select-all break-all">
                        {utr || "NOT PROVIDED"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Payer Name:</span>
                      <span className="text-white truncate block">
                        {payment?.payerName || activeRegDetail.captainName || "Athlete"}
                      </span>
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="pt-1">
                    {screenshot ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                        <img
                          src={screenshot}
                          alt="Payment Screenshot Proof"
                          onClick={() => setPreviewScreenshot(screenshot)}
                          className="h-16 w-16 object-cover rounded-lg border border-white/20 hover:border-[#fc8100] cursor-pointer transition-colors shrink-0"
                          title="Click to enlarge"
                        />
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(screenshot)}
                            className="px-3 py-1.5 rounded-lg bg-[#fc8100]/20 hover:bg-[#fc8100] text-[#fc8100] hover:text-black text-xs font-heading font-bold uppercase transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Payment Screenshot
                          </button>
                          <p className="text-[10px] text-gray-400 font-mono">
                            Click image or button to view proof in full high-resolution.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 font-mono italic">
                        No payment screenshot uploaded. Verification relies on UTR: {utr || "None"}.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdatePayment(activeRegDetail.id, "VERIFIED", true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-heading font-bold text-xs uppercase cursor-pointer"
                >
                  Verify Payment &amp; Approve
                </button>
                <button
                  onClick={() => handleUpdateRegStatus(activeRegDetail.id, "REJECTED")}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-heading font-bold text-xs uppercase cursor-pointer"
                >
                  Reject Squad
                </button>
              </div>

              <button
                onClick={() => setActiveRegDetail(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-heading font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREENSHOT PREVIEW MODAL ================= */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full rounded-2xl bg-[#0D0D12] border border-white/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-bold uppercase text-white">
                Payment Screenshot Verification
              </span>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg">
              <img
                src={previewScreenshot}
                alt="Payment Screenshot Proof"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
