import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Handshake,
  Search,
  CheckCircle2,
  Globe
} from "lucide-react";
import { partnersApi, type PartnerItem } from "../api/partners";
import { SEO } from "../components/common/SEO";
import { getKnownPartnerLogo } from "../sections/PartnersSection";

// Default local logos
import logoInfinix from "../assets/partner-infinix.png";
import logoFreeFireMax from "../assets/partner-freefire.png";
import logoFusionCrystals from "../assets/partner-fusion.png";
import logoEsportsWorldCup from "../assets/partner-ewc.png";
import logoEsportsPro from "../assets/partner-esportspro.png";
import logoEspotzLive from "../assets/partner-espotz.png";

interface PartnerRowData {
  id: string;
  name: string;
  tier: string;
  category: string;
  logo: string;
  website: string;
  description: string;
  highlights: string[];
  since: string;
}

const curatedPartners: PartnerRowData[] = [
  {
    id: "infinix",
    name: "INFINIX",
    tier: "MAIN SPONSOR",
    category: "Official Gaming Smartphone",
    logo: logoInfinix,
    website: "https://infinixmobility.com",
    description:
      "Supplying MG ESPORTS competitive mobile rosters with high-performance Infinix GT series devices equipped with 120 FPS high refresh displays, bypass charging, and vapor chamber cooling for prolonged tournament supremacy.",
    highlights: [
      "Official Tournament Device",
      "120 FPS Refresh Rate Optimization",
      "Campus & LAN Championship Tours",
      "Athlete Performance Hardware Lab"
    ],
    since: "2024"
  },
  {
    id: "clash-of-clans",
    name: "CLASH OF CLANS",
    tier: "OFFICIAL CHAMPIONSHIP TITLE",
    category: "World Championship Mobile Title",
    logo: logoFreeFireMax,
    website: "https://supercell.com/en/games/clashofclans/",
    description:
      "Core competitive mobile esports championship ecosystem. Golden Ticket qualification stage, official World Championship tournament circuit, and global finals stage.",
    highlights: [
      "World Championship Golden Ticket",
      "Top 8 Worldwide Ranking",
      "Global Championship Broadcasts",
      "Supercell Competitive Circuit"
    ],
    since: "2024"
  },
  {
    id: "fusion-crystals",
    name: "FUSION CRYSTALS",
    tier: "OFFICIAL PARTNER",
    category: "Energy & Performance",
    logo: logoFusionCrystals,
    website: "https://fusioncrystals.gg",
    description:
      "Fueling the lightning reflex speeds, cognitive focus, and endurance of MG athletes during grueling multi-round scrims and tournament finals with zero-sugar gaming electrolyte formulas.",
    highlights: [
      "Athlete Hydration & Focus Spec",
      "Exclusive Clan Flavors",
      "Broadcast Product Placement",
      "Community Code: MG"
    ],
    since: "2025"
  },
  {
    id: "esports-world-cup",
    name: "ESPORTS WORLD CUP",
    tier: "GLOBAL ALLIANCE",
    category: "Global Championship Circuit",
    logo: logoEsportsWorldCup,
    website: "https://esportsworldcup.com",
    description:
      "International esports tournament pathway enabling South Indian talent to compete on the global stage through open qualifier roadmaps, club partner incentives, and bootcamp support.",
    highlights: [
      "International Qualifier Pathway",
      "Global Club Program Access",
      "Cross-Regional Showmatches",
      "Riyadh Grand Stage Roadmap"
    ],
    since: "2024"
  },
  {
    id: "esports-pro",
    name: "ESPORTS PRO",
    tier: "MAIN SPONSOR",
    category: "Tournament Platform & Infrastructure",
    logo: logoEsportsPro,
    website: "https://esportspro.gg",
    description:
      "Automating bracket progressions, anti-cheat validation, player ID authentication, and real-time leaderboard statistics for thousands of teams competing across MG open community cups.",
    highlights: [
      "Automated Scoring & Bracket Engine",
      "Real-Time K/D Tracking & Stats",
      "Automated Anti-Cheat Validation",
      "Direct Cash Prize Payout Engine"
    ],
    since: "2023"
  },
  {
    id: "espotz-live",
    name: "ESPOTZ LIVE",
    tier: "BROADCAST PARTNER",
    category: "Livestream Production & Media",
    logo: logoEspotzLive,
    website: "https://espotz.live",
    description:
      "Delivering studio-grade 4K 60FPS multi-camera tournament broadcasts, dynamic replay transitions, esports casting commentary, and multi-platform live syndication across YouTube and Discord.",
    highlights: [
      "4K 60FPS Multi-Cam Broadcast",
      "Pro Casting & Observer Desks",
      "Live Match Analytics Graphics",
      "Multi-Stream YouTube & Discord"
    ],
    since: "2024"
  }
];

