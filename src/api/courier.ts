import { apiRequest } from "./client";

export interface CourierOption {
  slug: string;
  name: string;
  category: "Domestic (India)" | "International" | "Global";
  trackingUrl?: (awb: string) => string;
}

export const POPULAR_COURIERS: CourierOption[] = [
  {
    slug: "india-post",
    name: "India Post Domestic",
    category: "Domestic (India)",
    trackingUrl: () => "https://www.indiapost.gov.in/_layouts/15/dpt.cptc.etracking/etms_new.aspx",
  },
  {
    slug: "india-post-int",
    name: "India Post International",
    category: "International",
    trackingUrl: (awb) => `https://track.aftership.com/india-post-int/${encodeURIComponent(awb)}`,
  },
  {
    slug: "delhivery",
    name: "Delhivery",
    category: "Domestic (India)",
    trackingUrl: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
  },
  {
    slug: "bluedart",
    name: "Blue Dart Express",
    category: "Domestic (India)",
    trackingUrl: () => "https://www.bluedart.com/tracking",
  },
  {
    slug: "dtdc",
    name: "DTDC India",
    category: "Domestic (India)",
    trackingUrl: () => "https://www.dtdc.in/tracking.asp",
  },
  {
    slug: "shadowfax",
    name: "Shadowfax",
    category: "Domestic (India)",
    trackingUrl: () => "https://tracker.shadowfax.in",
  },
  {
    slug: "ecom-express",
    name: "Ecom Express",
    category: "Domestic (India)",
    trackingUrl: () => "https://ecomexpress.in/tracking",
  },
  {
    slug: "xpressbees",
    name: "XpressBees",
    category: "Domestic (India)",
    trackingUrl: () => "https://www.xpressbees.com/track",
  },
  {
    slug: "dhl",
    name: "DHL Express",
    category: "Global",
    trackingUrl: (awb) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(awb)}`,
  },
  {
    slug: "fedex",
    name: "FedEx",
    category: "Global",
    trackingUrl: (awb) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`,
  },
  {
    slug: "ups",
    name: "UPS",
    category: "Global",
    trackingUrl: (awb) => `https://www.ups.com/track?tracknum=${encodeURIComponent(awb)}`,
  },
];

export interface TrackingCheckpoint {
  checkpoint_time?: string;
  city?: string | null;
  state?: string | null;
  country_region_name?: string | null;
  location?: string | null;
  message?: string | null;
  tag?: string | null;
  subtag_message?: string | null;
}

export interface TrackingResponse {
  success: boolean;
  found: boolean;
  trackingNumber: string;
  slug: string;
  courierName: string;
  tag?: string;
  subtagMessage?: string;
  originLocation?: string;
  destinationLocation?: string;
  expectedDelivery?: string | null;
  courierEstimatedDelivery?: string | null;
  checkpoints: TrackingCheckpoint[];
  aftershipTrackingUrl: string;
  courierTrackingUrl: string;
  note?: string;
  message?: string;
}

export function detectCourierSlug(nameOrPartner?: string | null): string {
  if (!nameOrPartner) return "india-post";
  const str = nameOrPartner.toLowerCase().trim();

  if (str.includes("india-post-int") || (str.includes("india post") && (str.includes("int") || str.includes("international")))) {
    return "india-post-int";
  }
  if (str.includes("india-post") || str.includes("india post") || str.includes("speed post") || str.includes("post office") || str.includes("postal")) {
    return "india-post";
  }
  if (str.includes("delhivery")) return "delhivery";
  if (str.includes("bluedart") || str.includes("blue dart")) return "bluedart";
  if (str.includes("dtdc")) return "dtdc";
  if (str.includes("shadowfax")) return "shadowfax";
  if (str.includes("ecom")) return "ecom-express";
  if (str.includes("xpress") || str.includes("bees")) return "xpressbees";
  if (str.includes("dhl")) return "dhl";
  if (str.includes("fedex")) return "fedex";
  if (str.includes("ups")) return "ups";

  return "india-post";
}

export function getAftershipTrackingUrl(slug: string, awb: string): string {
  const cleanSlug = slug || "india-post";
  return `https://track.aftership.com/${cleanSlug}/${encodeURIComponent(awb.trim())}`;
}

export function getCourierDirectUrl(slug: string, awb: string): string {
  const match = POPULAR_COURIERS.find((c) => c.slug === slug);
  if (match?.trackingUrl) {
    return match.trackingUrl(awb);
  }
  return getAftershipTrackingUrl(slug, awb);
}

