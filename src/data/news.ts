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
    title: "MG ESPORTS SECURES GOLDEN TICKET TO CLASH OF CLANS WORLD CHAMPIONSHIP",
    slug: "mg-esports-golden-ticket-world-championship",
    coverImage: "/images/hero.png",
    image: "/images/hero.png",
    excerpt: "Dominating competitive circuits with flawless 100% destruction star records, MG ESPORTS qualifies for the World Championship Finals stage.",
    content: "The global battle lines are drawn as MG ESPORTS earns its historic Golden Ticket to the Clash of Clans World Championship. Over months of grueling qualifiers, our premier roster has fought through international brackets, cementing our place among the top 8 teams worldwide.\n\nMG ESPORTS enters the World Championship Finals stage prepared to face premier powerhouses including Tribe Gaming. Fans can catch live official broadcasts on our YouTube and partner streams.",
    date: "OCT 28, 2026",
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
    content: "Today, MG ESPORTS proudly unveils the official 2026-27 Pro Combat Jersey, built in partnership with leading performance apparel designers. Incorporating traditional Tamil temple gopuram golden vectors merged with aerodynamic honeycomb moisture-wicking weave, the new kit symbolizes our unwavering ambition to dominate both national and international tournaments.\n\nPre-orders for the limited Supporter Edition are now officially open with customized gamer tags on the back. Clan members and community champions will receive priority dispatch before the first live LAN tournament.",
    date: "SEP 10, 2026",
    readTime: "2 MIN READ",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    author: "Branding Desk",
  },
  {
    id: "news-3",
    category: "PLAYER",
    title: "AADIL NAMED IGL OF THE MONTH AFTER WORLD QUALIFIER DOMINANCE",
    slug: "aadil-igl-of-the-month",
    coverImage: "/uploads/db-tickerPlayers-10-image-1793023263529-eckq5.png",
    image: "/uploads/db-tickerPlayers-10-image-1793023263529-eckq5.png",
    excerpt: "With precision base planning and flawless triple-star attacks, Aadil leads MG ESPORTS onto the global stage.",
    content: "Following an electrifying qualifier run, our primary In-Game Leader Aadil has officially been recognized as IGL of the Month. Leading the roster through intense high-stakes war fixtures, Aadil orchestrated complex attack strategies that secured MG's Golden Ticket.\n\n'This achievement belongs to the whole squad,' Aadil commented. 'Base design, attack precision, and absolute trust between players form our foundation.'",
    date: "OCT 20, 2026",
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
    content: "MG ESPORTS's dedicated Grassroots Scrim Initiative has crossed a landmark milestone of 500 verified players and 60 registered squads. Operating daily across 3 tiers (Tier-3 Challenger, Tier-2 Contender, Tier-1 Elite), our automated custom lobby system provides aspiring competitors with professional-grade competitive experience.\n\nTop-performing grassroots squads from weekly scoreboards earn direct invitations to showmatches and scouting trials with our academy coaches.",
    date: "AUG 28, 2026",
    readTime: "3 MIN READ",
    badgeColor: "bg-neutral-800 text-neutral-300 border-neutral-700",
    author: "Community Lead",
  },
];

