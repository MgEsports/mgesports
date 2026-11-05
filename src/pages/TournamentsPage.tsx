import { PageHero } from "../components/common/PageHero";
import { TournamentsSection } from "../sections/TournamentsSection";
import { useModals } from "../context/useModals";
import { SEO } from "../components/common/SEO";
import { SITE_URL } from "../config/seo";

export const TournamentsPage = () => {
  const { openJoinTournament } = useModals();

  const tournamentsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MG ESPORTS Competitive Tournaments",
    description: "Official Free Fire and Free Fire MAX competitive tournaments and scrims.",
    url: `${SITE_URL}/tournaments`,
    numberOfItems: 2,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "FLAME OF GLORY - FINALS",
        url: `${SITE_URL}/tournaments/fog-season-2`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "MG CLUTCH CUP S1",
        url: `${SITE_URL}/tournaments/mg-clutch-cup`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#050505] w-full max-w-full overflow-x-hidden">
      <SEO
        title="MG ESPORTS Tournaments | Free Fire Circuits &amp; Scrims"
        description="Explore verified Free Fire and Free Fire MAX esports tournaments by MG ESPORTS. Register your squad, view prize pools, stages, schedules, and live brackets."
        canonicalPath="/tournaments"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Tournaments", item: "/tournaments" },
        ]}
        structuredData={tournamentsSchema}
      />

      <PageHero
        badge="COMPETITIVE CIRCUITS"
        title="TOURNAMENT"
        titleHighlight="ARENA"
        subtitle="Register your squad, compete for verified cash prize pools, and earn national circuit ranking in official Free Fire and Free Fire MAX championships."
      />

      <TournamentsSection onSelectTournament={openJoinTournament} showHeader={false} />
    </div>
  );
};
