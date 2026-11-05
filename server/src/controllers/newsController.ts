import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const articleSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  excerpt: z.string().min(2),
  content: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().default("TOURNAMENT"),
  date: z.string().optional(),
  readTime: z.string().default("3 MIN READ"),
  author: z.string().default("Lordz Editorial"),
  badgeColor: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

const formatArticleResponse = (article: any) => {
  return {
    ...article,
    image: article.coverImage,
    bannerImage: article.coverImage,
    description: article.content || article.excerpt,
  };
};

export const getArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, featured } = req.query;
    const where: any = { published: true };
    if (category && category !== "ALL") where.category = String(category);
    if (featured !== undefined) where.featured = featured === "true";

    const articles = await prisma.newsArticle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: articles.map(formatArticleResponse) });
  } catch (error) {
    next(error);
  }
};

export const getAllArticlesAdmin = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: articles.map(formatArticleResponse) });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = { ...req.body };
    if (!body.coverImage && (body.image || body.bannerImage)) {
      body.coverImage = body.image || body.bannerImage;
    }
    if (!body.content && body.description) {
      body.content = body.description;
    }
    if (!body.slug && body.title) {
      body.slug =
        body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-${Date.now()}`;
    }
    if (!body.date) {
      body.date = new Date()
        .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        .toUpperCase();
    }

    const parsed = articleSchema.parse(body);
    const { image, description, bannerImage, ...prismaData } = parsed as any;
    if (!prismaData.coverImage && image) prismaData.coverImage = image;
    if (!prismaData.coverImage && bannerImage) prismaData.coverImage = bannerImage;
    if (!prismaData.content && description) prismaData.content = description;
    if (!prismaData.slug) {
      prismaData.slug = `news-${Date.now()}`;
    }

    const article = await prisma.newsArticle.create({ data: prismaData });
    res.status(201).json({
      success: true,
      message: "Article published successfully",
      data: formatArticleResponse(article),
    });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (!body.coverImage && (body.image || body.bannerImage)) {
      body.coverImage = body.image || body.bannerImage;
    }
    if (!body.content && body.description) {
      body.content = body.description;
    }

    const parsed = articleSchema.partial().parse(body);
    const { image, description, bannerImage, ...prismaData } = parsed as any;
    if (!prismaData.coverImage && (image || bannerImage)) {
      prismaData.coverImage = image || bannerImage;
    }
    if (!prismaData.content && description) {
      prismaData.content = description;
    }

    const article = await prisma.newsArticle.update({
      where: { id },
      data: prismaData,
    });
    res.json({
      success: true,
      message: "Article updated successfully",
      data: formatArticleResponse(article),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = _req.params;
    await prisma.newsArticle.delete({ where: { id } });
    res.json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    next(error);
  }
};

