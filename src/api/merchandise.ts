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

export function getStoredOrders(): OrderItem[] {
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = localStorage.getItem(DELETED_ORDERS_KEY);
      const deletedSet = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
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
      const deletedRaw = localStorage.getItem(DELETED_ORDERS_KEY);
      const deletedSet = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
      const filtered = items
        .filter((o) => o && (o.id || o.orderNumber) && !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
        .map(normalizeOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent("mg_order_created", { detail: filtered }));
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

export function normalizeOrder(ord: OrderItem): OrderItem {
  if (!ord) return ord;
  return {
    ...ord,
    orderNumber: ord.orderNumber ? ord.orderNumber.replace(/^LZ-/i, "MG-") : ord.orderNumber,
  };
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

  createOrder: async (data: any): Promise<OrderItem> => {
    const tempId = data.id || `ord-${Date.now()}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedOrderNumber = data.orderNumber || `MG-${new Date().getFullYear()}-${randomSuffix}`;
    const defaultPaymentStatus =
      data.paymentStatus ||
      (data.paymentMethod === "UPI"
        ? (data.utrNumber ? "PENDING_VERIFICATION" : "PENDING")
        : "COD_PENDING");

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
      paymentStatus: defaultPaymentStatus,
      utrNumber: data.utrNumber || null,
      orderStatus: "PENDING",
      courierPartner: null,
      trackingNumber: null,
      expectedDeliveryDate: null,
      adminNotes: null,
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately persist locally (0ms) so customer tracking and admin portal have it
    saveSingleOrder(localOrder);

    // 2. Transmit to backend API
    try {
      const res = await apiRequest<OrderItem>("/orders", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          orderNumber: generatedOrderNumber,
          customerEmail: localOrder.customerEmail,
        }),
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

    const deletedRaw = typeof localStorage !== "undefined" ? localStorage.getItem(DELETED_ORDERS_KEY) : null;
    const deletedSet = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();

    const merged = Array.from(map.values())
      .filter((o) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__" && !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    persistStoredOrders(merged);
    return merged;
  },

  trackOrders: async (query: string): Promise<OrderItem[]> => {
    const clean = query.trim();
    if (!clean) return [];

    const local = getStoredOrders();
    const cleanUpper = clean.toUpperCase();
    const cleanDigits = clean.replace(/[^0-9]/g, "");

    // Search local cache first
    const localMatches = local.filter((o) => {
      if (!o) return false;
      const ordNum = (o.orderNumber || "").toUpperCase();
      const phoneDigits = (o.customerPhone || "").replace(/[^0-9]/g, "");
      const email = (o.customerEmail || "").toLowerCase();
      const tracking = (o.trackingNumber || "").toUpperCase();

      if (ordNum === cleanUpper || ordNum.includes(cleanUpper)) return true;
      if (cleanUpper.startsWith("MG-") && ordNum.includes(cleanUpper.replace(/^MG-/, ""))) return true;
      if (cleanUpper.startsWith("LZ-") && ordNum.includes(cleanUpper.replace(/^LZ-/, ""))) return true;
      if (tracking && tracking.includes(cleanUpper)) return true;
      if (email === clean.toLowerCase()) return true;
      if (cleanDigits.length >= 6 && phoneDigits.includes(cleanDigits)) return true;
      return false;
    });

    // Also search server
    let serverOrders: OrderItem[] = [];
    try {
      const res = await apiRequest<OrderItem[]>(`/orders/track?query=${encodeURIComponent(clean)}`, { method: "GET" }, []);
      if (Array.isArray(res) && res.length > 0) {
        serverOrders = res.map(normalizeOrder);
      } else if (clean.toUpperCase().startsWith("MG-")) {
        const lzQuery = clean.replace(/^MG-/i, "LZ-");
        const alt = await apiRequest<OrderItem[]>(`/orders/track?query=${encodeURIComponent(lzQuery)}`, { method: "GET" }, []);
        if (Array.isArray(alt) && alt.length > 0) {
          serverOrders = alt.map(normalizeOrder);
        }
      } else if (clean.toUpperCase().startsWith("LZ-")) {
        const mgQuery = clean.replace(/^LZ-/i, "MG-");
        const alt = await apiRequest<OrderItem[]>(`/orders/track?query=${encodeURIComponent(mgQuery)}`, { method: "GET" }, []);
        if (Array.isArray(alt) && alt.length > 0) {
          serverOrders = alt.map(normalizeOrder);
        }
      }
    } catch {}

    // Combine local matches and server matches
    const map = new Map<string, OrderItem>();
    localMatches.forEach((o) => {
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

    const results = Array.from(map.values())
      .filter((o) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__")
      .map(normalizeOrder);

    if (serverOrders.length > 0) {
      serverOrders.forEach((o) => saveSingleOrder(o));
    }

    return results;
  },

  getMyOrders: async (): Promise<OrderItem[]> => {
    const local = getStoredOrders();
    let serverOrders: OrderItem[] = [];
    try {
      const res = await apiRequest<{ success: boolean; data: OrderItem[]; user?: any } | OrderItem[]>("/orders/my-orders", { method: "GET" });
      const list = Array.isArray(res) ? res : res && Array.isArray((res as any).data) ? (res as any).data : [];
      serverOrders = list.map(normalizeOrder);
    } catch {}

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

    return Array.from(map.values())
      .filter((o) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__")
      .map(normalizeOrder);
  },

  updateOrderStatus: async (
    id: string,
    orderStatus: string,
    trackingNumber?: string
  ): Promise<OrderItem> => {
    // 1. Update local cache immediately
    const local = getStoredOrders();
    const updated = local.map((o) =>
      o.id === id || o.orderNumber === id
        ? { ...o, orderStatus: orderStatus as any, ...(trackingNumber ? { trackingNumber } : {}) }
        : o
    );
    persistStoredOrders(updated);

    // 2. Transmit to backend API
    try {
      const res = await apiRequest<OrderItem>(`/orders/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus, trackingNumber }),
      });
      if (res && (res.id || res.orderNumber)) {
        saveSingleOrder(res);
        return normalizeOrder(res);
      }
    } catch {}

    const fallback = updated.find((o) => o.id === id || o.orderNumber === id);
    return fallback || ({} as OrderItem);
  },
};
