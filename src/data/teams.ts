import hariImg from "../assets/members/owner-harisree mg (1).png";
import vickyImg from "../assets/members/co founder-vicky.png";
import ronyImg from "../assets/members/manager-rony.png";
import mjImg from "../assets/members/community manager-mj.png";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  ign?: string;
  specialty: string;
}

export interface TeamLead {
  name: string;
  role: string;
  ign: string;
  focus: string;
  avatar?: string;
  statement?: string;
}

export interface TeamDivision {
  id: string;
  number: string;
  name: string;
  shortName: string;
  discipline: string;
  description: string;
  lead: TeamLead;
  responsibilities: string[];
  members: TeamMember[];
}

export interface CollectiveMember {
  id: string;
  name: string;
  handle: string;
  primaryRole: string;
  divisions: string[];
  focus: string;
  avatar?: string;
  initials: string;
  instagram?: string;
  linkedin?: string;
}

export const teamDivisions: TeamDivision[] = [
  {
    id: "tech",
    number: "01",
    name: "Development & Technology",
    shortName: "Technology",
    discipline: "SYSTEMS ARCHITECTURE & PLATFORM ENGINEERING",
    description:
      "Engineering high-concurrency web portals, automated tournament scoring pipelines, encrypted authentication, and athlete passport infrastructure.",
    lead: {
      name: "Jeremiah Paul",
      role: "Lead Systems Architect",
      ign: "LZ_ARCHITECT",
      focus: "Cloud scale, distributed infrastructure & platform security",
      statement: "Reliable systems build championship confidence. Fast, secure, and always operational.",
    },
    responsibilities: [
      "Full-stack web application development & edge cloud performance",
      "Real-time tournament bracket scoring and standings engines",
      "Athlete verification, secure authentication, and session handling",
      "Database architecture, relational integrity, and API scalability",
    ],
    members: [
      {
        id: "mem-karthik",
        name: "Karthik R",
        role: "Senior Frontend Engineer",
        ign: "LZ_FRONTEND",
        specialty: "Interactive web aesthetics, responsive layouts & UX",
      },
      {
        id: "mem-dinesh",
        name: "Dinesh Kumar",
        role: "Backend & Systems Specialist",
        ign: "LZ_SYSTEMS",
        specialty: "Database transactions, data pipelines & API security",
      },
      {
        id: "mem-harish",
        name: "Harish V.",
        role: "Platform QA & Security Auditor",
        ign: "LZ_SENTINEL",
        specialty: "Stress testing, verification audits & bug mitigation",
      },
    ],
  },
  {
    id: "tournaments",
    number: "02",
    name: "Tournament Operations",
    shortName: "Tournament Ops",
    discipline: "MATCH DISCIPLINE & LEAGUE GOVERNANCE",
    description:
      "Managing custom lobby security, match schedules, anti-cheat arbitrations, and live leaderboard calculations across competitive circuits.",
    lead: {
      name: "Silvest AJ",
      role: "Head of Tournament Operations",
      ign: "SILVEST",
      focus: "Rulebook enforcement, dispute resolution & lobby logistics",
      statement: "Integrity is the foundation of competitive gaming. Every point and every circle is audited.",
    },
    responsibilities: [
      "Custom lobby creation, slot verification, and player check-in",
      "Anti-cheat arbitrations and in-game POV screen-recording checks",
      "Live match scoring, placement multipliers, and tiebreaker rules",
      "Captain briefings, rulebook compliance, and bracket coordination",
    ],
    members: [
      {
        id: "mem-dinesh-tourn",
        name: "Dinesh Kumar",
        role: "Match Scrims & Bracket Coordinator",
        ign: "LZ_SYSTEMS",
        specialty: "Lobby bracket tracking & match result verification",
      },
      {
        id: "mem-harish-tourn",
        name: "Harish V.",
        role: "Custom Room Security & Verification",
        ign: "LZ_SENTINEL",
        specialty: "Player identity confirmation & fair play surveillance",
      },
    ],
  },
  {
    id: "admin",
    number: "03",
    name: "Administration & Management",
    shortName: "Administration",
    discipline: "ORGANIZATIONAL GOVERNANCE & STRATEGY",
    description:
      "Directing organizational strategy, financial transparency, merchandise logistics, partner compliance, and athlete contract agreements.",
    lead: {
      name: "Jeremiah Paul",
      role: "Executive Director & Clan Management",
      ign: "MG_JEREMIAH",
      focus: "Strategic vision, clan expansion & operational discipline",
      statement: "A championship organization requires quiet precision, clear governance, and dedicated people.",
    },
    responsibilities: [
      "Strategic franchise growth and regional competitive roadmap",
      "Financial accounting, prize pool escrow, and sponsor compliance",
      "Merchandise fulfillment coordination and quality management",
      "Clan policies, ethical guidelines, and legal athlete agreements",
    ],
    members: [
      {
        id: "mem-karthik-admin",
        name: "Karthik R",
        role: "Operations & Strategic Alliances",
        ign: "FALCON",
        specialty: "Partner onboarding & tournament scheduling coordination",
      },
      {
        id: "mem-dinesh-admin",
        name: "Dinesh Kumar",
        role: "Logistics & Resource Management",
        ign: "DINESH",
        specialty: "Operational workflows & administrative coordination",
      },
    ],
  },
  {
    id: "creative",
    number: "04",
    name: "Creative & Media Studio",
    shortName: "Creative Media",
    discipline: "VISUAL IDENTITY & BROADCAST PRODUCTION",
    description:
      "Creating tournament broadcast graphics, motion highlights, visual branding kits, match announcement reels, and athlete digital content.",
    lead: {
      name: "Tishbian Meshach S",
      role: "Creative Director & Visual Identity",
      ign: "TISHBIAN",
      focus: "Brand typography, graphic kits & broadcast aesthetics",
      statement: "Every moment of competitive glory deserves timeless, compelling visual storytelling.",
    },
    responsibilities: [
      "Broadcast streaming graphics, overlays, and transition packs",
      "Match highlight montages, motion design, and teaser edits",
      "Official team jersey artwork and brand asset kits",
      "Social media narrative visuals and tournament announcement art",
    ],
    members: [
      {
        id: "mem-deva",
        name: "Deva Dharshan",
        role: "Media Production & Motion Graphics",
        ign: "DEVA",
        specialty: "Video editing, motion lower-thirds & event promos",
      },
      {
        id: "mem-silvest",
        name: "Silvest AJ",
        role: "Broadcast Technical Operator",
        ign: "SILVEST",
        specialty: "OBS Studio stream mixing & multi-camera coordination",
      },
    ],
  },
  {
    id: "talent",
    number: "05",
    name: "Player Development & Talent",
    shortName: "Talent Scouting",
    discipline: "ATHLETE SCOUTING & COMPETITIVE CONDITIONING",
    description:
      "Identifying emerging competitive talent, coordinating daily practice scrims, analyzing tactical gameplay VODs, and conditioning tournament rosters.",
    lead: {
      name: "Karthik R",
      role: "Head of Player Performance & Scouting",
      ign: "FALCON",
      focus: "Rotational strategy, clutch performance & talent scouting",
      statement: "Mechanics open the round; team chemistry and circle anticipation win major championships.",
    },
    responsibilities: [
      "Grassroots scouting across community tournaments and scrims",
      "In-depth match VOD reviews and tactical drop-zone analysis",
      "Aim conditioning, crosshair placement, and reflex routines",
      "Roster synergy coordination and tournament mental composure",
    ],
    members: [
      {
        id: "mem-harish-talent",
        name: "Harish V.",
        role: "Tactical Gameplay Analyst",
        ign: "HARISH",
        specialty: "Zone rotation patterns & utility deployment review",
      },
      {
        id: "mem-deva-talent",
        name: "Deva Dharshan",
        role: "Player Media & Talent Relations",
        ign: "DEVA",
        specialty: "Athlete communications & media availability prep",
      },
    ],
  },
  {
    id: "community",
    number: "06",
    name: "Partnerships & Community",
    shortName: "Community Guild",
    discipline: "COMMUNITY ECOSYSTEMS & PARTNER ENGAGEMENT",
    description:
      "Fostering active clan discussion channels, coordinating community polls, hosting fan giveaways, and managing sponsor partner relationships.",
    lead: {
      name: "HariHaran R",
      role: "Head of Community & Partnerships",
      ign: "HARIHARAN",
      focus: "Community culture, fan safety & brand collaborations",
      statement: "A clan lives through the dedication of its community. We build lasting connections.",
    },
    responsibilities: [
      "Discord community server management and safety moderation",
      "Partner brand activations and collaborative gaming tournaments",
      "Official community MVP elections and interactive voting events",
      "Fan engagement initiatives, giveaways, and announcement channels",
    ],
    members: [
      {
        id: "mem-deva-comm",
        name: "Deva Dharshan",
        role: "Community Events & Engagement",
        ign: "DEVA",
        specialty: "Fan interaction, tournament queries & event hosting",
      },
      {
        id: "mem-tishbian-comm",
        name: "Tishbian Meshach S",
        role: "Brand Design & Partner Media",
        ign: "TISHBIAN",
        specialty: "Partner promotional art & fan club graphics",
      },
    ],
  },
];

