import { PageHero } from "../components/common/PageHero";
import { CommunitySection } from "../sections/CommunitySection";
import { SEO } from "../components/common/SEO";

export const CommunityPage = () => {
  return (
    <div className="min-h-screen bg-[#070709] w-full max-w-full overflow-x-hidden">
      <SEO
        title="MG ESPORTS Community | Discord &amp; Official Hub"
        description="Join the official MG ESPORTS community. Back the team, celebrate every win and be part of the MG ESPORTS family."
        canonicalPath="/community"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Community", item: "/community" },
        ]}
      />

      <PageHero
        badge="OFFICIAL COMMUNITY"
        title="JOIN THE"
        titleHighlight="COMMUNITY"
        subtitle="Back the team, celebrate every win and be part of the MG ESPORTS family across our official Discord and channels."
      />

      <CommunitySection showHeader={false} />
    </div>
  );
};
