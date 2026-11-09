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

export const mediaData: MediaItem[] = [];

export const getFeaturedHighlights = (): MediaItem[] => {
  const highlights = mediaData.filter((item) => item.featured || item.tag === "PREMIERE");
  return highlights.length > 0 ? highlights.slice(0, 3) : mediaData.slice(0, 3);
};
