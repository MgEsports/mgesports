/**
 * Centralized SEO Configuration for MG ESPORTS (mgesports)
 * Single source of truth for site origin, brand identity, social channels, and structured data schemas.
 */

// Resolves canonical origin: VITE_SITE_URL environment variable takes precedence,
// strictly falling back to the intended production domain https://mgesports.in.
// NEVER outputs localhost, staging, or vercel.app preview URLs as canonical, OG, or schema metadata.
export const getSiteUrl = (): string => {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    // Guard against accidental localhost or vercel preview URLs being treated as canonical
    if (!trimmed.includes("localhost") && !trimmed.includes("127.0.0.1") && !trimmed.includes(".vercel.app")) {
      return trimmed;
    }
  }

  // Canonical production domain
  return "https://mgesports.in";
};

export const SITE_URL = getSiteUrl();

export const BRAND_CONFIG = {
  brandName: "MG ESPORTS",
  legalName: "MG ESPORTS",
  alternateNames: ["MG Esports", "mgesports", "MG", "MG13"],
  tagline: "Together we conquer",
  description:
    "MG ESPORTS is a professional mobile esports organization. We train, compete and win as one team on the Clash of Clans World Championship stage. Golden Ticket winners.",
  themeColor: "#050505",
  logoUrl: `${SITE_URL}/images/embedded-logo.png`,
  ogImageUrl: `${SITE_URL}/images/hero.png`,
  contactEmail: "contact@mgesports.gg",
  location: {
    locality: "Chennai",
    region: "Tamil Nadu",
    country: "IN",
  },
  socials: {
    instagram: "https://www.instagram.com/mg13e.sports",
    youtube: "https://youtube.com/@mgesports-mg",
    discord: "https://discord.gg/rH3PkZdNz",
    twitter: "https://x.com/mg13esports",
    whatsappMain: "https://whatsapp.com/channel/mgesports",
    whatsappScrims: "https://whatsapp.com/channel/mgesports-scrims",
  },
};

/**
 * Builds standard Organization JSON-LD Schema based solely on verified project data.
 */
export const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: BRAND_CONFIG.brandName,
  alternateName: BRAND_CONFIG.alternateNames,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: BRAND_CONFIG.logoUrl,
    width: "512",
    height: "512",
  },
  image: BRAND_CONFIG.ogImageUrl,
  description: BRAND_CONFIG.description,
  email: BRAND_CONFIG.contactEmail,
  address: {
    "@type": "PostalAddress",
    addressLocality: BRAND_CONFIG.location.locality,
    addressRegion: BRAND_CONFIG.location.region,
    addressCountry: BRAND_CONFIG.location.country,
  },
  sameAs: [
    BRAND_CONFIG.socials.instagram,
    BRAND_CONFIG.socials.youtube,
    BRAND_CONFIG.socials.discord,
    BRAND_CONFIG.socials.twitter,
    BRAND_CONFIG.socials.whatsappMain,
    BRAND_CONFIG.socials.whatsappScrims,
  ],
  sport: "Esports",
});

/**
 * Builds WebSite JSON-LD Schema for site name and brand entity recognition.
 */
export const buildWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BRAND_CONFIG.brandName,
  alternateName: BRAND_CONFIG.alternateNames[0],
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  inLanguage: "en-US",
});
