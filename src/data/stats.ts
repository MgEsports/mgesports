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
    id: "winRate",
    value: 84,
    suffix: "%",
    label: "MATCH DOMINANCE",
    sublabel: "Tournament Win Rate on Global Stage",
  },
  {
    id: "ranking",
    value: 8,
    prefix: "TOP ",
    suffix: "",
    label: "WORLD RANKING",
    sublabel: "Clash of Clans Championship Tier",
  },
  {
    id: "titles",
    value: 3,
    suffix: "x",
    label: "REGIONAL CHAMPIONS",
    sublabel: "Premier Championship Victories",
  },
  {
    id: "roster",
    value: 13,
    suffix: "",
    label: "ATHLETES & LEADS",
    sublabel: "Dedicated roster & management crew",
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
    title: "WORLD CHAMPIONSHIP FINALS",
    achievement: "GOLDEN TICKET WINNER",
    mvp: "AADIL",
    event: "CLASH OF CLANS WORLD STAGE",
    prize: "GLOBAL STAGE",
    description: "Earned the coveted Golden Ticket to compete against top international rosters at the World Championship.",
  },
  {
    year: "2026",
    title: "REGIONAL CHAMPIONSHIP S3",
    achievement: "1ST PLACE CHAMPIONS",
    mvp: "NORMAN",
    event: "PREMIER REGIONAL LEAGUE",
    prize: "3X DEFENDING CHAMPIONS",
    description: "Flawless war execution with back-to-back 100% destruction star records.",
  },
  {
    year: "2025",
    title: "CLASH GLOBAL INVITATIONAL",
    achievement: "TOP 8 WORLDWIDE",
    mvp: "AERO",
    event: "INTERNATIONAL CIRCUIT",
    prize: "TOP TIER FINISH",
    description: "Proved our mettle against premier global powerhouses including Tribe Gaming.",
  },
  {
    year: "2025",
    title: "MG CLUTCH CUP S1",
    achievement: "INAUGURAL VICTORY",
    mvp: "DRAGO",
    event: "ORGANIZATION FLAGSHIP CUP",
    prize: "CHAMPIONS PURSE",
    description: "The founding championship tournament that set the standard in competitive mobile esports.",
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
