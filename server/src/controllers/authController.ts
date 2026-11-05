import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendPasswordResetOtpEmail, sendWelcomeEmail } from "../services/emailService.js";
import { getCache, setCache, delCache } from "../config/cache.js";

const JWT_SECRET = process.env.JWT_SECRET || "lordz-esports-ultra-secure-jwt-secret-key-2026-prod";

const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(7, "Please provide a valid mobile number"),
  gamingExperience: z.string().optional().default("1-2 Years (Semi-Pro)"),
  primaryGame: z.string().optional().default("FREE FIRE MAX"),
  ign: z.string().optional(),
  gameUid: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  device: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  ign: z.string().optional().nullable(),
  gameUid: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  gamingExperience: z.string().optional().nullable(),
  primaryGame: z.string().optional().nullable(),
  device: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, email, password } = loginSchema.parse(req.body);
    const loginId = (identifier || email || "").toLowerCase().trim();

    if (!loginId) {
      res.status(400).json({ success: false, message: "Please provide your username or email" });
      return;
    }

    // Support logging in via email, unique username, or IGN
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { username: loginId },
          { ign: { equals: loginId, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid username/email or password" });
      return;
    }

    if (user.status === "SUSPENDED") {
      res.status(403).json({ success: false, message: "Your athlete account has been suspended. Contact support." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid username/email or password" });
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      ign: user.ign,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ign: user.ign,
        gameUid: user.gameUid,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        discord: user.discord,
        gamingExperience: user.gamingExperience,
        primaryGame: user.primaryGame,
        device: user.device,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const username = data.username.toLowerCase().trim();

    // 1. Check if email already registered
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      res.status(409).json({ success: false, message: "This email address is already registered. Please sign in." });
      return;
    }

    // 2. Check if username already taken
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      res.status(409).json({ success: false, message: "This username is already taken. Please choose another one." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: "PLAYER",
        ign: data.ign?.trim() || username.toUpperCase(),
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        discord: data.discord?.trim() || null,
        gamingExperience: data.gamingExperience || "1-2 Years (Semi-Pro)",
        primaryGame: data.primaryGame || "FREE FIRE MAX",
        device: data.device?.trim() || null,
        bio: data.bio?.trim() || null,
        status: "ACTIVE",
      },
    });

    // Dispatch attractive Lord Esports welcome email with official logo via Resend
    sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      ign: user.ign,
      primaryGame: user.primaryGame,
      gamingExperience: user.gamingExperience,
      device: user.device,
      discord: user.discord,
    }).catch((err) => {
      console.warn("⚠️ [Register] Welcome email dispatch warning:", err?.message || err);
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role, ign: user.ign },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.status(201).json({
      success: true,
      message: "Player account registered successfully!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ign: user.ign,
        gameUid: user.gameUid,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        discord: user.discord,
        gamingExperience: user.gamingExperience,
        primaryGame: user.primaryGame,
        device: user.device,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        ign: true,
        gameUid: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        discord: true,
        gamingExperience: true,
        primaryGame: true,
        device: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user && req.user.email) {
      user = await prisma.user.findUnique({
        where: { email: req.user.email },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          ign: true,
          gameUid: true,
          fullName: true,
          avatarUrl: true,
          phone: true,
          discord: true,
          gamingExperience: true,
          primaryGame: true,
          device: true,
          bio: true,
          status: true,
          createdAt: true,
        },
      });
    }

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = updateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        ign: true,
        gameUid: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        discord: true,
        gamingExperience: true,
        primaryGame: true,
        device: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ success: true, message: "Profile updated successfully", user: updated });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, credential, email, name, picture, googleId } = req.body;

    let userEmail = email?.toLowerCase().trim();
    let userName = name?.trim();
    let avatarUrl = picture;

    // 1. If OAuth2 access token (e.g. from Google popup token client: ya29...)
    const rawToken = credential || token;
    if (rawToken && (rawToken.startsWith("ya29.") || !rawToken.includes("."))) {
      try {
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${rawToken}` },
        });
        if (googleRes.ok) {
          const profile: any = await googleRes.json();
          if (profile.email) {
            userEmail = profile.email.toLowerCase().trim();
            userName = userName || profile.name || profile.given_name;
            avatarUrl = avatarUrl || profile.picture;
          }
        }
      } catch (err) {
        console.warn("Google userinfo fetch failed:", err);
      }
    } else if (rawToken) {
      // 2. Decode JWT payload if credential/token is a Google ID token
      try {
        const decoded: any = jwt.decode(rawToken);
        if (decoded && decoded.email) {
          userEmail = decoded.email.toLowerCase().trim();
          userName = userName || decoded.name || decoded.given_name;
          avatarUrl = avatarUrl || decoded.picture;
        }
      } catch (err) {
        console.warn("Google token decode failed:", err);
      }
    }

    if (!userEmail) {
      res.status(400).json({ success: false, message: "Valid Google account email is required" });
      return;
    }

    let user: any = null;

    try {
      user = await prisma.user.findFirst({
        where: { email: userEmail },
      });
    } catch (e) {
      console.warn("DB user find error:", e);
    }

    if (!user) {
      // Create new player user with Google credentials
      const baseUsername = userEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18);
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      const randomPassword = await bcrypt.hash(`Google_${Date.now()}_${Math.random()}`, 10);
      const defaultIgn = userName ? userName.replace(/\s+/g, "_").toUpperCase().slice(0, 15) : uniqueUsername.toUpperCase();

      try {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            username: uniqueUsername,
            fullName: userName || "Lordz Athlete",
            ign: defaultIgn,
            passwordHash: randomPassword,
            role: "PLAYER",
            avatarUrl: avatarUrl || null,
            primaryGame: "FREE FIRE MAX",
            gamingExperience: "1-2 Years (Semi-Pro)",
            status: "ACTIVE",
          },
        });
      } catch (createErr) {
        console.warn("DB user create error, using memory fallback:", createErr);
        user = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: userEmail,
          username: uniqueUsername,
          fullName: userName || "Lordz Athlete",
          ign: defaultIgn,
          role: "PLAYER",
          avatarUrl: avatarUrl || null,
          primaryGame: "FREE FIRE MAX",
          gamingExperience: "1-2 Years (Semi-Pro)",
          status: "ACTIVE",
          createdAt: new Date(),
        };
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      ign: user.ign,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Google sign-in successful",
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ign: user.ign,
        gameUid: user.gameUid,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        discord: user.discord,
        gamingExperience: user.gamingExperience,
        primaryGame: user.primaryGame,
        device: user.device,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEffectiveCallbackUrl = (req: Request, customUri?: string): string => {
  if (customUri) return customUri;
  const host = req.get("host") || "localhost:5000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const envUrl = process.env.GOOGLE_CALLBACK_URL;
  if (envUrl && (host.includes("localhost") || !envUrl.includes("localhost"))) {
    return envUrl;
  }
  return `${protocol}://${host}/api/auth/google/callback`;
};

/**
 * 1. Initiate Google OAuth 2.0 Authorization Flow
 * Redirects the user's browser directly to accounts.google.com
 */
export const initiateGoogleLogin = (req: Request, res: Response): void => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Google OAuth Client ID is not configured in server/.env.");
    return;
  }

  const callbackUrl = getEffectiveCallbackUrl(req);

  // Preserve return url or role in state parameter
  const returnUrl =
    (req.query.returnUrl as string) ||
    (req.query.redirect_to as string) ||
    (process.env.NODE_ENV === "development" ? "http://localhost:5173" : process.env.CLIENT_URL || "/");
  const role = (req.query.role as string) || "PLAYER";

  const stateObj = {
    returnUrl,
    role,
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId.trim(),
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    }).toString();

  res.redirect(googleAuthUrl);
};

