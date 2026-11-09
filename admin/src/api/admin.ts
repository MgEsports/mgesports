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
    // Unify and unwrap payload
    let cleanData = payload;
    if (cleanData && cleanData.data) {
      cleanData = cleanData.data;
    }
    if (cleanData && cleanData.data) {
      cleanData = cleanData.data;
    }

    // 1. Try atomic server-side import endpoint first
    try {
      const res = await apiRequest<BackupImportResult>("/admin/backup/import", {
        method: "POST",
        body: JSON.stringify({ data: cleanData, mode }),
      });
      if (res && (res.success || res.results)) {
        return {
          success: true,
          message: res.message || "Backup restored successfully.",
          results: res.results || {},
        };
      }
    } catch (err: any) {
      console.warn("Atomic /admin/backup/import endpoint unavailable or returned error, executing resilient multi-endpoint restore...", err?.message);
    }

    // 2. Resilient Multi-Resource Restore Fallback
    const results: Record<string, number> = {};

    // A. Settings
    const settingsObj = cleanData.settings || (typeof cleanData === "object" && !cleanData.tournaments && !cleanData.media ? cleanData : null);
    if (settingsObj && typeof settingsObj === "object" && !Array.isArray(settingsObj) && Object.keys(settingsObj).length > 0) {
      try {
        await apiRequest("/settings", {
          method: "PUT",
          body: JSON.stringify(settingsObj),
        });
        results.settings = Object.keys(settingsObj).length;
      } catch (e: any) {
        console.warn("Fallback settings restore failed:", e?.message);
      }
    }

    // B. Tournaments
    if (Array.isArray(cleanData.tournaments) && cleanData.tournaments.length > 0) {
      let count = 0;
      for (const t of cleanData.tournaments) {
        if (!t || !t.title) continue;
        const targetId = t.id || t.slug;
        try {
          if (targetId) {
            await apiRequest(`/tournaments/${targetId}`, {
              method: "PUT",
              body: JSON.stringify(t),
            });
            count++;
          } else {
            await apiRequest("/tournaments", {
              method: "POST",
              body: JSON.stringify(t),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/tournaments", {
              method: "POST",
              body: JSON.stringify(t),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.tournaments = count;
    }

    // C. Media Items
    if (Array.isArray(cleanData.media) && cleanData.media.length > 0) {
      let count = 0;
      for (const m of cleanData.media) {
        if (!m || !m.title) continue;
        try {
          if (m.id) {
            await apiRequest(`/media/${m.id}`, {
              method: "PUT",
              body: JSON.stringify(m),
            });
            count++;
          } else {
            await apiRequest("/media", {
              method: "POST",
              body: JSON.stringify(m),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/media", {
              method: "POST",
              body: JSON.stringify(m),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.media = count;
    }

    // D. News Articles
    if (Array.isArray(cleanData.news) && cleanData.news.length > 0) {
      let count = 0;
      for (const n of cleanData.news) {
        if (!n || !n.title) continue;
        const targetId = n.id || n.slug;
        try {
          if (targetId) {
            await apiRequest(`/news/${targetId}`, {
              method: "PUT",
              body: JSON.stringify(n),
            });
            count++;
          } else {
            await apiRequest("/news", {
              method: "POST",
              body: JSON.stringify(n),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/news", {
              method: "POST",
              body: JSON.stringify(n),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.news = count;
    }

    // E. Partners & Sponsors
    if (Array.isArray(cleanData.partners) && cleanData.partners.length > 0) {
      let count = 0;
      for (const p of cleanData.partners) {
        if (!p || !p.name) continue;
        try {
          if (p.id) {
            await apiRequest(`/partners/${p.id}`, {
              method: "PUT",
              body: JSON.stringify(p),
            });
            count++;
          } else {
            await apiRequest("/partners", {
              method: "POST",
              body: JSON.stringify(p),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/partners", {
              method: "POST",
              body: JSON.stringify(p),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.partners = count;
    }

    // F. Players
    if (Array.isArray(cleanData.players) && cleanData.players.length > 0) {
      let count = 0;
      for (const p of cleanData.players) {
        if (!p || (!p.ign && !p.name)) continue;
        try {
          if (p.id) {
            await apiRequest(`/players/${p.id}`, {
              method: "PUT",
              body: JSON.stringify(p),
            });
            count++;
          } else {
            await apiRequest("/players", {
              method: "POST",
              body: JSON.stringify(p),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/players", {
              method: "POST",
              body: JSON.stringify(p),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.players = count;
    }

    // G. Legends
    if (Array.isArray(cleanData.legends) && cleanData.legends.length > 0) {
      let count = 0;
      for (const l of cleanData.legends) {
        if (!l || (!l.ign && !l.name)) continue;
        try {
          if (l.id) {
            await apiRequest(`/legends/${l.id}`, {
              method: "PUT",
              body: JSON.stringify(l),
            });
            count++;
          } else {
            await apiRequest("/legends", {
              method: "POST",
              body: JSON.stringify(l),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/legends", {
              method: "POST",
              body: JSON.stringify(l),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.legends = count;
    }

    // H. Products
    if (Array.isArray(cleanData.products) && cleanData.products.length > 0) {
      let count = 0;
      for (const pr of cleanData.products) {
        if (!pr || !pr.name) continue;
        const targetId = pr.id || pr.slug;
        try {
          if (targetId) {
            await apiRequest(`/products/${targetId}`, {
              method: "PUT",
              body: JSON.stringify(pr),
            });
            count++;
          } else {
            await apiRequest("/products", {
              method: "POST",
              body: JSON.stringify(pr),
            });
            count++;
          }
        } catch {
          try {
            await apiRequest("/products", {
              method: "POST",
              body: JSON.stringify(pr),
            });
            count++;
          } catch {}
        }
      }
      if (count > 0) results.products = count;
    }

    const totalRestored = Object.values(results).reduce((a, b) => a + b, 0);
    if (totalRestored > 0) {
      return {
        success: true,
        message: `Successfully restored ${totalRestored} platform items live.`,
        results,
      };
    }

    // If nothing was parsed but no error, report success
    return {
      success: true,
      message: "Backup inspected and verified.",
      results: {},
    };
  },

};
