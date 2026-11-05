import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const legendSchema = z.object({
  ign: z.string().min(2),
  realName: z.string().min(2),
  role: z.string().default("VETERAN RUSHER"),
  activeYears: z.string().default("2023 - 2025"),
  retiredJerseyNumber: z.string().optional().nullable(),
  achievements: z.string().default("3x Regional Champion, MVP Season 1"),
  hallOfFameBio: z.string().min(10),
  avatarUrl: z.string().optional().nullable(),
  highlightVideoUrl: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
});

export const getLegends = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const legends = await prisma.legend.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: legends });
  } catch (error) {
    next(error);
  }
};

export const createLegend = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = legendSchema.parse(req.body);
    const legend = await prisma.legend.create({
      data: {
        ...data,
        ign: data.ign.toUpperCase(),
      },
    });

    res.status(201).json({ success: true, message: "Legend added to Hall of Fame", data: legend });
  } catch (error) {
    next(error);
  }
};

export const updateLegend = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = legendSchema.partial().parse(req.body);

    const legend = await prisma.legend.update({
      where: { id },
      data: {
        ...data,
        ...(data.ign ? { ign: data.ign.toUpperCase() } : {}),
      },
    });

    res.json({ success: true, message: "Legend updated successfully", data: legend });
  } catch (error) {
    next(error);
  }
};

export const deleteLegend = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.legend.delete({ where: { id } });
    res.json({ success: true, message: "Legend removed from Hall of Fame" });
  } catch (error) {
    next(error);
  }
};
