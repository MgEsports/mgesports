import { PageHero } from "../components/common/PageHero";
import { JerseyShowcaseSection } from "../sections/JerseyShowcaseSection";
import { useModals } from "../context/useModals";
import { SEO } from "../components/common/SEO";

export const JerseyPage = () => {
  const { openJersey } = useModals();

  return (
    <div className="min-h-screen bg-[#070709]">
      <SEO
        title="MG ESPORTS Official Combat Merchandise &amp; Jersey"
        description="Engineered for high-pressure competition. Crafted with Dravidian temple heritage, athlete IGN sublimation, and battle flame aesthetics."
        canonicalPath="/products"
      />
      <PageHero
        badge="OFFICIAL MERCHANDISE"
        title="WEAR THE"
        titleHighlight="MG"
        subtitle="Engineered for high-pressure competition. Crafted with Dravidian temple heritage, athlete IGN sublimation, and battle flame aesthetics."
      />

      <JerseyShowcaseSection onShopJersey={openJersey} showHeader={false} />
    </div>
  );
};
