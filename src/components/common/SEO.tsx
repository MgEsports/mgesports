import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, BRAND_CONFIG } from "../../config/seo";

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile" | "product";
  noindex?: boolean;
  nofollow?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: Record<string, any> | Array<Record<string, any>>;
  children?: React.ReactNode;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = BRAND_CONFIG.description,
  canonicalPath,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noindex = false,
  nofollow = false,
  breadcrumbs,
  structuredData,
  children,
}) => {
  const location = useLocation();

  // Format title consistently with brand
  const formattedTitle = React.useMemo(() => {
    if (!title) {
      return `${BRAND_CONFIG.brandName} | ${BRAND_CONFIG.tagline}`;
    }
    if (title.toUpperCase().includes(BRAND_CONFIG.brandName.toUpperCase())) {
      return title;
    }
    return `${title} | ${BRAND_CONFIG.brandName}`;
  }, [title]);

  // Detect whether currently running on a Vercel preview or staging deployment
  const isPreviewDeployment = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    // Allow indexing on production domains
    if (
      host === "mgesports.in" ||
      host === "www.mgesports.in" ||
      host === "mgesports.com" ||
      host === "www.mgesports.com" ||
      host === "lordesportz.com" ||
      host === "www.lordesportz.com"
    ) {
      return false;
    }
    // Block indexing on preview URLs, vercel.app, staging, and dev hosts
    return true;
  }, []);

  // Compute canonical URL strictly using production SITE_URL
  const resolvedCanonical = React.useMemo(() => {
    if (canonicalUrl) return canonicalUrl;
    const path = canonicalPath || location.pathname;
    if (path === "/" || path === "") {
      return `${SITE_URL}/`;
    }
    const cleanPath = path.replace(/\/+$/, "");
    return `${SITE_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
  }, [canonicalUrl, canonicalPath, location.pathname]);

  // Resolve OpenGraph image - ensure absolute URL
  const resolvedOgImage = React.useMemo(() => {
    if (!ogImage) return BRAND_CONFIG.ogImageUrl;
    if (ogImage.startsWith("http://") || ogImage.startsWith("https://")) {
      return ogImage;
    }
    return `${SITE_URL}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
  }, [ogImage]);

  // Robots directive (auto-noindex preview deployments to prevent duplicate indexation)
  const robotsContent = React.useMemo(() => {
    if (isPreviewDeployment) {
      return "noindex, follow";
    }
    if (noindex && nofollow) return "noindex, nofollow";
    if (noindex) return "noindex, follow";
    if (nofollow) return "index, nofollow";
    return "index, follow";
  }, [isPreviewDeployment, noindex, nofollow]);

  // Breadcrumbs schema
  const breadcrumbSchema = React.useMemo(() => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: b.name,
        item: b.item.startsWith("http") ? b.item : `${SITE_URL}${b.item.startsWith("/") ? "" : "/"}${b.item}`,
      })),
    };
  }, [breadcrumbs]);

  // Combine structured data into an array or single graph
  const finalStructuredData = React.useMemo(() => {
    const list: any[] = [];
    if (breadcrumbSchema) list.push(breadcrumbSchema);
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        list.push(...structuredData);
      } else {
        list.push(structuredData);
      }
    }
    return list;
  }, [breadcrumbSchema, structuredData]);

  // Synchronize document <head> elements for client-side navigation
  useEffect(() => {
    // 1. Update Title
    document.title = formattedTitle;

    // Helper function to update or create a meta tag
    const setMetaTag = (attribute: string, attrValue: string, content: string) => {
      let element = document.head.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Standard Meta
    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", robotsContent);

    // 3. Open Graph
    setMetaTag("property", "og:title", formattedTitle);
    setMetaTag("property", "og:description", description);
    if (!noindex) {
      setMetaTag("property", "og:url", resolvedCanonical);
    }
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", resolvedOgImage);
    setMetaTag("property", "og:site_name", BRAND_CONFIG.brandName);
    setMetaTag("property", "og:locale", "en_US");

    // 4. Twitter Card
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", formattedTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", resolvedOgImage);

    // 5. Canonical Link Tag (Omitted on noindex / 404 pages)
    let canonicalLink = document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (noindex) {
      if (canonicalLink) {
        canonicalLink.remove();
      }
    } else {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", resolvedCanonical);
    }

    // 6. JSON-LD Structured Data Injection (Skip on noindex/private pages)
    const SCRIPT_ID = "seo-json-ld";
    let scriptElement = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!noindex && finalStructuredData.length > 0) {
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = SCRIPT_ID;
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }
      const payload =
        finalStructuredData.length === 1
          ? finalStructuredData[0]
          : {
              "@context": "https://schema.org",
              "@graph": finalStructuredData,
            };
      scriptElement.textContent = JSON.stringify(payload);
    } else if (scriptElement) {
      scriptElement.remove();
    }
  }, [
    formattedTitle,
    description,
    resolvedCanonical,
    resolvedOgImage,
    ogType,
    robotsContent,
    noindex,
    finalStructuredData,
  ]);

  return (
    <>
      {/* React 19 native metadata hoisting fallback */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      {!noindex && <link rel="canonical" href={resolvedCanonical} />}
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      {!noindex && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:site_name" content={BRAND_CONFIG.brandName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />
      {!noindex && finalStructuredData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              finalStructuredData.length === 1
                ? finalStructuredData[0]
                : { "@context": "https://schema.org", "@graph": finalStructuredData }
            ),
          }}
        />
      )}
      {children}
    </>
  );
};
