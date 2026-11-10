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
    return (Array.isArray(list) ? list : []).filter(
      (o) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__"
    );
  },

  trackOrders: async (query: string): Promise<OrderItem[]> => {
    const orders = await apiRequest<OrderItem[]>(`/orders/track?query=${encodeURIComponent(query)}`, { method: "GET" }, []);
    return (Array.isArray(orders) ? orders : []).filter(
      (o) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__"
    );
  },

  getMyOrders: async (): Promise<OrderItem[]> => {
    try {
      const res = await apiRequest<{ success: boolean; data: OrderItem[]; user?: any } | OrderItem[]>("/orders/my-orders", { method: "GET" });
      const list = Array.isArray(res) ? res : res && Array.isArray((res as any).data) ? (res as any).data : [];
      return list.filter(
        (o: OrderItem) => o && (o.orderStatus as any) !== "DELETED" && o.adminNotes !== "__DELETED__"
      );
    } catch {
      return [];
    }
  },

  updateOrderStatus: async (
    id: string,
    orderStatus: string,
    trackingNumber?: string
  ): Promise<OrderItem> => {
    return apiRequest<OrderItem>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ orderStatus, trackingNumber }),
    });
  },
};
