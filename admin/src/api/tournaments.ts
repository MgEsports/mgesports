import { apiRequest, getApiUrl, clearClientCache } from "./client";
import {
  type Tournament,
  type TournamentStage,
  type TournamentRound,
  type RegistrationItem,
  type LeaderboardEntry,
  type MatchItem,
  DEFAULT_TOURNAMENT_BANNER,
} from "../data/tournaments";
import { getStoredTournamentsList, persistStoredTournaments } from "../../../src/api/tournaments";

export interface SquadRegistrationInput {
  teamName: string;
  teamLogo?: string;
  captainIgn: string;
  captainName?: string;
  captainPhone?: string;
  captainEmail?: string;
  whatsapp: string;
  discordTag?: string;
  playerNames?: string;
  players?: Array<{
    name: string;
    ign: string;
    playerId?: string;
    role: string;
    phone?: string;
    email?: string;
    discordId?: string;
    isCaptain?: boolean;
    isSubstitute?: boolean;
  }>;
  payment?: {
    amount?: number;
    method?: string;
    utr?: string;
    payerName?: string;
    screenshot?: string;
    remarks?: string;
  };
}

export const tournamentsApi = {
  // Tournaments
  getAll: async (params?: { gameCategory?: string; status?: string; search?: string }): Promise<Tournament[]> => {
    const local = getStoredTournamentsList();
    const query = new URLSearchParams();
    if (params?.gameCategory && params.gameCategory !== "ALL") query.set("gameCategory", params.gameCategory);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    query.set("includeDrafts", "true");
    query.set("_t", Date.now().toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const res = await apiRequest<Tournament[]>(`/tournaments${qs}`, { method: "GET" }, local);
      if (Array.isArray(res) && res.length > 0) return res;
      return local;
    } catch {
      return local;
    }
  },

  getById: async (id: string): Promise<Tournament | null> => {
    const local = getStoredTournamentsList().find((t) => t.id === id || t.slug === id) || null;
    try {
      const res = await apiRequest<Tournament | null>(`/tournaments/${id}`, { method: "GET" }, local);
      return res || local;
    } catch {
      return local;
    }
  },

  create: async (data: Partial<Tournament>): Promise<Tournament> => {
    clearClientCache("tournaments");
    const local = getStoredTournamentsList();
    const newTournament: Tournament = {
      id: data.id || `tournament-${Date.now()}`,
      title: data.title || "NEW TOURNAMENT",
      tagline: data.tagline || "",
      description: data.description || "",
      game: data.game || "FREE FIRE MAX",
      gameCategory: data.gameCategory || "FREE FIRE MAX",
      status: data.status || "DRAFT",
      prizePool: data.prizePool || "₹50,000",
      regStartDate: data.regStartDate || new Date().toISOString(),
      regEndDate: data.regEndDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      bannerImage: data.bannerImage || DEFAULT_TOURNAMENT_BANNER,
      ...data,
    } as Tournament;
    const updated = [newTournament, ...local];
    persistStoredTournaments(updated);

    try {
      const res = await apiRequest<Tournament>("/tournaments", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res || newTournament;
    } catch {
      return newTournament;
    }
  },

  update: async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
    clearClientCache("tournaments");
    const local = getStoredTournamentsList();
    const updated = local.map((t) => (t.id === id ? { ...t, ...data } : t));
    persistStoredTournaments(updated);

    try {
      const res = await apiRequest<Tournament>(`/tournaments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res || (updated.find((t) => t.id === id) as Tournament);
    } catch {
      return (updated.find((t) => t.id === id) || data) as Tournament;
    }
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    clearClientCache("tournaments");
    const local = getStoredTournamentsList();
    const updated = local.filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      try {
        const deletedRaw = localStorage.getItem("lordz_deleted_tournament_ids");
        const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
        deletedIds.add(id);
        localStorage.setItem("lordz_deleted_tournament_ids", JSON.stringify(Array.from(deletedIds)));
      } catch {}
    }
    persistStoredTournaments(updated);

    try {
      await apiRequest<{ success: boolean }>(`/tournaments/${id}`, {
        method: "DELETE",
      });
    } catch {}
    return { success: true };
  },

  duplicate: async (id: string): Promise<Tournament> => {
    clearClientCache("tournaments");
    const local = getStoredTournamentsList();
    const existing = local.find((t) => t.id === id);
    const duplicated: Tournament = {
      ...(existing || {}),
      id: `tournament-${Date.now()}`,
      title: `${existing?.title || "Tournament"} (Copy)`,
      status: "DRAFT",
    } as Tournament;
    const updated = [duplicated, ...local];
    persistStoredTournaments(updated);

    try {
      const res = await apiRequest<Tournament>(`/tournaments/${id}/duplicate`, {
        method: "POST",
      });
      return res || duplicated;
    } catch {
      return duplicated;
    }
  },

  // Registrations & Payments
  registerSquad: async (tournamentId: string, squad: SquadRegistrationInput): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/register`, {
      method: "POST",
      body: JSON.stringify(squad),
    });
  },

  getRegistrations: async (params?: {
    tournamentId?: string;
    stageId?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<RegistrationItem[]> => {
    const query = new URLSearchParams();
    if (params?.tournamentId && params.tournamentId !== "ALL") query.set("tournamentId", params.tournamentId);
    if (params?.stageId && params.stageId !== "ALL") query.set("stageId", params.stageId);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.paymentStatus && params.paymentStatus !== "ALL") query.set("paymentStatus", params.paymentStatus);
    if (params?.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<RegistrationItem[]>(`/tournaments/registrations${qs}`, { method: "GET" }, []);
  },

  updateRegistrationStatus: async (
    id: string,
    status: string,
    slotNumber?: number,
    adminNotes?: string
  ): Promise<any> => {
    return apiRequest(`/tournaments/registrations/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, slotNumber, adminNotes }),
    });
  },

  updatePaymentStatus: async (
    id: string,
    paymentStatus: string,
    adminNotes?: string,
    autoApprove?: boolean
  ): Promise<any> => {
    return apiRequest(`/tournaments/registrations/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify({ paymentStatus, adminNotes, autoApprove }),
    });
  },

  verifyPayment: async (registrationId: string): Promise<any> => {
    return apiRequest(`/tournaments/registrations/${registrationId}/payment-verify`, {
      method: "PUT",
    });
  },

  rejectPayment: async (registrationId: string, reason?: string): Promise<any> => {
    return apiRequest(`/tournaments/registrations/${registrationId}/payment-reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  adminOverrideRoster: async (teamId: string, members: any[]): Promise<any> => {
    return apiRequest(`/teams/${teamId}/override-roster`, {
      method: "POST",
      body: JSON.stringify({ members }),
    });
  },

  getTournamentTeams: async (tournamentId: string): Promise<any[]> => {
    return apiRequest(`/tournaments/${tournamentId}/teams`, { method: "GET" }, []);
  },

  getAnalytics: async (tournamentId?: string): Promise<any> => {
    const qs = tournamentId ? `?tournamentId=${tournamentId}` : "";
    return apiRequest(`/tournaments/admin/analytics${qs}`, { method: "GET" });
  },

  bulkActionRegistrations: async (
    registrationIds: string[],
    action: "APPROVE" | "REJECT" | "VERIFY_PAYMENT" | "MOVE_STAGE",
    targetStageId?: string
  ): Promise<any> => {
    return apiRequest("/tournaments/registrations/bulk", {
      method: "POST",
      body: JSON.stringify({ registrationIds, action, targetStageId }),
    });
  },

  exportRegistrationsCsv: async (tournamentId: string, stageId?: string, status?: string): Promise<string> => {
    const query = new URLSearchParams();
    if (stageId) query.set("stageId", stageId);
    if (status) query.set("status", status);
    const qs = query.toString() ? `?${query.toString()}` : "";

    const url = getApiUrl(`/tournaments/${tournamentId}/export${qs}`);
    const token = localStorage.getItem("lordz_admin_token") || localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    return res.text();
  },

  // Stages & Progression
  getStages: async (tournamentId: string): Promise<TournamentStage[]> => {
    return apiRequest<TournamentStage[]>(`/tournaments/${tournamentId}/stages`, { method: "GET" }, []);
  },

  createStage: async (tournamentId: string, stage: Partial<TournamentStage>): Promise<TournamentStage> => {
    return apiRequest<TournamentStage>(`/tournaments/${tournamentId}/stages`, {
      method: "POST",
      body: JSON.stringify(stage),
    });
  },

  updateStage: async (stageId: string, stage: Partial<TournamentStage>): Promise<TournamentStage> => {
    return apiRequest<TournamentStage>(`/tournaments/stages/${stageId}`, {
      method: "PUT",
      body: JSON.stringify(stage),
    });
  },

  deleteStage: async (stageId: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/tournaments/stages/${stageId}`, {
      method: "DELETE",
    });
  },

  moveTeamsToStage: async (tournamentId: string, registrationIds: string[], targetStageId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/stages/move-teams`, {
      method: "POST",
      body: JSON.stringify({ registrationIds, targetStageId }),
    });
  },

  // Tournament Leaderboard
  getLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
    return apiRequest<LeaderboardEntry[]>(`/tournaments/${tournamentId}/leaderboard`, { method: "GET" }, []);
  },

  updateLeaderboardBatch: async (tournamentId: string, entries: LeaderboardEntry[]): Promise<LeaderboardEntry[]> => {
    return apiRequest<LeaderboardEntry[]>(`/tournaments/${tournamentId}/leaderboard`, {
      method: "PUT",
      body: JSON.stringify({ entries }),
    });
  },

  addLeaderboardEntry: async (tournamentId: string, entry: Partial<LeaderboardEntry>): Promise<LeaderboardEntry> => {
    return apiRequest<LeaderboardEntry>(`/tournaments/${tournamentId}/leaderboard/entry`, {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  deleteLeaderboardEntry: async (tournamentId: string, entryId: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/tournaments/${tournamentId}/leaderboard/${entryId}`, {
      method: "DELETE",
    });
  },

  // Rounds & Progression
  getRounds: async (tournamentId: string): Promise<TournamentRound[]> => {
    return apiRequest<TournamentRound[]>(`/tournaments/${tournamentId}/rounds`, { method: "GET" }, []);
  },

  createRound: async (tournamentId: string, round: Partial<TournamentRound>): Promise<TournamentRound> => {
    return apiRequest<TournamentRound>(`/tournaments/${tournamentId}/rounds`, {
      method: "POST",
      body: JSON.stringify(round),
    });
  },

  createBatchDivisions: async (
    tournamentId: string,
    data: {
      stageName: string;
      roundNumber: number;
      divisionNames: string[];
      maxTeamsPerDivision?: number;
      roundType?: string;
      startDate?: string;
      startTime?: string;
      map?: string;
    }
  ): Promise<{ success: boolean; data: TournamentRound[]; message: string }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/batch-divisions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  autoDistributeSquads: async (
    tournamentId: string,
    data: {
      roundIds: string[];
      capacityPerDivision?: number;
    }
  ): Promise<{ success: boolean; message: string; totalAssigned: number }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/auto-distribute`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateRound: async (tournamentId: string, roundId: string, round: Partial<TournamentRound>): Promise<TournamentRound> => {
    return apiRequest<TournamentRound>(`/tournaments/${tournamentId}/rounds/${roundId}`, {
      method: "PUT",
      body: JSON.stringify(round),
    });
  },

  deleteRound: async (tournamentId: string, roundId: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/tournaments/${tournamentId}/rounds/${roundId}`, {
      method: "DELETE",
    });
  },

  getEligibleTeamsForRound: async (
    tournamentId: string,
    roundId: string
  ): Promise<{ success: boolean; data: any[]; round: any; stageDivisions?: any[] }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/${roundId}/eligible-teams`, { method: "GET" });
  },

  selectTeamsForRound: async (
    tournamentId: string,
    roundId: string,
    teamIds: string[]
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/${roundId}/teams`, {
      method: "POST",
      body: JSON.stringify({ teamIds }),
    });
  },

  advanceTeams: async (
    tournamentId: string,
    roundId: string,
    teamIds: string[],
    nextRoundId: string,
    markUnselectedAsEliminated?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/${roundId}/advance`, {
      method: "POST",
      body: JSON.stringify({ teamIds, nextRoundId, markUnselectedAsEliminated: Boolean(markUnselectedAsEliminated) }),
    });
  },

  updateRoundCredentials: async (
    tournamentId: string,
    roundId: string,
    credentials: {
      roomId?: string;
      roomPassword?: string;
      map?: string;
      roomTime?: string;
      credentialsPublished?: boolean;
      customNotes?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/${roundId}/credentials`, {
      method: "PUT",
      body: JSON.stringify(credentials),
    });
  },

  updateRoundTeamStatus: async (
    tournamentId: string,
    roundId: string,
    teamId: string,
    data: { status?: string; score?: number; seed?: number }
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/tournaments/${tournamentId}/rounds/${roundId}/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getTeamRoundHistory: async (tournamentId: string, teamId: string): Promise<{ success: boolean; data: any[] }> => {
    return apiRequest(`/tournaments/${tournamentId}/teams/${teamId}/round-history`, { method: "GET" });
  },

  // Waitlist
  getWaitlist: async (tournamentId: string): Promise<RegistrationItem[]> => {
    return apiRequest<RegistrationItem[]>(`/tournaments/${tournamentId}/waitlist`, { method: "GET" }, []);
  },

  promoteWaitlistTeam: async (tournamentId: string, registrationId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/waitlist/${registrationId}/promote`, { method: "POST" });
  },

  removeWaitlistTeam: async (tournamentId: string, registrationId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/waitlist/${registrationId}`, { method: "DELETE" });
  },

  // Check-In
  getCheckInStatus: async (tournamentId: string): Promise<{ total: number; checkedIn: number; pending: number; noShows: number; teams: any[] }> => {
    return apiRequest(`/tournaments/${tournamentId}/check-in-status`, { method: "GET" }, { total: 0, checkedIn: 0, pending: 0, noShows: 0, teams: [] });
  },

  checkInTeam: async (tournamentId: string, registrationId?: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/check-in`, {
      method: "POST",
      body: JSON.stringify({ registrationId }),
    });
  },

  handleNoShows: async (tournamentId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/handle-no-shows`, { method: "POST" });
  },

  // Matches
  getMatches: async (params?: { tournamentId?: string; roundId?: string; status?: string }): Promise<MatchItem[]> => {
    const query = new URLSearchParams();
    if (params?.tournamentId) query.set("tournamentId", params.tournamentId);
    if (params?.roundId) query.set("roundId", params.roundId);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<MatchItem[]>(`/matches${qs}`, { method: "GET" }, []);
  },

  createMatch: async (data: Partial<MatchItem>): Promise<MatchItem> => {
    return apiRequest<MatchItem>("/matches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateMatch: async (id: string, data: Partial<MatchItem>): Promise<MatchItem> => {
    return apiRequest<MatchItem>(`/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteMatch: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/matches/${id}`, {
      method: "DELETE",
    });
  },

  getMatchCredentials: async (id: string): Promise<any> => {
    return apiRequest(`/matches/${id}/credentials`, { method: "GET" });
  },

  // File Uploads
  uploadImage: async (file: File): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const token =
      localStorage.getItem("lordz_admin_token") ||
      localStorage.getItem("token") ||
      ((import.meta as any).env?.DEV ? "demo-admin-token" : "");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(getApiUrl("/upload"), {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to upload image" }));
      throw new Error(err.message || "Failed to upload image");
    }
    return res.json();
  },
};
