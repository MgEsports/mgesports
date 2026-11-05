import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.string().default("ADMIN"),
  phone: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
});

export const getAdminUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN", "TOURNAMENT_ADMIN", "CONTENT_EDITOR"] },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        ign: true,
        role: true,
        status: true,
        phone: true,
        discord: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createAdminUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createAdminSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      res.status(409).json({ success: false, message: "User with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
        discord: data.discord,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "CREATE_ADMIN_USER",
          resource: "User",
          details: `Created admin user: ${user.email} (${user.role})`,
        },
      });
    }

    res.status(201).json({ success: true, message: "Admin user created successfully", data: user });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, status, fullName, phone, discord } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(fullName ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(discord !== undefined ? { discord } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "UPDATE_ADMIN_USER",
          resource: "User",
          details: `Updated admin user ${user.email}`,
        },
      });
    }

    res.json({ success: true, message: "Admin user updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user?.id === id) {
      res.status(400).json({ success: false, message: "Cannot delete your own admin account" });
      return;
    }

    const user = await prisma.user.delete({ where: { id } });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          action: "DELETE_ADMIN_USER",
          resource: "User",
          details: `Deleted admin user: ${user.email}`,
        },
      });
    }

    res.json({ success: true, message: "Admin user deleted successfully" });
  } catch (error) {
    next(error);
  }
};
