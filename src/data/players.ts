import aadhilImg from "../assets/members/player-aadhil.png";
import normanImg from "../assets/members/player-norman.png";
import aeroImg from "../assets/members/player-aero.png";
import dragoImg from "../assets/members/player-drago.png";
import kolayaImg from "../assets/members/player-kolaya.png";
import omkarImg from "../assets/members/player-omkar.png";
import rudyImg from "../assets/members/player-rudy.png";
import destroImg from "../assets/members/player-destro.png";
import leapImg from "../assets/members/player-leap.png";

export interface Player {
  id: string;
  ign: string;
  realName: string;
  jerseyNumber?: string;
  role: string;
  game: string;
  team: string;
  about: string;
  instagram: string;
  image?: string;
  avatarUrl?: string;
  featuredQuote?: string;
  kdRatio?: string;
  headshotRate?: string;
  matchesPlayed?: number;
  avatarBg?: string;
  isCaptain?: boolean;
}

export const playersData: Player[] = [
  {
    id: "player-aadil",
    ign: "AADIL",
    realName: "Aadil",
    jerseyNumber: "01",
    role: "IGL",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Base architect and strategic anchor steering MG to the World Championship.",
    instagram: "@mg13e.sports",
    image: aadhilImg,
    avatarUrl: aadhilImg,
    featuredQuote: "Tactics win wars. Conviction wins championships.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: true,
  },
  {
    id: "player-norman",
    ign: "NORMAN",
    realName: "Norman",
    jerseyNumber: "07",
    role: "FRAGGER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Triple-star specialist with unparalleled high-pressure execution.",
    instagram: "@mg13e.sports",
    image: normanImg,
    avatarUrl: normanImg,
    featuredQuote: "Flawless pathing under championship pressure.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-aero",
    ign: "AERO",
    realName: "Aero",
    jerseyNumber: "12",
    role: "SNIPER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Air attack master and precision surgical deployment specialist.",
    instagram: "@mg13e.sports",
    image: aeroImg,
    avatarUrl: aeroImg,
    featuredQuote: "Precision timing from the skies.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-drago",
    ign: "DRAGO",
    realName: "Drago",
    jerseyNumber: "04",
    role: "RUSHER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Fierce offense and aggressive smash attack innovator.",
    instagram: "@mg13e.sports",
    image: dragoImg,
    avatarUrl: dragoImg,
    featuredQuote: "Break lines and overwhelm defences.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-kolaya",
    ign: "KOLAYA",
    realName: "Kolaya",
    jerseyNumber: "05",
    role: "SUPPORT",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Defensive fortress designer behind MG's lowest star concessions.",
    instagram: "@mg13e.sports",
    image: kolayaImg,
    avatarUrl: kolayaImg,
    featuredQuote: "Every wall placement tells a defensive story.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-omkar",
    ign: "OMKAR",
    realName: "Omkar",
    jerseyNumber: "06",
    role: "IGL",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Analytical mind analyzing opponent replay weaknesses in real time.",
    instagram: "@mg13e.sports",
    image: omkarImg,
    avatarUrl: omkarImg,
    featuredQuote: "Preparation before the war determines victory.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-rudy",
    ign: "RUDY",
    realName: "Rudy",
    jerseyNumber: "08",
    role: "FRAGGER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "High percentage clutch finisher on the global stage.",
    instagram: "@mg13e.sports",
    image: rudyImg,
    avatarUrl: rudyImg,
    featuredQuote: "Stepping up when everything is on the line.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-destro",
    ign: "DESTRO",
    realName: "Destro",
    jerseyNumber: "09",
    role: "SNIPER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Ground attack mastery and Queen charge precision specialist.",
    instagram: "@mg13e.sports",
    image: destroImg,
    avatarUrl: destroImg,
    featuredQuote: "Patience and surgical funneling create triumphs.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
  {
    id: "player-leap",
    ign: "LEAP",
    realName: "Leap",
    jerseyNumber: "10",
    role: "RUSHER",
    game: "CLASH OF CLANS",
    team: "MG ESPORTS",
    about: "Dynamic multi-army versatility keeping opponents off-balance.",
    instagram: "@mg13e.sports",
    image: leapImg,
    avatarUrl: leapImg,
    featuredQuote: "Adapt and conquer any defense layout.",
    avatarBg: "insta:@mg13e.sports",
    isCaptain: false,
  },
];