/**
 * 2. Handle Google OAuth Callback
 * Receives authorization code from Google, exchanges it for tokens,
 * creates/updates user in database, and redirects back to frontend.
 */
export const handleGoogleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    let returnUrl =
      process.env.NODE_ENV === "development" ? "http://localhost:5173" : process.env.CLIENT_URL || "/";
    let targetRole = "PLAYER";

    if (state && typeof state === "string") {
      try {
        const decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
        if (decodedState.returnUrl) returnUrl = decodedState.returnUrl;
        if (decodedState.role) targetRole = decodedState.role;
      } catch (err) {
        console.warn("Could not parse OAuth state:", err);
      }
    }

    if (error) {
      console.warn("Google OAuth error response:", error);
      const url = new URL(returnUrl, returnUrl.startsWith("http") ? undefined : "http://localhost:5173");
      url.searchParams.set("auth_error", String(error));
      res.redirect(url.toString());
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).send("Authorization code missing from Google callback");
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).send("Google OAuth Client credentials not set on server");
      return;
    }

    const callbackUrl = getEffectiveCallbackUrl(req);

    // Exchange authorization code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      const url = new URL(returnUrl, returnUrl.startsWith("http") ? undefined : "http://localhost:5173");
      url.searchParams.set("auth_error", tokenData.error_description || tokenData.error || "Token exchange failed");
      res.redirect(url.toString());
      return;
    }

    // Retrieve verified profile from Google
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userinfoRes.ok) {
      throw new Error("Failed to fetch user profile from Google");
    }

    const profile: any = await userinfoRes.json();
    const userEmail = profile.email?.toLowerCase().trim();
    const userName = profile.name || profile.given_name;
    const avatarUrl = profile.picture;

    if (!userEmail) {
      throw new Error("No email returned from Google user profile");
    }

    // Find or create in Prisma
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: userEmail },
      });
    } catch (e) {
      console.warn("DB user find error:", e);
    }

    if (!user) {
      const baseUsername = userEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18);
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      const randomPassword = await bcrypt.hash(`Google_${Date.now()}_${Math.random()}`, 10);
      const defaultIgn = userName
        ? userName.replace(/\s+/g, "_").toUpperCase().slice(0, 15)
        : uniqueUsername.toUpperCase();

      try {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            username: uniqueUsername,
            fullName: userName || "Lordz Athlete",
            ign: defaultIgn,
            passwordHash: randomPassword,
            role: targetRole === "ADMIN" ? "ADMIN" : "PLAYER",
            avatarUrl: avatarUrl || null,
            primaryGame: "FREE FIRE MAX",
            gamingExperience: "1-2 Years (Semi-Pro)",
            status: "ACTIVE",
          },
        });
      } catch (createErr) {
        console.warn("DB user create error, using fallback:", createErr);
        user = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: userEmail,
          username: uniqueUsername,
          fullName: userName || "Lordz Athlete",
          ign: defaultIgn,
          role: targetRole === "ADMIN" ? "ADMIN" : "PLAYER",
          avatarUrl: avatarUrl || null,
          primaryGame: "FREE FIRE MAX",
          gamingExperience: "1-2 Years (Semi-Pro)",
          status: "ACTIVE",
          createdAt: new Date(),
        };
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      ign: user.ign,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // Set secure cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      ign: user.ign,
      gameUid: user.gameUid,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      discord: user.discord,
      gamingExperience: user.gamingExperience,
      primaryGame: user.primaryGame,
      device: user.device,
      bio: user.bio,
      status: user.status,
      createdAt: user.createdAt,
    };

    const targetUrl = new URL(returnUrl, returnUrl.startsWith("http") ? undefined : "http://localhost:5173");
    targetUrl.searchParams.set("google_auth", "success");
    targetUrl.searchParams.set("token", jwtToken);
    targetUrl.searchParams.set("user", encodeURIComponent(JSON.stringify(safeUser)));

    res.redirect(targetUrl.toString());
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Exchange Google Authorization Code
 * Allows client-side redirect callbacks to exchange the code for session tokens.
 */
