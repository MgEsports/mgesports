import logoCleanEsportsPro from "../assets/logo-esportspro-clean.svg";
import logoCleanEspotzLive from "../assets/logo-espotz-clean.svg";
import logoCleanInfinix from "../assets/logo-infinix-clean.svg";
import logoCleanFreeFireMax from "../assets/logo-freefire-clean.svg";
import logoCleanFusionCrystals from "../assets/logo-fusion-clean.svg";
import logoCleanEsportsWorldCup from "../assets/logo-ewc-clean.svg";

import partnerEsportsPro from "../assets/partner-esportspro.png";
import partnerEspotz from "../assets/partner-espotz.png";
import partnerInfinix from "../assets/partner-infinix.png";
import partnerFreeFire from "../assets/partner-freefire.png";
import partnerFusion from "../assets/partner-fusion.png";
import partnerEwc from "../assets/partner-ewc.png";

import cardEsportsPro from "../assets/card_esports_pro.png";
import cardEspotzLive from "../assets/card_espotz_live.png";
import cardInfinix from "../assets/card_infinix.png";
import cardFreeFireMax from "../assets/card_free_fire_max.png";
import cardFusionCrystals from "../assets/card_fusion_crystals.png";
import cardEsportsWorldCup from "../assets/card_esports_world_cup.png";

import { getApiUrl } from "../api/client";

// Brand name / ID lookup table mapping to crisp bundled SVG logos
const KNOWN_PARTNER_LOGOS: Record<string, string> = {
  "esports-pro": logoCleanEsportsPro,
  "esportspro": logoCleanEsportsPro,
  "espotz-live": logoCleanEspotzLive,
  "espotz": logoCleanEspotzLive,
  "infinix": logoCleanInfinix,
  "free-fire-max": logoCleanFreeFireMax,
  "free-fire": logoCleanFreeFireMax,
  "freefire": logoCleanFreeFireMax,
  "ffmax": logoCleanFreeFireMax,
  "fusion-crystals": logoCleanFusionCrystals,
  "fusion": logoCleanFusionCrystals,
  "fusioncrystals": logoCleanFusionCrystals,
  "esports-world-cup": logoCleanEsportsWorldCup,
  "ewc": logoCleanEsportsWorldCup,
  "worldcup": logoCleanEsportsWorldCup,
  "world-cup": logoCleanEsportsWorldCup,
};

const FILENAME_FALLBACKS: Record<string, string> = {
  "partner-esportspro.png": partnerEsportsPro,
  "logo-esportspro-clean.svg": logoCleanEsportsPro,
  "partner-espotz.png": partnerEspotz,
  "logo-espotz-clean.svg": logoCleanEspotzLive,
  "partner-infinix.png": partnerInfinix,
  "logo-infinix-clean.svg": logoCleanInfinix,
  "partner-freefire.png": partnerFreeFire,
  "logo-freefire-clean.svg": logoCleanFreeFireMax,
  "partner-fusion.png": partnerFusion,
  "logo-fusion-clean.svg": logoCleanFusionCrystals,
  "partner-ewc.png": partnerEwc,
  "logo-ewc-clean.svg": logoCleanEsportsWorldCup,
  "card_esports_pro.png": cardEsportsPro,
  "card_espotz_live.png": cardEspotzLive,
  "card_infinix.png": cardInfinix,
  "card_free_fire_max.png": cardFreeFireMax,
  "card_fusion_crystals.png": cardFusionCrystals,
  "card_esports_world_cup.png": cardEsportsWorldCup,
};

/**
 * Resolves a partner logo URL with 100% reliability:
 * 1. Checks if the logo corresponds to a bundled known partner SVG/PNG (instant 0ms render).
 * 2. Checks if the URL matches standard seed file names.
 * 3. Handles absolute URLs (Cloudinary, external CDNs, data URIs).
 * 4. Resolves relative /uploads paths through getApiUrl().
 */
export function resolveAdminPartnerLogo(
  logoUrl?: string | null,
  name?: string | null,
  id?: string | null
): string {
  const normName = (name || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normId = (id || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  // 1. Check known brand match (prioritizes ultra-clean bundled SVG)
  for (const [key, asset] of Object.entries(KNOWN_PARTNER_LOGOS)) {
    const cleanKey = key.replace(/[^a-z0-9]/g, "");
    if (normId === cleanKey || normName.includes(cleanKey) || (id && id.toLowerCase().includes(key))) {
      return asset;
    }
  }

  // 2. Check filename in logoUrl
  if (logoUrl) {
    const filename = logoUrl.split("/").pop()?.split("?")[0] || "";
    if (FILENAME_FALLBACKS[filename]) {
      return FILENAME_FALLBACKS[filename];
    }
  }

  // 3. Absolute URLs
  if (
    logoUrl &&
    (logoUrl.startsWith("http://") ||
      logoUrl.startsWith("https://") ||
      logoUrl.startsWith("data:") ||
      logoUrl.startsWith("blob:"))
  ) {
    return logoUrl;
  }

  // 4. Relative uploads path
  if (logoUrl) {
    return getApiUrl(logoUrl);
  }

  return "";
}

/**
 * Resolves partner card background image with fallback
 */
export function resolveAdminPartnerCard(
  cardUrl?: string | null,
  id?: string | null
): string | null {
  if (!cardUrl && id) {
    const cleanId = id.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (cleanId.includes("esportspro")) return cardEsportsPro;
    if (cleanId.includes("espotz")) return cardEspotzLive;
    if (cleanId.includes("infinix")) return cardInfinix;
    if (cleanId.includes("freefire")) return cardFreeFireMax;
    if (cleanId.includes("fusion")) return cardFusionCrystals;
    if (cleanId.includes("worldcup") || cleanId.includes("ewc")) return cardEsportsWorldCup;
  }

  if (cardUrl) {
    const filename = cardUrl.split("/").pop()?.split("?")[0] || "";
    if (FILENAME_FALLBACKS[filename]) {
      return FILENAME_FALLBACKS[filename];
    }
    if (cardUrl.startsWith("http://") || cardUrl.startsWith("https://") || cardUrl.startsWith("data:")) {
      return cardUrl;
    }
    return getApiUrl(cardUrl);
  }

  return null;
}
