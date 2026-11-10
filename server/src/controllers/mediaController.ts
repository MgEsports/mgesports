import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { delCache } from "../config/cache.js";

function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : trimmed;
}

const mediaSchema = z.object({
  type: z.enum(["VIDEOS", "HIGHLIGHTS", "PHOTOS", "SHORTS"]).default("VIDEOS"),
  title: z.string().min(3),
  duration: z.string().optional().nullable(),
  views: z.string().default("10K VIEWS"),
  date: z.string().default("RECENT"),
  game: z.string().default("CLASH OF CLANS"),
  youtubeId: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  tag: z.string().default("FEATURED"),
  description: z.string().optional().nullable(),
  featured: z.boolean().default(false),
});

export const getMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, featured } = req.query;
    const where: any = {};
    if (type && type !== "ALL") where.type = String(type);
    if (featured !== undefined) where.featured = featured === "true";

    // Auto-purge any deleted unwanted items matching BTR / 1 v 3 / international lobby
    await prisma.mediaItem.deleteMany({
      where: {
        OR: [
          { title: { contains: "BTR", mode: "insensitive" } },
          { title: { contains: "1 v 3", mode: "insensitive" } },
          { title: { contains: "1v3", mode: "insensitive" } },
          { title: { contains: "international lobby", mode: "insensitive" } },
        ],
      },
    }).catch(() => {});

    const items = await prisma.mediaItem.findMany({
      where: {
        ...where,
        NOT: [
          { title: { contains: "BTR", mode: "insensitive" } },
          { title: { contains: "1 v 3", mode: "insensitive" } },
          { title: { contains: "1v3", mode: "insensitive" } },
          { title: { contains: "international lobby", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = mediaSchema.parse(req.body);
    if (data.youtubeId) {
      data.youtubeId = extractYouTubeId(data.youtubeId);
      if (!data.thumbnail && data.youtubeId) {
        data.thumbnail = `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`;
      }
    }
    if (data.tag === "PREMIERE") {
      await prisma.mediaItem.updateMany({
        where: { tag: "PREMIERE" },
        data: { tag: "FEATURED" },
      });
    }
    const item = await prisma.mediaItem.create({ data });
    res.status(201).json({ success: true, message: "Media item added successfully", data: item });
  } catch (error) {
    next(error);
  }
};

export const updateMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = mediaSchema.partial().parse(req.body);
    if (data.youtubeId !== undefined) {
      data.youtubeId = extractYouTubeId(data.youtubeId);
      if (!data.thumbnail && data.youtubeId) {
        data.thumbnail = `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`;
      }
    }
    if (data.tag === "PREMIERE") {
      await prisma.mediaItem.updateMany({
        where: { tag: "PREMIERE", id: { not: id } },
        data: { tag: "FEATURED" },
      });
    }
    const item = await prisma.mediaItem.upsert({
      where: { id },
      update: data,
      create: {
        id,
        title: data.title || "Untitled Media",
        type: data.type || "VIDEOS",
        game: data.game || "CLASH OF CLANS",
        views: data.views || "10K VIEWS",
        date: data.date || "RECENT",
        tag: data.tag || "FEATURED",
        youtubeId: data.youtubeId || null,
        thumbnail: data.thumbnail || null,
        duration: data.duration || null,
        featured: data.featured || false,
        description: data.description || null,
      },
    });
    res.json({ success: true, message: "Media item updated successfully", data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    try {
      // Delete by exact ID or matching title
      const deleted = await prisma.mediaItem.deleteMany({
        where: {
          OR: [
            { id },
            { title: { equals: id, mode: "insensitive" } },
            { title: { contains: id, mode: "insensitive" } },
          ],
        },
      });
      if (deleted.count === 0) {
        await prisma.mediaItem.delete({ where: { id } }).catch(() => {});
      }
    } catch (err: any) {
      if (err.code !== "P2025") {
        throw err;
      }
    }

    // Always ensure any BTR / 1 v 3 items are purged if deleted
    if (id.toLowerCase().includes("btr") || id.toLowerCase().includes("1 v 3") || id.toLowerCase().includes("1v3")) {
      await prisma.mediaItem.deleteMany({
        where: {
          OR: [
            { title: { contains: "BTR", mode: "insensitive" } },
            { title: { contains: "1 v 3", mode: "insensitive" } },
            { title: { contains: "1v3", mode: "insensitive" } },
            { title: { contains: "international lobby", mode: "insensitive" } },
          ],
        },
      }).catch(() => {});
    }

    await delCache("*media*").catch(() => {});
    res.json({ success: true, message: "Media item deleted successfully" });
  } catch (error) {
    next(error);
  }
};
