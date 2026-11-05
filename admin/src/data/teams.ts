export interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
  rank: string;
  points: string;
  winRate: string;
  championships: number;
  rosterCount: number;
  region: string;
  status: "ACTIVE" | "REPRESENTATIVE";
}

export const teamsData: Team[] = [
  {
    id: "mg-ff-main",
    name: "MG ESPORTS",
    tag: "MG",
    game: "FREE FIRE MAX",
    rank: "#03",
    points: "1,240 PTS",
    winRate: "72%",
    championships: 3,
    rosterCount: 5,
    region: "INDIA (TN)",
    status: "REPRESENTATIVE",
  },
  {
    id: "dfg-esports",
    name: "DFG ESPORTS",
    tag: "DFG",
    game: "FREE FIRE MAX",
    rank: "#01",
    points: "1,480 PTS",
    winRate: "78%",
    championships: 4,
    rosterCount: 5,
    region: "INDIA",
    status: "ACTIVE",
  },
  {
    id: "tb-esports",
    name: "TB ESPORTS",
    tag: "TBE",
    game: "FREE FIRE MAX",
    rank: "#02",
    points: "1,390 PTS",
    winRate: "75%",
    championships: 2,
    rosterCount: 5,
    region: "INDIA",
    status: "ACTIVE",
  },
  {
    id: "eyeglaciers",
    name: "EYEGLACIERS",
    tag: "EYE",
    game: "FREE FIRE MAX",
    rank: "#04",
    points: "1,050 PTS",
    winRate: "64%",
    championships: 1,
    rosterCount: 4,
    region: "INDIA",
    status: "ACTIVE",
  },
  {
    id: "mg-academy",
    name: "MG ACADEMY",
    tag: "LZA",
    game: "FREE FIRE MAX",
    rank: "#06",
    points: "980 PTS",
    winRate: "66%",
    championships: 1,
    rosterCount: 4,
    region: "INDIA",
    status: "REPRESENTATIVE",
  },
  {
    id: "mg-strikers",
    name: "MG STRIKERS",
    tag: "LZS",
    game: "FREE FIRE",
    rank: "#08",
    points: "910 PTS",
    winRate: "62%",
    championships: 0,
    rosterCount: 4,
    region: "INDIA",
    status: "REPRESENTATIVE",
  },
];