export const exchangeGoogleCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, redirectUri, role } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: "Authorization code is required" });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ success: false, message: "Google OAuth credentials not configured on server" });
      return;
    }

    const effectiveCallbackUrl = getEffectiveCallbackUrl(req, redirectUri);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: effectiveCallbackUrl,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.status(400).json({
        success: false,
        message: tokenData.error_description || tokenData.error || "Token exchange failed",
      });
      return;
    }

    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userinfoRes.ok) {
      res.status(400).json({ success: false, message: "Failed to retrieve user profile from Google" });
      return;
    }

    const profile: any = await userinfoRes.json();
    const userEmail = profile.email?.toLowerCase().trim();
    const userName = profile.name || profile.given_name;
    const avatarUrl = profile.picture;

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: userEmail },
      });
    } catch (e) {
      console.warn("DB user find error:", e);
    }

    if (!user) {
      const baseUsername = userEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18);
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      const randomPassword = await bcrypt.hash(`Google_${Date.now()}_${Math.random()}`, 10);
      const defaultIgn = userName
        ? userName.replace(/\s+/g, "_").toUpperCase().slice(0, 15)
        : uniqueUsername.toUpperCase();

      user = await prisma.user.create({
        data: {
          email: userEmail,
          username: uniqueUsername,
          fullName: userName || "Lordz Athlete",
          ign: defaultIgn,
          passwordHash: randomPassword,
          role: role === "ADMIN" ? "ADMIN" : "PLAYER",
          avatarUrl: avatarUrl || null,
          primaryGame: "FREE FIRE MAX",
          gamingExperience: "1-2 Years (Semi-Pro)",
          status: "ACTIVE",
        },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      ign: user.ign,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ign: user.ign,
        gameUid: user.gameUid,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        discord: user.discord,
        gamingExperience: user.gamingExperience,
        primaryGame: user.primaryGame,
        device: user.device,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().min(6, "Verification code must be 6 digits").max(6, "Verification code must be 6 digits"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().min(6, "Verification code must be 6 digits").max(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Request Password Reset Email with 6-digit OTP via Resend
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "No athlete account found registered with this email address.",
      });
      return;
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const cacheKey = `otp:reset:${cleanEmail}`;

    // Store in cache for 10 minutes (600 seconds)
    await setCache(cacheKey, { otp, email: cleanEmail, expiresAt: Date.now() + 10 * 60 * 1000 }, 600);

    // Send email using Resend
    const sendResult = await sendPasswordResetOtpEmail(
      user.email,
      otp,
      user.fullName || user.ign || user.username || "Athlete"
    );

    if (!sendResult.success) {
      res.status(502).json({
        success: false,
        message: sendResult.error || "Failed to deliver OTP email. Please verify that your email is valid.",
      });
      return;
    }

    res.json({
      success: true,
      message: "A 6-digit verification code has been dispatched to your email address.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP entered by athlete
 */
export const verifyResetOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();
    const cacheKey = `otp:reset:${cleanEmail}`;

    const stored = await getCache<{ otp: string; email: string; expiresAt: number }>(cacheKey);

    if (!stored || !stored.otp) {
      res.status(400).json({
        success: false,
        message: "Verification code has expired or was not requested. Please request a new code.",
      });
      return;
    }

    if (stored.otp !== otp.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check your email and try again.",
      });
      return;
    }

    res.json({
      success: true,
      message: "Verification code verified successfully. You may now enter your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set New Password using verified OTP
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();
    const cacheKey = `otp:reset:${cleanEmail}`;

    const stored = await getCache<{ otp: string; email: string; expiresAt: number }>(cacheKey);

    if (!stored || !stored.otp) {
      res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
      return;
    }

    if (stored.otp !== otp.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User account not found." });
      return;
    }

    // Hash new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate OTP immediately
    await delCache(cacheKey);

    res.json({
      success: true,
      message: "Password reset successful! You may now sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};



