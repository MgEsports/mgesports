import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tournamentsApi } from "../api/tournaments";
import { clearClientCache } from "../api/client";
import {
  type Tournament,
  type PrizeTier,
  type SponsorItem,
  getTournamentBannerUrl,
  DEFAULT_TOURNAMENT_BANNER,
} from "../data/tournaments";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  Plus,
  Search,
  Radio,
  Edit,
  Trash2,
  Users,
  X,
  Calendar,
  DollarSign,
  Copy,
  ArrowRight,
  Shield,
  Upload,
  Image as ImageIcon,
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  Eye,
  Percent,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  RefreshCw,
} from "lucide-react";

type FormSection =
  | "BASIC"
  | "TEAM"
  | "SCHEDULE"
  | "PAYMENT"
  | "PRIZES"
  | "FORMAT"
  | "RULES"
  | "REVIEW";

const DEFAULT_PRIZE_TIERS: PrizeTier[] = [
  { id: "p-1", place: "1st Place", type: "PERCENTAGE", percentage: 50, amount: 25000, badge: "🥇" },
  { id: "p-2", place: "2nd Place", type: "PERCENTAGE", percentage: 30, amount: 15000, badge: "🥈" },
  { id: "p-3", place: "3rd Place", type: "PERCENTAGE", percentage: 20, amount: 10000, badge: "🥉" },
];

const DEFAULT_PLACEMENT_MATRIX = [
  { place: 1, points: 12 },
  { place: 2, points: 9 },
  { place: 3, points: 8 },
  { place: 4, points: 7 },
  { place: 5, points: 6 },
  { place: 6, points: 5 },
  { place: 7, points: 4 },
  { place: 8, points: 3 },
  { place: 9, points: 2 },
  { place: 10, points: 1 },
];

