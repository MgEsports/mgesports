import { createContext } from "react";
import type { Tournament } from "../data/tournaments";
import type { Match } from "../data/matches";
import type { MediaItem } from "../data/media";
import type { NewsArticle } from "../data/news";

export interface VideoPayload {
  title: string;
  category?: string;
  game?: string;
  youtubeId?: string;
}

export interface ModalContextType {
  openJoinTournament: (tournament?: Tournament) => void;
  closeJoinTournament: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  openJersey: () => void;
  closeJersey: () => void;
  openVideo: (video: VideoPayload) => void;
  closeVideo: () => void;
  watchMatch: (match: Match) => void;
  playMedia: (item: MediaItem) => void;
  openArticle: (article: NewsArticle) => void;
  closeArticle: () => void;
  openPartner: () => void;
  closePartner: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
