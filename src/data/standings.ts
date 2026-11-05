export interface StandingRow {
  rank: string;
  team: string;
  tag: string;
  chickenDinner: string;
  matches: string;
  position: string;
  finishes: string;
  total: string;
  isTopThree?: boolean;
}

export const flameOfGloryStandings: StandingRow[] = [
  {
    rank: "01",
    team: "DFG ESPORTS",
    tag: "DFG",
    chickenDinner: "01",
    matches: "02",
    position: "21",
    finishes: "32",
    total: "53",
    isTopThree: true,
  },
  {
    rank: "02",
    team: "TB ESPORTS",
    tag: "TBE",
    chickenDinner: "01",
    matches: "02",
    position: "20",
    finishes: "31",
    total: "51",
    isTopThree: true,
  },
  {
    rank: "03",
    team: "MG ESPORTS",
    tag: "MG",
    chickenDinner: "00",
    matches: "02",
    position: "16",
    finishes: "22",
    total: "38",
    isTopThree: true,
  },
  {
    rank: "04",
    team: "EYEGLACIERS",
    tag: "EYE",
    chickenDinner: "00",
    matches: "02",
    position: "13",
    finishes: "12",
    total: "25",
  },
  {
    rank: "05",
    team: "DW ESP",
    tag: "DWE",
    chickenDinner: "00",
    matches: "02",
    position: "10",
    finishes: "15",
    total: "25",
  },
  {
    rank: "06",
    team: "ELITE BLAZE ESPORTS",
    tag: "EBE",
    chickenDinner: "00",
    matches: "02",
    position: "12",
    finishes: "03",
    total: "15",
  },
  {
    rank: "07",
    team: "ST UNITY",
    tag: "STU",
    chickenDinner: "00",
    matches: "02",
    position: "10",
    finishes: "03",
    total: "13",
  },
  {
    rank: "08",
    team: "GODLIKE INVINCIBLE",
    tag: "GLI",
    chickenDinner: "00",
    matches: "02",
    position: "08",
    finishes: "04",
    total: "12",
  },
  {
    rank: "09",
    team: "HYDRA CLAN",
    tag: "HYD",
    chickenDinner: "00",
    matches: "02",
    position: "06",
    finishes: "05",
    total: "11",
  },
  {
    rank: "10",
    team: "REVENANT X",
    tag: "RVT",
    chickenDinner: "00",
    matches: "02",
    position: "05",
    finishes: "04",
    total: "09",
  },
];