export const AFTERSHIP_PUBLIC_KEY = "asat_3a9186ede78a4f6cb61cbd41573f1471";

async function fetchDirectFromAftership(
  cleanNumber: string,
  cleanSlug: string
): Promise<TrackingResponse | null> {
  try {
    const url = `https://api.aftership.com/tracking/2026-07/trackings?tracking_numbers=${encodeURIComponent(
      cleanNumber
    )}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "as-api-key": AFTERSHIP_PUBLIC_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const trackings: any[] = json?.data?.trackings || [];

    if (trackings.length > 0) {
      const t = trackings[0];
      const matched = POPULAR_COURIERS.find((c) => c.slug === (t.slug || cleanSlug));
      const aftershipTrackingUrl =
        t.aftership_tracking_url ||
        getAftershipTrackingUrl(t.slug || cleanSlug, cleanNumber);
      const courierTrackingUrl =
        t.courier_tracking_link ||
        matched?.trackingUrl?.(cleanNumber) ||
        getCourierDirectUrl(t.slug || cleanSlug, cleanNumber);

      return {
        success: true,
        found: true,
        trackingNumber: t.tracking_number || cleanNumber,
        slug: t.slug || cleanSlug,
        courierName: matched?.name || t.slug || "India Post",
        tag: t.tag || "Delivered",
        subtagMessage: t.subtag_message || t.tag || "Delivered",
        originLocation: t.origin_raw_location || "",
        destinationLocation: t.destination_raw_location || "",
        expectedDelivery:
          t.shipment_delivery_date ||
          t.aftership_estimated_delivery_date ||
          t.courier_estimated_delivery_date ||
          null,
        courierEstimatedDelivery: t.courier_estimated_delivery_date || null,
        checkpoints: Array.isArray(t.checkpoints)
          ? t.checkpoints.map((cp: any) => ({
              checkpoint_time: cp.checkpoint_time,
              city: cp.city,
              state: cp.state,
              location: cp.location,
              message: cp.message,
              tag: cp.tag,
              subtag_message: cp.subtag_message,
            }))
          : [],
        aftershipTrackingUrl,
        courierTrackingUrl,
      };
    }
  } catch (err) {
    console.warn("Direct AfterShip query error:", err);
  }
  return null;
}

export const courierApi = {
  track: async (trackingNumber: string, slug?: string): Promise<TrackingResponse> => {
    const cleanNumber = trackingNumber.trim();
    const cleanSlug = slug || detectCourierSlug(slug);

    // 1. Try Backend Proxy first
    try {
      const qs = new URLSearchParams({
        trackingNumber: cleanNumber,
        slug: cleanSlug,
      });
      const data = await apiRequest<TrackingResponse>(`/courier/track?${qs.toString()}`, {
        method: "GET",
      });
      if (data && data.success && data.found) {
        return data;
      }
    } catch {
      // Backend route not available, proceed to direct fallback
    }

    // 2. Direct AfterShip API Fallback (Supported via AfterShip CORS)
    const directResult = await fetchDirectFromAftership(cleanNumber, cleanSlug);
    if (directResult) {
      return directResult;
    }

    // 3. Fallback mock state if not found anywhere yet
    const matched = POPULAR_COURIERS.find((c) => c.slug === cleanSlug);
    return {
      success: true,
      found: false,
      trackingNumber: cleanNumber,
      slug: cleanSlug,
      courierName: matched?.name || "India Post",
      tag: "InTransit",
      subtagMessage: "Active shipment in transit. Official carrier tracking available.",
      checkpoints: [],
      aftershipTrackingUrl: getAftershipTrackingUrl(cleanSlug, cleanNumber),
      courierTrackingUrl: getCourierDirectUrl(cleanSlug, cleanNumber),
    };
  },

  syncAll: async (): Promise<{
    success: boolean;
    checkedCount: number;
    updatedCount: number;
    message: string;
    updatedDetails?: any[];
  }> => {
    try {
      return await apiRequest<{
        success: boolean;
        checkedCount: number;
        updatedCount: number;
        message: string;
        updatedDetails?: any[];
      }>("/courier/sync-all", { method: "POST" });
    } catch (err: any) {
      return {
        success: false,
        checkedCount: 0,
        updatedCount: 0,
        message: err.message || "Failed to trigger courier sync",
      };
    }
  },
};
