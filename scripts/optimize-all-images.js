import fs from "fs";
import path from "path";
import sharp from "sharp";

async function optimizeImage(filePath, maxWidth = 1000, maxHeight = null, isCrop = false, cropTopRatio = 0) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return;

  const originalStat = fs.statSync(filePath);
  const originalSize = originalStat.size;
  const inputBuffer = fs.readFileSync(filePath);

  try {
    let pipeline = sharp(inputBuffer);
    const meta = await pipeline.metadata();

    if (isCrop && cropTopRatio > 0) {
      const topOffset = Math.round(meta.height * cropTopRatio);
      const cropHeight = Math.round(meta.height * (1 - cropTopRatio));
      pipeline = pipeline.extract({
        left: 0,
        top: topOffset,
        width: meta.width,
        height: cropHeight,
      });
    }

    if (maxWidth && meta.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, maxHeight || null, { withoutEnlargement: true });
    }

    let buffer;
    if (ext === ".png") {
      buffer = await pipeline.png({ quality: 82, compressionLevel: 8 }).toBuffer();
    } else {
      buffer = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    }

    // Only overwrite if optimized is smaller
    if (buffer.length < originalSize) {
      fs.writeFileSync(filePath, buffer);
      console.log(
        `✓ ${path.basename(filePath)}: ${Math.round(originalSize / 1024)} KB -> ${Math.round(buffer.length / 1024)} KB (-${Math.round((1 - buffer.length / originalSize) * 100)}%)`
      );
    } else {
      console.log(`- ${path.basename(filePath)}: already optimal (${Math.round(originalSize / 1024)} KB)`);
    }
  } catch (err) {
    console.error(`Error optimizing ${filePath}:`, err.message);
  }
}

async function run() {
  console.log("=== Optimizing public/members ===");
  // Specific portrait handling for kart.jpeg to remove excessive ceiling headroom
  await optimizeImage("public/members/kart.jpeg", 800, null, true, 0.18);
  await optimizeImage("public/members/manager.PNG", 800, null);
  await optimizeImage("public/members/EDTIOR.jpeg", 800, null);
  await optimizeImage("public/members/editor.jpeg", 800, null);
  await optimizeImage("public/members/founder.png", 800, null);
  await optimizeImage("public/members/jer 2].jpeg", 800, null);
  await optimizeImage("public/members/jer.jpeg", 800, null);
  await optimizeImage("public/members/jai.jpeg", 800, null);
  await optimizeImage("public/members/dinesh.jpeg", 800, null);

  console.log("\n=== Optimizing public/players ===");
  if (fs.existsSync("public/players")) {
    for (const f of fs.readdirSync("public/players")) {
      await optimizeImage(path.join("public/players", f), 800, null);
    }
  }

  console.log("\n=== Optimizing src/assets ===");
  const assetsDir = "src/assets";
  for (const f of fs.readdirSync(assetsDir)) {
    const full = path.join(assetsDir, f);
    if (!fs.statSync(full).isFile()) continue;

    const lower = f.toLowerCase();
    if (lower.includes("banner") || lower.includes("about")) {
      await optimizeImage(full, 1400, null);
    } else if (lower.includes("player-") || lower.includes("product-") || lower.includes("jersey-")) {
      await optimizeImage(full, 800, null);
    } else if (lower.includes("free-fire-")) {
      await optimizeImage(full, 1000, null);
    }
  }

  console.log("\nAll images optimized successfully!");
}

run();
