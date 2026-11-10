import { apiRequest } from "./client";

export interface SettingsMap {
  liveTicker?: string;
  emergencyBanner?: string;
  emergencyBannerActive?: string;
  tournamentsCount?: string;
  playersCount?: string;
  teamsCount?: string;
  prizePoolCount?: string;
  discordUrl?: string;
  whatsappUrl?: string;
  whatsappScrimsUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  businessEmail?: string;
  codEnabled?: string; // "true" or "false"
  [key: string]: string | undefined;
}

export const fallbackSettings: SettingsMap = {
  liveTicker: "🔥 CLASH OF CLANS WORLD CHAMPIONSHIP FINALS • MG ESPORTS VS TRIBE GAMING • WATCH LIVE",
  emergencyBanner: "MG ESPORTS • GOLDEN TICKET WINNERS • CLASH OF CLANS WORLD CHAMPIONSHIP",
  emergencyBannerActive: "true",
  tournamentsCount: "84% Win Rate",
  playersCount: "Top 8 World",
  teamsCount: "3x Champions",
  prizePoolCount: "Golden Ticket",
  discordUrl: "https://discord.gg/rH3PkZdNz",
  whatsappUrl: "https://whatsapp.com/channel/mgesports",
  whatsappScrimsUrl: "https://whatsapp.com/channel/mgesports-scrims",
  youtubeUrl: "https://youtube.com/@mgesports-mg",
  instagramUrl: "https://www.instagram.com/mg13e.sports",
  twitterUrl: "https://x.com/mg13esports",
  businessEmail: "contact@mgesports.gg",
  codEnabled: "true",
};

export const settingsApi = {
  getSettings: async (): Promise<SettingsMap> => {
    return apiRequest<SettingsMap>("/settings", { method: "GET" }, fallbackSettings);
  },

  updateSettings: async (settings: SettingsMap): Promise<SettingsMap> => {
    return apiRequest<SettingsMap>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};