export const BrandPartnersPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbPartners, setDbPartners] = useState<PartnerItem[]>([]);

  useEffect(() => {
    partnersApi
      .getAll()
      .then((res) => {
        if (Array.isArray(res)) {
          setDbPartners(res.filter((p) => p.isActive !== false));
        } else {
          setDbPartners([]);
        }
      })
      .catch(() => {
        setDbPartners([]);
      });
  }, []);

  // Display ONLY active partners returned from the database
  const mergedPartners: PartnerRowData[] = dbPartners
    .filter((p) => p.isActive !== false)
    .map((p) => {
      const hasExternalLogo =
        p.logoImage &&
        (p.logoImage.startsWith("http") || p.logoImage.startsWith("data:"));
      const knownFallback =
        getKnownPartnerLogo(p.name) || getKnownPartnerLogo(p.id);
      const resolvedLogo =
        (hasExternalLogo && p.logoImage
          ? p.logoImage
          : knownFallback || p.logoImage || p.cardImage || logoInfinix) ||
        logoInfinix;

      const curatedMatch = curatedPartners.find(
        (cp) => cp.id === p.id || cp.name.toLowerCase() === p.name.toLowerCase()
      );

      return {
        id: p.id,
        name: p.name,
        tier: p.tier || curatedMatch?.tier || "OFFICIAL PARTNER",
        category: p.category || curatedMatch?.category || "Esports Partner",
        logo: resolvedLogo,
        website: p.websiteUrl || curatedMatch?.website || "https://mgesports.in",
        description:
          curatedMatch?.description ||
          `Official brand partner collaborating with MG ESPORTS to advance competitive gaming excellence and fan engagement across India.`,
        highlights: curatedMatch?.highlights || [
          "Official Partner Collaboration",
          "Brand Integration in Tournaments",
          "Direct Community Reach",
          "Active 2026 Season",
        ],
        since: curatedMatch?.since || "2026",
      };
    });

  const categories = [
    "ALL",
    "MAIN SPONSOR",
    "OFFICIAL TITLE",
    "GLOBAL ALLIANCE",
    "BROADCAST PARTNER",
    "OFFICIAL PARTNER"
  ];

  const filteredPartners = mergedPartners.filter((partner) => {
    const matchesCategory =
      selectedCategory === "ALL" || partner.tier === selectedCategory;
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "MAIN SPONSOR":
        return "bg-[#fc8100]/15 text-[#fc8100] border-[#fc8100]/40";
      case "OFFICIAL TITLE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
      case "GLOBAL ALLIANCE":
        return "bg-purple-500/15 text-purple-300 border-purple-500/40";
      case "BROADCAST PARTNER":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/40";
      default:
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 w-full max-w-full overflow-x-hidden relative">
      <SEO
        title="Official Brand Partners &amp; Sponsors | MG ESPORTS"
        description="Explore official brands, industry leaders, gaming platforms, and corporate sponsors partnering with MG ESPORTS."
        canonicalPath="/partners"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Brand Partners", item: "/partners" },
        ]}
      />

      {/* Background Ambience */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-[100vw] h-[450px] bg-radial from-[#fc8100]/8 via-transparent to-transparent blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fc8100]/10 border border-[#fc8100]/30 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#fc8100] animate-ping" />
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#fc8100]">
                SPONSORSHIP &amp; INTEGRATIONS
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-wide text-white leading-[1.1]">
              Our Brand <span className="text-gold-gradient">Partners</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-gray-400 font-body leading-relaxed max-w-2xl mx-auto">
              Empowering the future of Indian competitive esports through premier technological, hardware, and broadcast collaborations.
            </p>

            {/* <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/partner-with-us"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(252, 129, 0,0.3)]"
              >
                <Handshake className="h-4 w-4" />
                <span>Become a Partner • View Pricing Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div> */}
          </motion.div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                    : "bg-[#0f0f14] text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand partners..."
              className="w-full rounded-xl bg-[#0f0f14] border border-white/10 pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#fc8100] focus:outline-none font-body"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW-WISE PARTNERS LIST (ONE BY ONE) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {filteredPartners.map((partner, index) => {
            const tierStyle = getTierColor(partner.tier);

            return (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -3 }}
                className="group relative rounded-2xl bg-[#0C0C11] border border-white/10 hover:border-[#fc8100]/60 p-6 sm:p-8 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_15px_40px_rgba(252, 129, 0,0.12)] overflow-hidden"
              >
                {/* Subtle Ambient Gold Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#fc8100]/5 via-transparent to-[#fc8100]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
                  {/* Left Column: Illuminated Brand Logo Box */}
                  <div className="shrink-0 flex items-center gap-5">
                    <div className="w-32 sm:w-40 h-24 sm:h-28 rounded-xl bg-black/80 border border-white/10 group-hover:border-[#fc8100]/40 flex items-center justify-center p-4 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          const fb = getKnownPartnerLogo(partner.name) || logoInfinix;
                          if (e.currentTarget.src !== fb) {
                            e.currentTarget.src = fb;
                          }
                        }}
                        className="max-h-16 max-w-[90%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Center Column: Partner Metadata & Collaboration Narrative */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider border ${tierStyle}`}
                      >
                        {partner.tier}
                      </span>
                      <span className="text-xs font-mono text-gray-500 uppercase">
                        Partner Since {partner.since}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>VERIFIED OFFICIAL ALLIANCE</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white group-hover:text-[#fc8100] transition-colors">
                        {partner.name}
                      </h3>
                      <p className="text-xs font-heading font-semibold uppercase text-gray-400 tracking-wider mt-0.5">
                        {partner.category}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-300 font-body leading-relaxed max-w-3xl">
                      {partner.description}
                    </p>

                    {/* Scope & Deliverables Badges */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {partner.highlights.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-body text-gray-300 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#fc8100]" />
                          <span>{h}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: CTA & Official Link */}
                  <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-[#fc8100] text-gray-200 hover:text-black font-heading text-xs font-bold uppercase tracking-wider border border-white/15 hover:border-[#fc8100] transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.5)] group/btn"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Visit Platform</span>
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </a>

                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">
                      Active 2026 Season
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredPartners.length === 0 && (
            <div className="py-20 text-center rounded-2xl bg-[#0C0C11] border border-white/5">
              <Handshake className="h-12 w-12 text-[#fc8100]/40 mx-auto mb-4" />
              <h3 className="font-display text-xl uppercase tracking-wider text-white">
                No Partners Found
              </h3>
              <p className="text-gray-400 font-body text-sm mt-2 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "ALL"
                  ? "No partners match your current filter criteria."
                  : "New official brand alliances and tournament partners will be announced soon."}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Banner: Become a Partner CTA */}
        {/* <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#111116] via-[#161622] to-[#111116] border border-[#fc8100]/30 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fc8100]/10 border border-[#fc8100]/30 text-[11px] font-heading font-bold uppercase tracking-widest text-[#fc8100]">
              <Sparkles className="h-3 w-3" />
              <span>OPPORTUNITY FOR BRANDS &amp; CREATORS</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
              Want to Showcase Your Brand Across Indian Esports?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-body max-w-xl">
              Choose from Bronze, Silver, Gold, Diamond, or Lifetime partnership tiers with guaranteed tournament slots, livestream brand overlays, and direct community outreach.
            </p>
          </div>

          <Link
            to="/partner-with-us"
            className="shrink-0 inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(252, 129, 0,0.35)]"
          >
            <Handshake className="h-4 w-4" />
            <span>View Subscription Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div> */}
      </div>
    </div>
  );
};
