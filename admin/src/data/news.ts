export interface NewsArticle {
  id: string;
  category: "TOURNAMENT" | "TEAM" | "PLAYER" | "COMMUNITY" | "ESPORTS" | string;
  title: string;
  slug?: string;
  excerpt: string;
  content?: string;
  description?: string;
  date: string;
  readTime: string;
  badgeColor?: string;
  author: string;
  coverImage?: string;
  image?: string;
  bannerImage?: string;
  published?: boolean;
  featured?: boolean;
}

export const newsData: NewsArticle[] = [
  {
    id: "news-1",
    category: "TOURNAMENT",
    title: "FLAME OF GLORY S2 GRAND FINALS COMMENCES WITH ₹50,000 AT STAKE",
    slug: "flame-of-glory-s2-grand-finals",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    excerpt: "32 of the sharpest mobile esports squads converge in a 6-round showdown. MG Esports enters as the heavyweight contender.",
    content: "The battle lines are drawn as Flame of Glory Season 2 reaches its climax. Over 32 verified Tier-1 squads have fought through grueling qualifiers across 4 regional brackets to earn their spots in the Grand Finals. With a total prize purse of ₹50,000 and the prestigious Flame of Glory trophy on the line, every point, every frag, and every late-game rotation will determine the legacy of this season.\n\nMG Esports enters the finals holding the #1 seed following a dominant group-stage run led by IGL Beast. Official broadcast coverage begins at 18:00 IST with multi-cam casters and real-time telemetry streaming live on our YouTube and partner channels.",
    date: "SEP 12, 2026",
    readTime: "3 MIN READ",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    author: "MG Editorial",
  },
  {
    id: "news-2",
    category: "TEAM",
    title: "OFFICIAL REVEAL: THE 2026-27 MG PRO JERSEY UNVEILED",
    slug: "2026-27-mg-pro-jersey-unveiled",
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Crafted with temple gopuram gold line art and battle flame motifs, representing the warrior heritage of South Indian competitive gaming.",
    content: "Today, MG Esports proudly unveils the official 2026-27 Pro Combat Jersey, built in partnership with leading performance apparel designers. Incorporating traditional Tamil temple gopuram golden vectors merged with aerodynamic honeycomb moisture-wicking weave, the new kit symbolizes our unwavering ambition to dominate both national and international tournaments.\n\nPre-orders for the limited Supporter Edition are now officially open with customized gamer tags on the back. Clan members and community champions will receive priority dispatch before the first live LAN tournament.",
    date: "SEP 10, 2026",
    readTime: "2 MIN READ",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    author: "Branding Desk",
  },
  {
    id: "news-3",
    category: "PLAYER",
    title: "BEAST NAMED IGL OF THE MONTH AFTER RECORD-BREAKING CLUTCHES",
    slug: "beast-igl-of-the-month",
    coverImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    excerpt: "With a 4.82 K/D and unmatched late-circle tactical rotations, Beast leads MG Esports into the championship tier.",
    content: "Following an electrifying month of competitive play, our primary In-Game Leader 'Beast' has officially been awarded IGL of the Month by the national esports circuit. Across 28 tournament matches, Beast delivered a record-setting 4.82 K/D ratio, over 14,000 total damage output, and led the roster through four consecutive 1v3 final circle clutches.\n\n'This recognition belongs to the whole squad,' Beast commented. 'Our synergy, callouts, and scrim discipline have leveled up tremendously. We are hungry for the national trophy.'",
    date: "SEP 05, 2026",
    readTime: "4 MIN READ",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    author: "Scouting Team",
  },
  {
    id: "news-4",
    category: "COMMUNITY",
    title: "TIER-1 DAILY SCRIMS PROGRAM PASSES 500+ VERIFIED PLAYERS",
    slug: "tier-1-scrims-500-verified-players",
    coverImage: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Our Discord-integrated grassroots scrim infrastructure now hosts daily lobbies with live anti-cheat and automated scoreboard logging.",
    content: "MG Esports' dedicated Grassroots Scrim Initiative has crossed a landmark milestone of 500 verified players and 60 registered squads. Operating daily across 3 tiers (Tier-3 Challenger, Tier-2 Contender, Tier-1 Elite), our automated custom lobby system provides aspiring competitors with professional-grade competitive experience.\n\nTop-performing grassroots squads from weekly scoreboards earn direct invitations to showmatches and scouting trials with our academy coaches.",
    date: "AUG 28, 2026",
    readTime: "3 MIN READ",
    badgeColor: "bg-neutral-800 text-neutral-300 border-neutral-700",
    author: "Community Lead",
  },
];

