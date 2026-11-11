import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageHero } from "../components/common/PageHero";
import { AboutSection } from "../sections/AboutSection";
import { PlayersSection } from "../sections/PlayersSection";
import { TheCollectiveSection } from "../sections/TheCollectiveSection";
import { StatsSection } from "../sections/StatsSection";
import { SEO } from "../components/common/SEO";
import { buildOrganizationSchema } from "../config/seo";

export const AboutPage = () => {
  const location = useLocation();

  // Handle hash scrolling when navigating to #players, #teams, or #manifesto
  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#/, "");
      const targetElement = document.getElementById(cleanHash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] selection:bg-[#fc8100] selection:text-black w-full max-w-full overflow-x-hidden">
      <SEO
        title="About MG ESPORTS | Organization History & Pro Athletes Roster"
        description="Explore the complete world of MG ESPORTS: Our competitive manifesto, the national champion athletes roster, and the operational leadership collective."
        canonicalPath="/about"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "About", item: "/about" },
        ]}
        structuredData={buildOrganizationSchema()}
      />

      <PageHero
        badge="ORGANIZATION PROFILE & DIRECTORY"
        title="ABOUT"
        titleHighlight="MG ESPORTS"
        subtitle="The competitive manifesto, national champion athlete roster, and the operational collective powering India's elite clan."
      />

      {/* 1. Manifesto & Organization Story Section */}
      <div id="manifesto" className="scroll-mt-32 sm:scroll-mt-36">
        <AboutSection showHeader={false} defaultTab="manifesto" />
      </div>

      {/* 2. Pro Athletes Section */}
      <div id="players" className="scroll-mt-32 sm:scroll-mt-36">
        <PlayersSection showHeader={true} />
      </div>

      {/* 3. The Collective & Leadership Team Section */}
      <div id="teams" className="scroll-mt-32 sm:scroll-mt-36">
        <TheCollectiveSection showHeader={true} />
      </div>

      {/* 4. Championship Records & Statistics */}
      <div id="stats" className="scroll-mt-32 sm:scroll-mt-36 border-t border-white/5">
        <StatsSection />
      </div>
    </div>
  );
};
