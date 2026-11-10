import { Request, Response, NextFunction } from "express";
import https from "https";
import { prisma } from "../config/prisma.js";

const DEFAULT_AFTERSHIP_KEY = "asat_3a9186ede78a4f6cb61cbd41573f1471";

export interface CourierOption {
  slug: string;
  name: string;
  category: "Domestic (India)" | "International" | "Global";
  trackingUrl?: string;
}

export const POPULAR_COURIERS: CourierOption[] = [
  {
    slug: "india-post",
    name: "India Post Domestic",
    category: "Domestic (India)",
    trackingUrl: "https://www.indiapost.gov.in/_layouts/15/dpt.cptc.etracking/etms_new.aspx",
  },
  {
    slug: "india-post-int",
    name: "India Post International",
    category: "International",
    trackingUrl: "https://track.aftership.com/india-post-int",
  },
  {
    slug: "delhivery",
    name: "Delhivery",
    category: "Domestic (India)",
    trackingUrl: "https://www.delhivery.com/track/package",
  },
  {
    slug: "bluedart",
    name: "Blue Dart Express",
    category: "Domestic (India)",
    trackingUrl: "https://www.bluedart.com/tracking",
  },
  {
    slug: "dtdc",
    name: "DTDC India",
    category: "Domestic (India)",
    trackingUrl: "https://www.dtdc.in/tracking.asp",
  },
  {
    slug: "shadowfax",
    name: "Shadowfax",
    category: "Domestic (India)",
    trackingUrl: "https://tracker.shadowfax.in",
  },
  {
    slug: "ecom-express",
    name: "Ecom Express",
    category: "Domestic (India)",
    trackingUrl: "https://ecomexpress.in/tracking",
  },
  {
    slug: "xpressbees",
    name: "XpressBees",
    category: "Domestic (India)",
    trackingUrl: "https://www.xpressbees.com/track",
  },
  {
    slug: "dhl",
    name: "DHL Express",
    category: "Global",
    trackingUrl: "https://www.dhl.com/en/express/tracking.html",
  },
  {
    slug: "fedex",
    name: "FedEx",
    category: "Global",
    trackingUrl: "https://www.fedex.com/fedextrack",
  },
  {
    slug: "ups",
    name: "UPS",
    category: "Global",
    trackingUrl: "https://www.ups.com/track",
  },
];

async function getEffectiveApiKey(): Promise<string> {
  try {
    const setting = await prisma.websiteSetting.findUnique({
      where: { key: "aftershipApiKey" },
    });
    if (setting?.value && setting.value.trim().length > 5) {
      return setting.value.trim();
    }
  } catch {}
  return process.env.AFTERSHIP_API_KEY?.trim() || DEFAULT_AFTERSHIP_KEY;
}

function callAftershipApi(
  path: string,
  method: string,
  apiKey: string,
  body?: any
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve) => {
    const options: https.RequestOptions = {
      hostname: "api.aftership.com",
      path,
      method,
      headers: {
        "as-api-key": apiKey,
        "Content-Type": "application/json",
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ statusCode: res.statusCode || 500, data: parsed });
        } catch {
          resolve({
            statusCode: res.statusCode || 500,
            data: { meta: { message: raw || "Unknown response" } },
          });
        }
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 500,
        data: { meta: { message: err.message || "Network request failed" } },
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Automatically synchronizes an order's delivery status in the database based on AfterShip live tracking tag.
 */
export async function syncOrderDeliveryStatus(
  cleanNumber: string,
  tag?: string,
  estimatedDelivery?: string | null
): Promise<{ updated: boolean; orderId?: string; orderNumber?: string; oldStatus?: string; newStatus?: string }> {
  if (!cleanNumber || !tag) return { updated: false };

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingNumber: cleanNumber },
          { trackingNumber: { contains: cleanNumber, mode: "insensitive" } },
        ],
        orderStatus: { not: "DELETED" },
      },
    });

    if (!order) return { updated: false };

    let newStatus: string | null = null;
    let newPaymentStatus: string | null = null;
    const cleanTag = tag.trim().toLowerCase();

    if (cleanTag === "delivered" || cleanTag.includes("delivered")) {
      newStatus = "DELIVERED";
      if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
        newPaymentStatus = "PAID";
      }
    } else if (
      cleanTag === "intransit" ||
      cleanTag === "outfordelivery" ||
      cleanTag === "attemptfail" ||
      cleanTag === "exception"
    ) {
      if (order.orderStatus === "PENDING" || order.orderStatus === "PROCESSING") {
        newStatus = "SHIPPED";
      }
    }

    const updateData: any = {};
    if (newStatus && newStatus !== order.orderStatus) {
      updateData.orderStatus = newStatus;
    }
    if (newPaymentStatus && newPaymentStatus !== order.paymentStatus) {
      updateData.paymentStatus = newPaymentStatus;
    }
    if (estimatedDelivery && !order.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = estimatedDelivery;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });

      return {
        updated: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus: order.orderStatus,
        newStatus: updateData.orderStatus || order.orderStatus,
      };
    }

    return { updated: false, orderId: order.id, orderNumber: order.orderNumber };
  } catch (err) {
    console.warn("Failed to auto-update order delivery status:", err);
    return { updated: false };
  }
}

