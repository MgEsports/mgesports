import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getStandings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const standings = await prisma.standing.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: standings });
  } catch (error) {
    next(error);
  }
};

export const updateStandingsBatch = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { standings } = _req.body; // Array of standings

    if (!Array.isArray(standings)) {
      res.status(400).json({ success: false, message: "standings must be an array" });
      return;
    }

    // Upsert or replace standings
    for (const [index, row] of standings.entries()) {
      if (row.id) {
        await prisma.standing.upsert({
          where: { id: row.id },
          update: {
            rank: row.rank || String(index + 1).padStart(2, "0"),
            team: row.team,
            tag: row.tag,
            chickenDinner: row.chickenDinner || "00",
            matches: row.matches || "02",
            position: row.position || "00",
            finishes: row.finishes || "00",
            total: row.total || "00",
            isTopThree: index < 3,
            sortOrder: index,
          },
          create: {
            id: row.id,
            rank: row.rank || String(index + 1).padStart(2, "0"),
            team: row.team,
            tag: row.tag,
            chickenDinner: row.chickenDinner || "00",
            matches: row.matches || "02",
            position: row.position || "00",
            finishes: row.finishes || "00",
            total: row.total || "00",
            isTopThree: index < 3,
            sortOrder: index,
          },
        });
      }
    }

    const updated = await prisma.standing.findMany({ orderBy: { sortOrder: "asc" } });
    res.json({ success: true, message: "Standings updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};
