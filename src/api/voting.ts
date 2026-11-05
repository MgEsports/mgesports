import { apiRequest } from "./client";
import type { Player } from "../data/players";

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
  player?: Player;
}

export interface UserVotingStatus {
  hasVoted: boolean;
  votedNomineeId: string | null;
  votedAt: string | null;
}

export interface PublicVotingEvent {
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
  isExpired: boolean;
  isUpcoming: boolean;
  isActive: boolean;
  totalVotes?: number;
  nominees: VotingNominee[];
  userVotingStatus?: UserVotingStatus;
}

export interface VoteResponse {
  voteId: string;
  nomineeId: string;
  playerIgn: string;
  votedAt: string;
}

export const votingApi = {
  getActive: async (category?: string): Promise<PublicVotingEvent | null> => {
    const url = category ? `/voting/active?category=${encodeURIComponent(category)}` : "/voting/active";
    return apiRequest<PublicVotingEvent | null>(url, { method: "GET" }, null);
  },

  getAllActive: async (): Promise<PublicVotingEvent[]> => {
    return apiRequest<PublicVotingEvent[]>("/voting/active-events", { method: "GET" }, []);
  },

  getById: async (id: string): Promise<PublicVotingEvent> => {
    return apiRequest<PublicVotingEvent>(`/voting/events/${id}`, { method: "GET" });
  },

  castVote: async (eventId: string, nomineeId: string): Promise<VoteResponse> => {
    return apiRequest<VoteResponse>(`/voting/events/${eventId}/vote`, {
      method: "POST",
      body: JSON.stringify({ nomineeId }),
    });
  },
};
