import { apiRequest, clearClientCache } from "./client";

export interface PartnerItem {
  id: string;
  name: string;
  category?: string;
  tier?: string;
  logoImage?: string | null;
  cardImage?: string | null;
  websiteUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerPlanItem {
  id: string;
  slug: string;
  name: string;
  badge: string;
  badgeColor?: string;
  price: string;
  billing: string;
  tag?: string | null;
  subheading?: string | null;
  features: string | string[]; // JSON string or string array
  ctaText: string;
  isPopular?: boolean;
  isLifetime?: boolean;
  limitedSlots?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerInquiryItem {
  id: string;
  planId?: string | null;
  planName: string;
  planPrice: string;
  orgName: string;
  contactName: string;
  email: string;
  phone: string;
  discordTag?: string | null;
  websiteUrl?: string | null;
  message?: string | null;
  status: "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED";
  paymentStatus: "PENDING" | "PAID";
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const fallbackPartners: PartnerItem[] = [];

export const fallbackPlansAdmin: PartnerPlanItem[] = [
  {
    id: "plan-bronze",
    slug: "bronze",
    name: "Bronze Partner",
    badge: "BRONZE",
    price: "₹499",
    billing: "/ Month",
    tag: null,
    subheading: null,
    features: JSON.stringify([
      "Official Partner Role",
      "Private Partner Discord Access",
      "Early Tournament Updates",
      "Partner Certificate (Digital)",
    ]),
    ctaText: "SUBSCRIBE BRONZE",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "plan-silver",
    slug: "silver",
    name: "Silver Partner",
    badge: "SILVER",
    price: "₹999",
    billing: "/ Month",
    tag: "Suitable For: Growing Teams & Creators",
    subheading: "EVERYTHING IN BRONZE",
    features: JSON.stringify([
      "Priority Tournament Registration",
      "Reserved Slot (Selected Events)",
      "Monthly Social Media Mention",
    ]),
    ctaText: "SUBSCRIBE SILVER",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "plan-gold",
    slug: "gold",
    name: "Gold Partner",
    badge: "GOLD ★ MOST POPULAR",
    price: "₹1,999",
    billing: "/ Month",
    tag: "Best Value for Competitive Guilds & Brands",
    subheading: "EVERYTHING IN SILVER",
    features: JSON.stringify([
      "Guaranteed Tournament Slot",
      "Logo on Website & Live Streams",
      "Promotional Video / Post per Month",
      "Discord Announcement Feature",
    ]),
    ctaText: "SUBSCRIBE GOLD",
    isPopular: true,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "plan-diamond",
    slug: "diamond",
    name: "Diamond Partner",
    badge: "DIAMOND",
    price: "₹3,999",
    billing: "/ Month",
    tag: "For Brands & Professional Esports Orgs",
    subheading: "EVERYTHING IN GOLD",
    features: JSON.stringify([
      "Co-Branding Opportunities",
      "Custom Tournament Sponsorship",
      "Dedicated Channel in Discord",
      "Direct Collaboration & Sponsorship Deals",
    ]),
    ctaText: "SUBSCRIBE DIAMOND",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "plan-lifetime",
    slug: "lifetime",
    name: "Lifetime Partner",
    badge: "LIFETIME",
    price: "₹9,999",
    billing: "One-Time",
    tag: "LIMITED SLOTS AVAILABLE",
    subheading: null,
    features: JSON.stringify([
      "Permanent Partner Role",
      "Website Hall of Partners",
      "Lifetime Priority Access",
      "Special Recognition During Major Events",
    ]),
    ctaText: "GET LIFETIME ACCESS",
    isPopular: false,
    isLifetime: true,
    limitedSlots: true,
    sortOrder: 5,
    isActive: true,
  },
];

export const partnersApi = {
  getAll: async (): Promise<PartnerItem[]> => {
    return apiRequest<PartnerItem[]>("/partners", { method: "GET" }, []);
  },

  getAllAdmin: async (): Promise<PartnerItem[]> => {
    return apiRequest<PartnerItem[]>("/partners/admin/all", { method: "GET" }, []);
  },

  create: async (data: Partial<PartnerItem>): Promise<PartnerItem> => {
    const res = await apiRequest<PartnerItem>("/partners", {
      method: "POST",
      body: JSON.stringify(data),
    });
    clearClientCache("partners");
    return res;
  },

  update: async (id: string, data: Partial<PartnerItem>): Promise<PartnerItem> => {
    const res = await apiRequest<PartnerItem>(`/partners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    clearClientCache("partners");
    return res;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiRequest<{ success: boolean }>(`/partners/${id}`, {
      method: "DELETE",
    });
    clearClientCache("partners");
    return res;
  },
};

export const partnerInquiriesApi = {
  getAll: async (status?: string): Promise<PartnerInquiryItem[]> => {
    const url = status && status !== "ALL" ? `/partner-inquiries?status=${status}` : "/partner-inquiries";
    return apiRequest<PartnerInquiryItem[]>(url, { method: "GET" }, []);
  },

  update: async (id: string, data: Partial<PartnerInquiryItem>): Promise<PartnerInquiryItem> => {
    return apiRequest<PartnerInquiryItem>(`/partner-inquiries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/partner-inquiries/${id}`, {
      method: "DELETE",
    });
  },
};

export const partnerPlansAdminApi = {
  getAll: async (): Promise<PartnerPlanItem[]> => {
    return apiRequest<PartnerPlanItem[]>("/partner-plans/admin/all", { method: "GET" }, fallbackPlansAdmin);
  },

  update: async (id: string, data: Partial<PartnerPlanItem>): Promise<PartnerPlanItem> => {
    return apiRequest<PartnerPlanItem>(`/partner-plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
