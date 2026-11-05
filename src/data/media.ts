export interface MediaItem {
  id: string;
  type: "VIDEOS" | "HIGHLIGHTS" | "PHOTOS" | "SHORTS";
  title: string;
  duration?: string;
  views: string;
  date: string;
  game: string;
  youtubeId?: string;
  thumbnail?: string;
  tag: string;
  description?: string;
  featured?: boolean;
}

export const mediaData: MediaItem[] = [
  {
    id: "media-sh-1",
    type: "VIDEOS",
    title: "T1 GRAND FINALS HIGHLIGHTS ( MG.LUFFY)",
    duration: "00:30",
    views: "89K VIEWS",
    date: "LAST WEEK",
    game: "FREE FIRE MAX",
    youtubeId: "o-1d_Ez_LcA",
    thumbnail: "https://img.youtube.com/vi/o-1d_Ez_LcA/hqdefault.jpg",
    tag: "PREMIERE",
    featured: true,
    description: "Official Grand Finals highlights of MG Esports starring MG Luffy dominating Bermuda.",
  },
  {
    id: "media-hl-1",
    type: "HIGHLIGHTS",
    title: "RNG x TPM vs MG Esports | LCQ World Championship | MG AERO",
    duration: "01:18",
    views: "34K VIEWS",
    date: "YESTERDAY",
    game: "COC",
    youtubeId: "sphPuFUveuM",
    thumbnail: "https://img.youtube.com/vi/sphPuFUveuM/hqdefault.jpg",
    tag: "CLUTCH",
    featured: true,
    description: "RNG x TPM vs MG Esports | LCQ World Championship | MG AERO",
  },
  {
    id: "media-vid-1",
    type: "VIDEOS",
    title: "FLAME OF GLORY S2 • OFFICIAL TRAILER & TEAM REVEAL",
    duration: "02:45",
    views: "48K VIEWS",
    date: "2 DAYS AGO",
    game: "FREE FIRE MAX",
    youtubeId: "fJ9rUzIMcZQ",
    thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    tag: "FEATURED",
    featured: true,
    description: "The grand cinematic reveal of Flame of Glory Season 2, featuring all 32 qualified squads.",
  },
  {
    id: "media-hl-2",
    type: "HIGHLIGHTS",
    title: "MG SQUAD WIPE VS EYEGLACIERS • FINAL CIRCLE",
    duration: "00:54",
    views: "21K VIEWS",
    date: "3 DAYS AGO",
    game: "FREE FIRE MAX",
    youtubeId: "o-1d_Ez_LcA",
    thumbnail: "https://img.youtube.com/vi/o-1d_Ez_LcA/hqdefault.jpg",
    tag: "TOP PLAY",
    featured: true,
    description: "Flawless tactical smoke push and coordinated flank eliminating the tournament favorites.",
  },
  {
    id: "media-hl-3",
    type: "HIGHLIGHTS",
    title: "SHADOW 7-KILL RUSH IN BERMUDA QUALIFIERS",
    duration: "03:12",
    views: "52K VIEWS",
    date: "4 DAYS AGO",
    game: "FREE FIRE MAX",
    youtubeId: "sphPuFUveuM",
    thumbnail: "https://img.youtube.com/vi/sphPuFUveuM/hqdefault.jpg",
    tag: "AGGRESSION",
    featured: false,
    description: "Aggressive entry fragging clinic across Clock Tower and Factory.",
  },
  {
    id: "media-ph-1",
    type: "PHOTOS",
    title: "BEHIND THE SCENES: 2026 PRO JERSEY SHOOT",
    views: "15K VIEWS",
    date: "5 DAYS AGO",
    game: "MG TEAM",
    tag: "LIFESTYLE",
  },
  {
    id: "media-ph-2",
    type: "PHOTOS",
    title: "FLAME OF GLORY TROPHY TOUR IN CHENNAI",
    views: "19K VIEWS",
    date: "LAST WEEK",
    game: "FLAME OF GLORY",
    tag: "COMMUNITY",
  },
];

/**
 * Service helper to fetch featured video highlights for the Home page.
 */
export const getFeaturedHighlights = (): MediaItem[] => {
  const highlights = mediaData.filter((item) => item.featured || item.tag === "PREMIERE");
  return highlights.length > 0 ? highlights.slice(0, 3) : mediaData.slice(0, 3);
};
