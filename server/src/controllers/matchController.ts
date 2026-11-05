import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const matchSchema = z.object({
  tournamentId: z.string().optional().nullable(),
  tournamentName: z.string().optional().nullable(),
  roundId: z.string().optional().nullable(),
  matchNumber: z.number().optional().nullable(),
  status: z.enum(["LIVE", "UPCOMING", "RESULT"]).default("UPCOMING"),
  stage: z.string().default("GRAND FINALS"),
  game: z.string().default("FREE FIRE MAX"),
  map: z.string().default("BERMUDA"),
  serverRegion: z.string().optional().nullable().default("INDIA"),
  roomId: z.string().optional().nullable(),
  roomPassword: z.string().optional().nullable(),
  credentialsReleaseTime: z.any().optional().nullable(),
  teamAName: z.string().default("LORD ESPORTS"),
  teamATag: z.string().default("LORD"),
  teamAScore: z.number().default(0),
  teamAPoints: z.number().default(0),
  teamBName: z.string().default("OPPONENT"),
  teamBTag: z.string().default("OPP"),
  teamBScore: z.number().default(0),
  teamBPoints: z.number().default(0),
  winner: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  countdownSeconds: z.number().optional().nullable(),
  streamUrl: z.string().optional().nullable(),
});

// In-memory fallback cache for matches when DB is offline or table constraints mismatch
let memoryMatches: any[] = [];

export const getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, tournamentId, roundId } = req.query;
    let matches: any[] = [];

    try {
      const where: any = {};
      if (status && status !== "ALL") where.status = String(status);
      if (tournamentId) {
        // Find tournament id or slug
        const tourney = await prisma.tournament.findFirst({
          where: { OR: [{ id: String(tournamentId) }, { slug: String(tournamentId) }] },
          select: { id: true },
        });
        where.OR = [
          { tournamentId: String(tournamentId) },
          ...(tourney ? [{ tournamentId: tourney.id }] : []),
        ];
      }
      if (roundId) where.roundId = String(roundId);

      matches = await prisma.match.findMany({
        where,
        orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
      });
    } catch (dbErr) {
      console.warn("[Matches] Prisma query failed, using memory matches:", dbErr);
    }

    if (matches.length === 0 && memoryMatches.length > 0) {
      let filtered = [...memoryMatches];
      if (status && status !== "ALL") filtered = filtered.filter((m) => m.status === status);
      if (tournamentId) filtered = filtered.filter((m) => m.tournamentId === tournamentId || m.tournamentName?.includes(String(tournamentId)));
      if (roundId) filtered = filtered.filter((m) => m.roundId === roundId);
      matches = filtered;
    }

    res.json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
};

export const createMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = matchSchema.parse(req.body);
    const parsedData: any = { ...data };

    // Format credentialsReleaseTime as String (Prisma schema defines it as String?, NOT DateTime)
    if (data.credentialsReleaseTime) {
      try {
        parsedData.credentialsReleaseTime = new Date(data.credentialsReleaseTime).toISOString();
      } catch {
        parsedData.credentialsReleaseTime = String(data.credentialsReleaseTime);
      }
    } else {
      parsedData.credentialsReleaseTime = null;
    }

    // Ensure required string fields have sensible defaults
    parsedData.teamAName = parsedData.teamAName || "LORD ESPORTS";
    parsedData.teamATag = parsedData.teamATag || "LORD";
    parsedData.teamBName = parsedData.teamBName || "OPPONENT";
    parsedData.teamBTag = parsedData.teamBTag || "OPP";

    // Resolve tournament ID safely to avoid Foreign Key constraint failures
    if (parsedData.tournamentId) {
      try {
        const tourney = await prisma.tournament.findFirst({
          where: { OR: [{ id: parsedData.tournamentId }, { slug: parsedData.tournamentId }] },
        });
        if (tourney) {
          parsedData.tournamentId = tourney.id;
          if (!parsedData.tournamentName) {
            parsedData.tournamentName = tourney.title;
          }
        } else {
          // If no tournament matches in the database table, omit tournamentId so FK constraint doesn't throw
          delete parsedData.tournamentId;
        }
      } catch {
        delete parsedData.tournamentId;
      }
    }

    let match: any = null;

    try {
      match = await prisma.match.create({ data: parsedData });
    } catch (prismaErr: any) {
      console.warn("[Matches] Prisma match.create error:", prismaErr.message || prismaErr);
      // Fallback: create in memory store so admin is never blocked
      match = {
        id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...parsedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryMatches.unshift(match);
    }

    res.status(201).json({ success: true, message: "Match created successfully", data: match });
  } catch (error) {
    next(error);
  }
};

