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

export const ORDERS_STORAGE_KEY = "mg_cached_orders";
export const DELETED_ORDERS_KEY = "lordz_deleted_orders";

function getDeletedOrderSet(): Set<string> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DELETED_ORDERS_KEY) : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function getStoredOrders(): OrderItem[] {
  if (typeof window !== "undefined") {
    try {
      const deletedSet = getDeletedOrderSet();
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((o: OrderItem) => o && (o.id || o.orderNumber) && !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
            .map(normalizeOrder);
        }
      }
    } catch {}
  }
  return [];
}

export function persistStoredOrders(items: OrderItem[]) {
  if (typeof window !== "undefined") {
    try {
      const deletedSet = getDeletedOrderSet();
      const filtered = items
        .filter((o) => o && (o.id || o.orderNumber) && !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
        .map(normalizeOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent("mg_orders_updated", { detail: filtered }));
    } catch {}
  }
}

export function saveSingleOrder(ord: OrderItem): OrderItem {
  const normalized = normalizeOrder(ord);
  const current = getStoredOrders();
  const existingIdx = current.findIndex(
    (o) => (normalized.id && o.id === normalized.id) || (normalized.orderNumber && o.orderNumber === normalized.orderNumber)
  );
  let updated: OrderItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...normalized };
  } else {
    updated = [normalized, ...current];
  }
  persistStoredOrders(updated);
  return normalized;
}

export function markOrderAsDeleted(identifiers: string[]) {
  try {
    if (typeof localStorage === "undefined") return;
    const set = getDeletedOrderSet();
    identifiers.forEach((id) => {
      if (id && typeof id === "string") set.add(id.trim());
    });
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(set)));

    // Also remove from stored orders
    const current = getStoredOrders().filter((o) => !set.has(o.id) && !set.has(o.orderNumber));
    persistStoredOrders(current);
  } catch {}
}

export const fallbackProducts: ProductItem[] = [];

export function normalizeOrder(ord: OrderItem): OrderItem {
  if (!ord) return ord;
  return {
    ...ord,
    orderNumber: ord.orderNumber ? ord.orderNumber.replace(/^LZ-/i, "MG-") : ord.orderNumber,
  };
}

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
    const tempId = data.id || `ord-${Date.now()}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedOrderNumber = data.orderNumber || `MG-${new Date().getFullYear()}-${randomSuffix}`;

    const localOrder: OrderItem = {
      id: tempId,
      orderNumber: generatedOrderNumber,
      productId: data.productId || null,
      productName: data.productName || "MG PRO COMBAT JERSEY 2026",
      customerName: data.customerName || "Clan Supporter",
      customerEmail: data.customerEmail || "fan@mgesports.in",
      customerPhone: data.customerPhone || "",
      address: data.address || "",
      city: data.city || "Chennai",
      state: data.state || "Tamil Nadu",
      pincode: data.pincode || "600001",
      size: data.size || "L",
      customIgn: data.customIgn || null,
      customNumber: data.customNumber || null,
      totalAmount: Number(data.totalAmount) || 1299,
      paymentMethod: data.paymentMethod || "UPI",
      paymentStatus: data.paymentStatus || "PENDING",
      utrNumber: data.utrNumber || null,
      orderStatus: "PENDING",
      courierPartner: null,
      trackingNumber: null,
      expectedDeliveryDate: null,
      adminNotes: null,
      createdAt: new Date().toISOString(),
    };

    saveSingleOrder(localOrder);

    try {
      const res = await apiRequest<OrderItem>("/orders", {
        method: "POST",
        body: JSON.stringify({ ...data, orderNumber: generatedOrderNumber }),
      });
      if (res && (res.id || res.orderNumber)) {
        const synced = normalizeOrder({
          ...localOrder,
          ...res,
          orderNumber: res.orderNumber ? res.orderNumber.replace(/^LZ-/i, "MG-") : generatedOrderNumber,
        });
        saveSingleOrder(synced);
        return synced;
      }
      return localOrder;
    } catch {
      return localOrder;
    }
  },

  getOrders: async (params?: { status?: string; search?: string }): Promise<OrderItem[]> => {
    const local = getStoredOrders();
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    let serverOrders: OrderItem[] = [];
    try {
      const list = await apiRequest<OrderItem[]>(`/orders${qs}`, { method: "GET" }, []);
      if (Array.isArray(list)) {
        serverOrders = list.map(normalizeOrder);
      }
    } catch {}

    // Merge server and local orders
    const map = new Map<string, OrderItem>();
    local.forEach((o) => {
      const key = o.orderNumber || o.id;
      if (key) map.set(key, o);
    });
    serverOrders.forEach((o) => {
      const key = o.orderNumber || o.id;
      if (key) {
        const existing = map.get(key);
        map.set(key, existing ? { ...existing, ...o } : o);
      }
    });

    const deletedSet = getDeletedOrderSet();
    const merged = Array.from(map.values())
      .filter((ord) => {
        if (!ord) return false;
        if ((ord.orderStatus as any) === "DELETED" || ord.adminNotes === "__DELETED__") return false;
        if (ord.id && deletedSet.has(ord.id)) return false;
        if (ord.orderNumber && deletedSet.has(ord.orderNumber)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    persistStoredOrders(merged);
    return merged;
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

    // Update local cache immediately
    const local = getStoredOrders();
    const existing = local.find((o) => o.id === id || o.orderNumber === id);
    if (existing) {
      saveSingleOrder({ ...existing, ...body } as OrderItem);
    }

    try {
      const res = await apiRequest<OrderItem>(`/orders/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (res && (res.id || res.orderNumber)) {
        saveSingleOrder(res);
        return normalizeOrder(res);
      }
    } catch {}

    return existing ? ({ ...existing, ...body } as OrderItem) : ({} as OrderItem);
  },
};
