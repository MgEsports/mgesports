import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const orderSchema = z.object({
  id: z.string().optional().nullable(),
  orderNumber: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  productName: z.string().default("MG PRO COMBAT JERSEY 2026"),
  customerName: z.string().min(1).default("Clan Supporter"),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  size: z.string().default("L"),
  customIgn: z.string().optional().nullable(),
  customNumber: z.string().optional().nullable(),
  totalAmount: z.number().default(1299),
  paymentMethod: z.string().default("UPI"),
  utrNumber: z.string().optional().nullable(),
  paymentStatus: z.string().optional().nullable(),
  courierPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  expectedDeliveryDate: z.string().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
});

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = orderSchema.parse(req.body);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = req.body.orderNumber || data.orderNumber || `MG-${new Date().getFullYear()}-${randomSuffix}`;

    const defaultPaymentStatus =
      data.paymentStatus ||
      (data.paymentMethod === "UPI"
        ? (data.utrNumber ? "PENDING_VERIFICATION" : "PENDING")
        : "COD_PENDING");

    // If user is logged in, ensure customerEmail and customerName default cleanly
    const customerEmail = data.customerEmail?.trim() || req.user?.email || "fan@mgesports.in";
    const customerPhone = data.customerPhone?.trim() || "";
    const address = data.address?.trim() || "Official Clan Dispatch";
    const city = data.city?.trim() || "Chennai";
    const state = data.state?.trim() || "Tamil Nadu";
    const pincode = data.pincode?.trim() || "600001";

    const order = await prisma.order.create({
      data: {
        ...data,
        customerEmail,
        customerPhone,
        address,
        city,
        state,
        pincode,
        orderNumber,
        paymentStatus: defaultPaymentStatus,
        orderStatus: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, ign: true, fullName: true, username: true },
    });

    const email = (user?.email || req.user.email)?.trim();
    if (!email) {
      res.json({ success: true, data: [] });
      return;
    }

    // Strictly fetch individual orders belonging to this user's verified account email
    const orders = await prisma.order.findMany({
      where: {
        customerEmail: { equals: email, mode: "insensitive" },
        orderStatus: { not: "DELETED" },
        adminNotes: { not: "__DELETED__" },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: orders,
      user: {
        id: userId,
        email,
        ign: user?.ign || user?.username,
        fullName: user?.fullName,
        phone: user?.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, email, phone } = req.query;

    const where: any = {
      orderStatus: { not: "DELETED" },
      adminNotes: { not: "__DELETED__" },
    };
    if (status && status !== "ALL") where.orderStatus = String(status);
    if (email) where.customerEmail = { equals: String(email), mode: "insensitive" };
    if (phone) {
      const clean = String(phone).replace(/[^0-9]/g, "");
      if (clean.length >= 6) where.customerPhone = { contains: clean };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search), mode: "insensitive" } },
        { customerName: { contains: String(search), mode: "insensitive" } },
        { customerPhone: { contains: String(search) } },
        { customerEmail: { contains: String(search), mode: "insensitive" } },
        { customIgn: { contains: String(search), mode: "insensitive" } },
        { utrNumber: { contains: String(search) } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      res.status(400).json({ success: false, message: "Order number, phone number, or email is required" });
      return;
    }
    const cleanQuery = query.trim();
    const lzQuery = cleanQuery.replace(/^MG-/i, "LZ-");
    const mgQuery = cleanQuery.replace(/^LZ-/i, "MG-");
    const cleanPhone = cleanQuery.replace(/[^0-9]/g, "");

    const conditions: any[] = [
      { orderNumber: { contains: cleanQuery, mode: "insensitive" } },
      { orderNumber: { contains: lzQuery, mode: "insensitive" } },
      { orderNumber: { contains: mgQuery, mode: "insensitive" } },
      { customerEmail: { equals: cleanQuery, mode: "insensitive" } },
      { trackingNumber: { contains: cleanQuery, mode: "insensitive" } },
    ];

    if (cleanPhone.length >= 6) {
      const matchDigits = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
      conditions.push({ customerPhone: { contains: matchDigits } });
    }

    const orders = await prisma.order.findMany({
      where: {
        AND: [
          { OR: conditions },
          { orderStatus: { not: "DELETED" } },
          { adminNotes: { not: "__DELETED__" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      orderNumber,
      orderStatus,
      trackingNumber,
      paymentStatus,
      courierPartner,
      expectedDeliveryDate,
      adminNotes,
    } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(orderNumber ? { orderNumber } : {}),
        ...(orderStatus ? { orderStatus } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(courierPartner !== undefined ? { courierPartner } : {}),
        ...(expectedDeliveryDate !== undefined ? { expectedDeliveryDate } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "UPDATE_ORDER_STATUS",
          resource: "Order",
          details: `Updated order ${order.orderNumber} to ${orderStatus || order.orderStatus}`,
        },
      });
    }

    res.json({ success: true, message: `Order updated successfully`, data: order });
  } catch (error) {
    next(error);
  }
};


export const deleteAllOrders = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.order.deleteMany({});
    res.json({ success: true, message: "All orders deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id || (req.query.id as string) || req.body?.id;
    const targetId = rawId ? decodeURIComponent(rawId).trim() : "";

    if (!targetId || targetId === "all" || req.query.all === "true" || req.body?.all === true) {
      await prisma.order.deleteMany({});
      res.json({ success: true, message: "All orders deleted successfully" });
      return;
    }

    const result = await prisma.order.deleteMany({
      where: {
        OR: [
          { id: targetId },
          { orderNumber: targetId },
          { orderNumber: { equals: targetId, mode: "insensitive" } },
        ],
      },
    });

    res.json({
      success: true,
      message: result.count > 0 ? "Order deleted successfully" : "Order already deleted or not found",
    });
  } catch (error) {
    next(error);
  }
};
