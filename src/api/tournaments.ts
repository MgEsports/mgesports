import { apiRequest, getApiUrl } from "./client";
import {
  type Tournament,
  type TournamentStage,
  type RegistrationItem,
  type LeaderboardEntry,
  tournamentsData,
} from "../data/tournaments";

export const TOURNAMENTS_STORAGE_KEY = "mg_cached_tournaments";
export const DELETED_TOURNAMENTS_KEY = "lordz_deleted_tournament_ids";

export function getStoredTournamentsList(): Tournament[] {
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = localStorage.getItem(DELETED_TOURNAMENTS_KEY);
      const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
      const raw = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((t: Tournament) => t && t.id && !deletedIds.has(t.id));
        }
      }
      return tournamentsData.filter((t) => !deletedIds.has(t.id));
    } catch {}
  }
  return tournamentsData;
}

export function persistStoredTournaments(items: Tournament[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("mg_tournaments_updated", { detail: items }));
    } catch {}
  }
}

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
  getAll: async (params?: { gameCategory?: string; status?: string; search?: string }): Promise<Tournament[]> => {
    const local = getStoredTournamentsList();
    const query = new URLSearchParams();
    if (params?.gameCategory && params.gameCategory !== "ALL") query.set("gameCategory", params.gameCategory);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    query.set("_t", Date.now().toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const res = await apiRequest<Tournament[]>(`/tournaments${qs}`, { method: "GET" }, local);
      if (Array.isArray(res) && res.length > 0) {
        if (!params || (!params.gameCategory && !params.status && !params.search)) {
          persistStoredTournaments(res);
        }
        return res;
      }
      return local;
    } catch {
      return local;
    }
  },

  getById: async (id: string): Promise<Tournament | null> => {
    const local = getStoredTournamentsList().find((t) => t.id === id || t.slug === id) || null;
    try {
      const res = await apiRequest<Tournament | null>(`/tournaments/${id}?_t=${Date.now()}`, { method: "GET" }, local);
      return res || local;
    } catch {
      return local;
    }
  },

  registerSquad: async (tournamentId: string, squad: SquadRegistrationInput): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/register`, {
      method: "POST",
      body: JSON.stringify(squad),
    });
  },

  submitPayment: async (
    registrationId: string,
    data: { utr: string; screenshot?: string; payerName?: string; amount?: number; method?: string; remarks?: string }
  ): Promise<any> => {
    return apiRequest(`/tournaments/registrations/${registrationId}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyTournaments: async (): Promise<any[]> => {
    const res = await apiRequest<any>("/my-tournaments", { method: "GET" }, { success: true, tournaments: [] });
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.tournaments && Array.isArray(res.tournaments)) return res.tournaments;
    return [];
  },

  searchPlayers: async (query: string, tournamentId?: string): Promise<any[]> => {
    const qs = new URLSearchParams({ q: query });
    if (tournamentId) qs.set("tournamentId", tournamentId);
    const res = await apiRequest<{ success: boolean; players: any[] }>(`/players/search?${qs.toString()}`, { method: "GET" }, { success: true, players: [] });
    return res.players || [];
  },

  invitePlayer: async (teamId: string, userId: string, role?: string): Promise<any> => {
    return apiRequest(`/teams/${teamId}/invite`, {
      method: "POST",
      body: JSON.stringify({ userId, role: role || "STARTER" }),
    });
  },

  removePlayer: async (teamId: string, memberId: string): Promise<any> => {
    return apiRequest(`/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  getNotifications: async (): Promise<{ notifications: any[]; unreadCount: number; pendingInvitations: any[] }> => {
    return apiRequest("/notifications", { method: "GET" }, { notifications: [], unreadCount: 0, pendingInvitations: [] });
  },

  markNotificationRead: async (id: string): Promise<any> => {
    return apiRequest(`/notifications/${id}/read`, { method: "PUT" });
  },

  markAllNotificationsRead: async (): Promise<any> => {
    return apiRequest("/notifications/read-all", { method: "PUT" });
  },

  respondToInvitation: async (invitationId: string, action: "ACCEPT" | "REJECT"): Promise<any> => {
    return apiRequest(`/invitations/${invitationId}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },

  getTournamentTeams: async (tournamentId: string): Promise<any[]> => {
    const res = await apiRequest<{ success: boolean; teams: any[] }>(`/tournaments/${tournamentId}/teams`, { method: "GET" }, { success: true, teams: [] });
    return res.teams || [];
  },

  getRegistrations: async (params?: { tournamentId?: string; status?: string; search?: string }): Promise<RegistrationItem[]> => {
    const query = new URLSearchParams();
    if (params?.tournamentId) query.set("tournamentId", params.tournamentId);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<RegistrationItem[]>(`/tournaments/registrations${qs}`, { method: "GET" }, []);
  },

  getStages: async (tournamentId: string): Promise<TournamentStage[]> => {
    return apiRequest<TournamentStage[]>(`/tournaments/${tournamentId}/stages`, { method: "GET" }, []);
  },

  getLeaderboard: async (tournamentId: string): Promise<LeaderboardEntry[]> => {
    return apiRequest<LeaderboardEntry[]>(`/tournaments/${tournamentId}/leaderboard`, { method: "GET" }, []);
  },

  uploadImage: async (file: File): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(getApiUrl("/upload"), {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload screenshot");
    }
    return res.json();
  },

  checkInTeam: async (tournamentId: string, teamId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ teamId }),
    });
  },

  getMatches: async (tournamentId: string): Promise<any[]> => {
    const res = await apiRequest<{ success: boolean; matches: any[] }>(
      `/tournaments/${tournamentId}/matches`,
      { method: "GET" },
      { success: true, matches: [] }
    );
    return res.matches || [];
  },

  getMatchCredentials: async (tournamentId: string, matchId: string): Promise<any> => {
    return apiRequest(`/tournaments/${tournamentId}/matches/${matchId}/credentials`, {
      method: "GET",
    });
  },

  getMyRoomAccess: async (tournamentId: string): Promise<{ success: boolean; data: any }> => {
    return apiRequest<{ success: boolean; data: any }>(
      `/tournaments/${tournamentId}/my-room-access`,
      { method: "GET" },
      { success: false, data: null }
    );
  },
};

export const getMyTournaments = tournamentsApi.getMyTournaments;
export const submitPayment = tournamentsApi.submitPayment;
export const searchPlayers = tournamentsApi.searchPlayers;
export const invitePlayer = tournamentsApi.invitePlayer;
export const removePlayer = tournamentsApi.removePlayer;
export const getNotifications = tournamentsApi.getNotifications;
export const markNotificationRead = tournamentsApi.markNotificationRead;
export const markAllNotificationsRead = tournamentsApi.markAllNotificationsRead;
export const respondToInvitation = tournamentsApi.respondToInvitation;
export const getTournamentTeams = tournamentsApi.getTournamentTeams;
export const checkInTeam = tournamentsApi.checkInTeam;
export const getMatchCredentials = tournamentsApi.getMatchCredentials;
export const getMyRoomAccess = tournamentsApi.getMyRoomAccess;


