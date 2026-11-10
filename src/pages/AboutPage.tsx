import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PageHero } from "../components/common/PageHero";
import { AboutSection } from "../sections/AboutSection";
import { PlayersSection } from "../sections/PlayersSection";
import { TheCollectiveSection } from "../sections/TheCollectiveSection";
import { StatsSection } from "../sections/StatsSection";
import { SEO } from "../components/common/SEO";
import { buildOrganizationSchema } from "../config/seo";
import { Shield, Users, Trophy, Sparkles } from "lucide-react";

export const AboutPage = () => {
  const location = useLocation();
  const [activeAnchor, setActiveAnchor] = useState<string>("manifesto");

  // Handle hash scrolling when navigating to #players, #teams, or #manifesto
  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#/, "");
      setActiveAnchor(cleanHash);
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

  // Track active section on scroll so active tab style is always synchronized
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["manifesto", "players", "teams", "stats"];
      const scrollY = window.scrollY + 200;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section && section.offsetTop <= scrollY) {
          setActiveAnchor(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAnchor = (anchorId: string) => {
    setActiveAnchor(anchorId);
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${anchorId}`);
    }
  };

  const navAnchors = [
    { id: "manifesto", label: "Manifesto & Story", icon: Sparkles },
    { id: "players", label: "Pro Athletes Roster", icon: Trophy },
    { id: "teams", label: "The Collective Team", icon: Users },
    { id: "stats", label: "Championship Records", icon: Shield },
  ];

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

      {/* Floating Sub-Navigation Anchor Bar - Solid Opaque, Perfect Sticky Alignment */}
      <div className="sticky top-16 sm:top-[68px] z-40 bg-[#070709] border-b border-white/10 py-2.5 sm:py-3 shadow-[0_10px_30px_rgba(0,0,0,0.9)] w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Mobile: Clean 2x2 Grid with balanced widths; Tablet/Desktop: Centered Row */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 w-full max-w-md sm:max-w-none mx-auto">
            {navAnchors.map((anchor) => {
              const Icon = anchor.icon;
              const isActive = activeAnchor === anchor.id;
              return (
                <button
                  key={anchor.id}
                  type="button"
                  onClick={() => scrollToAnchor(anchor.id)}
                  className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 xs:px-3 sm:px-4 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[10px] xs:text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer min-w-0 w-full sm:w-auto ${
                    isActive
                      ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.35)] border border-[#fc8100]"
                      : "bg-[#101014] text-gray-300 hover:text-white border border-white/10 hover:border-[#fc8100]/40"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-black" : "text-[#fc8100]"}`} />
                  <span className="truncate">{anchor.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
