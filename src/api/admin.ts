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
};
