export interface StatItem {
  id: string;
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  sublabel: string;
}

export const statsData: StatItem[] = [
  {
    id: "tournaments",
    value: 25,
    suffix: "+",
    label: "TOURNAMENTS",
    sublabel: "Organized & hosted across India",
  },
  {
    id: "players",
    value: 500,
    suffix: "+",
    label: "PLAYERS",
    sublabel: "Registered pro and scrim athletes",
  },
  {
    id: "teams",
    value: 50,
    suffix: "+",
    label: "TEAMS",
    sublabel: "Vetted competitive gaming rosters",
  },
  {
    id: "prizePool",
    value: 5,
    prefix: "₹",
    suffix: "L+",
    label: "PRIZE POOL",
    sublabel: "Awarded to champions & MVPs",
  },
];

export interface HallOfGloryItem {
  year: string;
  title: string;
  achievement: string;
  mvp?: string;
  event: string;
  prize: string;
  description: string;
}

export const hallOfGloryData: HallOfGloryItem[] = [
  {
    year: "2026",
    title: "FLAME OF GLORY S2",
    achievement: "GRAND FINALIST & STAGE WINNERS",
    mvp: "BEAST",
    event: "FREE FIRE MAX CHAMPIONSHIP",
    prize: "₹50,000 ARENA",
    description: "Dominant display with 32 total finishes across 2 high-intensity fixtures.",
  },
  {
    year: "2026",
    title: "TAMIL NADU CLASH",
    achievement: "1ST PLACE CHAMPIONS",
    mvp: "SHADOW",
    event: "SOUTH REGIONAL INVITATIONAL",
    prize: "₹35,000 PURSE",
    description: "Undefeated through group stages, sealing the trophy with back-to-back Booyahs.",
  },
  {
    year: "2025",
    title: "IGNITE WINTER LEAGUE",
    achievement: "RUNNERS UP",
    mvp: "FALCON",
    event: "NATIONAL TIER-1 LEAGUE",
    prize: "₹75,000 SHOWDOWN",
    description: "Secured second place in a 64-team national bracket, establishing the Lord legacy.",
  },
  {
    year: "2025",
    title: "MG INVITATIONAL S1",
    achievement: "FLAGSHIP LAUNCH VICTORY",
    mvp: "BEAST",
    event: "ORGANIZATION DEBUT CUP",
    prize: "₹25,000 PRIZE POOL",
    description: "The inauguration tournament that launched the Lord competitive journey.",
  },
];

export interface Partner {
  id: string;
  name: string;
  category: string;
  tier: "MAIN SPONSOR" | "OFFICIAL PARTNER" | "BROADCAST PARTNER";
}

export const partnersData: Partner[] = [
  { id: "p1", name: "TITAN AUDIO", category: "Pro Gaming Peripherals", tier: "MAIN SPONSOR" },
  { id: "p2", name: "APEX RIGS", category: "High Performance Hardware", tier: "OFFICIAL PARTNER" },
  { id: "p3", name: "KINETIC ENERGY", category: "Official Energy Partner", tier: "OFFICIAL PARTNER" },
  { id: "p4", name: "STREAMPRO INDIA", category: "Broadcast & Production", tier: "BROADCAST PARTNER" },
  { id: "p5", name: "VALKYRIE GEAR", category: "Apparel & Merchandise", tier: "OFFICIAL PARTNER" },
];