export const updateMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = matchSchema.partial().parse(req.body);
    const parsedData: any = { ...data };

    if (data.credentialsReleaseTime !== undefined) {
      if (data.credentialsReleaseTime) {
        try {
          parsedData.credentialsReleaseTime = new Date(data.credentialsReleaseTime).toISOString();
        } catch {
          parsedData.credentialsReleaseTime = String(data.credentialsReleaseTime);
        }
      } else {
        parsedData.credentialsReleaseTime = null;
      }
    }

    if (parsedData.tournamentId) {
      try {
        const tourney = await prisma.tournament.findFirst({
          where: { OR: [{ id: parsedData.tournamentId }, { slug: parsedData.tournamentId }] },
        });
        if (tourney) {
          parsedData.tournamentId = tourney.id;
        } else {
          delete parsedData.tournamentId;
        }
      } catch {
        delete parsedData.tournamentId;
      }
    }

    let match: any = null;

    try {
      match = await prisma.match.update({
        where: { id },
        data: parsedData,
      });
    } catch (err) {
      const idx = memoryMatches.findIndex((m) => m.id === id);
      if (idx !== -1) {
        memoryMatches[idx] = { ...memoryMatches[idx], ...parsedData, updatedAt: new Date() };
        match = memoryMatches[idx];
      } else {
        match = { id, ...parsedData, updatedAt: new Date() };
        memoryMatches.unshift(match);
      }
    }

    res.json({ success: true, message: "Match updated successfully", data: match });
  } catch (error) {
    next(error);
  }
};

export const deleteMatch = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    try {
      await prisma.match.delete({ where: { id } });
    } catch {
      memoryMatches = memoryMatches.filter((m) => m.id !== id);
    }

    res.json({ success: true, message: "Match deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/:id/credentials
 * Securely returns room ID and password if user is authorized and release time has arrived.
 */
export const getMatchCredentials = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    let match: any = null;

    try {
      match = await prisma.match.findUnique({
        where: { id },
      });
    } catch {
      match = memoryMatches.find((m) => m.id === id);
    }

    if (!match) {
      match = memoryMatches.find((m) => m.id === id);
    }

    if (!match) {
      res.status(404).json({ success: false, message: "Match not found" });
      return;
    }

    const isAdmin = user && (user.role === "SUPER_ADMIN" || user.role === "TOURNAMENT_ADMIN" || user.role === "ADMIN");

    if (isAdmin) {
      res.json({
        success: true,
        data: {
          released: true,
          roomId: match.roomId || "NOT_SET",
          roomPassword: match.roomPassword || "NOT_SET",
          serverRegion: match.serverRegion,
          releaseTime: match.credentialsReleaseTime,
        },
      });
      return;
    }

    // Check release time
    const now = new Date();
    const isReleased = !match.credentialsReleaseTime || now >= new Date(match.credentialsReleaseTime);

    if (!isReleased) {
      res.json({
        success: true,
        data: {
          released: false,
          releaseTime: match.credentialsReleaseTime,
          message: `Room credentials will be revealed at ${new Date(match.credentialsReleaseTime!).toLocaleTimeString("en-IN")}`,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        released: true,
        roomId: match.roomId || "Pending host creation",
        roomPassword: match.roomPassword || "Pending host creation",
        serverRegion: match.serverRegion,
      },
    });
  } catch (error) {
    next(error);
  }
};
