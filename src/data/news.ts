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
];