/**
 * GET /api/courier/track?trackingNumber=...&slug=...
 * Retrieves real-time tracking checkpoints from AfterShip and automatically updates delivery status.
 */
export const trackCourier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trackingNumber, slug } = req.query;
    if (!trackingNumber || typeof trackingNumber !== "string") {
      res.status(400).json({
        success: false,
        message: "Tracking number (AWB) is required",
      });
      return;
    }

    const cleanNumber = trackingNumber.trim();
    const cleanSlug = typeof slug === "string" && slug.trim() ? slug.trim() : "india-post";
    const apiKey = await getEffectiveApiKey();

    const queryPath = `/tracking/2026-07/trackings?tracking_numbers=${encodeURIComponent(cleanNumber)}`;
    const response = await callAftershipApi(queryPath, "GET", apiKey);

    const trackings: any[] = response.data?.data?.trackings || [];

    if (trackings.length > 0) {
      const tracking = trackings[0];
      const matchedCourier = POPULAR_COURIERS.find(
        (c) => c.slug === tracking.slug
      );

      // Automatically sync delivery status in database
      syncOrderDeliveryStatus(
        cleanNumber,
        tracking.tag,
        tracking.aftership_estimated_delivery_date || tracking.courier_estimated_delivery_date
      ).catch(() => {});

      res.json({
        success: true,
        found: true,
        trackingNumber: tracking.tracking_number || cleanNumber,
        slug: tracking.slug || cleanSlug,
        courierName: matchedCourier?.name || tracking.slug || "India Post",
        tag: tracking.tag || "InfoReceived",
        subtag: tracking.subtag || "",
        subtagMessage: tracking.subtag_message || tracking.tag || "In Transit",
        originLocation: tracking.origin_raw_location || tracking.origin_country_region || "",
        destinationLocation:
          tracking.destination_raw_location || tracking.destination_country_region || "",
        courierEstimatedDelivery: tracking.courier_estimated_delivery_date || null,
        expectedDelivery: tracking.aftership_estimated_delivery_date || null,
        checkpoints: Array.isArray(tracking.checkpoints) ? tracking.checkpoints : [],
        aftershipTrackingUrl:
          tracking.aftership_tracking_url ||
          `https://track.aftership.com/${tracking.slug || cleanSlug}/${encodeURIComponent(cleanNumber)}`,
        courierTrackingUrl:
          tracking.courier_tracking_link ||
          matchedCourier?.trackingUrl ||
          `https://track.aftership.com/${tracking.slug || cleanSlug}/${encodeURIComponent(cleanNumber)}`,
      });
      return;
    }

    // If not found in AfterShip, attempt to register it on-the-fly if slug is known
    const createResp = await callAftershipApi(
      "/tracking/2026-07/trackings",
      "POST",
      apiKey,
      {
        tracking_number: cleanNumber,
        slug: cleanSlug,
      }
    );

    const matchedCourier = POPULAR_COURIERS.find((c) => c.slug === cleanSlug);
    const trackingUrl = `https://track.aftership.com/${cleanSlug}/${encodeURIComponent(cleanNumber)}`;

    res.json({
      success: true,
      found: false,
      trackingNumber: cleanNumber,
      slug: cleanSlug,
      courierName: matchedCourier?.name || cleanSlug,
      tag: "InfoReceived",
      subtagMessage: "Registered with carrier. Initial scan pending.",
      checkpoints: [],
      aftershipTrackingUrl: trackingUrl,
      courierTrackingUrl: matchedCourier?.trackingUrl || trackingUrl,
      note: createResp.data?.meta?.message || "Tracking initiated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courier/sync-all & GET /api/courier/sync-all
 * Automatically updates delivery status for all active in-transit orders using live AfterShip data.
 */
export const syncAllCourierDeliveries = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        trackingNumber: { not: null },
        orderStatus: {
          notIn: ["DELIVERED", "DELETED", "CANCELLED"],
        },
      },
    });

    const validOrders = orders.filter((o: any) => o.trackingNumber && o.trackingNumber.trim().length > 3);

    if (validOrders.length === 0) {
      res.json({
        success: true,
        checkedCount: 0,
        updatedCount: 0,
        message: "All current orders are either already fulfilled or have no active tracking numbers.",
      });
      return;
    }

    const apiKey = await getEffectiveApiKey();
    const trackingNumbers = validOrders.map((o: any) => o.trackingNumber!.trim()).join(",");

    const queryPath = `/tracking/2026-07/trackings?tracking_numbers=${encodeURIComponent(trackingNumbers)}`;
    const response = await callAftershipApi(queryPath, "GET", apiKey);

    const trackings: any[] = response.data?.data?.trackings || [];
    let updatedCount = 0;
    const updatedDetails: any[] = [];

    for (const t of trackings) {
      if (t.tracking_number && t.tag) {
        const result = await syncOrderDeliveryStatus(
          t.tracking_number,
          t.tag,
          t.aftership_estimated_delivery_date || t.courier_estimated_delivery_date
        );
        if (result.updated) {
          updatedCount++;
          updatedDetails.push(result);
        }
      }
    }

    res.json({
      success: true,
      checkedCount: validOrders.length,
      updatedCount,
      updatedDetails,
      message: `Checked ${validOrders.length} active orders with AfterShip. Automatically updated ${updatedCount} delivery status(es).`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courier/webhook
 * Receives automated real-time tracking webhooks from AfterShip.
 */
export const handleAftershipWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;
    const msg = body?.msg;
    const trackingNumber = msg?.tracking_number;
    const tag = msg?.tag;
    const estimated = msg?.aftership_estimated_delivery_date || msg?.courier_estimated_delivery_date;

    if (trackingNumber && tag) {
      await syncOrderDeliveryStatus(trackingNumber, tag, estimated);
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch {
    res.json({ success: true, message: "Webhook acknowledged" });
  }
};

/**
 * POST /api/courier/create
 * Registers a new tracking number with AfterShip and syncs delivery status.
 */
export const createCourierTracking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trackingNumber, slug, title } = req.body;
    if (!trackingNumber) {
      res.status(400).json({
        success: false,
        message: "Tracking number is required",
      });
      return;
    }

    const cleanNumber = String(trackingNumber).trim();
    const cleanSlug = slug && String(slug).trim() ? String(slug).trim() : "india-post";
    const apiKey = await getEffectiveApiKey();

    const response = await callAftershipApi(
      "/tracking/2026-07/trackings",
      "POST",
      apiKey,
      {
        tracking_number: cleanNumber,
        slug: cleanSlug,
        ...(title ? { title: String(title).slice(0, 100) } : {}),
      }
    );

    const code = response.data?.meta?.code;
    const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    const isAlreadyExists = code === 4003 || response.data?.meta?.message?.includes("already exists");

    if (isSuccess || isAlreadyExists) {
      const trackingData = response.data?.data;
      if (trackingData?.tag) {
        syncOrderDeliveryStatus(cleanNumber, trackingData.tag).catch(() => {});
      }

      res.json({
        success: true,
        message: isAlreadyExists
          ? "Tracking already registered on AfterShip"
          : "Tracking successfully created on AfterShip",
        data: trackingData,
        aftershipTrackingUrl: `https://track.aftership.com/${cleanSlug}/${encodeURIComponent(cleanNumber)}`,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: response.data?.meta?.message || "Failed to create tracking in AfterShip",
      raw: response.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courier/test
 * Validates connectivity with the configured AfterShip API key.
 */
export const testAftershipConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customKey = typeof req.query.apiKey === "string" ? req.query.apiKey.trim() : null;
    const apiKey = customKey || (await getEffectiveApiKey());

    const response = await callAftershipApi("/tracking/2026-07/couriers", "GET", apiKey);

    if (response.statusCode === 200 && response.data?.data) {
      const total = response.data.data.couriers?.length || response.data.data.total || 0;
      res.json({
        success: true,
        message: "AfterShip API connected successfully!",
        couriersCount: total,
      });
    } else {
      res.status(400).json({
        success: false,
        message:
          response.data?.meta?.message ||
          "Failed to authenticate with AfterShip. Please verify your API key.",
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courier/couriers
 * Returns the list of popular and supported couriers.
 */
export const listCouriers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.json({
    success: true,
    data: POPULAR_COURIERS,
  });
};
