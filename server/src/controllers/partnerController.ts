import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { delCache } from "../config/cache.js";

const partnerSchema = z.object({
  name: z.string().min(1),
  category: z.string().default("Gaming"),
  tier: z.string().default("OFFICIAL PARTNER"),
  logoImage: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  cardImage: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const getPartners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ success: true, data: partners });
  } catch (error) {
    next(error);
  }
};

export const getAllPartnersAdmin = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ success: true, data: partners });
  } catch (error) {
    next(error);
  }
};

export const createPartner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = { ...req.body };
    if (!body.logoImage && body.logo) body.logoImage = body.logo;
    if (!body.websiteUrl && body.website) body.websiteUrl = body.website;

    const data = partnerSchema.parse(body);
    const { logo, website, ...prismaData } = data as any;
    if (!prismaData.logoImage && logo) prismaData.logoImage = logo;
    if (!prismaData.websiteUrl && website) prismaData.websiteUrl = website;

    const partner = await prisma.partner.create({ data: prismaData });

    // Invalidate all partner caches
    await delCache("api:partners*");
    await delCache("http:*partners*");
    await delCache("*partners*");
    await delCache("*partner*");

    res.status(201).json({ success: true, message: "Partner added successfully", data: partner });
  } catch (error) {
    next(error);
  }
};

export const updatePartner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (!body.logoImage && body.logo) body.logoImage = body.logo;
    if (!body.websiteUrl && body.website) body.websiteUrl = body.website;

    const data = partnerSchema.partial().parse(body);
    const { logo, website, ...prismaData } = data as any;
    if (!prismaData.logoImage && logo) prismaData.logoImage = logo;
    if (!prismaData.websiteUrl && website) prismaData.websiteUrl = website;

    const partner = await prisma.partner.update({
      where: { id },
      data: prismaData,
    });

    // Invalidate all partner caches
    await delCache("api:partners*");
    await delCache("http:*partners*");
    await delCache("*partners*");
    await delCache("*partner*");

    res.json({ success: true, message: "Partner updated successfully", data: partner });
  } catch (error) {
    next(error);
  }
};

export const deletePartner = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.partner.deleteMany({ where: { id } });

    // Invalidate all partner caches
    await delCache("api:partners*");
    await delCache("http:*partners*");
    await delCache("*partners*");
    await delCache("*partner*");

    res.json({ success: true, message: "Partner removed successfully" });
  } catch (error) {
    next(error);
  }
};
