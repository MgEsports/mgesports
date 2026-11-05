import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const orderSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().default("LORDZ PRO COMBAT JERSEY 2026"),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  size: z.string().default("L"),
  customIgn: z.string().optional().nullable(),
  customNumber: z.string().optional().nullable(),
  totalAmount: z.number().default(1299),
  paymentMethod: z.string().default("UPI"),
  utrNumber: z.string().optional().nullable(),
  paymentStatus: z.string().optional().nullable(),
  courierPartner: z.string().optional().nullable(),
  expectedDeliveryDate: z.string().optional().nullable(),
});

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = orderSchema.parse(req.body);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `LZ-${new Date().getFullYear()}-${randomSuffix}`;

    const defaultPaymentStatus =
      data.paymentStatus ||
      (data.paymentMethod === "UPI"
        ? (data.utrNumber ? "PENDING_VERIFICATION" : "PENDING")
        : "COD_PENDING");

    // If user is logged in, ensure customerEmail and customerName default cleanly
    const customerEmail = data.customerEmail || req.user?.email || "fan@lordz.gg";

    const order = await prisma.order.create({
      data: {
        ...data,
        customerEmail,
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

    const where: any = {};
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
    const cleanPhone = cleanQuery.replace(/[^0-9]/g, "");

    const conditions: any[] = [
      { orderNumber: { contains: cleanQuery, mode: "insensitive" } },
      { customerEmail: { equals: cleanQuery, mode: "insensitive" } },
    ];

    if (cleanPhone.length >= 10) {
      const last10 = cleanPhone.slice(-10);
      conditions.push({ customerPhone: { contains: last10 } });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: conditions,
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
