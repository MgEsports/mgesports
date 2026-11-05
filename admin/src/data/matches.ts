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
    id: "match-live-1",
    status: "LIVE",
    tournament: "FLAME OF GLORY S2",
    stage: "GRAND FINALS • MATCH 3",
    game: "FREE FIRE MAX",
    map: "BERMUDA",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
      score: 38,
      points: 22,
    },
    teamB: {
      name: "DFG ESPORTS",
      tag: "DFG",
      score: 53,
      points: 32,
    },
    streamUrl: "https://www.youtube.com",
  },
  {
    id: "match-up-1",
    status: "UPCOMING",
    tournament: "FLAME OF GLORY S2",
    stage: "GRAND FINALS • MATCH 4",
    game: "FREE FIRE MAX",
    map: "PURGATORY",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
    },
    teamB: {
      name: "TB ESPORTS",
      tag: "TBE",
    },
    startTime: "TODAY • 7:45 PM IST",
    countdownSeconds: 8075, // approx 02 : 14 : 35
  },
  {
    id: "match-up-2",
    status: "UPCOMING",
    tournament: "MG CLUTCH CUP",
    stage: "ROUND OF 16",
    game: "FREE FIRE MAX",
    map: "BERMUDA",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
    },
    teamB: {
      name: "GODLIKE INVINCIBLE",
      tag: "GLI",
    },
    startTime: "TOMORROW • 5:00 PM IST",
    countdownSeconds: 86400,
  },
  {
    id: "match-res-1",
    status: "RESULT",
    tournament: "FLAME OF GLORY S2",
    stage: "GRAND FINALS • MATCH 2",
    game: "FREE FIRE MAX",
    map: "KALAHARI",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
      score: 24,
      points: 12,
    },
    teamB: {
      name: "EYEGLACIERS",
      tag: "EYE",
      score: 14,
      points: 8,
    },
    winner: "MG ESPORTS",
  },
  {
    id: "match-res-2",
    status: "RESULT",
    tournament: "TAMIL CLASH QUALIFIERS",
    stage: "SEMI-FINALS",
    game: "FREE FIRE MAX",
    map: "BERMUDA",
    teamA: {
      name: "MG ESPORTS",
      tag: "MG",
      score: 30,
      points: 18,
    },
    teamB: {
      name: "DW ESP",
      tag: "DWE",
      score: 18,
      points: 6,
    },
    winner: "MG ESPORTS",
  },
];
