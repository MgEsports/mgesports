import { PageHero } from "../components/common/PageHero";
import { NewsSection } from "../sections/NewsSection";
import { useModals } from "../context/useModals";
import { SEO } from "../components/common/SEO";
import { SITE_URL } from "../config/seo";
import { newsData } from "../data/news";

export const NewsPage = () => {
  const { openArticle } = useModals();

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MG ESPORTS News & Dispatches",
    description: "Official competitive reports and announcements from MG ESPORTS.",
    url: `${SITE_URL}/news`,
    numberOfItems: newsData.length,
    itemListElement: newsData.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "NewsArticle",
        headline: item.title,
        description: item.excerpt,
        datePublished: "2026-09-12",
        author: {
          "@type": "Organization",
          name: "MG ESPORTS",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "MG ESPORTS",
          url: SITE_URL,
        },
        image: item.coverImage || item.image || `${SITE_URL}/og-image.jpg`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#070709] w-full max-w-full overflow-x-hidden">
      <SEO
        title="MG ESPORTS News | Tournament Briefs &amp; Roster Updates"
        description="Stay up to date with the latest dispatches, competitive match debriefs, tournament announcements, and roster updates from MG ESPORTS."
        canonicalPath="/news"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "News", item: "/news" },
        ]}
        structuredData={newsSchema}
      />

      <PageHero
        badge="EDITORIAL & MEDIA DISPATCHES"
        title="LATEST FROM"
        titleHighlight="MG"
        subtitle="Roster movements, official tournament briefings, tier-1 scrim announcements, and competitive post-match debriefs."
      />

      <NewsSection onSelectArticle={openArticle} showHeader={false} />
    </div>
  );
};
