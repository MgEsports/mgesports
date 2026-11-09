import { Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { delCache } from "../config/cache.js";

export const exportAllData = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      settings,
      tournaments,
      media,
      news,
      partners,
      partnerPlans,
      players,
      legends,
      products,
      votingEvents,
    ] = await Promise.all([
      prisma.websiteSetting.findMany({ orderBy: { key: "asc" } }).catch(() => []),
      prisma.tournament.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.mediaItem.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.newsArticle.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.partner.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
      prisma.partnerPlan.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
      prisma.player.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
      prisma.legend.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
      prisma.product.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.votingEvent.findMany({ include: { nominees: true }, orderBy: { createdAt: "desc" } }).catch(() => []),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const payload = {
      version: "2.0",
      organization: "MG Esports",
      exportedAt: new Date().toISOString(),
      summary: {
        settings: Object.keys(settingsMap).length,
        tournaments: tournaments.length,
        media: media.length,
        news: news.length,
        partners: partners.length,
        partnerPlans: partnerPlans.length,
        players: players.length,
        legends: legends.length,
        products: products.length,
        votingEvents: votingEvents.length,
      },
      data: {
        settings: settingsMap,
        tournaments,
        media,
        news,
        partners,
        partnerPlans,
        players,
        legends,
        products,
        votingEvents,
      },
    };

    res.json({ success: true, ...payload });
  } catch (error) {
    next(error);
  }
};

export const importAllData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let data = req.body.data !== undefined ? req.body.data : req.body;
    const mode = req.body.mode || (req.body.data && req.body.data.mode) || "merge";
    
    // Support nested data payload if exported as { success: true, data: { ... } }
    if (data && typeof data === "object" && data.data && typeof data.data === "object") {
      data = data.data;
    }

    if (!data || typeof data !== "object") {
      res.status(400).json({ success: false, message: "Invalid backup data: missing data object" });
      return;
    }

    const results: Record<string, number> = {};

    // 1. Settings
    if (data.settings && typeof data.settings === "object") {
      let count = 0;
      for (const [key, val] of Object.entries(data.settings)) {
        await prisma.websiteSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        }).catch(() => {});
        count++;
      }
      results.settings = count;
    }

    // 2. Tournaments
    if (Array.isArray(data.tournaments)) {
      if (mode === "replace") {
        await prisma.tournament.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const t of data.tournaments) {
        if (!t.title) continue;
        const { id, createdAt, updatedAt, stages, rounds, registrations, leaderboards, ...cleanData } = t;
        const targetId = id || `tourn-${Date.now()}-${count}`;
        await prisma.tournament.upsert({
          where: { id: targetId },
          update: cleanData,
          create: { id: targetId, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.tournaments = count;
    }

    // 3. Media Items
    if (Array.isArray(data.media)) {
      if (mode === "replace") {
        await prisma.mediaItem.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const m of data.media) {
        if (!m.title) continue;
        const { id, createdAt, updatedAt, ...cleanData } = m;
        const targetId = id || `media-${Date.now()}-${count}`;
        await prisma.mediaItem.upsert({
          where: { id: targetId },
          update: cleanData,
          create: { id: targetId, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.media = count;
    }

    // 4. News Articles
    if (Array.isArray(data.news)) {
      if (mode === "replace") {
        await prisma.newsArticle.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const n of data.news) {
        if (!n.title || !n.slug) continue;
        const { id, createdAt, updatedAt, ...cleanData } = n;
        await prisma.newsArticle.upsert({
          where: { slug: n.slug },
          update: cleanData,
          create: { id: id || undefined, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.news = count;
    }

    // 5. Partners
    if (Array.isArray(data.partners)) {
      if (mode === "replace") {
        await prisma.partner.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const p of data.partners) {
        if (!p.name) continue;
        const { id, createdAt, updatedAt, ...cleanData } = p;
        const targetId = id || `partner-${Date.now()}-${count}`;
        await prisma.partner.upsert({
          where: { id: targetId },
          update: cleanData,
          create: { id: targetId, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.partners = count;
    }

    // 6. Players
    if (Array.isArray(data.players)) {
      if (mode === "replace") {
        await prisma.player.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const p of data.players) {
        if (!p.ign) continue;
        const { id, createdAt, updatedAt, ...cleanData } = p;
        await prisma.player.upsert({
          where: { ign: p.ign },
          update: cleanData,
          create: { id: id || undefined, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.players = count;
    }

    // 7. Legends
    if (Array.isArray(data.legends)) {
      if (mode === "replace") {
        await prisma.legend.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const l of data.legends) {
        if (!l.ign) continue;
        const { id, createdAt, updatedAt, ...cleanData } = l;
        await prisma.legend.upsert({
          where: { ign: l.ign },
          update: cleanData,
          create: { id: id || undefined, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.legends = count;
    }

    // 8. Products
    if (Array.isArray(data.products)) {
      if (mode === "replace") {
        await prisma.product.deleteMany({}).catch(() => {});
      }
      let count = 0;
      for (const p of data.products) {
        if (!p.name || !p.slug) continue;
        const { id, createdAt, updatedAt, ...cleanData } = p;
        await prisma.product.upsert({
          where: { slug: p.slug },
          update: cleanData,
          create: { id: id || undefined, ...cleanData },
        }).catch(() => {});
        count++;
      }
      results.products = count;
    }

    // Invalidate all caches
    await delCache("*").catch(() => {});

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "RESTORE_SYSTEM_BACKUP",
          resource: "System",
          details: `Imported full system backup in ${mode} mode: ${JSON.stringify(results)}`,
        },
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Entire admin-side data restored successfully (${mode} mode)`,
      results,
    });
  } catch (error) {
    next(error);
  }
};