export const collectiveMembers: CollectiveMember[] = [
  {
    id: "hari-founder",
    name: "Hari",
    handle: "FOUNDER",
    primaryRole: "Founder",
    divisions: ["Leadership"],
    focus: "Organizational strategy, franchise roadmap, partnerships & Clash of Clans division",
    initials: "HA",
    avatar: hariImg,
    instagram: "https://www.instagram.com/mg13e.sports",
  },
  {
    id: "vicky-ceo",
    name: "Vicky",
    handle: "CEO",
    primaryRole: "Chief Executive Officer",
    divisions: ["Leadership"],
    focus: "Executive leadership, brand positioning, operations & esports management",
    initials: "VK",
    avatar: vickyImg,
    instagram: "https://www.instagram.com/mg13e.sports",
  },
  {
    id: "rony-manager",
    name: "Rony",
    handle: "TEAM_MANAGER",
    primaryRole: "Team Manager",
    divisions: ["Leadership", "Operations"],
    focus: "Roster performance, tournament scheduling, logistics & athlete preparation",
    initials: "RN",
    avatar: ronyImg,
    instagram: "https://www.instagram.com/mg13e.sports",
  },
  {
    id: "mj-gfx",
    name: "MJ",
    handle: "CREATIVE_LEAD",
    primaryRole: "GFX Artist & Community Manager",
    divisions: ["Leadership", "Creative", "Community"],
    focus: "Visual identity, creative design, social storytelling & Discord community",
    initials: "MJ",
    avatar: mjImg,
    instagram: "https://www.instagram.com/mg13e.sports",
  },  
];

