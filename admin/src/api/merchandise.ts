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

export const fallbackProducts: ProductItem[] = [
  {
    id: "lordz-pro-jersey-2026",
    name: "LORD PRO COMBAT JERSEY 2026",
    slug: "lordz-pro-jersey-2026",
    subtitle: "Official 2026-27 Athlete Edition • Black & Gold Temple Dravidian Edition",
    description: "Engineered for high-pressure competition. Crafted with breathable micro-poly, Dravidian temple gopuram architectural line art, and battle flame aesthetics.",
    price: 1299,
    originalPrice: 1999,
    stock: 150,
    category: "JERSEY",
    sizes: JSON.stringify(["S", "M", "L", "XL", "2XL"]),
    isAvailable: true,
    isFeatured: true,
  },
  {
    id: "lordz-stealth-hoodie",
    name: "LORD STEALTH CLAN HOODIE",
    slug: "lordz-stealth-hoodie",
    subtitle: "Heavyweight 380 GSM Fleece with Metallic Gold Crest",
    description: "Premium fleece pullover with gold-embroidered Lord crest, kangaroo pocket, and thumbhole cuffs.",
    price: 2499,
    originalPrice: 3299,
    stock: 75,
    category: "HOODIE",
    sizes: JSON.stringify(["M", "L", "XL", "2XL"]),
    isAvailable: true,
    isFeatured: false,
  },
];

export const merchandiseApi = {
  getProducts: async (): Promise<ProductItem[]> => {
    return apiRequest<ProductItem[]>("/merchandise", { method: "GET" }, fallbackProducts);
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
    return apiRequest<OrderItem[]>(`/orders${qs}`, { method: "GET" }, []);
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
