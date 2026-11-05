import { apiRequest } from "./client";

export interface VotingCandidateInput {
  id?: string;
  name: string;
  role?: string;
  team?: string;
  imageUrl?: string | null;
  bio?: string | null;
  category?: string | null;
  platform?: string | null;
}

export interface VotingNominee {
  id: string;
  votingEventId: string;
  playerId?: string;
  name: string;
  role?: string;
  team?: string;
  imageUrl?: string | null;
  bio?: string | null;
  category?: string | null;
  platform?: string | null;
  displayOrder: number;
  voteCount?: number;
  percentage?: number;
  player?: {
    id: string;
    ign: string;
    realName: string;
    role: string;
    team: string;
    image?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

export interface VotingEvent {
  id: string;
  title: string;
  slug?: string | null;
  category?: string;
  description?: string | null;
  bannerImage?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  startDate: string;
  endDate: string;
  isLiveResults: boolean;
  createdAt: string;
  updatedAt: string;
  nomineesCount?: number;
  totalVotes?: number;
  nominees?: VotingNominee[];
  leadingNominee?: {
    ign: string;
    votes: number;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  nomineeId: string;
  playerId: string;
  name: string;
  role?: string;
  team?: string;
  imageUrl?: string | null;
  category?: string | null;
  platform?: string | null;
  votes: number;
  percentage: number;
  player: {
    id: string;
    ign: string;
    realName: string;
    role: string;
    team: string;
    image?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

export interface VotingResultsData {
  eventId: string;
  title: string;
  category?: string;
  status: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  nomineesCount: number;
  leaderboard: LeaderboardEntry[];
}

export interface CreateVotingEventPayload {
  title: string;
  slug?: string;
  category?: string;
  description?: string;
  bannerImage?: string | null;
  startDate: string;
  endDate: string;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  isLiveResults?: boolean;
  nominees: VotingCandidateInput[];
  playerIds?: string[];
}

export const votingApi = {
  getAll: async (): Promise<VotingEvent[]> => {
    return apiRequest<VotingEvent[]>("/admin/voting/events", { method: "GET" }, []);
  },

  getById: async (id: string): Promise<VotingEvent> => {
    return apiRequest<VotingEvent>(`/admin/voting/events/${id}`, { method: "GET" });
  },

  create: async (payload: CreateVotingEventPayload): Promise<VotingEvent> => {
    return apiRequest<VotingEvent>("/admin/voting/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update: async (id: string, payload: Partial<CreateVotingEventPayload>): Promise<VotingEvent> => {
    return apiRequest<VotingEvent>(`/admin/voting/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  updateStatus: async (
    id: string,
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"
  ): Promise<VotingEvent> => {
    return apiRequest<VotingEvent>(`/admin/voting/events/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  getResults: async (id: string): Promise<VotingResultsData> => {
    return apiRequest<VotingResultsData>(`/admin/voting/events/${id}/results`, {
      method: "GET",
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/admin/voting/events/${id}`, {
      method: "DELETE",
    });
  },
};
