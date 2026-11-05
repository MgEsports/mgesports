export interface Match {
  id: string;
  status: "LIVE" | "UPCOMING" | "RESULT";
  tournament: string;
  stage: string;
  game: string;
  teamA: {
    name: string;
    tag: string;
    logo?: string;
    score?: number;
    points?: number;
  };
  teamB: {
    name: string;
    tag: string;
    logo?: string;
    score?: number;
    points?: number;
  };
  startTime?: string;
  countdownSeconds?: number;
  streamUrl?: string;
  map?: string;
  winner?: string;
}

export const matchesData: Match[] = [
  {
    id: "match-live-coc",
    status: "LIVE",
    tournament: "CLASH OF CLANS WORLD CHAMPIONSHIP",
    stage: "WORLD FINALS • ROUND 1",
    game: "CLASH OF CLANS",
    map: "WAR ARENA",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
      score: 15,
      points: 100,
    },
    teamB: {
      name: "TRIBE GAMING",
      tag: "TRB",
      score: 14,
      points: 98,
    },
    streamUrl: "https://www.youtube.com/@clashofclans",
  },
  {
    id: "match-up-1",
    status: "UPCOMING",
    tournament: "CLASH OF CLANS WORLD CHAMPIONSHIP",
    stage: "WORLD FINALS • SEMI FINALS",
    game: "CLASH OF CLANS",
    map: "CHAMPIONSHIP BASE",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
    },
    teamB: {
      name: "TRIBE GAMING",
      tag: "TRB",
    },
    startTime: "TODAY • 7:45 PM IST",
    countdownSeconds: 8075,
    streamUrl: "https://www.youtube.com/@clashofclans",
  },
  {
    id: "match-up-2",
    status: "UPCOMING",
    tournament: "MG CLUTCH CUP S1",
    stage: "ROUND OF 16",
    game: "CLASH OF CLANS",
    map: "CHAMPIONS CIRCUIT",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
    },
    teamB: {
      name: "CHAMPIONSHIP SQUAD",
      tag: "CSQ",
    },
    startTime: "TOMORROW • 5:00 PM IST",
    countdownSeconds: 86400,
  },
  {
    id: "match-res-1",
    status: "RESULT",
    tournament: "GOLDEN TICKET QUALIFIER",
    stage: "QUALIFIER FINALS",
    game: "CLASH OF CLANS",
    map: "WAR ARENA",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
      score: 15,
      points: 100,
    },
    teamB: {
      name: "REGIONAL TITANS",
      tag: "RTN",
      score: 13,
      points: 94,
    },
    winner: "MG ESPORTS",
  },
];
