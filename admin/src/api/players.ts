import { apiRequest } from "./client";
import { playersData, type Player } from "../data/players";

export interface LegendItem {
  id: string;
  ign: string;
  realName: string;
  role: string;
  activeYears: string;
  retiredJerseyNumber?: string | null;
  achievements: string;
  hallOfFameBio: string;
  avatarUrl?: string | null;
  highlightVideoUrl?: string | null;
  sortOrder?: number;
}

export const fallbackLegends: LegendItem[] = [
  {
    id: "legend-thunder",
    ign: "THUNDER",
    realName: "Praveen Raj",
    role: "FOUNDING RUSHER",
    activeYears: "2023 - 2024",
    retiredJerseyNumber: "10",
    achievements: "Inaugural Booyah MVP, Season 1 Regional Champion, 32 Squad Wipes",
    hallOfFameBio: "Pioneered the hyper-aggressive Clock Tower breach tactics that defined early Lordz dominance. Retired after lifting the Season 1 trophy.",
    sortOrder: 1,
  },
  {
    id: "legend-phantom",
    ign: "PHANTOM",
    realName: "Suresh Iyer",
    role: "TACTICAL SNIPER",
    activeYears: "2022 - 2024",
    retiredJerseyNumber: "03",
    achievements: "88% Career Headshot Accuracy, National Tier-1 Clutch King",
    hallOfFameBio: "Regarded as one of the deadliest AWM sharpshooters in South Indian mobile esports history. Anchored the team during the historic 2023 championship run.",
    sortOrder: 2,
  },
  {
    id: "legend-cyclone",
    ign: "CYCLONE",
    realName: "Aravind Swamy",
    role: "SENIOR STRATEGIST",
    activeYears: "2023 - 2025",
    retiredJerseyNumber: "44",
    achievements: "2x Grand Finals MVP, Hall of Fame Inductee 2025",
    hallOfFameBio: "Architect of Lordz' signature late-zone rotation protocols. Mentored the current roster including Beast and Shadow.",
    sortOrder: 3,
  },
];

export const playersApi = {
  // Pro Athlete Rosters
  getAll: async (): Promise<Player[]> => {
    return apiRequest<Player[]>("/players", { method: "GET" }, playersData);
  },

  create: async (data: Partial<Player>): Promise<Player> => {
    return apiRequest<Player>("/players", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Player>): Promise<Player> => {
    return apiRequest<Player>(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/players/${id}`, {
      method: "DELETE",
    });
  },

  // Hall of Fame & Legends
  getLegends: async (): Promise<LegendItem[]> => {
    return apiRequest<LegendItem[]>("/legends", { method: "GET" }, fallbackLegends);
  },

  createLegend: async (data: Partial<LegendItem>): Promise<LegendItem> => {
    return apiRequest<LegendItem>("/legends", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateLegend: async (id: string, data: Partial<LegendItem>): Promise<LegendItem> => {
    return apiRequest<LegendItem>(`/legends/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteLegend: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/legends/${id}`, {
      method: "DELETE",
    });
  },
};
