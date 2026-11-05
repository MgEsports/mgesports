import { execSync } from "child_process";
import fs from "fs";
import path from "path";

try {
  execSync("node scripts/generate-favicons.cjs", { stdio: "inherit" });
} catch {
  console.log("ℹ️ Favicon generation skipped (favicons already exist)");
}

console.log("🚀 Building Lord Esports Main Website...");
execSync("npm run build:web", { stdio: "inherit" });

const adminDir = path.resolve("admin");

console.log("⚙️ Building Lord Esports Admin Portal...");
execSync("npm install --include=dev", {
  cwd: adminDir,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" }
});
execSync("npm run build", {
  cwd: adminDir,
  stdio: "inherit",
  env: { ...process.env, VITE_BASE: "/admin/" }
});

console.log("📦 Packaging Admin Portal into dist/admin...");
const adminDist = path.resolve("admin", "dist");
const targetDist = path.resolve("dist", "admin");

if (fs.existsSync(adminDist)) {
  fs.cpSync(adminDist, targetDist, { recursive: true });
  console.log("✅ Admin Portal successfully merged into dist/admin!");
} else {
  console.error("❌ admin/dist not found!");
  process.exit(1);
}

// Ensure public uploads are copied to dist/uploads and admin directories
const publicUploads = path.resolve("public", "uploads");
const distUploads = path.resolve("dist", "uploads");
const adminPublicUploads = path.resolve("admin", "public", "uploads");
const adminDistUploads = path.resolve("dist", "admin", "uploads");
if (fs.existsSync(publicUploads)) {
  fs.cpSync(publicUploads, distUploads, { recursive: true });
  fs.cpSync(publicUploads, adminPublicUploads, { recursive: true });
  fs.cpSync(publicUploads, adminDistUploads, { recursive: true });
  console.log("✅ Partner and media uploads synchronized to dist/uploads and admin dist!");
}

console.log("🎉 Full production build completed successfully!");
