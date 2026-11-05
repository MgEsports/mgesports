import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const playerSchema = z.object({
  ign: z.string().min(2),
  realName: z.string().min(2),
  jerseyNumber: z.string().optional().default(""),
  role: z.enum(["IGL", "RUSHER", "SNIPER", "SUPPORT", "FRAGGER"]).default("RUSHER"),
  game: z.string().default("FREE FIRE MAX"),
  team: z.string().default("LORD ESPORTS"),
  about: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  kdRatio: z.string().default("4.00").optional(),
  headshotRate: z.string().default("65%").optional(),
  matchesPlayed: z.number().default(100).optional(),
  featuredQuote: z.string().default("Built for the ones who keep pushing.").optional(),
  avatarUrl: z.string().optional().nullable(),
  avatarBg: z.string().optional().nullable(),
  isCaptain: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

function formatPlayerOutput(p: any) {
  let instagram = "";
  if (p.avatarBg?.startsWith("insta:")) {
    instagram = p.avatarBg.replace("insta:", "");
  } else if (p.instagram) {
    instagram = p.instagram;
  }

  return {
    ...p,
    about: p.about || p.featuredQuote || "",
    instagram: instagram || "",
    image: p.avatarUrl || "",
  };
}

function buildPrismaPlayerData(data: any) {
  const result: any = {};
  if (data.ign !== undefined) result.ign = data.ign.toUpperCase();
  if (data.realName !== undefined) result.realName = data.realName;
  if (data.jerseyNumber !== undefined) result.jerseyNumber = data.jerseyNumber;
  if (data.role !== undefined) result.role = data.role;
  if (data.game !== undefined) result.game = data.game;
  if (data.team !== undefined) result.team = data.team;
  if (data.kdRatio !== undefined) result.kdRatio = data.kdRatio;
  if (data.headshotRate !== undefined) result.headshotRate = data.headshotRate;
  if (data.matchesPlayed !== undefined) result.matchesPlayed = data.matchesPlayed;
  if (data.avatarUrl !== undefined) result.avatarUrl = data.avatarUrl;
  if (data.isCaptain !== undefined) result.isCaptain = data.isCaptain;
  if (data.isActive !== undefined) result.isActive = data.isActive;
  if (data.sortOrder !== undefined) result.sortOrder = data.sortOrder;

  // Map about -> featuredQuote
  if (data.about !== undefined && data.about !== null) {
    result.featuredQuote = data.about;
  } else if (data.featuredQuote !== undefined) {
    result.featuredQuote = data.featuredQuote;
  }

  // Map instagram -> avatarBg
  if (data.instagram !== undefined) {
    result.avatarBg = data.instagram ? `insta:${data.instagram}` : null;
  } else if (data.avatarBg !== undefined) {
    result.avatarBg = data.avatarBg;
  }

  return result;
}

export const getPlayers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const players = await prisma.player.findMany({
      where: { isActive: true },
      orderBy: [{ isCaptain: "desc" }, { sortOrder: "asc" }],
    });
    res.json({ success: true, data: players.map(formatPlayerOutput) });
  } catch (error) {
    next(error);
  }
};

export const getAllPlayersAdmin = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: players.map(formatPlayerOutput) });
  } catch (error) {
    next(error);
  }
};

export const createPlayer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = playerSchema.parse(req.body);
    const prismaData = buildPrismaPlayerData(data);

    const player = await prisma.player.create({
      data: {
        ...prismaData,
        id: req.body.id || `player-${data.ign.toLowerCase().replace(/\s+/g, "-")}`,
      },
    });

    res.status(201).json({ success: true, message: "Player profile created", data: formatPlayerOutput(player) });
  } catch (error) {
    next(error);
  }
};

export const updatePlayer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = playerSchema.partial().parse(req.body);
    const prismaData = buildPrismaPlayerData(data);

    const player = await prisma.player.update({
      where: { id },
      data: prismaData,
    });

    res.json({ success: true, message: "Player profile updated", data: formatPlayerOutput(player) });
  } catch (error) {
    next(error);
  }
};

export const deletePlayer = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.player.delete({ where: { id } });
    res.json({ success: true, message: "Player profile deleted" });
  } catch (error) {
    next(error);
  }
};
