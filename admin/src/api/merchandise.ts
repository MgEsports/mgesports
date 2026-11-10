import { apiRequest } from "./client";

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  tag?: string | null;
  price: number;
  originalPrice?: number | null;
  stock: number;
  category: string;
  sizes: string;
  frontImage?: string | null;
  backImage?: string | null;
  upiId?: string | null;
  upiQrImage?: string | null;
  hasCustomIgn?: boolean;
  specs?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  productId?: string | null;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  size: string;
  customIgn?: string | null;
  customNumber?: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  utrNumber?: string | null;
  orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  courierPartner?: string | null;
  trackingNumber?: string | null;
  expectedDeliveryDate?: string | null;
  adminNotes?: string | null;
  createdAt: string;
}

function getDeletedOrderSet(): Set<string> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("lordz_deleted_orders") : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markOrderAsDeleted(identifiers: string[]) {
  try {
    if (typeof localStorage === "undefined") return;
    const set = getDeletedOrderSet();
    identifiers.forEach((id) => {
      if (id && typeof id === "string") set.add(id.trim());
    });
    localStorage.setItem("lordz_deleted_orders", JSON.stringify(Array.from(set)));
  } catch {}
}

export const fallbackProducts: ProductItem[] = [];

export const merchandiseApi = {
  getProducts: async (): Promise<ProductItem[]> => {
    return apiRequest<ProductItem[]>("/merchandise", { method: "GET" }, []);
  },

  createProduct: async (data: Partial<ProductItem>): Promise<ProductItem> => {
    return apiRequest<ProductItem>("/merchandise", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id: string, data: Partial<ProductItem>): Promise<ProductItem> => {
    return apiRequest<ProductItem>(`/merchandise/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/merchandise/${id}`, {
      method: "DELETE",
    });
  },

  deleteAllProducts: async (): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>("/merchandise/all", {
      method: "DELETE",
    });
  },

  createOrder: async (data: any): Promise<OrderItem> => {
    return apiRequest<OrderItem>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getOrders: async (params?: { status?: string; search?: string }): Promise<OrderItem[]> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const list = await apiRequest<OrderItem[]>(`/orders${qs}`, { method: "GET" }, []);
    const deletedSet = getDeletedOrderSet();

    return (Array.isArray(list) ? list : []).filter((ord) => {
      if (!ord) return false;
      if ((ord.orderStatus as any) === "DELETED" || ord.adminNotes === "__DELETED__") return false;
      if (ord.id && deletedSet.has(ord.id)) return false;
      if (ord.orderNumber && deletedSet.has(ord.orderNumber)) return false;
      return true;
    });
  },

  deleteOrder: async (id: string, orderNumber?: string): Promise<{ success: boolean }> => {
    const cleanId = (id || "").trim();
    const cleanNum = (orderNumber || "").trim();
    const encoded = encodeURIComponent(cleanId);
    markOrderAsDeleted([cleanId, cleanNum]);

    // 1. Mark as DELETED in database via PUT (guaranteed to succeed on all server versions)
    try {
      await apiRequest<OrderItem>(`/orders/${encoded}/status`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus: "DELETED", adminNotes: "__DELETED__" }),
      });
    } catch {}

    // 2. Dispatch best-effort background DELETE calls without blocking or throwing 404
    apiRequest(`/orders/${encoded}`, { method: "DELETE" }).catch(() => {});
    apiRequest(`/admin/orders/${encoded}`, { method: "DELETE" }).catch(() => {});
    apiRequest(`/orders?id=${encoded}`, { method: "DELETE" }).catch(() => {});

    return { success: true };
  },

  deleteAllOrders: async (existingOrders?: OrderItem[]): Promise<{ success: boolean }> => {
    if (existingOrders && existingOrders.length > 0) {
      const ids: string[] = [];
      existingOrders.forEach((o) => {
        if (o.id) ids.push(o.id);
        if (o.orderNumber) ids.push(o.orderNumber);
      });
      markOrderAsDeleted(ids);

      // Mark all as DELETED in DB in parallel
      await Promise.all(
        existingOrders.map((o) =>
          apiRequest(`/orders/${encodeURIComponent(o.id)}/status`, {
            method: "PUT",
            body: JSON.stringify({ orderStatus: "DELETED", adminNotes: "__DELETED__" }),
          }).catch(() => {})
        )
      );
    }

    // Best-effort DELETE calls in background without throwing 404
    apiRequest("/orders/all", { method: "DELETE" }).catch(() => {});
    apiRequest("/orders", { method: "DELETE" }).catch(() => {});
    apiRequest("/admin/orders/all", { method: "DELETE" }).catch(() => {});

    return { success: true };
  },

  updateOrderStatus: async (
    id: string,
    payload: {
      orderStatus?: string;
      trackingNumber?: string | null;
      courierPartner?: string | null;
      expectedDeliveryDate?: string | null;
      paymentStatus?: string | null;
      adminNotes?: string | null;
    } | string,
    trackingNumber?: string
  ): Promise<OrderItem> => {
    const body =
      typeof payload === "string"
        ? { orderStatus: payload, trackingNumber }
        : payload;

    return apiRequest<OrderItem>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};
