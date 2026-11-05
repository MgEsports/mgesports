import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./config/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "https://mgesports.in";
const ADMIN_URL = process.env.ADMIN_URL || "https://mgesports.in/admin";

// Allowed origins for CORS (Production custom domain, Cloudflare workers, Vercel, and local development)
const allowedOrigins = [
  "https://mgesports.in",
  "https://www.mgesports.in",
  "https://mgesports.com",
  "https://www.mgesports.com",
  "https://lordesportz.com",
  "https://www.lordesportz.com",
  "https://lordzesports.com",
  "https://www.lordzesports.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  CLIENT_URL,
  ADMIN_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : []),
].filter(Boolean);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl) or matching production/preview/dev hosts
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".workers.dev") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Gzip / Brotli response compression
app.use(compression());

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve static uploaded files with 30-day immutable browser & CDN caching
const possibleUploadDirs = [
  path.join(process.cwd(), "uploads"),
  path.join(process.cwd(), "server", "uploads"),
  path.resolve(__dirname, "..", "uploads"),
  path.resolve(__dirname, "..", "..", "uploads"),
  path.resolve(__dirname, "..", "..", "public", "uploads"),
  path.join(os.tmpdir(), "uploads"),
];

for (const dir of possibleUploadDirs) {
  if (fs.existsSync(dir)) {
    app.use("/uploads", express.static(dir, {
      maxAge: "30d",
      immutable: true,
      etag: true,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
        res.setHeader("Access-Control-Allow-Origin", "*");
      },
    }));
  }
}

// Explicit fallback endpoint for /uploads/:filename
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  for (const dir of possibleUploadDirs) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.sendFile(candidate);
    }
  }
  res.status(404).json({ success: false, message: "File not found" });
});

const playersDir = path.join(process.cwd(), "..", "public", "players");
app.use("/players", express.static(playersDir));

// Dynamic XML Sitemap Generator
const handleSitemapRequest = async (_req: express.Request, res: express.Response) => {
  try {
    const siteUrl = (process.env.SITE_URL || "https://mgesports.in").trim().replace(/\/+$/, "");

    // Fetch published public tournaments from database
    const tournaments = await prisma.tournament.findMany({
      where: {
        isPublished: true,
        isDraft: false,
        status: { notIn: ["DRAFT", "ARCHIVED", "CANCELLED"] },
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    });

    const staticRoutes = [
      { path: "", changefreq: "daily", priority: "1.0" },
      { path: "/tournaments", changefreq: "daily", priority: "0.9" },
      { path: "/players", changefreq: "weekly", priority: "0.8" },
      { path: "/teams", changefreq: "monthly", priority: "0.7" },
      { path: "/products", changefreq: "weekly", priority: "0.8" },
      { path: "/news", changefreq: "daily", priority: "0.8" },
      { path: "/media", changefreq: "weekly", priority: "0.7" },
      { path: "/community", changefreq: "monthly", priority: "0.7" },
      { path: "/about", changefreq: "monthly", priority: "0.7" },
      { path: "/partners", changefreq: "monthly", priority: "0.6" },
      { path: "/partner-with-us", changefreq: "monthly", priority: "0.6" },
      { path: "/voting", changefreq: "weekly", priority: "0.7" },
    ];

    const today = new Date().toISOString().split("T")[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    (r) => `  <url>
    <loc>${siteUrl}${r.path ? r.path : "/"}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
${tournaments
  .map(
    (t: { id: string; slug?: string | null; updatedAt?: Date | null }) => {
      const path = t.slug || t.id;
      return `  <url>
    <loc>${siteUrl}/tournaments/${path}</loc>
    <lastmod>${t.updatedAt ? new Date(t.updatedAt).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
};

app.get("/sitemap.xml", handleSitemapRequest);
app.get("/api/sitemap.xml", handleSitemapRequest);

// Health check endpoint
app.get("/health", (req, res) => {
  // If visited via browser directly, redirect to the main website
  if (req.accepts("html") && !req.accepts("json")) {
    const targetUrl = process.env.CLIENT_URL || (req.get("host")?.includes("localhost") ? "http://localhost:5173" : CLIENT_URL);
    return res.redirect(302, targetUrl);
  }
  res.json({
    status: "ok",
    service: "MG ESPORTS Shared REST API",
    timestamp: new Date().toISOString(),
  });
});

// Root route - directly go to website for browser requests; return JSON for API clients
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    const distIndex = path.resolve(__dirname, "../../dist/index.html");
    if (fs.existsSync(distIndex)) {
      return res.sendFile(distIndex);
    }
    const targetUrl = process.env.CLIENT_URL || (req.get("host")?.includes("localhost") ? "http://localhost:5173" : CLIENT_URL);
    return res.redirect(302, targetUrl);
  }

  res.json({
    success: true,
    status: "online",
    service: "MG ESPORTS Shared REST API",
    version: "1.0.0",
    database: "Connected",
    endpoints: {
      health: "/health",
      partners: "/api/partners",
      tournaments: "/api/tournaments",
      players: "/api/players",
      news: "/api/news",
      media: "/api/media",
      jerseys: "/api/jerseys",
      settings: "/api/settings",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes (support /, /api, and /api/v1 so frontend requests work seamlessly with or without /api prefix)
app.use("/api/v1", routes);
app.use("/api", routes);
app.use("/", routes);

// Base /api status fallback
app.get(["/api", "/api/v1"], (_req, res) => {
  res.json({
    success: true,
    service: "MG ESPORTS REST API",
    version: "1.0.0",
    status: "healthy",
    documentation: "Visit / for available endpoints",
  });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler
app.use(errorHandler);

// Verify database connection on first import (non-blocking)
prisma.$connect()
  .then(() => {
    console.log("🐘 DATABASE: Connected to Neon PostgreSQL");
  })
  .catch((err: Error) => {
    console.warn("⚠️  DATABASE connection failed:", err.message);
  });

// Export app for Vercel serverless — do NOT call app.listen() here.
// For local dev, run src/index.ts which calls app.listen().
export default app;
