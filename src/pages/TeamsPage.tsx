import { useState, useEffect } from "react";
import { collectiveMembers } from "../data/teams";
import teamPhoto from "../assets/about-team.webp";
import { SEO } from "../components/common/SEO";
import {
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// Social SVG Icon for Instagram
const InstagramIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Social SVG Icon for LinkedIn
const LinkedInIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
  </svg>
);

const formatInstagramUrl = (handleOrUrl?: string) => {
  if (!handleOrUrl || !handleOrUrl.trim()) return "https://www.instagram.com/lord.esportz";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://www.instagram.com/${trimmed.replace(/^@/, "")}`;
};

const formatLinkedInUrl = (handleOrUrl?: string) => {
  if (!handleOrUrl || !handleOrUrl.trim()) return "https://www.linkedin.com";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://www.linkedin.com/in/${trimmed.replace(/^@/, "")}`;
};

export const TeamsPage = () => {
  const [memberFilter, setMemberFilter] = useState<string>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter collective directory members
  const filteredMembers = collectiveMembers.filter((member) => {
    if (memberFilter === "all") return true;
    return member.divisions.some((divName) =>
      divName.toLowerCase().includes(memberFilter.toLowerCase())
    );
  });

  // Object position map to prioritize faces and avoid clipping heads
  const memberImagePositions: Record<string, string> = {
    "dinesh-s": "center 20%",
    "jeremiah-paul": "center 15%",
    "karthik-r": "center 15%",
    "founder": "center 20%",
    "demo-community-manager": "center 10%",
    "CEO": "center 10%",
    "editor": "center 15%",
  };

  // Reusable Member Avatar / Portrait Component
  const MemberPortrait = ({
    member,
    className = "",
    aspectRatio = "aspect-[4/5]",
    large = false,
  }: {
    member: { id: string; name: string; initials: string; avatar?: string; handle?: string; primaryRole?: string };
    className?: string;
    aspectRatio?: string;
    large?: boolean;
  }) => {
    const [imgSrc, setImgSrc] = useState<string | undefined>(member.avatar);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImgSrc(member.avatar);
      setHasError(false);
    }, [member.avatar]);

    const handleImgError = () => {
      if (imgSrc) {
        if (imgSrc.endsWith(".jpg")) {
          setImgSrc(imgSrc.replace(/\.jpg$/, ".png"));
        } else if (imgSrc.endsWith(".png")) {
          setImgSrc(imgSrc.replace(/\.png$/, ".webp"));
        } else if (imgSrc.endsWith(".webp")) {
          setImgSrc(imgSrc.replace(/\.webp$/, ".jpeg"));
        } else {
          setHasError(true);
        }
      } else {
        setHasError(true);
      }
    };

    const objectPosition = memberImagePositions[member.id] || "center 20%";

    return (
      <div
        className={`relative overflow-hidden rounded-md bg-[#0A0A0A] border border-white/[0.08] ${aspectRatio} ${className}`}
      >
        {!hasError && imgSrc ? (
          <img
            src={imgSrc}
            alt={`${member.name} (${member.primaryRole || member.handle || "Team Member"}) - LORD ESPORTZ`}
            onError={handleImgError}
            loading="lazy"
            decoding="async"
            style={{ objectPosition }}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-[#111111] via-[#0B0B0B] to-[#070707] relative group">
            {/* Minimalist Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Initials Monogram */}
            <div
              className={`rounded-full border border-white/[0.08] flex items-center justify-center font-display font-black text-white/90 group-hover:border-[#FFBE32]/60 group-hover:text-[#FFBE32] transition-colors ${
                large ? "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl" : "w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm"
              }`}
            >
              {member.initials}
            </div>

            {member.handle && (
              <span className="font-mono text-[9px] sm:text-[10px] text-[#777777] mt-2 sm:mt-3 tracking-widest uppercase">
                //{member.handle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] selection:bg-[#FFBE32] selection:text-black font-sans">
      <SEO
        title="LORD ESPORTZ Team | Founders, Leadership & Operations Collective"
        description="Meet the core team and leadership powering LORD ESPORTZ across technology, tournament operations, management, creative media, and community."
        canonicalPath="/teams"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Team", item: "/teams" },
        ]}
      />

      {/* ========================================================================= */}
      {/* 1. INTRODUCTION / HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-20 sm:pt-36 md:pt-40 pb-10 sm:pb-20 md:pb-24 border-b border-white/[0.07] overflow-hidden">
        {/* Subtle Ambient Background Warmth */}
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#FFBE32]/[0.02] blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-3 mb-3 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFBE32]" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#A0A0A0]">
              LORD ESPORTZ / THE COLLECTIVE
            </span>
          </div>

          {/* Asymmetric Hero Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left: Dominant Editorial Typography */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white leading-[0.95]">
                THE PEOPLE
                <br />
                <span className="text-[#7A7A7A]">BEHIND THE</span>{" "}
                <span className="text-white">PLAY.</span>
              </h1>

              <div className="w-12 h-px bg-[#FFBE32]/60 my-6" />

              <p className="text-base sm:text-lg text-[#A0A0A0] font-body leading-relaxed max-w-xl">
                Real people. Distinct roles. One competitive organization. LORD ESPORTZ is powered by individuals working across technology, tournament operations, management, creative media, player talent, and community.
              </p>

              {/* Minimal Editorial Subtext */}
              <div className="pt-2 flex items-center gap-6 text-xs font-mono text-[#777777]">
                <span>// 8 CORE OPERATORS</span>
                <span>•</span>
                <span>// 6 DISCIPLINES</span>
                <span>•</span>
                <span>// PAN-INDIA CIRCUIT</span>
              </div>
            </div>

            {/* Right: Restrained Editorial Visual Framing */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative group overflow-hidden rounded-md border border-white/[0.08] bg-[#0A0A0A]">
                <img
                  src={teamPhoto}
                  alt="LORD ESPORTZ Collective"
                  className="w-full h-52 xs:h-60 sm:h-80 object-cover hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent pointer-events-none" />

                {/* Caption */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex items-end justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-[#FFBE32] uppercase tracking-widest block mb-0.5">
                      HQ DIVISION ARCHIVE
                    </span>
                    <span className="text-white font-heading font-semibold tracking-wide">
                      The Operational Vanguard
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#888888]">
                    EST. 2024
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE COLLECTIVE ROSTER (ALL MEMBERS WITH IMAGE ARCHITECTURE) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-24 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          {/* Section Header with Filter Chips */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FFBE32] block">
                COMPLETE DIRECTORY
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                The Collective Roster
              </h2>
              <p className="text-xs sm:text-sm text-[#888888] font-body max-w-lg">
                The dedicated individuals steering engineering, clan leadership, and community.
              </p>
            </div>

            {/* Discipline Filter Chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-mono">
              {[
                { id: "all", label: "All" },
                { id: "developers", label: "Developers" },
                { id: "leadership", label: "Leadership" },
                { id: "community", label: "Community" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setMemberFilter(filter.id)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs font-mono transition-colors cursor-pointer ${
                    memberFilter === filter.id
                      ? "bg-white text-black font-semibold"
                      : "bg-[#0F0F0F] text-[#888888] hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Members Matrix: 2 Columns on Mobile, 2 on Tablet, 4 on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="group rounded-md bg-[#090909] border border-white/[0.06] hover:border-[#FFBE32]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Dedicated Member Portrait Area */}
                  <MemberPortrait
                    member={member}
                    aspectRatio="aspect-[4/5]"
                    className="border-b border-white/[0.06] rounded-b-none"
                  />

                  {/* Profile Details */}
                  <div className="p-2.5 xs:p-3 sm:p-5 space-y-1.5 sm:space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                      <span className="font-mono text-[10px] sm:text-[11px] text-[#777777] group-hover:text-[#FFBE32] transition-colors shrink-0">
                        //{member.handle}
                      </span>

                      {/* Social Connect Actions */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* LinkedIn Connect (For Developers / Professional Profiles) */}
                        {member.linkedin && (
                          <a
                            href={formatLinkedInUrl(member.linkedin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#0A66C2]/15 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/35 hover:border-[#0A66C2]/80 text-[#70B5F9] hover:text-white transition-all duration-200 text-[9px] sm:text-[10px] font-mono group/linkedin shadow-sm"
                            title={`Connect with ${member.name || member.handle || "Developer"} on LinkedIn`}
                          >
                            <LinkedInIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#0A66C2] group-hover/linkedin:text-[#70B5F9] group-hover/linkedin:scale-110 transition-transform shrink-0" />
                            <span className="font-semibold tracking-wide">Connect</span>
                          </a>
                        )}

                        {/* Instagram Link */}
                        {member.instagram && (
                          <a
                            href={formatInstagramUrl(member.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-gradient-to-r hover:from-[#E1306C]/25 hover:via-[#FD1D1D]/20 hover:to-[#F56040]/25 border border-white/[0.08] hover:border-[#E1306C]/60 text-gray-300 hover:text-white transition-all duration-200 text-[9px] sm:text-[10px] font-mono group/insta shadow-sm ${
                              member.linkedin ? "p-1 sm:p-1.5" : "gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 py-0.5 sm:py-1"
                            }`}
                            title={`Follow ${member.name || member.handle || "Member"} on Instagram`}
                          >
                            <InstagramIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#E1306C] group-hover/insta:scale-110 transition-transform shrink-0" />
                            {!member.linkedin && <span className="font-semibold tracking-wide">Connect</span>}
                          </a>
                        )}
                      </div>
                    </div>

                    <h4 className="font-heading text-sm xs:text-base sm:text-lg font-bold text-white group-hover:text-[#FFBE32] transition-colors leading-snug break-words">
                      {member.name || (member.handle ? member.handle.replace(/^[//_]+/, "") : "Member")}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-[#A0A0A0] font-body leading-snug break-words">
                      {member.primaryRole}
                    </p>

                    <p className="text-[10px] xs:text-[11px] sm:text-xs text-[#666666] font-body leading-relaxed pt-1.5 sm:pt-2 border-t border-white/[0.04] break-words">
                      {member.focus}
                    </p>
                  </div>
                </div>

                {/* Division Badges */}
                <div className="p-2.5 xs:p-3 sm:p-4 pt-0 flex flex-wrap gap-1 sm:gap-1.5">
                  {member.divisions.map((div, i) => (
                    <span
                      key={i}
                      className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono text-[#888888] bg-[#121212] border border-white/[0.04]"
                    >
                      {div}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CLOSING SECTION: BUILT TO COMPETE. DESIGNED TO LAST. */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#FFBE32]" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#FFBE32]">
              THE LORD PHILOSOPHY
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
            Built to compete.
            <br />
            <span className="text-[#777777]">Designed to last.</span>
          </h2>

          <p className="text-sm sm:text-base text-[#999999] font-body max-w-xl mx-auto leading-relaxed">
            We are always interested in collaborating with dedicated web engineers, tournament arbiters, motion graphics artists, and community leaders who believe in the future of competitive gaming in India.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://whatsapp.com/channel/0029Vb8sSc66hENsTW35hd11"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-xs font-heading font-semibold uppercase tracking-wider bg-white text-black hover:bg-[#FFBE32] transition-colors cursor-pointer"
            >
              <span>Connect on WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://www.instagram.com/lord.esportz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-xs font-heading font-semibold uppercase tracking-wider bg-gradient-to-r from-[#E1306C]/15 via-[#FD1D1D]/10 to-[#F56040]/15 hover:from-[#E1306C] hover:to-[#F56040] text-[#FF5B84] hover:text-white border border-[#E1306C]/40 hover:border-transparent transition-all cursor-pointer shadow-[0_0_20px_rgba(225,48,108,0.15)] group"
            >
              <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C] group-hover:text-white transition-colors" />
              <span>Connect on Instagram</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="/partner-with-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-xs font-heading font-semibold uppercase tracking-wider bg-[#111111] text-white border border-white/[0.08] hover:border-white/[0.2] transition-colors cursor-pointer"
            >
              <span>Partner Inquiries</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