// Backwards-compatibility for tournament divisions showcase
export interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
  rank: string;
  points: string;
  winRate: string;
  championships: number;
  rosterCount: number;
  region: string;
  status: "ACTIVE" | "REPRESENTATIVE";
}

export const teamsData: Team[] = [
  {
    id: "mg-coc-main",
    name: "MG ESPORTS",
    tag: "MG",
    game: "CLASH OF CLANS",
    rank: "TOP 8 WORLDWIDE",
    points: "GOLDEN TICKET",
    winRate: "84%",
    championships: 3,
    rosterCount: 9,
    region: "GLOBAL (INDIA)",
    status: "REPRESENTATIVE",
  },
  {
    id: "tribe-gaming",
    name: "TRIBE GAMING",
    tag: "TRB",
    game: "CLASH OF CLANS",
    rank: "#02 WORLDWIDE",
    points: "WORLD FINALIST",
    winRate: "82%",
    championships: 4,
    rosterCount: 5,
    region: "NORTH AMERICA",
    status: "ACTIVE",
  },
  {
    id: "mg-bgmi",
    name: "MG BATTLEGROUNDS",
    tag: "MGB",
    game: "BGMI",
    rank: "#08",
    points: "920 PTS",
    winRate: "61%",
    championships: 1,
    rosterCount: 4,
    region: "INDIA",
    status: "REPRESENTATIVE",
  },
  {
    id: "mg-val",
    name: "MG PROTOCOL",
    tag: "MGP",
    game: "VALORANT",
    rank: "#12",
    points: "840 PTS",
    winRate: "58%",
    championships: 1,
    rosterCount: 5,
    region: "INDIA (SOUTH)",
    status: "REPRESENTATIVE",
  },
];
