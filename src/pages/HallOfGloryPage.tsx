import { PageHero } from "../components/common/PageHero";
import { HallOfGlorySection } from "../sections/HallOfGlorySection";
import { SEO } from "../components/common/SEO";

export const HallOfGloryPage = () => {
  return (
    <div className="min-h-screen bg-[#050505]">
      <SEO
        title="MG ESPORTS Hall of Glory &amp; Trophy Room"
        description="Honoring landmark championship victories, tournament MVPs, and historic milestones in MG ESPORTS history."
        canonicalPath="/tournaments"
      />
      <PageHero
        badge="TROPHY ROOM & ACHIEVEMENTS"
        title="HALL OF"
        titleHighlight="GLORY"
        subtitle="Honoring the landmark championship victories, event MVPs, and historic milestones in MG ESPORTS history."
      />

      <HallOfGlorySection showHeader={false} />
    </div>
  );
};
