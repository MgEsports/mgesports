/**
 * Image Optimization & Cloudinary URL Transformer
 * Automatically optimizes images via Cloudinary transformations (f_auto, q_auto, w_...)
 * and provides reliable fallback asset resolution.
 */

import jerseyFrontImg from "../assets/jersey-front.jpg";
import hoodieImg from "../assets/product-hoodie.jpg";
import mousepadImg from "../assets/product-mousepad.jpg";
import capImg from "../assets/product-cap.jpg";
import sleeveImg from "../assets/product-sleeve.jpg";

export function getProductFallbackImage(name?: string): string {
  if (!name) return jerseyFrontImg;
  const lower = name.toLowerCase();
  if (lower.includes("jersey")) return jerseyFrontImg;
  if (lower.includes("hoodie") || lower.includes("fleece") || lower.includes("apparel")) return hoodieImg;
  if (lower.includes("mousepad") || lower.includes("mat") || lower.includes("pad")) return mousepadImg;
  if (lower.includes("cap") || lower.includes("hat") || lower.includes("snapback")) return capImg;
  if (lower.includes("sleeve") || lower.includes("arm") || lower.includes("key chain") || lower.includes("keychain")) return sleeveImg;
  return jerseyFrontImg;
}

export function optimizeCloudinaryUrl(url?: string | null, width = 800): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();

  // 1. If Cloudinary URL, inject auto format (WebP/AVIF), auto quality, and width bounds
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/upload/")) {
    if (trimmed.includes("/f_auto,q_auto") || trimmed.includes("/q_auto,f_auto")) {
      return trimmed;
    }
    const transform = `f_auto,q_auto,w_${width},c_limit`;
    return trimmed.replace("/upload/", `/upload/${transform}/`);
  }

  // 2. If relative /uploads/ path on production
  if (
    trimmed.startsWith("/uploads/") &&
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return `https://lordz-esportsserver.vercel.app${trimmed}`;
  }

  return trimmed;
}
