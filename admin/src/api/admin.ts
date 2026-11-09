import { apiRequest, getApiUrl } from "./client";

export interface DashboardMetrics {
  kpis: {
    tournamentsCount: number;
    liveTournamentsCount: number;
    registrationsCount: number;
    pendingRegistrationsCount: number;
    playersCount: number;
    legendsCount: number;
    ordersCount: number;
    pendingOrdersCount: number;
    productsCount: number;
    articlesCount: number;
    partnersCount: number;
    totalRevenue: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number; registrations: number }>;
  recentRegistrations: any[];
  recentOrders: any[];
  recentAuditLogs: any[];
  gameDistribution?: Array<{ game: string; count: number; percentage: number }>;
  productSales?: Array<{ name: string; revenue: number; count: number; percentage: number }>;
  systemHealth?: {
    latencyMs: number;
    dbStatus: string;
    uptime: string;
  };
}


export interface PlatformBackupData {
  settings?: Record<string, any>;
  tournaments?: any[];
  media?: any[];
  news?: any[];
  partners?: any[];
  partnerPlans?: any[];
  players?: any[];
  legends?: any[];
  products?: any[];
  votingEvents?: any[];
  [key: string]: any;
}

export interface PlatformBackupPayload {
  version: string;
  organization: string;
  exportedAt: string;
  summary?: Record<string, number>;
  data: PlatformBackupData;
  settings?: Record<string, any>; // also allow top-level for convenience
}

export interface BackupImportResult {
  success: boolean;
  message: string;
  results?: Record<string, number>;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName?: string | null;
  role: "ADMIN" | string;
  status: "ACTIVE" | "SUSPENDED";
  phone?: string | null;
  discord?: string | null;
  createdAt: string;
}

export const adminApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    return apiRequest<DashboardMetrics>("/analytics/dashboard", { method: "GET" });
  },

  getAdminUsers: async (): Promise<AdminUserItem[]> => {
    return apiRequest<AdminUserItem[]>("/admin/users", { method: "GET" }, []);
  },

  createAdminUser: async (data: any): Promise<AdminUserItem> => {
    return apiRequest<AdminUserItem>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateAdminUser: async (id: string, data: any): Promise<AdminUserItem> => {
    return apiRequest<AdminUserItem>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteAdminUser: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/admin/users/${id}`, {
      method: "DELETE",
    });
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("lordz_admin_token");
    const response = await fetch(getApiUrl("/upload"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || "Upload failed");
    }
    return json;
  },

  exportFullBackup: async (): Promise<PlatformBackupPayload> => {
    try {
      const res = await apiRequest<any>("/admin/backup/export", { method: "GET" });
      if (res && (res.data || res.settings || res.tournaments)) {
        return {
          version: res.version || "2.0",
          organization: res.organization || "MG Esports",
          exportedAt: res.exportedAt || new Date().toISOString(),
          summary: res.summary || {},
          data: res.data || {
            settings: res.settings || {},
            tournaments: res.tournaments || [],
            media: res.media || [],
            news: res.news || [],
            partners: res.partners || [],
            partnerPlans: res.partnerPlans || [],
            players: res.players || [],
            legends: res.legends || [],
            products: res.products || [],
            votingEvents: res.votingEvents || [],
          },
        };
      }
      throw new Error("Empty response from backup export");
    } catch (err) {
      console.warn("Direct backup export failed, fallback to multi-endpoint collection...", err);
      const [settings, tournaments, media, news, partners, players, legends] = await Promise.allSettled([
        apiRequest<Record<string, any>>("/settings", { method: "GET" }).catch(() => ({})),
        apiRequest<any[]>("/tournaments", { method: "GET" }).catch(() => []),
        apiRequest<any[]>("/media", { method: "GET" }).catch(() => []),
        apiRequest<any[]>("/news", { method: "GET" }).catch(() => []),
        apiRequest<any[]>("/partners", { method: "GET" }).catch(() => []),
        apiRequest<any[]>("/players", { method: "GET" }).catch(() => []),
        apiRequest<any[]>("/legends", { method: "GET" }).catch(() => []),
      ]);

      const getVal = (r: PromiseSettledResult<any>, fallback: any) =>
        r.status === "fulfilled" ? r.value : fallback;

      const gatheredData: PlatformBackupData = {
        settings: getVal(settings, {}),
        tournaments: getVal(tournaments, []),
        media: getVal(media, []),
        news: getVal(news, []),
        partners: getVal(partners, []),
        players: getVal(players, []),
        legends: getVal(legends, []),
      };

      return {
        version: "2.0",
        organization: "MG Esports",
        exportedAt: new Date().toISOString(),
        summary: {
          settings: Object.keys(gatheredData.settings || {}).length,
          tournaments: gatheredData.tournaments?.length || 0,
          media: gatheredData.media?.length || 0,
          news: gatheredData.news?.length || 0,
          partners: gatheredData.partners?.length || 0,
          players: gatheredData.players?.length || 0,
          legends: gatheredData.legends?.length || 0,
        },
        data: gatheredData,
      };
    }
  },

  importFullBackup: async (payload: any, mode: "merge" | "replace" = "merge"): Promise<BackupImportResult> => {
    // Unify data object
    const cleanData = payload.data ? payload.data : payload;
    try {
      const res = await apiRequest<BackupImportResult>("/admin/backup/import", {
        method: "POST",
        body: JSON.stringify({ data: cleanData, mode }),
      });
      return res;
    } catch (err: any) {
      console.warn("Direct backup import endpoint error, attempting partial fallback...", err);
      // Fallback: If settings are present, update via /settings
      if (cleanData.settings && Object.keys(cleanData.settings).length > 0) {
        await apiRequest("/settings", {
          method: "PUT",
          body: JSON.stringify(cleanData.settings),
        });
        return {
          success: true,
          message: "Settings restored successfully (fallback mode).",
          results: { settings: Object.keys(cleanData.settings).length },
        };
      }
      throw err;
    }
  },

};
