import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[API ERROR]", err);

  if (err instanceof ZodError) {
    const detailMsg = err.errors.map((e) => `${e.path.join(".") || "field"}: ${e.message}`).join(" • ");
    res.status(400).json({
      success: false,
      message: detailMsg || "Validation failed",
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target ? err.meta.target : "field"} already exists.`,
    });
    return;
  }

  // Prisma record not found
  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Record not found",
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
