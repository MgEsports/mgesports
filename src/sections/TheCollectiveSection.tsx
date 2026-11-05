import { useState } from "react";
import { collectiveMembers } from "../data/teams";
import { SectionHeading } from "../components/common/SectionHeading";

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
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
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

// Object position map to prioritize faces and avoid clipping heads
const memberImagePositions: Record<string, string> = {
  "dinesh-s": "center 20%",
  "jeremiah-paul": "center 15%",
  "karthik-r": "center 15%",
  founder: "center 20%",
  "demo-community-manager": "center 10%",
  CEO: "center 10%",
  editor: "center 15%",
};

interface TheCollectiveSectionProps {
  showHeader?: boolean;
  filterDefault?: string;
}

export const TheCollectiveSection = ({
  showHeader = true,
  filterDefault = "all",
}: TheCollectiveSectionProps) => {
  const [memberFilter, setMemberFilter] = useState<string>(filterDefault);

  // Filter collective directory members
  const filteredMembers = collectiveMembers.filter((member) => {
    if (memberFilter === "all") return true;
    return member.divisions.some((divName) =>
      divName.toLowerCase().includes(memberFilter.toLowerCase())
    );
  });

  return (
    <section
      id="teams"
      className={`relative ${
        showHeader ? "py-24" : "py-12 sm:py-16"
      } px-4 sm:px-6 lg:px-8 bg-[#070709] border-t border-white/5 overflow-hidden w-full max-w-full`}
    >
      {/* Background Ambience */}
      <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFBE32]/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {showHeader && (
          <SectionHeading
            badge="LEADERSHIP & OPERATIONS"
            title="THE COLLECTIVE TEAM"
            subtitle="The dedicated individuals steering engineering, platform architecture, tournament operations, and community growth."
          />
        )}

        {/* Directory Controls & Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FFBE32] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-gray-400">
              OPERATIONAL VANGUARD ({filteredMembers.length} MEMBERS)
            </span>
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
                type="button"
                onClick={() => setMemberFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  memberFilter === filter.id
                    ? "bg-[#FFBE32] text-black font-bold shadow-[0_0_15px_rgba(255,190,50,0.35)]"
                    : "bg-[#111115] text-gray-400 hover:text-white border border-white/10 hover:border-[#FFBE32]/40"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Matrix Grid: 2 Columns on Mobile, 2 on Tablet, 4 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-6">
          {filteredMembers.map((member) => {
            const objectPosition = memberImagePositions[member.id] || "center 20%";

            return (
              <div
                key={member.id}
                className="group relative rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#141418] via-[#0C0C0E] to-[#070709] border border-white/10 hover:border-[#FFBE32]/60 p-2.5 xs:p-3 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_45px_rgba(255,190,50,0.2)] transition-all duration-300 flex flex-col justify-between overflow-hidden min-w-0"
              >
                {/* Top Chamfer Cut Gold Strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFBE32] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Dedicated Member Portrait Container */}
                  <div className="relative aspect-[4/5] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-b from-[#181820] to-[#0A0A0C] border border-white/10 mb-2 sm:mb-4 group-hover:border-[#FFBE32]/40 transition-colors">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={`${member.name} - ${member.primaryRole}`}
                        loading="eager"
                        decoding="async"
                        style={{ objectPosition }}
                        onError={(e) => {
                          // Try alternative extension or hide image to show initials
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : null}

                    {/* Monogram Initials Fallback */}
                    <div
                      style={{ display: member.avatar ? "none" : "flex" }}
                      className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-[#16161B] via-[#0D0D10] to-[#08080A]"
                    >
                      <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center font-display font-black text-sm xs:text-base sm:text-xl text-white/90 group-hover:border-[#FFBE32]/60 group-hover:text-[#FFBE32] transition-colors">
                        {member.initials || "LZ"}
                      </div>
                      {member.handle && (
                        <span className="font-mono text-[9px] xs:text-[10px] text-gray-500 mt-1.5 tracking-widest uppercase truncate max-w-full px-1">
                          //{member.handle}
                        </span>
                      )}
                    </div>

                    {/* Subtle Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Bottom Floating Tag in Image */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 xs:bottom-2 xs:left-2 xs:right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                      <span className="px-1.5 xs:px-2 py-0.5 rounded bg-black/80 border border-white/10 text-gray-300 truncate max-w-full">
                        //{member.handle}
                      </span>
                    </div>
                  </div>

                  {/* Profile Header & Social Actions */}
                  <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[9px] xs:text-[10px] font-mono uppercase tracking-wider text-[#FFBE32] truncate">
                      {member.divisions[0] || "CORE"}
                    </span>

                    {/* Social Connect Badges */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {member.linkedin && (
                        <a
                          href={formatLinkedInUrl(member.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-[#0A66C2]/20 hover:bg-[#0A66C2]/40 border border-[#0A66C2]/40 hover:border-[#0A66C2] text-[#70B5F9] hover:text-white transition-all text-[9px] xs:text-[10px] font-mono group/linkedin"
                          title={`Connect with ${member.name} on LinkedIn`}
                        >
                          <LinkedInIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#0A66C2] group-hover/linkedin:text-[#70B5F9]" />
                          <span className="font-semibold hidden xs:inline">Connect</span>
                        </a>
                      )}

                      {member.instagram && (
                        <a
                          href={formatInstagramUrl(member.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1 xs:p-1.5 rounded-full bg-white/5 hover:bg-gradient-to-tr hover:from-[#E1306C]/30 hover:to-[#F56040]/30 border border-white/10 hover:border-[#E1306C]/60 text-gray-400 hover:text-white transition-all"
                          title={`Follow ${member.name} on Instagram`}
                        >
                          <InstagramIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#E1306C]" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Member Name - Retains original alignment, typography, and styling */}
                  <h4 className="font-heading text-xs xs:text-sm sm:text-lg font-bold text-white group-hover:text-[#FFBE32] transition-colors leading-tight mb-0.5 sm:mb-1 truncate">
                    {member.name || (member.handle ? member.handle.replace(/^[//_]+/, "") : "Member")}
                  </h4>

                  {/* Role - Retains original alignment and styling */}
                  <p className="text-[10px] xs:text-[11px] sm:text-xs text-gray-300 font-medium leading-snug mb-1.5 sm:mb-2 line-clamp-2">
                    {member.primaryRole}
                  </p>

                  {/* Focus Description */}
                  <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-400 font-body leading-relaxed pt-1.5 sm:pt-2 border-t border-white/5 line-clamp-2 sm:line-clamp-3">
                    {member.focus}
                  </p>
                </div>

                {/* Division Chips Footer */}
                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/5 flex flex-wrap gap-1">
                  {member.divisions.map((div, i) => (
                    <span
                      key={i}
                      className="px-1.5 xs:px-2 py-0.5 rounded text-[8px] xs:text-[9px] font-mono text-gray-400 bg-white/5 border border-white/5"
                    >
                      {div}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