export const AdminTournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<FormSection>("BASIC");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [hasRestorableDraft, setHasRestorableDraft] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    game: "FREE FIRE MAX",
    gameCategory: "FREE FIRE MAX" as string,
    status: "REGISTRATION_OPEN" as string,
    prizePool: "₹50,000",
    prizeDistributionType: "PERCENTAGE" as "CUSTOM" | "PERCENTAGE" | "FIXED" | "WINNER_TAKES_ALL",
    allowUnallocatedPrize: true,
    firstPrize: "₹25,000",
    secondPrize: "₹15,000",
    thirdPrize: "₹10,000",
    entryFee: "₹499 / SQUAD",
    feeAmount: 499,
    entryFeeType: "PER_TEAM" as "FREE" | "PER_TEAM" | "PER_PLAYER",
    paymentMethod: "UPI" as "ONLINE" | "UPI" | "BOTH",
    currency: "INR",
    upiId: "mgesports@upi",
    upiQrImage: null as string | null,
    slots: "128 TEAMS",
    totalTeams: 128,
    minTeams: 12,
    teamType: "SQUAD" as "SOLO" | "DUO" | "TRIO" | "SQUAD" | "CUSTOM",
    teamSize: 4,
    minPlayersPerTeam: 4,
    maxPlayersPerTeam: 5,
    allowSubstitutes: true,
    substituteCount: 1,
    allowWaitlist: true,
    allowLateRegistration: false,
    date: "SEP 28, 2026 • 6:00 PM IST",
    startDate: "2026-09-28T18:00",
    endDate: "2026-09-30T22:00",
    startTime: "18:00 IST",
    regStartDate: "2026-09-10T00:00",
    regEndDate: "2026-09-26T23:59",
    rosterLockDate: "2026-09-27T18:00",
    checkInEnabled: true,
    checkInStartTime: "2026-09-28T17:00",
    checkInEndTime: "2026-09-28T17:45",
    noShowTimeoutMinutes: 15,
    format: "BATTLE ROYALE • 6 MATCHES",
    tournamentFormat: "BATTLE_ROYALE" as "BATTLE_ROYALE" | "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN",
    scoringWin: 12,
    scoringKill: 1,
    scoringPlacement: JSON.stringify(DEFAULT_PLACEMENT_MATRIX),
    scoringBonus: "1st Kill: +2 pts, Squad Wipe: +3 pts",
    scoringPenalty: "Late Room Entry: -2 pts",
    featured: false,
    tagline: "Official MG ESPORTS Tier-1 Championship",
    shortDescription: "Top teams battle across Bermuda & Purgatory for the championship trophy.",
    description: "",
    streamUrl: "https://youtube.com/@mgesportsesports",
    bannerImage: DEFAULT_TOURNAMENT_BANNER as string | null,
    logoImage: null as string | null,
    rules: "1. Mobile devices only. Emulators are strictly prohibited.\n2. In-game recording is mandatory for top-tier rounds.\n3. Toxic behavior or abusing officials leads to immediate DQ.\n4. All players must join the official MG ESPORTS Discord.",
    scoringRules: "Win: 12 pts | Kill: 1 pt | 2nd: 9 pts | 3rd: 8 pts",
    refundAvailable: false,
    refundPolicy: "Registration fee is 100% refundable if the tournament is cancelled by admin, or if requested 48 hours prior to roster lock.",
    termsConditions: "MG ESPORTS reserves the right to reschedule matches in case of game server outages.",
    supportEmail: "tournaments@mgesports.in",
    supportPhone: "+91 98765 43210",
    discordUrl: "https://discord.gg/mgesports",
    telegramUrl: "https://t.me/mgesports",
    whatsappUrl: "https://chat.whatsapp.com/lordz",
    isDraft: false,
    isPublished: true,
  });

  // Dynamic Prizes List
  const [prizesList, setPrizesList] = useState<PrizeTier[]>(DEFAULT_PRIZE_TIERS);

  // Dynamic Sponsors List
  const [sponsorsList, setSponsorsList] = useState<SponsorItem[]>([
    { id: "sp-1", name: "Infinix Gaming", tier: "TITLE" },
  ]);

  // Load draft check
  useEffect(() => {
    const saved = localStorage.getItem("lordz_admin_tournament_draft");
    if (saved) {
      setHasRestorableDraft(true);
    }
  }, []);

  // Parse numeric prize pool helper
  const parseNumericPool = (poolStr: string): number => {
    const cleaned = String(poolStr).replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  const totalPoolNumber = parseNumericPool(formData.prizePool);

  // Calculate allocated prize pool sum
  const allocatedPrizeSum = prizesList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingPrizeSum = Math.max(0, totalPoolNumber - allocatedPrizeSum);
  const allocatedPercentage = totalPoolNumber > 0 ? Math.round((allocatedPrizeSum / totalPoolNumber) * 100) : 0;

  // Sync prizes when mode or total pool changes
  const handlePrizeModeChange = (newMode: "CUSTOM" | "PERCENTAGE" | "FIXED" | "WINNER_TAKES_ALL") => {
    setFormData((prev) => ({ ...prev, prizeDistributionType: newMode }));

    if (newMode === "WINNER_TAKES_ALL") {
      setPrizesList([
        { id: "p-1", place: "1st Place (Champion)", type: "PERCENTAGE", percentage: 100, amount: totalPoolNumber, badge: "🏆" },
      ]);
    } else if (newMode === "PERCENTAGE") {
      // Recalculate amounts based on percentages
      setPrizesList((prev) =>
        prev.map((p) => {
          const pct = p.percentage || 0;
          const amt = Math.round((totalPoolNumber * pct) / 100);
          return { ...p, type: "PERCENTAGE", amount: amt };
        })
      );
    } else {
      setPrizesList((prev) => prev.map((p) => ({ ...p, type: "FIXED" })));
    }
  };

  // Update specific prize row
  const updatePrizeTier = (index: number, field: keyof PrizeTier, value: any) => {
    setPrizesList((prev) => {
      const copy = [...prev];
      const tier = { ...copy[index], [field]: value };

      if (field === "percentage") {
        const pct = Math.max(0, Math.min(100, Number(value) || 0));
        tier.percentage = pct;
        tier.amount = Math.round((totalPoolNumber * pct) / 100);
      } else if (field === "amount") {
        const amt = Math.max(0, Number(value) || 0);
        tier.amount = amt;
        if (totalPoolNumber > 0) {
          tier.percentage = Math.round((amt / totalPoolNumber) * 100);
        }
      }

      copy[index] = tier;
      return copy;
    });
  };

  // Add new prize row
  const handleAddPrizeTier = () => {
    const nextRank = prizesList.length + 1;
    let label = `${nextRank}th Place`;
    let badge = "🎖️";
    if (nextRank === 1) { label = "1st Place"; badge = "🥇"; }
    else if (nextRank === 2) { label = "2nd Place"; badge = "🥈"; }
    else if (nextRank === 3) { label = "3rd Place"; badge = "🥉"; }

    const newTier: PrizeTier = {
      id: `p-${Date.now()}`,
      place: label,
      type: formData.prizeDistributionType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
      percentage: 10,
      amount: Math.round((totalPoolNumber * 10) / 100),
      badge,
    };
    setPrizesList((prev) => [...prev, newTier]);
  };

  // Remove prize row
  const handleRemovePrizeTier = (index: number) => {
    if (prizesList.length <= 1) {
      alert("At least one prize position (1st Place) is required.");
      return;
    }
    setPrizesList((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Sponsor
  const handleAddSponsor = () => {
    setSponsorsList((prev) => [
      ...prev,
      { id: `sp-${Date.now()}`, name: "New Sponsor", tier: "ASSOCIATE" },
    ]);
  };

  const handleRemoveSponsor = (index: number) => {
    setSponsorsList((prev) => prev.filter((_, i) => i !== index));
  };

  // QR Code Upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }
    setQrUploading(true);
    try {
      const res = await tournamentsApi.uploadImage(file);
      if (res && res.url) {
        setFormData((prev) => ({ ...prev, upiQrImage: res.url }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload QR code image");
    } finally {
      setQrUploading(false);
    }
  };

  // Banner Upload
  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const res = await tournamentsApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, bannerImage: res.url }));
    } catch (err: any) {
      alert(err.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Logo Upload
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const res = await tournamentsApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, logoImage: res.url }));
    } catch (err: any) {
      alert(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Auto-Save Draft to localStorage
  useEffect(() => {
    if (modalOpen && !editingTournament && formData.title) {
      const draftObj = {
        formData,
        prizesList,
        sponsorsList,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("lordz_admin_tournament_draft", JSON.stringify(draftObj));
    }
  }, [formData, prizesList, sponsorsList, modalOpen, editingTournament]);

  // Restore Draft
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem("lordz_admin_tournament_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.prizesList) setPrizesList(parsed.prizesList);
        if (parsed.sponsorsList) setSponsorsList(parsed.sponsorsList);
        setHasRestorableDraft(false);
      }
    } catch (e) {
      console.warn("Failed to parse draft:", e);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem("lordz_admin_tournament_draft");
    setHasRestorableDraft(false);
  };

  // Load Tournaments
  const loadTournaments = async () => {
    setLoading(true);
    // Always bust cache so admin sees live data, not stale SWR
    clearClientCache("tournaments");
    try {
      const data = await tournamentsApi.getAll({
        status: statusFilter,
        search: searchQuery,
      });
      setTournaments(Array.isArray(data) ? data : []);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, [statusFilter, searchQuery]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingTournament(null);
    setActiveSection("BASIC");
    setPrizesList(DEFAULT_PRIZE_TIERS);
    setFormData({
      title: "",
      slug: "",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "REGISTRATION_OPEN",
      prizePool: "₹50,000",
      prizeDistributionType: "PERCENTAGE",
      allowUnallocatedPrize: true,
      firstPrize: "₹25,000",
      secondPrize: "₹15,000",
      thirdPrize: "₹10,000",
      entryFee: "₹499 / SQUAD",
      feeAmount: 499,
      entryFeeType: "PER_TEAM",
      paymentMethod: "UPI",
      currency: "INR",
      upiId: "mgesports@upi",
      upiQrImage: "/uploads/partner-ewc.png",
      slots: "128 TEAMS",
      totalTeams: 128,
      minTeams: 12,
      teamType: "SQUAD",
      teamSize: 4,
      minPlayersPerTeam: 4,
      maxPlayersPerTeam: 5,
      allowSubstitutes: true,
      substituteCount: 1,
      allowWaitlist: true,
      allowLateRegistration: false,
      date: "SEP 28, 2026 • 6:00 PM IST",
      startDate: "2026-09-28T18:00",
      endDate: "2026-09-30T22:00",
      startTime: "18:00 IST",
      regStartDate: "2026-09-10T00:00",
      regEndDate: "2026-09-26T23:59",
      rosterLockDate: "2026-09-27T18:00",
      checkInEnabled: true,
      checkInStartTime: "2026-09-28T17:00",
      checkInEndTime: "2026-09-28T17:45",
      noShowTimeoutMinutes: 15,
      format: "BATTLE ROYALE • 6 MATCHES",
      tournamentFormat: "BATTLE_ROYALE",
      scoringWin: 12,
      scoringKill: 1,
      scoringPlacement: JSON.stringify(DEFAULT_PLACEMENT_MATRIX),
      scoringBonus: "1st Kill: +2 pts, Squad Wipe: +3 pts",
      scoringPenalty: "Late Room Entry: -2 pts",
      featured: false,
      tagline: "Official MG ESPORTS Championship",
      shortDescription: "High-stakes Free Fire MAX championship with live broadcast.",
      description: "",
      streamUrl: "https://youtube.com/@mgesportsesports",
      bannerImage: DEFAULT_TOURNAMENT_BANNER,
      logoImage: null,
      rules: "1. Mobile devices only. Emulators are strictly prohibited.\n2. In-game recording is mandatory.\n3. Discord check-in is mandatory before matches.",
      scoringRules: "Win: 12 pts | Kill: 1 pt",
      refundAvailable: false,
      refundPolicy: "Registration fee is refundable if tournament is cancelled.",
      termsConditions: "Standard MG ESPORTS tournament guidelines apply.",
      supportEmail: "tournaments@mgesports.in",
      supportPhone: "+91 98765 43210",
      discordUrl: "https://discord.gg/mgesports",
      telegramUrl: "https://t.me/mgesports",
      whatsappUrl: "https://chat.whatsapp.com/lordz",
      isDraft: false,
      isPublished: true,
    });
    setModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (t: Tournament) => {
    setEditingTournament(t);
    setActiveSection("BASIC");

    let loadedPrizes: PrizeTier[] = DEFAULT_PRIZE_TIERS;
    if (t.prizes) {
      try {
        const parsed = JSON.parse(t.prizes);
        if (Array.isArray(parsed) && parsed.length > 0) loadedPrizes = parsed;
      } catch (e) {
        console.warn("Failed to parse t.prizes:", e);
      }
    } else if (t.firstPrize) {
      loadedPrizes = [
        { id: "p-1", place: "1st Place", type: "FIXED", amount: parseNumericPool(t.firstPrize), badge: "🥇" },
      ];
      if (t.secondPrize) {
        loadedPrizes.push({ id: "p-2", place: "2nd Place", type: "FIXED", amount: parseNumericPool(t.secondPrize), badge: "🥈" });
      }
      if (t.thirdPrize) {
        loadedPrizes.push({ id: "p-3", place: "3rd Place", type: "FIXED", amount: parseNumericPool(t.thirdPrize), badge: "🥉" });
      }
    }
    setPrizesList(loadedPrizes);

    let loadedSponsors: SponsorItem[] = [];
    if (t.sponsors) {
      try {
        const parsed = JSON.parse(t.sponsors);
        if (Array.isArray(parsed)) loadedSponsors = parsed;
      } catch (e) {
        console.warn("Failed to parse t.sponsors:", e);
      }
    }
    setSponsorsList(loadedSponsors);

    setFormData({
      title: t.title,
      slug: t.slug || t.id,
      game: t.game,
      gameCategory: t.gameCategory as string,
      status: t.status as string,
      prizePool: t.prizePool,
      prizeDistributionType: (t.prizeDistributionType as any) || "PERCENTAGE",
      allowUnallocatedPrize: t.allowUnallocatedPrize ?? true,
      firstPrize: t.firstPrize || "",
      secondPrize: t.secondPrize || "",
      thirdPrize: t.thirdPrize || "",
      entryFee: t.entryFee,
      feeAmount: t.feeAmount || 0,
      entryFeeType: ((t as any).entryFeeType || (t.feeAmount === 0 ? "FREE" : "PER_TEAM")) as any,
      paymentMethod: (t.paymentMethod as any) || "UPI",
      currency: t.currency || "INR",
      upiId: t.upiId || "mgesports@upi",
      upiQrImage: t.upiQrImage || null,
      slots: t.slots,
      totalTeams: t.totalTeams || 32,
      minTeams: t.minTeams || 12,
      teamType: (t.teamType as any) || "SQUAD",
      teamSize: t.teamSize || 4,
      minPlayersPerTeam: t.minPlayersPerTeam || 4,
      maxPlayersPerTeam: t.maxPlayersPerTeam || 5,
      allowSubstitutes: t.allowSubstitutes ?? true,
      substituteCount: t.substituteCount ?? 1,
      allowWaitlist: t.allowWaitlist ?? true,
      allowLateRegistration: t.allowLateRegistration ?? false,
      date: t.date,
      startDate: t.startDate ? t.startDate.slice(0, 16) : "",
      endDate: t.endDate ? t.endDate.slice(0, 16) : "",
      startTime: t.startTime || "18:00 IST",
      regStartDate: t.regStartDate ? t.regStartDate.slice(0, 16) : "",
      regEndDate: t.regEndDate ? t.regEndDate.slice(0, 16) : "",
      rosterLockDate: t.rosterLockDate ? String(t.rosterLockDate).slice(0, 16) : "",
      checkInEnabled: t.checkInEnabled ?? false,
      checkInStartTime: t.checkInStartTime ? t.checkInStartTime.slice(0, 16) : "",
      checkInEndTime: t.checkInEndTime ? t.checkInEndTime.slice(0, 16) : "",
      noShowTimeoutMinutes: t.noShowTimeoutMinutes ?? 15,
      format: t.format,
      tournamentFormat: (t.tournamentFormat as any) || "BATTLE_ROYALE",
      scoringWin: t.scoringWin ?? 12,
      scoringKill: t.scoringKill ?? 1,
      scoringPlacement: t.scoringPlacement || JSON.stringify(DEFAULT_PLACEMENT_MATRIX),
      scoringBonus: t.scoringBonus || "",
      scoringPenalty: t.scoringPenalty || "",
      featured: !!t.featured,
      tagline: t.tagline,
      shortDescription: t.shortDescription || "",
      description: t.description || "",
      streamUrl: t.streamUrl || "",
      bannerImage: t.bannerImage || null,
      logoImage: t.logoImage || null,
      rules: t.rules || "",
      scoringRules: t.scoringRules || "",
      refundAvailable: t.refundAvailable ?? false,
      refundPolicy: t.refundPolicy || "",
      termsConditions: t.termsConditions || "",
      supportEmail: t.supportEmail || "tournaments@mgesports.in",
      supportPhone: t.supportPhone || "+91 98765 43210",
      discordUrl: t.discordUrl || "https://discord.gg/mgesports",
      telegramUrl: t.telegramUrl || "",
      whatsappUrl: t.whatsappUrl || "",
      isDraft: t.isDraft ?? false,
      isPublished: t.isPublished ?? true,
    });
    setModalOpen(true);
  };

  // Submit Handler (Save or Publish)
  const handleSave = async (asDraft: boolean = false) => {
    try {
      // 1st prize, 2nd prize, 3rd prize extraction from prizesList for backward compatibility
      const first = prizesList[0] ? `₹${Number(prizesList[0].amount).toLocaleString("en-IN")}` : null;
      const second = prizesList[1] ? `₹${Number(prizesList[1].amount).toLocaleString("en-IN")}` : null;
      const third = prizesList[2] ? `₹${Number(prizesList[2].amount).toLocaleString("en-IN")}` : null;

      // Clean entry fee text
      let feeNum = formData.feeAmount;
      if (formData.entryFeeType === "FREE") feeNum = 0;
      let cleanEntryFee = feeNum > 0 ? `₹${feeNum}` : "FREE ENTRY";
      if (formData.entryFeeType === "PER_PLAYER" && feeNum > 0) {
        cleanEntryFee = `₹${feeNum} / PLAYER`;
      } else if (formData.entryFeeType === "PER_TEAM" && feeNum > 0) {
        cleanEntryFee = `₹${feeNum} / SQUAD`;
      }

      const payload: any = {
        ...formData,
        feeAmount: feeNum,
        entryFee: cleanEntryFee,
        firstPrize: first,
        secondPrize: second,
        thirdPrize: third,
        prizes: JSON.stringify(prizesList),
        sponsors: JSON.stringify(sponsorsList),
        isDraft: asDraft,
        isPublished: !asDraft,
        status: asDraft ? "DRAFT" : formData.status,
      };

      if (editingTournament) {
        const updated = await tournamentsApi.update(editingTournament.id, payload);
        setTournaments((prev) =>
          prev.map((item) => (item.id === editingTournament.id ? { ...item, ...updated } : item))
        );
      } else {
        const newId = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const created = await tournamentsApi.create({ ...payload, id: newId });
        setTournaments((prev) => [created, ...prev]);
        localStorage.removeItem("lordz_admin_tournament_draft");
      }

      clearClientCache("tournaments");
      setModalOpen(false);
      loadTournaments();
    } catch (err: any) {
      alert(err.message || "Failed to save tournament");
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    try {
      await tournamentsApi.delete(id);
    } catch {
      // optimistic
    }
    clearClientCache("tournaments");
    setTournaments((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
  };

  // Quick Status Toggle Handler (e.g. Mark as COMPLETED or Reopen)
  const handleQuickStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus as any };
      if (newStatus === "REGISTRATION_OPEN") {
        updateData.regDeadline = null;
        updateData.regEndDate = null;
      }
      await tournamentsApi.update(id, updateData);
      clearClientCache("tournaments");
      setTournaments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updateData } : t))
      );
      if (statusFilter !== "ALL" && statusFilter !== newStatus) {
        setTournaments((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update tournament status");
    }
  };

  // Duplicate Handler
  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await tournamentsApi.duplicate(id);
      clearClientCache("tournaments");
      setTournaments((prev) => [duplicated, ...prev]);
      alert(`Tournament successfully duplicated as "${duplicated.title}" in DRAFT mode!`);
    } catch {
      alert("Failed to duplicate tournament");
    }
  };

  // Checklist Validation Status
  const isTitleValid = Boolean(formData.title.trim().length >= 3);
  const isScheduleValid = Boolean(formData.date.trim().length > 0);
  const isPrizeValid = Boolean(totalPoolNumber > 0 && prizesList.length > 0);
  const isPaymentValid = formData.entryFeeType === "FREE" || formData.feeAmount === 0 || Boolean(formData.upiQrImage || formData.upiId);
  const isSlotsValid = Boolean(formData.totalTeams >= 2);
  const canPublish = isTitleValid && isScheduleValid && isPrizeValid && isPaymentValid && isSlotsValid;

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            TOURNAMENT ENGINE MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Advanced esports tournament creation, prize distribution hub, waitlist queues, check-in, and scoring administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasRestorableDraft && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-[#FFBE32] bg-[#FFBE32]/10 border border-[#FFBE32]/30 hover:bg-[#FFBE32]/20 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Restore Draft</span>
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-3 py-2.5 rounded-xl text-xs font-heading font-bold uppercase text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition-all cursor-pointer"
              >
                Discard
              </button>
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: "ALL", label: "ALL" },
            { id: "REGISTRATION_OPEN", label: "REGISTRATION OPEN" },
            { id: "LIVE", label: "LIVE NOW" },
            { id: "UPCOMING", label: "UPCOMING" },
            { id: "DRAFT", label: "DRAFT" },
            { id: "COMPLETED", label: "COMPLETED" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)] font-extrabold"
                  : "bg-black/50 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {tab.id === "COMPLETED" && (
                <CheckCircle2 className={`h-3.5 w-3.5 ${statusFilter === tab.id ? "text-black" : "text-emerald-400"}`} />
              )}
              {tab.id === "LIVE" && (
                <Radio className={`h-3.5 w-3.5 ${statusFilter === tab.id ? "text-black" : "text-rose-400 animate-pulse"}`} />
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tournament title..."
            className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FFBE32] focus:outline-none"
          />
        </div>
      </div>

      {/* Tournament Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading tournaments...
        </div>
      ) : tournaments.length === 0 ? (
        <div className="py-20 px-6 rounded-2xl bg-[#0D0D12] border border-white/10 text-center max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFBE32]/10 border border-[#FFBE32]/25 flex items-center justify-center text-[#FFBE32]">
            <Trophy className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
            {statusFilter === "COMPLETED"
              ? "NO COMPLETED TOURNAMENTS"
              : statusFilter !== "ALL"
              ? `NO ${statusFilter.replace("_", " ")} TOURNAMENTS`
              : "NO TOURNAMENTS AVAILABLE"}
          </h3>
          <p className="font-body text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {statusFilter === "COMPLETED"
              ? "Tournaments that conclude and are marked as COMPLETED will appear in this list."
              : "There are currently no tournaments found in the database. Click 'Create Tournament' to add your first competitive circuit."}
          </p>
          {statusFilter === "ALL" && (
            <button
              onClick={handleOpenCreate}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Tournament Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {tournaments.map((t) => {
            const registeredCount = t.registeredTeams ?? (t.stats?.total || 0);
            const maxCount = t.totalTeams || 32;

            return (
              <div
                key={t.id}
                className="rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/40 transition-all flex flex-col lg:flex-row overflow-hidden group shadow-xl"
              >
                {/* Banner Thumbnail (Left on desktop) */}
                <div className="relative lg:w-72 h-44 lg:h-auto bg-[#141419] shrink-0 overflow-hidden">
                  {t.bannerImage ? (
                    <img
                      src={getTournamentBannerUrl(t.bannerImage, t.title)}
                      alt={t.title}
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_TOURNAMENT_BANNER;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#141419] to-black p-4 text-center">
                      <Shield className="h-8 w-8 text-gray-600 mb-1" />
                      <span className="text-[10px] text-gray-500 font-mono">LORD ARENA</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                  {/* Registered Count Badge on Banner */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 border border-[#FFBE32]/40 text-[#FFBE32] font-heading font-extrabold text-[11px] uppercase tracking-wider backdrop-blur-md shadow-lg">
                    {registeredCount} TEAMS REGISTERED
                  </div>
                </div>

                {/* Center Content */}
                <div className="p-5 flex-1 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-black border border-white/10 text-[10px] font-mono font-bold text-[#FFBE32] uppercase">
                        {t.gameCategory || t.game}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider ${
                          t.status === "LIVE"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : t.status === "REGISTRATION_OPEN" || t.status === "UPCOMING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : t.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold"
                            : t.status === "DRAFT"
                            ? "bg-neutral-800 text-gray-300 border border-neutral-700"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        }`}
                      >
                        {t.status === "LIVE" && <Radio className="h-2.5 w-2.5 animate-pulse" />}
                        {t.status === "COMPLETED" && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                        {t.status.replace("_", " ")}
                      </span>

                      {t.featured && (
                        <span className="px-2 py-0.5 rounded bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/40 text-[9px] font-mono uppercase font-bold">
                          Featured Hero
                        </span>
                      )}

                      {t.allowWaitlist && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono uppercase">
                          Waitlist Enabled
                        </span>
                      )}

                      {t.checkInEnabled && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono uppercase">
                          Check-In Active
                        </span>
                      )}
                    </div>

                    <Link to={`/admin/tournaments/${t.id}`}>
                      <h3 className="font-display text-2xl uppercase tracking-wider text-white hover:text-[#FFBE32] transition-colors">
                        {t.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-400 font-body max-w-2xl line-clamp-1">
                      {t.tagline}
                    </p>
                  </div>

                  {/* Prominent Registered Teams Counter + Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                    <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-[#FFBE32]/30 text-white font-bold inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span className="text-[#FFBE32] text-sm font-display">{registeredCount}</span>
                      <span className="text-gray-400">/ {maxCount} TEAMS REGISTERED</span>
                    </div>

                    <span className="flex items-center gap-1 text-[#FFBE32]">
                      <DollarSign className="h-3.5 w-3.5" /> Pool: <strong>{formatCurrency(t.prizePool)}</strong>
                    </span>

                    <span className="flex items-center gap-1 text-gray-300">
                      Fee: <strong>{t.feeAmount && t.feeAmount > 0 ? formatCurrency(t.feeAmount) : (t.entryFee || "FREE")}</strong>
                    </span>

                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(t.date || t.startDate)}
                    </span>
                  </div>
                </div>

                {/* Right Action Rail */}
                <div className="p-5 lg:border-l border-white/5 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 bg-black/20 shrink-0">
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="w-full lg:w-40 py-2.5 px-4 rounded-xl font-heading text-xs font-bold uppercase tracking-wider bg-[#FFBE32] hover:bg-[#FFA000] text-black text-center transition-all shadow-[0_0_12px_rgba(255,190,50,0.2)] flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Hub</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {t.status !== "COMPLETED" ? (
                      <button
                        onClick={() => handleQuickStatus(t.id, "COMPLETED")}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-heading font-bold uppercase"
                        title="Mark Tournament as Completed"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Complete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatus(t.id, "REGISTRATION_OPEN")}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-heading font-bold uppercase"
                        title="Reopen Tournament"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reopen</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(t.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                      title="Duplicate Tournament Configuration"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-[#FFBE32] transition-all cursor-pointer"
                      title="Edit Tournament"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Tournament"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-[#0D0D12] border border-red-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl uppercase text-white">Delete Tournament</h3>
            <p className="text-xs text-gray-400 font-body">
              Are you sure you want to delete this tournament? This will remove all associated stages, registrations, and leaderboards.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading font-bold text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-xs uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADVANCED TOURNAMENT CREATION / EDIT WORKFLOW MODAL      */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-2xl bg-[#0C0C10] border border-[#FFBE32]/40 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0D0D14]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center text-[#FFBE32]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase tracking-wider text-white">
                    {editingTournament ? `Edit Tournament: ${formData.title}` : "Advanced Tournament Creator"}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {editingTournament ? "Modify configuration, prizes, and game settings" : "Create production-ready esports tournaments with custom rules and prize distribution"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold text-gray-300 hover:text-white uppercase flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-[#FFBE32]" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Section Stepper Tabs */}
            <div className="flex items-center gap-1 px-6 py-2 border-b border-white/10 bg-black/60 overflow-x-auto no-scrollbar shrink-0">
              {[
                { key: "BASIC", label: "1. Info & Media", icon: Shield },
                { key: "TEAM", label: "2. Team & Squad", icon: Users },
                { key: "SCHEDULE", label: "3. Schedule & Check-In", icon: Clock },
                { key: "PAYMENT", label: "4. Fee & Payments", icon: DollarSign },
                { key: "PRIZES", label: "5. Prize Distribution", icon: Award },
                { key: "FORMAT", label: "6. Format & Scoring", icon: Trophy },
                { key: "RULES", label: "7. Rules & Sponsors", icon: FileText },
                { key: "REVIEW", label: "8. Review & Publish", icon: CheckCircle2 },
              ].map((step) => {
                const Icon = step.icon;
                const active = activeSection === step.key;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveSection(step.key as FormSection)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)] font-extrabold"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Container */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* ======================================================== */}
              {/* SECTION 1: BASIC INFO & MEDIA                            */}
              {/* ======================================================== */}
              {activeSection === "BASIC" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Tournament Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. FLAME OF GLORY S3 FINALS"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        URL Slug (Optional, auto-generated)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g. fog-s3-finals"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Game Title
                      </label>
                      <select
                        value={formData.gameCategory}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gameCategory: e.target.value,
                            game: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                      >
                        <option value="FREE FIRE MAX">FREE FIRE MAX</option>
                        <option value="FREE FIRE">FREE FIRE</option>
                        <option value="BGMI">BATTLEGROUNDS MOBILE INDIA</option>
                        <option value="VALORANT">VALORANT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-bold"
                      >
                        <option value="DRAFT">DRAFT (Hidden from Public)</option>
                        <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                        <option value="REGISTRATION_CLOSED">REGISTRATION CLOSED</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE / ONGOING</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Featured on Hero Showcase?
                      </label>
                      <div className="flex items-center gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                            className="h-4 w-4 rounded accent-[#FFBE32]"
                          />
                          <span>Pin to Website Homepage Hero</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Tagline / Catchphrase
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="The pinnacle championship of mobile esports supremacy."
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                    />
                  </div>

                  {/* Banner & Logo Media Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-heading font-bold uppercase text-gray-200">Tournament Banner</span>
                        <span className="text-[10px] text-gray-400 font-mono">16:9 Aspect Ratio</span>
                      </div>
                      {formData.bannerImage && (
                        <div className="h-28 rounded-lg overflow-hidden border border-white/10">
                          <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleBannerUpload(e.target.files[0]);
                        }}
                        className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-heading file:font-bold file:bg-[#FFBE32] file:text-black cursor-pointer"
                      />
                      {uploadingBanner && <span className="text-xs text-[#FFBE32] animate-pulse">Uploading banner...</span>}
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-heading font-bold uppercase text-gray-200">Tournament Logo / Badge</span>
                        <span className="text-[10px] text-gray-400 font-mono">1:1 Square</span>
                      </div>
                      {formData.logoImage ? (
                        <div className="h-28 w-28 rounded-lg overflow-hidden border border-white/10 mx-auto">
                          <img src={formData.logoImage} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-28 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center text-gray-500 text-xs">
                          <Shield className="h-6 w-6 mb-1" />
                          <span>Optional Event Logo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0]);
                        }}
                        className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-heading file:font-bold file:bg-white/10 file:text-white cursor-pointer"
                      />
                      {uploadingLogo && <span className="text-xs text-[#FFBE32] animate-pulse">Uploading logo...</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 2: TEAM & SQUAD CONFIG                           */}
              {/* ======================================================== */}
              {activeSection === "TEAM" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <Users className="h-4 w-4" /> Team Size & Roster Structure
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { type: "SOLO", count: 1, label: "Solo (1v1)" },
                        { type: "DUO", count: 2, label: "Duo (2 Players)" },
                        { type: "TRIO", count: 3, label: "Trio (3 Players)" },
                        { type: "SQUAD", count: 4, label: "Squad (4 Players)" },
                        { type: "CUSTOM", count: 5, label: "Custom Team" },
                      ].map((tm) => (
                        <button
                          key={tm.type}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              teamType: tm.type as any,
                              teamSize: tm.count,
                              minPlayersPerTeam: tm.count,
                              maxPlayersPerTeam: tm.count + (prev.allowSubstitutes ? prev.substituteCount : 0),
                            }))
                          }
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            formData.teamType === tm.type
                              ? "border-[#FFBE32] bg-[#FFBE32]/10 text-white font-bold shadow-[0_0_12px_rgba(255,190,50,0.2)]"
                              : "border-white/10 bg-black/60 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="font-display text-lg">{tm.type}</div>
                          <div className="text-[10px] font-mono text-gray-400">{tm.label}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Starters Required per Team
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={formData.teamSize}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData({
                              ...formData,
                              teamSize: val,
                              minPlayersPerTeam: val,
                              maxPlayersPerTeam: val + (formData.allowSubstitutes ? formData.substituteCount : 0),
                            });
                          }}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Max Players per Team (including Substitutes)
                        </label>
                        <input
                          type="number"
                          min={formData.teamSize}
                          max={12}
                          value={formData.maxPlayersPerTeam}
                          onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Substitutes System */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-white">
                          Roster Substitutes
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Allow teams to register bench/backup players in their roster.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowSubstitutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allowSubstitutes: e.target.checked,
                              maxPlayersPerTeam: formData.teamSize + (e.target.checked ? formData.substituteCount : 0),
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFBE32]"></div>
                      </label>
                    </div>

                    {formData.allowSubstitutes && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            Max Substitutes Allowed
                          </label>
                          <select
                            value={formData.substituteCount}
                            onChange={(e) => {
                              const cnt = Number(e.target.value);
                              setFormData({
                                ...formData,
                                substituteCount: cnt,
                                maxPlayersPerTeam: formData.teamSize + cnt,
                              });
                            }}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                          >
                            <option value={1}>1 Substitute</option>
                            <option value={2}>2 Substitutes</option>
                            <option value={3}>3 Substitutes</option>
                          </select>
                        </div>

                        <div className="flex items-center text-xs text-gray-400 p-3 rounded-lg bg-black/60 border border-white/5 font-mono">
                          Total Roster: {formData.teamSize} Starters + {formData.substituteCount} Substitute(s) = {formData.maxPlayersPerTeam} Max Players
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slot Limits & Waitlist */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <Users className="h-4 w-4" /> Capacity & Waitlist Queue
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Max Confirmed Slots (Teams) *
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={512}
                          value={formData.totalTeams}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData({
                              ...formData,
                              totalTeams: val,
                              slots: `${val} TEAMS`,
                            });
                          }}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Min Teams to Start Event
                        </label>
                        <input
                          type="number"
                          min={2}
                          value={formData.minTeams}
                          onChange={(e) => setFormData({ ...formData, minTeams: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Waitlist System
                        </label>
                        <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={formData.allowWaitlist}
                            onChange={(e) => setFormData({ ...formData, allowWaitlist: e.target.checked })}
                            className="h-4 w-4 rounded accent-[#FFBE32]"
                          />
                          <span>Allow athletes to join waitlist when full</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 3: SCHEDULE & CHECK-IN                           */}
              {/* ======================================================== */}
              {activeSection === "SCHEDULE" && (
                <div className="space-y-6">
                  {/* Tournament Schedule */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Tournament Schedule & Registration Windows
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Display Schedule Label *
                        </label>
                        <input
                          type="text"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          placeholder="e.g. SEP 28, 2026 • 6:00 PM IST"
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Roster Lock Time (Athletes cannot change members)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.rosterLockDate}
                          onChange={(e) => setFormData({ ...formData, rosterLockDate: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Registration Opens
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.regStartDate}
                          onChange={(e) => setFormData({ ...formData, regStartDate: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Registration Closes
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.regEndDate}
                          onChange={(e) => setFormData({ ...formData, regEndDate: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Tournament Match Start
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Tournament Expected End
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Check-in System */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Athlete Check-In Window
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Require confirmed teams to check in prior to match start. Non-checked-in teams can be disqualified as no-shows.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkInEnabled}
                          onChange={(e) => setFormData({ ...formData, checkInEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFBE32]"></div>
                      </label>
                    </div>

                    {formData.checkInEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            Check-In Window Opens
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.checkInStartTime}
                            onChange={(e) => setFormData({ ...formData, checkInStartTime: e.target.value })}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            Check-In Window Closes
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.checkInEndTime}
                            onChange={(e) => setFormData({ ...formData, checkInEndTime: e.target.value })}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            No-Show Timeout (Minutes)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={60}
                            value={formData.noShowTimeoutMinutes}
                            onChange={(e) => setFormData({ ...formData, noShowTimeoutMinutes: Number(e.target.value) })}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 4: ENTRY FEE & PAYMENTS                          */}
              {/* ======================================================== */}
              {activeSection === "PAYMENT" && (
                <div className="space-y-6">
                  {/* Fee Type Selection */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Entry Fee Model
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { type: "FREE", label: "Free Tournament", desc: "No fee required to participate" },
                        { type: "PER_TEAM", label: "Per Team / Squad", desc: "Leader pays a flat fee for the whole squad" },
                        { type: "PER_PLAYER", label: "Per Player Calculation", desc: "Fee calculated dynamically based on player count" },
                      ].map((ef) => (
                        <button
                          key={ef.type}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              entryFeeType: ef.type as any,
                              feeAmount: ef.type === "FREE" ? 0 : prev.feeAmount || 100,
                            }))
                          }
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.entryFeeType === ef.type
                              ? "border-[#FFBE32] bg-[#FFBE32]/10 text-white shadow-[0_0_12px_rgba(255,190,50,0.2)]"
                              : "border-white/10 bg-black/60 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="font-heading font-bold text-sm text-[#FFBE32]">{ef.label}</div>
                          <div className="text-[11px] text-gray-400 mt-1">{ef.desc}</div>
                        </button>
                      ))}
                    </div>

                    {formData.entryFeeType !== "FREE" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            {formData.entryFeeType === "PER_PLAYER" ? "Fee per Player (₹) *" : "Fee per Squad / Team (₹) *"}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={formData.feeAmount}
                            onChange={(e) => setFormData({ ...formData, feeAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                          />
                        </div>

                        {formData.entryFeeType === "PER_PLAYER" && (
                          <div className="p-3 rounded-xl bg-black/70 border border-[#FFBE32]/30 flex flex-col justify-center">
                            <span className="text-[10px] font-mono text-gray-400 uppercase">Live Squad Fee Calculation</span>
                            <span className="font-display text-lg text-[#FFBE32]">
                              {formData.teamSize} Starters × ₹{formData.feeAmount} = ₹{formData.teamSize * formData.feeAmount} per Squad
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Methods & UPI Gateway */}
                  {formData.entryFeeType !== "FREE" && (
                    <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> UPI & Payment Verification
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            Payment Acceptance Method
                          </label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                          >
                            <option value="UPI">UPI (QR Code & UTR Verification)</option>
                            <option value="ONLINE">Online Payment Gateway</option>
                            <option value="BOTH">Both (UPI + Online Gateway)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                            UPI ID (VPA) *
                          </label>
                          <input
                            type="text"
                            value={formData.upiId}
                            onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                            placeholder="mgesports@upi"
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Official QR Code */}
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Tournament Payment QR Code (PNG, JPG, WEBP • Max 5MB)
                        </label>

                        {formData.upiQrImage ? (
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-[#FFBE32]/30 bg-black/70">
                            <div className="h-28 w-28 rounded-xl border border-white/10 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={formData.upiQrImage} alt="Payment QR" className="h-full w-full object-contain" />
                            </div>
                            <div className="space-y-2 flex-1">
                              <div className="text-xs text-white font-heading font-bold uppercase">Official QR Code Ready</div>
                              <div className="text-[11px] text-gray-400 font-mono truncate max-w-md">{formData.upiQrImage}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-heading font-bold uppercase text-white cursor-pointer inline-flex items-center gap-1.5">
                                  <Upload className="h-3 w-3" /> Replace QR Code
                                  <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={qrUploading} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, upiQrImage: null })}
                                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-heading font-bold uppercase text-rose-400 border border-rose-500/20"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-[#FFBE32]/50 bg-black/40 hover:bg-black/60 cursor-pointer transition-all">
                            {qrUploading ? (
                              <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#FFBE32] animate-pulse">
                                <Upload className="h-4 w-4 animate-spin" /> Uploading QR Code...
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-gray-500 mb-1" />
                                <span className="text-xs font-heading font-bold text-white uppercase">Upload Tournament Payment QR Code</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Visible to players in Step 4 registration</span>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={qrUploading} />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 5: PRIZE DISTRIBUTION HUB                        */}
              {/* ======================================================== */}
              {activeSection === "PRIZES" && (
                <div className="space-y-6">
                  {/* Prize Pool & Mode Hub */}
                  <div className="p-5 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                          <Award className="h-4 w-4" /> Prize Distribution Hub
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Configure prize pool, dynamic placement slots, percentages, or single-winner formats.
                        </p>
                      </div>

                      {/* Total Pool Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-gray-300 uppercase">Total Pool:</span>
                        <input
                          type="text"
                          required
                          value={formData.prizePool}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({ ...prev, prizePool: val }));
                            // Update percentage amounts if in percentage mode
                            const num = parseNumericPool(val);
                            if (formData.prizeDistributionType === "PERCENTAGE") {
                              setPrizesList((prevList) =>
                                prevList.map((p) => ({
                                  ...p,
                                  amount: Math.round((num * (p.percentage || 0)) / 100),
                                }))
                              );
                            }
                          }}
                          placeholder="₹50,000"
                          className="w-36 rounded-xl border border-[#FFBE32]/40 bg-black/80 px-3 py-1.5 text-sm font-display font-bold text-[#FFBE32] text-right focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {[
                        { key: "PERCENTAGE", label: "Percentage Based", desc: "Auto-computes ₹ from %" },
                        { key: "FIXED", label: "Fixed Amount", desc: "Specify exact ₹ amounts" },
                        { key: "WINNER_TAKES_ALL", label: "Winner Takes All", desc: "100% to 1st Place" },
                        { key: "CUSTOM", label: "Custom", desc: "Special tiers & awards" },
                      ].map((md) => (
                        <button
                          key={md.key}
                          type="button"
                          onClick={() => handlePrizeModeChange(md.key as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.prizeDistributionType === md.key
                              ? "border-[#FFBE32] bg-[#FFBE32]/10 text-white font-bold shadow-[0_0_10px_rgba(255,190,50,0.2)]"
                              : "border-white/10 bg-black/60 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-heading font-bold">{md.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{md.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Live Balance Summary Bar */}
                    <div className="p-3 rounded-xl bg-black/70 border border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-300">
                            Allocated: <strong className="text-white">₹{allocatedPrizeSum.toLocaleString("en-IN")}</strong> ({allocatedPercentage}%)
                          </span>
                          <span className={`${remainingPrizeSum > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            Remaining: <strong>₹{remainingPrizeSum.toLocaleString("en-IN")}</strong>
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-400 text-[11px]">
                          <input
                            type="checkbox"
                            checked={formData.allowUnallocatedPrize}
                            onChange={(e) => setFormData({ ...formData, allowUnallocatedPrize: e.target.checked })}
                            className="h-3.5 w-3.5 rounded accent-[#FFBE32]"
                          />
                          <span>Allow unallocated balance</span>
                        </label>
                      </div>

                      {/* Visual Allocation Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            allocatedPercentage === 100
                              ? "bg-emerald-500"
                              : allocatedPercentage > 100
                              ? "bg-rose-500"
                              : "bg-[#FFBE32]"
                          }`}
                          style={{ width: `${Math.min(100, allocatedPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Prize Positions Table */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-heading font-bold uppercase tracking-wider text-gray-200">
                        Prize Positions ({prizesList.length} Position{prizesList.length !== 1 ? "s" : ""})
                      </h5>
                      <button
                        type="button"
                        onClick={handleAddPrizeTier}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFBE32]/10 hover:bg-[#FFBE32]/20 border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase text-[#FFBE32] transition-all cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Position
                      </button>
                    </div>

                    <div className="space-y-2">
                      {prizesList.map((tier, idx) => (
                        <div
                          key={tier.id || idx}
                          className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-black/60"
                        >
                          {/* Badge / Rank Icon */}
                          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                            {tier.badge || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️")}
                          </div>

                          {/* Position Label */}
                          <input
                            type="text"
                            value={tier.place}
                            onChange={(e) => updatePrizeTier(idx, "place", e.target.value)}
                            placeholder="e.g. 1st Place / Top Fragger"
                            className="flex-1 w-full sm:w-auto rounded-lg border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-white focus:border-[#FFBE32] focus:outline-none"
                          />

                          {/* Percentage Input (if in percentage mode) */}
                          {formData.prizeDistributionType === "PERCENTAGE" && (
                            <div className="flex items-center gap-1 shrink-0 w-full sm:w-28">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={tier.percentage || 0}
                                onChange={(e) => updatePrizeTier(idx, "percentage", e.target.value)}
                                className="w-full rounded-lg border border-white/15 bg-black/80 px-2 py-1.5 text-xs text-white text-right focus:border-[#FFBE32] focus:outline-none font-mono"
                              />
                              <span className="text-xs text-gray-400 font-bold">%</span>
                            </div>
                          )}

                          {/* Amount Input */}
                          <div className="flex items-center gap-1 shrink-0 w-full sm:w-36">
                            <span className="text-xs text-[#FFBE32] font-bold">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={tier.amount || 0}
                              onChange={(e) => updatePrizeTier(idx, "amount", e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-black/80 px-2.5 py-1.5 text-xs text-[#FFBE32] font-bold text-right focus:border-[#FFBE32] focus:outline-none font-mono"
                            />
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePrizeTier(idx)}
                            disabled={prizesList.length <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer"
                            title="Remove position"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Visual Medal Preview Showcase */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Public Website Prize Preview
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {prizesList.map((tier, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-white/10 bg-black/70 flex items-center gap-2.5"
                          >
                            <span className="text-2xl">{tier.badge || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️")}</span>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase font-mono">{tier.place}</div>
                              <div className="text-sm font-display font-bold text-[#FFBE32]">
                                ₹{Number(tier.amount || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 6: FORMAT & SCORING                              */}
              {/* ======================================================== */}
              {activeSection === "FORMAT" && (
                <div className="space-y-6">
                  {/* Tournament Format */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Tournament Structure & Format
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "BATTLE_ROYALE", label: "Battle Royale", desc: "Multi-round points & placement" },
                        { key: "SINGLE_ELIMINATION", label: "Single Elimination", desc: "Knockout bracket tree" },
                        { key: "DOUBLE_ELIMINATION", label: "Double Elimination", desc: "Winners & Losers brackets" },
                      ].map((fmt) => (
                        <button
                          key={fmt.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, tournamentFormat: fmt.key as any })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.tournamentFormat === fmt.key
                              ? "border-[#FFBE32] bg-[#FFBE32]/10 text-white font-bold"
                              : "border-white/10 bg-black/60 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-heading font-bold">{fmt.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{fmt.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        Format Display Label *
                      </label>
                      <input
                        type="text"
                        value={formData.format}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                        placeholder="e.g. BATTLE ROYALE • 6 MATCHES • BERMUDA & PURGATORY"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Scoring Rules Matrix */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <Percent className="h-4 w-4" /> Scoring Engine & Point System
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Win / Booyah Points
                        </label>
                        <input
                          type="number"
                          value={formData.scoringWin}
                          onChange={(e) => setFormData({ ...formData, scoringWin: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Kill Points (Per Elimination)
                        </label>
                        <input
                          type="number"
                          value={formData.scoringKill}
                          onChange={(e) => setFormData({ ...formData, scoringKill: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Bonus Points Description
                        </label>
                        <input
                          type="text"
                          value={formData.scoringBonus}
                          onChange={(e) => setFormData({ ...formData, scoringBonus: e.target.value })}
                          placeholder="e.g. 1st Kill: +2 pts, Squad Wipe: +3 pts"
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Penalties Description
                        </label>
                        <input
                          type="text"
                          value={formData.scoringPenalty}
                          onChange={(e) => setFormData({ ...formData, scoringPenalty: e.target.value })}
                          placeholder="e.g. Late Room Entry: -2 pts"
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 7: RULES, REFUND POLICY & SPONSORS              */}
              {/* ======================================================== */}
              {activeSection === "RULES" && (
                <div className="space-y-6">
                  {/* Tournament Rules */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2">
                    <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32]">
                      Tournament Rules & Anti-Cheat Requirements
                    </label>
                    <textarea
                      rows={5}
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder="1. Emulators strictly banned. 2. Recording mandatory..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                    />
                  </div>

                  {/* Refund Policy */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-white">
                          Refund Policy & Cancellation Terms
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Configure whether entry fees are refundable upon withdrawal or cancellation.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.refundAvailable}
                          onChange={(e) => setFormData({ ...formData, refundAvailable: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFBE32]"></div>
                      </label>
                    </div>

                    {formData.refundAvailable && (
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                          Refund Terms & Conditions
                        </label>
                        <textarea
                          rows={2}
                          value={formData.refundPolicy}
                          onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-[#FFBE32] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sponsors Section */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Sponsors & Partners Showcase
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddSponsor}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFBE32]/10 hover:bg-[#FFBE32]/20 border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase text-[#FFBE32] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Sponsor
                      </button>
                    </div>

                    <div className="space-y-2">
                      {sponsorsList.map((sp, idx) => (
                        <div key={sp.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-black/60">
                          <input
                            type="text"
                            value={sp.name}
                            onChange={(e) => {
                              const copy = [...sponsorsList];
                              copy[idx].name = e.target.value;
                              setSponsorsList(copy);
                            }}
                            placeholder="Sponsor Brand Name"
                            className="flex-1 rounded-lg border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-white"
                          />
                          <select
                            value={sp.tier || "ASSOCIATE"}
                            onChange={(e) => {
                              const copy = [...sponsorsList];
                              copy[idx].tier = e.target.value as any;
                              setSponsorsList(copy);
                            }}
                            className="rounded-lg border border-white/15 bg-black/80 px-3 py-1.5 text-xs text-gray-300"
                          >
                            <option value="TITLE">Title Sponsor</option>
                            <option value="POWERED_BY">Powered By</option>
                            <option value="ASSOCIATE">Associate Partner</option>
                            <option value="MEDIA">Media Partner</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveSponsor(idx)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Channels */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-white">
                      Player Support Channels
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-heading font-bold text-gray-400 mb-1">Support Email</label>
                        <input
                          type="text"
                          value={formData.supportEmail}
                          onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold text-gray-400 mb-1">Discord Link</label>
                        <input
                          type="text"
                          value={formData.discordUrl}
                          onChange={(e) => setFormData({ ...formData, discordUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold text-gray-400 mb-1">WhatsApp Group</label>
                        <input
                          type="text"
                          value={formData.whatsappUrl}
                          onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 8: PRE-PUBLISH VALIDATION CHECKLIST & REVIEW     */}
              {/* ======================================================== */}
              {activeSection === "REVIEW" && (
                <div className="space-y-6">
                  {/* Pre-Publish Validation Checklist */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Pre-Publish Validation Checklist
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      All criteria below must pass before publishing to the public Lordz tournament directory.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${isTitleValid ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-300"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isTitleValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {isTitleValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Tournament Title Set</div>
                          <div className="text-[10px] text-gray-400">{formData.title || "Missing title"}</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${isScheduleValid ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-300"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isScheduleValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {isScheduleValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Schedule Configured</div>
                          <div className="text-[10px] text-gray-400">{formData.date}</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${isPrizeValid ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-300"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isPrizeValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {isPrizeValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Prize Distribution Hub</div>
                          <div className="text-[10px] text-gray-400">{formData.prizePool} ({prizesList.length} tier{prizesList.length !== 1 ? "s" : ""})</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${isPaymentValid ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-300"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isPaymentValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {isPaymentValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Payment & Fee Settings</div>
                          <div className="text-[10px] text-gray-400">
                            {formData.entryFeeType === "FREE" ? "Free Event" : `₹${formData.feeAmount} via ${formData.paymentMethod}`}
                          </div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${isSlotsValid ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-300"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${isSlotsValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {isSlotsValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Capacity & Slots</div>
                          <div className="text-[10px] text-gray-400">{formData.totalTeams} Total Teams ({formData.teamType})</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-white/10 bg-black/60 flex items-center gap-3 text-gray-300">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <Clock className="h-3.5 w-3.5 text-[#FFBE32]" />
                        </div>
                        <div className="text-xs">
                          <div className="font-heading font-bold uppercase">Check-In System</div>
                          <div className="text-[10px] text-gray-400">{formData.checkInEnabled ? "Enabled" : "Disabled"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player View Card Preview */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-black/60 space-y-3">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#FFBE32]" /> Live Player Card Preview
                    </span>

                    <div className="rounded-xl border border-[#FFBE32]/30 bg-[#0D0D12] overflow-hidden p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="h-28 w-44 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10">
                        {formData.bannerImage ? (
                          <img src={formData.bannerImage} alt="Banner" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-600 text-xs">No Banner</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5 text-center sm:text-left">
                        <div className="text-xs font-mono font-bold text-[#FFBE32] uppercase">{formData.gameCategory}</div>
                        <div className="font-display text-xl text-white uppercase">{formData.title || "Untitled Tournament"}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{formData.tagline}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1 text-gray-300">
                          <span>🏆 {formData.prizePool}</span>
                          <span>💰 {formData.entryFeeType === "FREE" ? "FREE" : `₹${formData.feeAmount}`}</span>
                          <span>👥 {formData.totalTeams} TEAMS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Action Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0D0D14] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sections: FormSection[] = ["BASIC", "TEAM", "SCHEDULE", "PAYMENT", "PRIZES", "FORMAT", "RULES", "REVIEW"];
                    const currIdx = sections.indexOf(activeSection);
                    if (currIdx > 0) setActiveSection(sections[currIdx - 1]);
                  }}
                  disabled={activeSection === "BASIC"}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sections: FormSection[] = ["BASIC", "TEAM", "SCHEDULE", "PAYMENT", "PRIZES", "FORMAT", "RULES", "REVIEW"];
                    const currIdx = sections.indexOf(activeSection);
                    if (currIdx < sections.length - 1) setActiveSection(sections[currIdx + 1]);
                  }}
                  disabled={activeSection === "REVIEW"}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold uppercase tracking-wider text-gray-300 hover:text-white cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canPublish && !confirm("Some checklist criteria are not yet fully completed. Do you still wish to publish?")) {
                      return;
                    }
                    handleSave(false);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,190,50,0.3)] cursor-pointer transition-all ${
                    canPublish
                      ? "bg-[#FFBE32] hover:bg-[#FFA000] text-black"
                      : "bg-[#FFBE32]/60 hover:bg-[#FFBE32] text-black"
                  }`}
                  title={!canPublish ? "Review checklist before publishing" : "Ready to publish"}
                >
                  {editingTournament ? "Save & Publish" : "Publish Tournament"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIVE TOURNAMENT PREVIEW MODAL                            */}
      {/* ======================================================== */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/50 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#FFBE32] flex items-center gap-2">
                <Eye className="h-4 w-4" /> Public Website Preview
              </span>
              <button onClick={() => setPreviewModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Banner preview */}
            <div className="h-48 rounded-xl bg-black overflow-hidden border border-white/10 relative">
              {formData.bannerImage && (
                <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 space-y-1">
                <span className="px-2 py-0.5 rounded bg-black/80 text-[#FFBE32] text-[10px] font-mono uppercase font-bold border border-[#FFBE32]/30">
                  {formData.gameCategory}
                </span>
                <h2 className="font-display text-2xl uppercase text-white">{formData.title || "Untitled Tournament"}</h2>
              </div>
            </div>

            {/* Prize tiers */}
            <div className="space-y-2">
              <div className="text-xs font-heading font-bold uppercase text-gray-300">Prizes Showcase</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {prizesList.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/60 border border-white/10 text-center">
                    <div className="text-2xl">{p.badge || "🎖️"}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-mono mt-1">{p.place}</div>
                    <div className="text-sm font-display font-bold text-[#FFBE32]">
                      ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#FFBE32] text-black font-heading font-bold text-xs uppercase"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
