import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.websiteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const item of settings) {
      settingsMap[item.key] = item.value;
    }
    res.json({ success: true, data: settingsMap, raw: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settingsObj = req.body; // Record<string, string> or array of { key, value }

    if (typeof settingsObj === "object" && !Array.isArray(settingsObj)) {
      for (const [key, value] of Object.entries(settingsObj)) {
        await prisma.websiteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "UPDATE_SETTINGS",
          resource: "WebsiteSetting",
          details: "Updated site configuration and content settings",
        },
      });
    }

    const updated = await prisma.websiteSetting.findMany();
    const map: Record<string, string> = {};
    for (const item of updated) {
      map[item.key] = item.value;
    }

    res.json({ success: true, message: "Settings updated successfully", data: map });
  } catch (error) {
    next(error);
  }
};
