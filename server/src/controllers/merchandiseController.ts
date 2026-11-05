import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getCache, setCache, delCache } from "../config/cache.js";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tag: z.string().default("OFFICIAL ATHLETE SPEC"),
  price: z.number().positive(),
  originalPrice: z.number().optional().nullable(),
  stock: z.number().int().default(100),
  category: z.string().default("JERSEY"),
  sizes: z.string().default("[\"S\",\"M\",\"L\",\"XL\",\"2XL\"]"),
  frontImage: z.string().optional().nullable(),
  backImage: z.string().optional().nullable(),
  upiId: z.string().default("lordzesports@upi"),
  upiQrImage: z.string().optional().nullable(),
  hasCustomIgn: z.boolean().default(false),
  specs: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(true),
});

export const getProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = "api:merchandise:all";

    // 1. Check Redis / Memory cache first for lightning-fast sub-millisecond response
    const cached = await getCache<any[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      res.setHeader("X-Cache", "HIT-REDIS");
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      );
      res.json({ success: true, data: cached });
      return;
    }

    // 2. Fetch from Database
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 3. Store in Redis/memory cache with 10-minute TTL
    await setCache(cacheKey, products, 600);

    res.setHeader("X-Cache", "MISS");
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = productSchema.parse(req.body);
    const baseSlug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let finalSlug = baseSlug || `product-${Date.now()}`;
    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: finalSlug,
      },
    });

    // Invalidate Redis and HTTP caches
    await delCache("api:merchandise:*");
    await delCache("http:*merchandise*");

    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // Invalidate Redis and HTTP caches
    await delCache("api:merchandise:*");
    await delCache("http:*merchandise*");

    res.json({ success: true, message: "Product updated successfully", data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.product.delete({ where: { id } });

    // Invalidate Redis and HTTP caches
    await delCache("api:merchandise:*");
    await delCache("http:*merchandise*");

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

