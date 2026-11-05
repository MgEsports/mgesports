/**
 * Image Optimization & Cloudinary URL Transformer for Admin Portal
 */

export function optimizeCloudinaryUrl(url?: string | null, width = 600): string {
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
