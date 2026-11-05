import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const planUpdateSchema = z.object({
  name: z.string().optional(),
  badge: z.string().optional(),
  badgeColor: z.string().optional(),
  price: z.string().optional(),
  billing: z.string().optional(),
  tag: z.string().optional().nullable(),
  subheading: z.string().optional().nullable(),
  features: z.string().optional(), // JSON array string
  ctaText: z.string().optional(),
  isPopular: z.boolean().optional(),
  isLifetime: z.boolean().optional(),
  limitedSlots: z.boolean().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

const inquirySchema = z.object({
  planId: z.string().optional().nullable(),
  planName: z.string().min(1),
  planPrice: z.string().min(1),
  orgName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  discordTag: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

// GET /api/partner-plans (Public)
export const getPartnerPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await prisma.partnerPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// GET /api/partner-plans/admin/all (Admin)
export const getAllPartnerPlansAdmin = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await prisma.partnerPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// PUT /api/partner-plans/:id (Admin)
export const updatePartnerPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = planUpdateSchema.parse(req.body);
    const updated = await prisma.partnerPlan.update({
      where: { id },
      data,
    });
    res.json({ success: true, message: "Plan updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/partner-inquiries (Public)
export const createPartnerInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = inquirySchema.parse(req.body);
    const inquiry = await prisma.partnerInquiry.create({
      data: {
        planId: data.planId || null,
        planName: data.planName,
        planPrice: data.planPrice,
        orgName: data.orgName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        discordTag: data.discordTag || null,
        websiteUrl: data.websiteUrl || null,
        message: data.message || null,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Your partnership application has been submitted! Our team will contact you shortly.",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/partner-inquiries (Admin)
export const getPartnerInquiries = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = String(status);
    }

    const inquiries = await prisma.partnerInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: inquiries });
  } catch (error) {
    next(error);
  }
};

// PUT /api/partner-inquiries/:id (Admin)
export const updatePartnerInquiry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.partnerInquiry.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, message: "Inquiry updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/partner-inquiries/:id (Admin)
export const deletePartnerInquiry = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.partnerInquiry.delete({ where: { id } });
    res.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    next(error);
  }
};
