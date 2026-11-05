import { PageHero } from "../components/common/PageHero";
import { MediaSection } from "../sections/MediaSection";
import { useModals } from "../context/useModals";
import { SEO } from "../components/common/SEO";
import { mediaData } from "../data/media";

export const MediaPage = () => {
  const { playMedia } = useModals();

  const videoSchemas = mediaData
    .filter((m) => Boolean(m.youtubeId))
    .slice(0, 5)
    .map((m) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: m.title,
      description: m.description || `Official LORD ESPORTZ ${m.game} highlight.`,
      thumbnailUrl: m.thumbnail || `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg`,
      uploadDate: "2026-09-20T12:00:00Z",
      contentUrl: `https://www.youtube.com/watch?v=${m.youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${m.youtubeId}`,
    }));

  return (
    <div className="min-h-screen bg-[#050505] w-full max-w-full overflow-x-hidden">
      <SEO
        title="MG ESPORTS Media | Tournament Highlights, Streams &amp; VODs"
        description="Watch official tournament highlights, clutch plays, team cinematics, and broadcast VODs from MG ESPORTS."
        canonicalPath="/media"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Media", item: "/media" },
        ]}
        structuredData={videoSchemas}
      />

      <PageHero
        badge="CINEMATICS & CLUTCHES"
        title="MG"
        titleHighlight="MEDIA HUB"
        subtitle="Match replays, clutch compilations, athlete shorts, behind-the-scenes gallery, and official broadcast documentaries."
      />

      <MediaSection onPlayMedia={playMedia} showHeader={false} />
    </div>
  );
};
