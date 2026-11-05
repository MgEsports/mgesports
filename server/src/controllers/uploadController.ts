import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("⚠️ Could not create uploads directory (read-only environment):", err);
}

// Use memory storage so we can stream/buffer directly to Cloudinary
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are supported"));
    }
  },
}).single("file");

/**
 * Upload directly to Cloudinary via REST API without requiring heavy SDK packages
 */
async function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not configured in server/.env");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();

  const ext = mimetype.includes("png") ? "png" : mimetype.includes("webp") ? "webp" : "jpg";
  const blob = new Blob([new Uint8Array(buffer)], { type: mimetype });
  formData.append("file", blob, `athlete-upload.${ext}`);

  if (apiKey && apiSecret) {
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "lordz-esports/players";
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("folder", folder);

    // Cloudinary signature formula: sha1(sorted_params + api_secret)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");
    formData.append("signature", signature);
  } else if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "lordz-esports/players");
  } else {
    throw new Error("Missing Cloudinary API Key/Secret or Upload Preset in server/.env");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const resJson = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(resJson?.error?.message || "Cloudinary upload request failed");
  }

  return resJson.secure_url;
}

export const handleUpload = (req: Request, res: Response, _next: NextFunction): void => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

    // If Cloudinary credentials are provided, upload online to Cloudinary
    if (cloudName && ((apiKey && apiSecret) || uploadPreset)) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        res.json({
          success: true,
          message: "Uploaded to Cloudinary successfully",
          url: cloudinaryUrl,
          provider: "cloudinary",
        });
        return;
      } catch (cloudinaryErr: any) {
        console.error("Cloudinary upload error:", cloudinaryErr);
        res.status(500).json({
          success: false,
          message: `Cloudinary error: ${cloudinaryErr.message}`,
        });
        return;
      }
    }

    // Fallback: save to local disk if Cloudinary credentials are not yet entered
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = "lordz-" + uniqueSuffix + ext;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      const fileUrl = `/uploads/${filename}`;
      res.json({
        success: true,
        message: "File uploaded locally. To store online in Cloudinary, fill in CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET in server/.env",
        url: fileUrl,
        filename,
        provider: "local",
      });
    } catch (saveErr: any) {
      res.status(500).json({ success: false, message: saveErr.message || "Failed to save file" });
    }
  });
};
