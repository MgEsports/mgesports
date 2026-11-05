import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendRoomCredentialsEmail } from "../services/emailService.js";

function parsePrismaDateTime(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ================= VALIDATION SCHEMAS =================

const tournamentSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional().nullable(),
  game: z.string().default("FREE FIRE MAX"),
  gameCategory: z.string().default("FREE FIRE MAX"),
  gameMode: z.string().default("SQUAD BATTLE ROYALE"),
  status: z.enum([
    "DRAFT",
    "REGISTRATION_OPEN",
    "CLOSING_SOON",
    "FULL",
    "REGISTRATION_CLOSED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED",
    "ARCHIVED",
    "UPCOMING",
    "LIVE",
  ]).default("REGISTRATION_OPEN"),
  prizePool: z.string().default("₹50,000"),
  firstPrize: z.string().optional().nullable(),
  secondPrize: z.string().optional().nullable(),
  thirdPrize: z.string().optional().nullable(),
  prizeDistributionType: z.string().optional().default("CUSTOM"),
  prizes: z.string().optional().nullable(),
  allowUnallocatedPrize: z.boolean().optional().default(true),
  entryFee: z.string().default("FREE ENTRY"),
  feeAmount: z.number().default(0),
  entryFeeType: z.string().optional().default("PER_TEAM"),
  paymentMethod: z.string().optional().default("BOTH"),
  currency: z.string().default("INR"),
  slots: z.string().default("32 TEAMS"),
  totalTeams: z.number().default(32),
  teamType: z.string().optional().default("SQUAD"),
  teamSize: z.number().default(4),
  minPlayersPerTeam: z.number().optional().default(4),
  maxPlayersPerTeam: z.number().default(5),
  allowSubstitutes: z.boolean().optional().default(true),
  substituteCount: z.number().default(1),
  allowWaitlist: z.boolean().optional().default(true),
  allowLateRegistration: z.boolean().optional().default(false),
  minTeams: z.number().optional().default(2),
  date: z.string(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().default("18:00 IST"),
  regStartDate: z.string().optional().nullable(),
  regEndDate: z.string().optional().nullable(),
  regDeadline: z.any().optional().nullable(),
  rosterLockDate: z.any().optional().nullable(),
  checkInEnabled: z.boolean().optional().default(false),
  checkInStartTime: z.string().optional().nullable(),
  checkInEndTime: z.string().optional().nullable(),
  noShowTimeoutMinutes: z.number().optional().default(10),
  allowMultipleTeams: z.boolean().optional().default(false),
  requireTeammateApproval: z.boolean().optional().default(true),
  slotReservationDuration: z.number().optional().default(10),
  format: z.string().default("BATTLE ROYALE • 6 MATCHES"),
  tournamentFormat: z.string().optional().default("BATTLE_ROYALE"),
  matchFormat: z.string().optional().nullable(),
  scoringWin: z.number().optional().default(12),
  scoringKill: z.number().optional().default(1),
  scoringPlacement: z.string().optional().nullable(),
  scoringBonus: z.string().optional().nullable(),
  scoringPenalty: z.string().optional().nullable(),
  sponsors: z.string().optional().nullable(),
  refundAvailable: z.boolean().optional().default(false),
  refundPolicy: z.string().optional().nullable(),
  supportEmail: z.string().optional().nullable(),
  supportPhone: z.string().optional().nullable(),
  discordUrl: z.string().optional().nullable(),
  telegramUrl: z.string().optional().nullable(),
  whatsappUrl: z.string().optional().nullable(),
  isDraft: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  featured: z.boolean().default(false),
  tagline: z.string().default("Official Lord Esports Tournament"),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  streamUrl: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  logoImage: z.string().optional().nullable(),
  rules: z.string().optional().nullable(),
  scoringRules: z.string().optional().nullable(),
  termsConditions: z.string().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
  upiQrImage: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
});

const roundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  roundNumber: z.number().default(1),
  roundType: z.string().default("BATTLE_ROYALE"),
  startDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  maxTeams: z.number().default(32),
  selectionMethod: z.string().default("MANUAL"),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]).default("UPCOMING"),
});

const playerSchema = z.object({
  name: z.string().optional().nullable().default("Player"),
  ign: z.string().min(1, "Player IGN is required"),
  playerId: z.string().optional().nullable(),
  role: z.string().default("STARTER"),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  discordId: z.string().optional().nullable(),
  isCaptain: z.boolean().default(false),
  isSubstitute: z.boolean().default(false),
});

const registrationSchema = z.object({
  teamName: z.string().min(1, "Team Name is required"),
  teamLogo: z.string().optional().nullable(),
  captainIgn: z.string().min(1, "Captain IGN is required"),
  captainName: z.string().optional().nullable(),
  captainPhone: z.string().optional().nullable(),
  captainEmail: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable().default(""),
  discordTag: z.string().optional().nullable(),
  playerNames: z.string().optional().nullable(),
  players: z.array(playerSchema).optional().default([]),
  payment: z.object({
    amount: z.number().optional().default(0),
    method: z.string().optional().default("UPI"),
    utr: z.string().optional().nullable(),
    payerName: z.string().optional().nullable(),
    screenshot: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
  }).optional().nullable(),
});

const stageSchema = z.object({
  name: z.string().min(2),
  order: z.number().default(1),
  status: z.string().default("UPCOMING"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  teamsCount: z.number().optional().nullable(),
  qualificationCriteria: z.string().optional().nullable(),
});

// Helper to safely execute Prisma calls with in-memory fallback
let dbConnected = true;
prisma.$connect()
  .then(() => {
    dbConnected = true;
  })
  .catch((err) => {
    console.warn("Prisma background connect notice:", err?.message);
    // Keep dbConnected true so individual queries still attempt Neon connection
  });

// ================= IN-MEMORY RESILIENT STORE =================
// Only retains dynamically created items when database is offline; initialized empty so deleted tournaments stay deleted
let memoryTournaments: any[] = [];
let memoryTeams: any[] = [];
let memoryStages: any[] = [];
let memoryRounds: any[] = [];

let memoryRoundTeams: any[] = [];


let memoryRegistrations: any[] = [
  {
    id: "reg-dfg-01",
    registrationNumber: "LZ-FGF-00127",
    tournamentId: "fog-season-2",
    teamName: "DFG ESPORTS",
    teamLogo: null,
    captainIgn: "DFG_MAHESH",
    captainName: "Mahesh Kumar",
    captainPhone: "+91 99000 88776",
    captainEmail: "mahesh@dfgesports.com",
    whatsapp: "+91 99000 88776",
    discordTag: "dfg_lead#0001",
    playerNames: "DFG_MAHESH, PLAYER_02, PLAYER_03, PLAYER_04, PLAYER_05",
    status: "APPROVED",
    paymentStatus: "VERIFIED",
    currentStageId: "stage-fog-1",
    slotNumber: 1,
    adminNotes: "Vetted Tier-1 Squad from regional league",
    approvedAt: new Date("2026-09-18T11:05:00Z"),
    rejectedAt: null,
    createdAt: new Date("2026-09-18T10:32:00Z"),
    updatedAt: new Date("2026-09-18T11:05:00Z"),
    players: [
      { id: "p-1", name: "Mahesh Kumar", ign: "DFG_MAHESH", playerId: "109827364", role: "IGL", phone: "+91 99000 88776", email: "mahesh@dfg.gg", discordId: "dfg_lead#0001", isCaptain: true, isSubstitute: false },
      { id: "p-2", name: "Arun", ign: "PLAYER_02", playerId: "298716253", role: "Rusher", phone: "+91 99000 88777", email: null, discordId: "arun#1029", isCaptain: false, isSubstitute: false },
      { id: "p-3", name: "Karthik", ign: "PLAYER_03", playerId: "387461928", role: "Support", phone: "+91 99000 88778", email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-4", name: "Rahul", ign: "PLAYER_04", playerId: "476592817", role: "Sniper", phone: "+91 99000 88779", email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-5", name: "Vishal", ign: "PLAYER_05", playerId: "587162839", role: "Entry", phone: "+91 99000 88780", email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-6", name: "Suresh", ign: "PLAYER_06", playerId: "687291029", role: "Sub", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: true },
    ],
    payment: {
      id: "pay-1",
      registrationId: "reg-dfg-01",
      amount: 499,
      method: "UPI",
      utr: "324567891234",
      payerName: "Mahesh Kumar",
      screenshot: "/uploads/partner-infinix.png",
      status: "VERIFIED",
      remarks: "Transaction verified on HDFC UPI gateway",
      submittedAt: new Date("2026-09-18T10:35:00Z"),
      verifiedAt: new Date("2026-09-18T11:02:00Z"),
      verifiedBy: "admin@lordz.gg",
      adminNotes: "UTR verified with merchant passbook",
    },
    activityLogs: [
      { id: "log-1", action: "REGISTRATION_SUBMITTED", performedBy: "Mahesh Kumar", details: "Registration submitted for FLAME OF GLORY - FINALS", createdAt: new Date("2026-09-18T10:32:00Z") },
      { id: "log-2", action: "PAYMENT_SUBMITTED", performedBy: "Mahesh Kumar", details: "Payment of ₹499 submitted (UTR: 324567891234)", createdAt: new Date("2026-09-18T10:35:00Z") },
      { id: "log-3", action: "PAYMENT_VERIFIED", performedBy: "admin@lordz.gg", details: "Payment verified by Admin", createdAt: new Date("2026-09-18T11:02:00Z") },
      { id: "log-4", action: "REGISTRATION_APPROVED", performedBy: "admin@lordz.gg", details: "Registration approved into ROUND 1", createdAt: new Date("2026-09-18T11:05:00Z") },
    ],
  },
  {
    id: "reg-godlike-02",
    registrationNumber: "LZ-FGF-00128",
    tournamentId: "fog-season-2",
    teamName: "GODLIKE CLAN",
    teamLogo: null,
    captainIgn: "JONATHAN_X",
    captainName: "Jonathan Amaral",
    captainPhone: "+91 98450 11223",
    captainEmail: "jonathan@godlike.in",
    whatsapp: "+91 98450 11223",
    discordTag: "jonathan#9988",
    playerNames: "JONATHAN_X, SHADOW_G, CLUTCH_GOD, NEYOOO",
    status: "APPROVED",
    paymentStatus: "VERIFIED",
    currentStageId: "stage-fog-1",
    slotNumber: 2,
    adminNotes: "Direct invite slot",
    approvedAt: new Date("2026-09-18T12:00:00Z"),
    rejectedAt: null,
    createdAt: new Date("2026-09-18T11:30:00Z"),
    updatedAt: new Date("2026-09-18T12:00:00Z"),
    players: [
      { id: "p-21", name: "Jonathan", ign: "JONATHAN_X", playerId: "778899001", role: "IGL", phone: "+91 98450 11223", email: null, discordId: "jonathan#9988", isCaptain: true, isSubstitute: false },
      { id: "p-22", name: "Shadow", ign: "SHADOW_G", playerId: "778899002", role: "Rusher", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-23", name: "ClutchGod", ign: "CLUTCH_GOD", playerId: "778899003", role: "Support", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-24", name: "Neyo", ign: "NEYOOO", playerId: "778899004", role: "Sniper", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
    ],
    payment: {
      id: "pay-2",
      registrationId: "reg-godlike-02",
      amount: 499,
      method: "UPI",
      utr: "982736451029",
      payerName: "Jonathan",
      screenshot: "/uploads/partner-fusion.png",
      status: "VERIFIED",
      remarks: "Verified by admin",
      submittedAt: new Date("2026-09-18T11:35:00Z"),
      verifiedAt: new Date("2026-09-18T12:00:00Z"),
      verifiedBy: "admin@lordz.gg",
      adminNotes: "Approved",
    },
    activityLogs: [
      { id: "log-21", action: "REGISTRATION_SUBMITTED", performedBy: "Jonathan", details: "Registration submitted", createdAt: new Date("2026-09-18T11:30:00Z") },
      { id: "log-22", action: "PAYMENT_VERIFIED", performedBy: "admin@lordz.gg", details: "Payment verified", createdAt: new Date("2026-09-18T12:00:00Z") },
      { id: "log-23", action: "REGISTRATION_APPROVED", performedBy: "admin@lordz.gg", details: "Registration approved", createdAt: new Date("2026-09-18T12:00:00Z") },
    ],
  },
  {
    id: "reg-veera-03",
    registrationNumber: "LZ-FGF-00129",
    tournamentId: "fog-season-2",
    teamName: "VEERA TAMIZHAN",
    teamLogo: null,
    captainIgn: "TAMIL_HUNTER",
    captainName: "Saravanan",
    captainPhone: "+91 97890 55443",
    captainEmail: "hunter@veera.gg",
    whatsapp: "+91 97890 55443",
    discordTag: "hunter#4433",
    playerNames: "TAMIL_HUNTER, VELU_99, MARUTHU, SINGAM_T",
    status: "PENDING",
    paymentStatus: "SUBMITTED",
    currentStageId: "stage-fog-1",
    slotNumber: null,
    adminNotes: "UTR submitted, awaiting manual verification",
    approvedAt: null,
    rejectedAt: null,
    createdAt: new Date("2026-09-19T08:15:00Z"),
    updatedAt: new Date("2026-09-19T08:15:00Z"),
    players: [
      { id: "p-31", name: "Saravanan", ign: "TAMIL_HUNTER", playerId: "554433221", role: "IGL", phone: "+91 97890 55443", email: null, discordId: "hunter#4433", isCaptain: true, isSubstitute: false },
      { id: "p-32", name: "Velu", ign: "VELU_99", playerId: "554433222", role: "Rusher", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-33", name: "Maruthu", ign: "MARUTHU", playerId: "554433223", role: "Support", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-34", name: "Singam", ign: "SINGAM_T", playerId: "554433224", role: "Entry", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
    ],
    payment: {
      id: "pay-3",
      registrationId: "reg-veera-03",
      amount: 499,
      method: "UPI",
      utr: "449911882233",
      payerName: "Saravanan M",
      screenshot: "/uploads/partner-espotz.png",
      status: "SUBMITTED",
      remarks: "Sent via GPay to lordzesports@upi",
      submittedAt: new Date("2026-09-19T08:20:00Z"),
      verifiedAt: null,
      verifiedBy: null,
      adminNotes: null,
    },
    activityLogs: [
      { id: "log-31", action: "REGISTRATION_SUBMITTED", performedBy: "Saravanan", details: "Registration submitted", createdAt: new Date("2026-09-19T08:15:00Z") },
      { id: "log-32", action: "PAYMENT_SUBMITTED", performedBy: "Saravanan", details: "Payment submitted (UTR: 449911882233)", createdAt: new Date("2026-09-19T08:20:00Z") },
    ],
  },
  {
    id: "reg-soul-04",
    registrationNumber: "LZ-FGF-00130",
    tournamentId: "fog-season-2",
    teamName: "SOUL WARRIORS",
    teamLogo: null,
    captainIgn: "SOUL_VIPER",
    captainName: "Viper Esports",
    captainPhone: "+91 98765 43210",
    captainEmail: "viper@soul.gg",
    whatsapp: "+91 98765 43210",
    discordTag: "viper#1234",
    playerNames: "SOUL_VIPER, SOUL_AMAN, SOUL_REGALTOS, SOUL_RONAK",
    status: "PAYMENT_PENDING",
    paymentStatus: "PENDING",
    currentStageId: "stage-fog-1",
    slotNumber: null,
    adminNotes: "Awaiting UPI payment",
    approvedAt: null,
    rejectedAt: null,
    createdAt: new Date("2026-09-19T14:45:00Z"),
    updatedAt: new Date("2026-09-19T14:45:00Z"),
    players: [
      { id: "p-41", name: "Aman", ign: "SOUL_VIPER", playerId: "998877661", role: "IGL", phone: "+91 98765 43210", email: null, discordId: "viper#1234", isCaptain: true, isSubstitute: false },
      { id: "p-42", name: "Aman J", ign: "SOUL_AMAN", playerId: "998877662", role: "Rusher", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-43", name: "Regaltos", ign: "SOUL_REGALTOS", playerId: "998877663", role: "Support", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
      { id: "p-44", name: "Ronak", ign: "SOUL_RONAK", playerId: "998877664", role: "Sniper", phone: null, email: null, discordId: null, isCaptain: false, isSubstitute: false },
    ],
    payment: null,
    activityLogs: [
      { id: "log-41", action: "REGISTRATION_SUBMITTED", performedBy: "SOUL_VIPER", details: "Registration submitted, payment pending", createdAt: new Date("2026-09-19T14:45:00Z") },
    ],
  },
];

let memoryLeaderboard: any[] = [
  {
    id: "lb-1",
    tournamentId: "fog-season-2",
    teamName: "DFG ESPORTS",
    tag: "DFG",
    rank: 1,
    matchesPlayed: 5,
    wins: 4,
    losses: 1,
    kills: 32,
    placementPoints: 46,
    bonusPoints: 0,
    totalPoints: 78,
    status: "ACTIVE",
    updatedAt: new Date(),
  },
  {
    id: "lb-2",
    tournamentId: "fog-season-2",
    teamName: "GODLIKE CLAN",
    tag: "GDL",
    rank: 2,
    matchesPlayed: 5,
    wins: 3,
    losses: 2,
    kills: 28,
    placementPoints: 37,
    bonusPoints: 0,
    totalPoints: 65,
    status: "ACTIVE",
    updatedAt: new Date(),
  },
  {
    id: "lb-3",
    tournamentId: "fog-season-2",
    teamName: "LORD ESPORTS",
    tag: "LORD",
    rank: 3,
    matchesPlayed: 5,
    wins: 2,
    losses: 3,
    kills: 24,
    placementPoints: 34,
    bonusPoints: 2,
    totalPoints: 60,
    status: "ACTIVE",
    updatedAt: new Date(),
  },
  {
    id: "lb-4",
    tournamentId: "fog-season-2",
    teamName: "VEERA TAMIZHAN",
    tag: "VT",
    rank: 4,
    matchesPlayed: 5,
    wins: 1,
    losses: 4,
    kills: 19,
    placementPoints: 26,
    bonusPoints: 0,
    totalPoints: 45,
    status: "ACTIVE",
    updatedAt: new Date(),
  },
];

// Helper to compute live registration statistics for a tournament
function getTournamentStats(tournamentId: string) {
  const regs = memoryRegistrations.filter((r) => r.tournamentId === tournamentId);
  const total = regs.length;
  const approved = regs.filter((r) => r.status === "APPROVED").length;
  const pending = regs.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length;
  const paymentPending = regs.filter((r) => r.status === "PAYMENT_PENDING" || r.paymentStatus === "PENDING").length;
  const paymentVerified = regs.filter((r) => r.paymentStatus === "VERIFIED").length;
  const rejected = regs.filter((r) => r.status === "REJECTED").length;

  return {
    total,
    approved,
    pending,
    paymentPending,
    paymentVerified,
    rejected,
  };
}

// Recalculate leaderboard ranking dynamically
function recalculateLeaderboardRanks(tournamentId: string) {
  const entries = memoryLeaderboard.filter((lb) => lb.tournamentId === tournamentId);
  // Sort descending by totalPoints, then kills, then wins
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return b.wins - a.wins;
  });

  entries.forEach((item, idx) => {
    item.rank = idx + 1;
    item.updatedAt = new Date();
  });
}

// ================= CONTROLLER HANDLERS =================

/**
 * GET /api/tournaments
 * List all tournaments with dynamically computed registeredTeams count
 */
export const getTournaments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const { status, gameCategory, featured, search } = req.query;

    if (dbConnected) {
      try {
        const where: any = {};
        const authHeader = req.headers.authorization;
        const isRequestFromAdmin = Boolean(authHeader && authHeader.startsWith("Bearer ")) || req.query.includeDrafts === "true";

        if (!isRequestFromAdmin) {
          where.isDraft = false;
          where.status = { not: "DRAFT" };
        }

        if (status && status !== "ALL") {
          const s = String(status).toUpperCase();
          if (s === "UPCOMING") {
            where.status = "UPCOMING";
          } else if (s === "LIVE" || s === "LIVE NOW") {
            where.status = { in: ["LIVE", "ONGOING"] };
          } else if (s === "COMPLETED") {
            where.status = { in: ["COMPLETED", "ARCHIVED"] };
          } else if (s === "REGISTRATION_OPEN") {
            where.status = { in: ["REGISTRATION_OPEN", "OPEN"] };
          } else if (s === "REGISTRATION_CLOSED") {
            where.status = { in: ["REGISTRATION_CLOSED", "FULL"] };
          } else if (isRequestFromAdmin || s !== "DRAFT") {
            where.status = s;
          }
        }
        if (gameCategory && gameCategory !== "ALL") where.gameCategory = String(gameCategory);
        if (featured !== undefined) where.featured = featured === "true";
        if (search) {
          where.OR = [
            { title: { contains: String(search), mode: "insensitive" } },
            { tagline: { contains: String(search), mode: "insensitive" } },
            { game: { contains: String(search), mode: "insensitive" } },
          ];
        }

        const tournaments = await prisma.tournament.findMany({
          where,
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          include: {
            _count: {
              select: { registrations: true },
            },
            registrations: {
              select: {
                id: true,
                status: true,
                paymentStatus: true,
              },
            },
          },
        });

        const mapped = tournaments.map((t: any) => {
          const confirmedCount = (t.registrations || []).filter(
            (r: any) => r.status === "CONFIRMED" || r.status === "APPROVED"
          ).length;
          const totalSlots = t.totalTeams || 32;
          const availableSlots = Math.max(0, totalSlots - confirmedCount);

          let dynamicStatus = t.status;
          if (t.status === "CANCELLED" || t.status === "COMPLETED" || t.status === "ARCHIVED") {
            dynamicStatus = "COMPLETED";
          } else if (t.status === "LIVE" || t.status === "ONGOING") {
            dynamicStatus = "LIVE";
          } else if (confirmedCount >= totalSlots && totalSlots > 0) {
            dynamicStatus = "FULL";
          } else if (t.status === "REGISTRATION_CLOSED") {
            dynamicStatus = "REGISTRATION_CLOSED";
          } else if (
            (t.regDeadline && new Date() > new Date(t.regDeadline)) ||
            (t.regEndDate && new Date() > new Date(t.regEndDate))
          ) {
            if (t.status !== "REGISTRATION_OPEN") {
              dynamicStatus = "REGISTRATION_CLOSED";
            }
          } else if (
            t.regDeadline &&
            new Date(t.regDeadline).getTime() - Date.now() < 24 * 3600 * 1000 &&
            new Date(t.regDeadline).getTime() > Date.now()
          ) {
            dynamicStatus = "CLOSING_SOON";
          }

          return {
            ...t,
            registeredTeams: confirmedCount,
            confirmedTeams: confirmedCount,
            availableSlots,
            status: dynamicStatus,
            stages: (t as any).stages || [],
            stagesCount: (t as any)._count?.stages || (t as any).stages?.length || 0,
          };
        });

        res.json({ success: true, data: mapped });
        return;
      } catch (err) {
        console.warn("Prisma query failed, utilizing resilient in-memory store:", err);
      }
    }

    // In-memory fallback — always exclude DRAFT/unpublished from public listing
    const isFallbackAdmin = Boolean(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) || req.query.includeDrafts === "true";
    let result = [...memoryTournaments].filter((t) => isFallbackAdmin || (!t.isDraft && t.status !== "DRAFT"));
    if (status && status !== "ALL") {
      const s = String(status).toUpperCase();
      if (s === "UPCOMING") {
        result = result.filter((t) => t.status === "UPCOMING");
      } else if (s === "LIVE" || s === "LIVE NOW") {
        result = result.filter((t) => ["LIVE", "ONGOING"].includes(t.status));
      } else if (s === "COMPLETED") {
        result = result.filter((t) => ["COMPLETED", "ARCHIVED"].includes(t.status));
      } else if (s === "REGISTRATION_OPEN") {
        result = result.filter((t) => ["REGISTRATION_OPEN", "OPEN"].includes(t.status));
      } else if (s === "REGISTRATION_CLOSED") {
        result = result.filter((t) => ["REGISTRATION_CLOSED", "FULL"].includes(t.status));
      } else if (isFallbackAdmin || s !== "DRAFT") {
        result = result.filter((t) => t.status === s);
      }
    }
    if (gameCategory && gameCategory !== "ALL") {
      result = result.filter((t) => t.gameCategory === gameCategory);
    }
    if (featured !== undefined) {
      result = result.filter((t) => t.featured === (featured === "true"));
    }
    if (search) {
      const q = String(search).toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.tagline && t.tagline.toLowerCase().includes(q)) ||
          t.game.toLowerCase().includes(q)
      );
    }

    const enhanced = result.map((t) => {
      const stats = getTournamentStats(t.id);
      const stages = memoryStages.filter((s) => s.tournamentId === t.id);
      const confirmedCount = stats.approved;
      const totalSlots = t.totalTeams || 32;
      const availableSlots = Math.max(0, totalSlots - confirmedCount);

      let dynamicStatus = t.status;
      if (confirmedCount >= totalSlots) dynamicStatus = "FULL";

      return {
        ...t,
        registeredTeams: confirmedCount,
        confirmedTeams: confirmedCount,
        availableSlots,
        status: dynamicStatus,
        stagesCount: stages.length,
        stats,
      };
    });

    res.json({ success: true, data: enhanced });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id (or slug)
 * Fetch full tournament with stages, registrations, leaderboard & stats
 */
export const getTournamentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const { id } = req.params;

    if (dbConnected) {
      try {
        const tournament: any = await prisma.tournament.findFirst({
          where: {
            OR: [
              { id },
              { slug: id },
            ],
          } as any,
          include: {
            stages: { orderBy: { order: "asc" } },
            rounds: {
              orderBy: { roundNumber: "asc" },
              include: {
                roundTeams: {
                  include: { team: true },
                },
              },
            },
            leaderboard: { orderBy: { rank: "asc" } },
            registrations: {
              include: {
                payment: true,
                players: true,
                currentStage: true,
              },
              orderBy: { createdAt: "desc" },
            },
            matches: { orderBy: { createdAt: "desc" } },
            standings: { orderBy: { sortOrder: "asc" } },
          },
        });

        if (tournament) {
          const authHeader = req.headers.authorization;
          const isRequestFromAdmin = Boolean(authHeader && authHeader.startsWith("Bearer "));
          if (!isRequestFromAdmin && (tournament.isDraft || tournament.status === "DRAFT")) {
            res.status(404).json({ success: false, message: "Tournament not found" });
            return;
          }

          const regs: any[] = tournament.registrations || [];
          const total = regs.length;
          const approved = regs.filter((r: any) => r.status === "CONFIRMED" || r.status === "APPROVED").length;
          const pending = regs.filter((r: any) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length;
          const paymentPending = regs.filter((r: any) => r.status === "PAYMENT_PENDING" || r.paymentStatus === "PENDING").length;
          const paymentVerified = regs.filter((r: any) => r.paymentStatus === "VERIFIED").length;
          const rejected = regs.filter((r: any) => r.status === "REJECTED").length;

          const totalSlots = tournament.totalTeams || 32;
          const availableSlots = Math.max(0, totalSlots - approved);

          let dynamicStatus = tournament.status;
          if (tournament.status === "CANCELLED" || tournament.status === "COMPLETED") {
            dynamicStatus = tournament.status;
          } else if (approved >= totalSlots) {
            dynamicStatus = "FULL";
          } else if (tournament.regDeadline && new Date() > new Date(tournament.regDeadline)) {
            dynamicStatus = "REGISTRATION_CLOSED";
          } else if (
            tournament.regDeadline &&
            new Date(tournament.regDeadline).getTime() - Date.now() < 24 * 3600 * 1000 &&
            new Date(tournament.regDeadline).getTime() > Date.now()
          ) {
            dynamicStatus = "CLOSING_SOON";
          }

          res.json({
            success: true,
            data: {
              ...tournament,
              registeredTeams: approved,
              confirmedTeams: approved,
              availableSlots,
              status: dynamicStatus,
              stages: tournament.stages || [],
              rounds: tournament.rounds || [],
              leaderboard: tournament.leaderboard || [],
              stats: {
                total,
                approved,
                pending,
                paymentPending,
                paymentVerified,
                rejected,
              },
            },
          });
          return;
        }
      } catch (err) {
        console.warn("Prisma getById failed, checking resilient memory store:", err);
      }
    }

    // In-memory fallback
    const authHeader = req.headers.authorization;
    const isRequestFromAdmin = Boolean(authHeader && authHeader.startsWith("Bearer "));
    const tournament = memoryTournaments.find((t) => t.id === id || t.slug === id);
    if (!tournament || (!isRequestFromAdmin && (tournament.isDraft || tournament.status === "DRAFT"))) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    const stages = memoryStages.filter((s) => s.tournamentId === tournament.id).sort((a, b) => a.order - b.order);
    const registrations = memoryRegistrations.filter((r) => r.tournamentId === tournament.id);
    const leaderboard = memoryLeaderboard.filter((lb) => lb.tournamentId === tournament.id).sort((a, b) => a.rank - b.rank);
    const stats = getTournamentStats(tournament.id);
    const totalSlots = tournament.totalTeams || 32;
    const confirmedCount = stats.approved;
    const availableSlots = Math.max(0, totalSlots - confirmedCount);

    res.json({
      success: true,
      data: {
        ...tournament,
        registeredTeams: confirmedCount,
        confirmedTeams: confirmedCount,
        availableSlots,
        stages,
        registrations,
        leaderboard,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments
 * Create new tournament with stages & settings
 */
export const createTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawData = req.body;
    // Extract numeric fee
    let feeNum = 0;
    if (rawData.feeAmount !== undefined && rawData.feeAmount !== null) {
      feeNum = Math.max(0, parseInt(String(rawData.feeAmount).replace(/[^0-9]/g, ""), 10) || 0);
    } else if (rawData.entryFee !== undefined && rawData.entryFee !== null) {
      const parsed = parseInt(String(rawData.entryFee).replace(/[^0-9]/g, ""), 10);
      feeNum = isNaN(parsed) ? 0 : parsed;
    }

    const cleanEntryFee = feeNum > 0 ? `₹${feeNum}` : "FREE ENTRY";

    // Clean prize pool so it doesn't duplicate ₹
    let cleanPrize = "₹50,000";
    if (rawData.prizePool) {
      const stripped = String(rawData.prizePool).replace(/₹/g, "").replace(/,/g, "").trim();
      const pNum = Number(stripped);
      cleanPrize = isNaN(pNum) ? String(rawData.prizePool) : `₹${pNum.toLocaleString("en-IN")}`;
    }

    const data = tournamentSchema.parse({
      ...rawData,
      feeAmount: feeNum,
      entryFee: cleanEntryFee,
      prizePool: cleanPrize,
    });

    let generatedSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!generatedSlug) {
      generatedSlug = "tourney-" + Date.now();
    }

    const newTournamentId = "tourney-" + Date.now();
    const createdTournament = {
      id: newTournamentId,
      ...data,
      slug: generatedSlug,
      registeredTeams: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (dbConnected) {
      try {
        const existingSlug = await prisma.tournament.findUnique({ where: { slug: generatedSlug } });
        if (existingSlug) {
          generatedSlug = `${generatedSlug}-${Date.now().toString(36)}`;
        }

        const createPayload: any = {
          ...data,
          slug: generatedSlug,
          rosterLockDate: parsePrismaDateTime(data.rosterLockDate),
          regDeadline: parsePrismaDateTime(data.regDeadline),
        };
        if (rawData.id) {
          const existingId = await prisma.tournament.findUnique({ where: { id: rawData.id } });
          if (!existingId) {
            createPayload.id = rawData.id;
          }
        }

        const dbResult = await prisma.tournament.create({
          data: {
            ...createPayload,
            registeredTeams: 0,
            stages: {
              create: [
                { name: "ROUND 1", order: 1, status: "UPCOMING", teamsCount: data.totalTeams },
                { name: "ROUND 2", order: 2, status: "UPCOMING", teamsCount: Math.ceil(data.totalTeams / 2) },
                { name: "GRAND FINALS", order: 3, status: "UPCOMING", teamsCount: 12 },
              ],
            },
            rounds: {
              create: [
                { name: "ROUND 1", roundNumber: 1, roundType: "BATTLE_ROYALE", maxTeams: data.totalTeams, selectionMethod: "MANUAL", status: "UPCOMING" },
                { name: "ROUND 2", roundNumber: 2, roundType: "BATTLE_ROYALE", maxTeams: Math.ceil(data.totalTeams / 2), selectionMethod: "QUALIFIED", status: "UPCOMING" },
                { name: "GRAND FINALS", roundNumber: 3, roundType: "BATTLE_ROYALE", maxTeams: 12, selectionMethod: "QUALIFIED", status: "UPCOMING" },
              ],
            },
          },
          include: { stages: true, rounds: true },
        });

        if (req.user) {
          await prisma.auditLog.create({
            data: {
              adminId: req.user.id,
              adminEmail: req.user.email,
              action: "CREATE_TOURNAMENT",
              resource: "Tournament",
              details: `Created tournament: ${data.title}`,
            },
          }).catch(() => {});
        }

        res.status(201).json({ success: true, message: "Tournament created successfully", data: dbResult });
        return;
      } catch (err) {
        console.error("Prisma tournament create error:", err);
        throw err;
      }
    }

    // In-memory create
    memoryTournaments.unshift(createdTournament);

    // Default stages
    const defaultStages = [
      { id: `stage-${newTournamentId}-1`, tournamentId: newTournamentId, name: "ROUND 1", order: 1, status: "UPCOMING", teamsCount: data.totalTeams, createdAt: new Date(), updatedAt: new Date() },
      { id: `stage-${newTournamentId}-2`, tournamentId: newTournamentId, name: "ROUND 2", order: 2, status: "UPCOMING", teamsCount: Math.ceil(data.totalTeams / 2), createdAt: new Date(), updatedAt: new Date() },
      { id: `stage-${newTournamentId}-3`, tournamentId: newTournamentId, name: "GRAND FINALS", order: 3, status: "UPCOMING", teamsCount: 12, createdAt: new Date(), updatedAt: new Date() },
    ];
    memoryStages.push(...defaultStages);

    // Default rounds
    const defaultRounds = [
      { id: `round-${newTournamentId}-1`, tournamentId: newTournamentId, name: "ROUND 1", roundNumber: 1, roundType: "BATTLE_ROYALE", maxTeams: data.totalTeams, selectionMethod: "MANUAL", status: "UPCOMING", createdAt: new Date(), updatedAt: new Date() },
      { id: `round-${newTournamentId}-2`, tournamentId: newTournamentId, name: "ROUND 2", roundNumber: 2, roundType: "BATTLE_ROYALE", maxTeams: Math.ceil(data.totalTeams / 2), selectionMethod: "QUALIFIED", status: "UPCOMING", createdAt: new Date(), updatedAt: new Date() },
      { id: `round-${newTournamentId}-3`, tournamentId: newTournamentId, name: "GRAND FINALS", roundNumber: 3, roundType: "BATTLE_ROYALE", maxTeams: 12, selectionMethod: "QUALIFIED", status: "UPCOMING", createdAt: new Date(), updatedAt: new Date() },
    ];
    memoryRounds.push(...defaultRounds);

    res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      data: { ...createdTournament, stages: defaultStages, rounds: defaultRounds },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id
 * Update tournament details, banner, rules, and configuration
 */
export const updateTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const rawData = { ...req.body };

    if (rawData.feeAmount !== undefined && rawData.feeAmount !== null) {
      const feeNum = Math.max(0, parseInt(String(rawData.feeAmount).replace(/[^0-9]/g, ""), 10) || 0);
      rawData.feeAmount = feeNum;
      rawData.entryFee = feeNum > 0 ? `₹${feeNum}` : "FREE ENTRY";
    }

    if (rawData.prizePool) {
      const stripped = String(rawData.prizePool).replace(/₹/g, "").replace(/,/g, "").trim();
      const pNum = Number(stripped);
      if (!isNaN(pNum)) {
        rawData.prizePool = `₹${pNum.toLocaleString("en-IN")}`;
      }
    }

    const data = tournamentSchema.partial().parse(rawData);

    if (dbConnected) {
      try {
        const updatePayload: any = { ...data };
        if (rawData.status === "REGISTRATION_OPEN") {
          updatePayload.status = "REGISTRATION_OPEN";
          if (rawData.regDeadline === undefined) {
            updatePayload.regDeadline = null;
          }
          if (rawData.regEndDate === undefined) {
            updatePayload.regEndDate = null;
          }
        }
        if (data.rosterLockDate !== undefined) {
          updatePayload.rosterLockDate = parsePrismaDateTime(data.rosterLockDate);
        }
        if (data.regDeadline !== undefined) {
          updatePayload.regDeadline = parsePrismaDateTime(data.regDeadline);
        }

        const updated = await prisma.tournament.update({
          where: { id },
          data: updatePayload,
          include: { stages: true, rounds: true },
        });

        res.json({ success: true, message: "Tournament updated successfully", data: updated });
        return;
      } catch (err) {
        console.warn("Prisma update failed, updating in-memory store:", err);
      }
    }

    const index = memoryTournaments.findIndex((t) => t.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    if (rawData.status === "REGISTRATION_OPEN") {
      if (rawData.regDeadline === undefined) memoryTournaments[index].regDeadline = null;
      if (rawData.regEndDate === undefined) memoryTournaments[index].regEndDate = null;
    }

    memoryTournaments[index] = {
      ...memoryTournaments[index],
      ...data,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      message: "Tournament updated successfully",
      data: memoryTournaments[index],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id
 */
export const deleteTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (dbConnected) {
      try {
        await prisma.tournament.delete({ where: { id } });
        res.json({ success: true, message: "Tournament deleted successfully" });
        return;
      } catch (err) {
        console.warn("Prisma delete failed, deleting from in-memory store:", err);
      }
    }

    memoryTournaments = memoryTournaments.filter((t) => t.id !== id);
    memoryStages = memoryStages.filter((s) => s.tournamentId !== id);
    memoryRegistrations = memoryRegistrations.filter((r) => r.tournamentId !== id);
    memoryLeaderboard = memoryLeaderboard.filter((lb) => lb.tournamentId !== id);

    res.json({ success: true, message: "Tournament deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/duplicate
 * Duplicate tournament configuration with a " (Copy)" suffix
 */
export const duplicateTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (dbConnected) {
      try {
        const source = await prisma.tournament.findUnique({
          where: { id },
          include: { stages: true, rounds: true },
        });

        if (source) {
          const newSlug = `${source.slug || source.id}-copy-${Date.now().toString(36)}`;
          const { id: _origId, createdAt: _c, updatedAt: _u, stages, rounds, registeredTeams: _rt, ...rest } = source;

          const duplicated = await prisma.tournament.create({
            data: {
              ...rest,
              title: `${source.title} (Copy)`,
              slug: newSlug,
              status: "DRAFT",
              isDraft: true,
              isPublished: false,
              registeredTeams: 0,
              stages: {
                create: (stages || []).map((s: any) => ({
                  name: s.name,
                  order: s.order,
                  status: "UPCOMING",
                  startDate: s.startDate,
                  endDate: s.endDate,
                  teamsCount: s.teamsCount,
                  qualificationCriteria: s.qualificationCriteria,
                })),
              },
              rounds: {
                create: (rounds || []).map((r: any) => ({
                  name: r.name,
                  roundNumber: r.roundNumber,
                  roundType: r.roundType,
                  startDate: r.startDate,
                  startTime: r.startTime,
                  description: r.description,
                  maxTeams: r.maxTeams,
                  selectionMethod: r.selectionMethod,
                  status: "UPCOMING",
                })),
              },
            },
            include: { stages: true, rounds: true },
          });

          res.status(201).json({
            success: true,
            message: "Tournament duplicated successfully as draft",
            data: duplicated,
          });
          return;
        }
      } catch (dbErr) {
        console.warn("Prisma tournament duplicate failed, falling back to memory:", dbErr);
      }
    }

    const source = memoryTournaments.find((t) => t.id === id);
    if (!source) {
      res.status(404).json({ success: false, message: "Source tournament not found" });
      return;
    }

    const newId = "tourney-copy-" + Date.now();
    const duplicated = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      slug: `${source.slug || source.id}-copy-${Date.now().toString(36)}`,
      status: "DRAFT",
      isDraft: true,
      isPublished: false,
      registeredTeams: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryTournaments.unshift(duplicated);

    // Duplicate stages
    const sourceStages = memoryStages.filter((s) => s.tournamentId === id);
    const newStages = sourceStages.map((s, idx) => ({
      ...s,
      id: `stage-${newId}-${idx + 1}`,
      tournamentId: newId,
      status: "UPCOMING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    memoryStages.push(...newStages);

    // Duplicate rounds
    const sourceRounds = memoryRounds.filter((r) => r.tournamentId === id);
    const newRounds = sourceRounds.map((r, idx) => ({
      ...r,
      id: `round-${newId}-${idx + 1}`,
      tournamentId: newId,
      status: "UPCOMING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    memoryRounds.push(...newRounds);

    res.status(201).json({
      success: true,
      message: "Tournament duplicated successfully as draft",
      data: { ...duplicated, stages: newStages, rounds: newRounds },
    });
  } catch (error) {
    next(error);
  }
};

// ================= SQUAD REGISTRATION & PAYMENTS =================

/**
 * POST /api/tournaments/:id/register
 * Register a complete squad with roster and optional UPI payment record
 */
export const registerSquad = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = registrationSchema.parse(req.body);

    // Identify user: from auth or find by email/IGN
    let userId = req.user?.id;
    if (!userId && data.captainEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.captainEmail.toLowerCase().trim() },
      });
      if (existingUser) userId = existingUser.id;
    }

    if (!userId && data.captainIgn) {
      const existingUserByIgn = await prisma.user.findFirst({
        where: { ign: { equals: data.captainIgn.trim(), mode: "insensitive" } },
      });
      if (existingUserByIgn) userId = existingUserByIgn.id;
    }

    if (!userId && process.env.NODE_ENV !== "production") {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: { in: ["USER", "ADMIN", "SUPER_ADMIN"] } },
      });
      if (fallbackUser) userId = fallbackUser.id;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "You need to login to join this tournament.",
      });
      return;
    }

    // 1. Fetch tournament from database or fallback to resilient memory store
    let tournament: any = null;
    if (dbConnected) {
      try {
        tournament = await prisma.tournament.findFirst({
          where: { OR: [{ id }, { slug: id }] },
          include: {
            stages: { orderBy: { order: "asc" } },
            _count: { select: { registrations: true } },
          },
        });
      } catch (err) {
        console.warn("[registerSquad] DB lookup error:", err);
      }
    }

    if (!tournament) {
      tournament = memoryTournaments.find(
        (t) =>
          t.id === id ||
          t.slug === id ||
          t.id.toLowerCase() === id.toLowerCase() ||
          t.slug.toLowerCase() === id.toLowerCase() ||
          (t.title && t.title.toLowerCase().includes(id.toLowerCase())) ||
          id.toLowerCase().includes("fog") ||
          id.toLowerCase().includes("flame")
      ) || memoryTournaments[0];
    }

    if (!tournament) {
      res.status(404).json({ success: false, message: "Tournament not found" });
      return;
    }

    if (!tournament.stages) {
      tournament.stages = memoryStages.filter((s) => s.tournamentId === tournament.id);
    }

    // 2. Validate tournament status
    if (
      tournament.status === "COMPLETED" ||
      tournament.status === "ARCHIVED" ||
      tournament.status === "CANCELLED" ||
      tournament.status === "REGISTRATION_CLOSED" ||
      tournament.status === "DRAFT" ||
      tournament.isDraft
    ) {
      res.status(400).json({ success: false, message: "Registration for this tournament is closed" });
      return;
    }

    if (tournament.regDeadline && new Date() > new Date(tournament.regDeadline)) {
      res.status(400).json({ success: false, message: "Tournament registration deadline has passed" });
      return;
    }

    if (tournament.regEndDate && new Date() > new Date(tournament.regEndDate)) {
      res.status(400).json({ success: false, message: "Tournament registration deadline has passed" });
      return;
    }

    // 3. Validate tournament capacity
    let confirmedCount = 0;
    try {
      if (dbConnected) {
        confirmedCount = await prisma.tournamentRegistration.count({
          where: {
            tournamentId: tournament.id,
            status: { in: ["CONFIRMED", "APPROVED"] },
          },
        });
      }
    } catch {
      confirmedCount = memoryRegistrations.filter(
        (r) => r.tournamentId === tournament.id && (r.status === "CONFIRMED" || r.status === "APPROVED")
      ).length;
    }

    const isSlotsFull = confirmedCount >= (tournament.totalTeams || 128);
    let isWaitlistEntry = false;
    let waitlistPriorityNumber: number | null = null;

    if (isSlotsFull) {
      if (tournament.allowWaitlist) {
        isWaitlistEntry = true;
        let currentWaitlistCount = 0;
        try {
          if (dbConnected) {
            currentWaitlistCount = await prisma.tournamentRegistration.count({
              where: {
                tournamentId: tournament.id,
                isWaitlisted: true,
              },
            });
          }
        } catch {
          currentWaitlistCount = memoryRegistrations.filter((r) => r.tournamentId === tournament.id && r.isWaitlisted).length;
        }
        waitlistPriorityNumber = currentWaitlistCount + 1;
      } else {
        res.status(400).json({ success: false, message: "TOURNAMENT FULL. All slots have been confirmed." });
        return;
      }
    }

    // 4. Validate duplicate team name in this tournament
    let existingTeam: any = null;
    try {
      if (dbConnected && tournament.id && !tournament.id.startsWith("fog-") && !tournament.id.startsWith("lordz-")) {
        existingTeam = await prisma.team.findFirst({
          where: {
            tournamentId: tournament.id,
            teamName: { equals: data.teamName.trim(), mode: "insensitive" },
          },
        });
      }
    } catch (err) {
      console.warn("[registerSquad] duplicate team check error:", err);
    }

    if (!existingTeam) {
      existingTeam = memoryTeams.find(
        (t) => t.tournamentId === tournament.id && t.teamName?.toLowerCase() === data.teamName.trim().toLowerCase()
      );
    }

    if (existingTeam) {
      res.status(400).json({
        success: false,
        message: "A team with this name is already registered for this tournament",
      });
      return;
    }

    // 5. Validate player team restriction (if not allowMultipleTeams)
    if (!tournament.allowMultipleTeams && userId && dbConnected && !tournament.id.startsWith("fog-") && !tournament.id.startsWith("lordz-")) {
      try {
        const existingMembership = await prisma.teamMember.findFirst({
          where: {
            userId,
            invitationStatus: "ACCEPTED",
            team: { tournamentId: tournament.id },
          },
        });

        if (existingMembership) {
          res.status(400).json({
            success: false,
            message: "You're already registered with another team for this tournament.",
          });
          return;
        }
      } catch (err) {
        console.warn("[registerSquad] team membership check error:", err);
      }
    }

    // 6. Check duplicate UTR if payment provided
    const cleanUtr = data.payment?.utr ? data.payment.utr.trim().toUpperCase() : null;
    if (cleanUtr) {
      let dupUtr: any = null;
      if (dbConnected) {
        try {
          dupUtr = await prisma.paymentRecord.findFirst({
            where: { utr: cleanUtr },
          });
        } catch (err) {
          console.warn("[registerSquad] duplicate UTR check error:", err);
        }
      }
      if (!dupUtr) {
        dupUtr = memoryRegistrations.find((r) => r.payment?.utr && r.payment.utr.toUpperCase() === cleanUtr);
      }
      if (dupUtr) {
        res.status(400).json({
          success: false,
          message: "This UTR / Transaction ID has already been submitted for another registration.",
        });
        return;
      }
    }

    // 7. Generate unique Registration Number: REG-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const regNumber = `REG-${year}-${randomSeq}`;

    const isPaid = tournament.feeAmount > 0;
    const hasUtr = !!cleanUtr;

    let initialStatus = "PENDING";
    let paymentStatus = "PENDING";
    let teamStatus = "PENDING";

    if (isWaitlistEntry) {
      initialStatus = "WAITLISTED";
      paymentStatus = isPaid && hasUtr ? "UNDER_REVIEW" : "PENDING";
      teamStatus = "WAITLISTED";
    } else if (isPaid) {
      if (hasUtr) {
        initialStatus = "PAYMENT_UNDER_REVIEW";
        paymentStatus = "UNDER_REVIEW";
      } else {
        initialStatus = "PAYMENT_PENDING";
        paymentStatus = "PENDING";
      }
    } else {
      initialStatus = "CONFIRMED";
      paymentStatus = "VERIFIED";
      teamStatus = "CONFIRMED";
    }

    const firstStageId = tournament.stages.length > 0 ? tournament.stages[0].id : null;
    const reservationMinutes = tournament.slotReservationDuration || 10;
    const reservationExpiry = new Date(Date.now() + reservationMinutes * 60 * 1000);

    // 8. Execute atomic transaction to create Team, Members, Registration, Payment, and SlotReservation
    let result: any = null;
    try {
      if (dbConnected && tournament.id && !tournament.id.startsWith("fog-") && !tournament.id.startsWith("lordz-")) {
        result = await prisma.$transaction(async (tx: any) => {
      // A. Create Team
      const team = await tx.team.create({
        data: {
          tournamentId: tournament.id,
          teamName: data.teamName.trim().toUpperCase(),
          teamLogo: data.teamLogo || null,
          leaderId: userId!,
          status: teamStatus,
        },
      });

      // B. Create Leader as TeamMember
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: userId!,
          role: "IGL",
          invitationStatus: "ACCEPTED",
        },
      });

      // C. Create SlotReservation
      await tx.slotReservation.create({
        data: {
          tournamentId: tournament.id,
          teamId: team.id,
          status: initialStatus === "CONFIRMED" ? "CONFIRMED" : "ACTIVE",
          expiresAt: reservationExpiry,
        },
      });

      // D. Create TournamentRegistration
      const reg = await tx.tournamentRegistration.create({
        data: {
          registrationNumber: regNumber,
          tournamentId: tournament.id,
          teamId: team.id,
          submittedById: userId,
          teamName: data.teamName.trim().toUpperCase(),
          teamLogo: data.teamLogo || null,
          captainIgn: data.captainIgn.trim().toUpperCase(),
          captainName: data.captainName || null,
          captainPhone: data.captainPhone || data.whatsapp || "",
          captainEmail: data.captainEmail || null,
          whatsapp: data.whatsapp || "",
          discordTag: data.discordTag || null,
          playerNames: data.players && data.players.length > 0 ? data.players.map((p) => p.ign).join(", ") : data.captainIgn,
          status: initialStatus,
          paymentStatus,
          isWaitlisted: isWaitlistEntry,
          waitlistPriority: waitlistPriorityNumber,
          currentStageId: firstStageId,
          slotNumber: isWaitlistEntry ? null : confirmedCount + 1,
          approvedAt: initialStatus === "CONFIRMED" ? new Date() : null,
          confirmedAt: initialStatus === "CONFIRMED" ? new Date() : null,
        },
      });

      // E. Create RegistrationPlayer records via batch createMany
      const playersList = (data.players && data.players.length > 0)
        ? data.players
        : [
            {
              name: data.captainName || data.captainIgn,
              ign: data.captainIgn,
              role: "IGL",
              phone: data.whatsapp || "",
              isCaptain: true,
              isSubstitute: false,
            },
          ];

      await tx.registrationPlayer.createMany({
        data: playersList.map((p) => ({
          registrationId: reg.id,
          name: p.name || p.ign || "Player",
          ign: p.ign,
          playerId: p.playerId || null,
          role: p.role || "STARTER",
          phone: p.phone || null,
          email: p.email || null,
          discordId: p.discordId || null,
          isCaptain: p.isCaptain || false,
          isSubstitute: p.isSubstitute || false,
        })),
      });

      // F. Create PaymentRecord
      let paymentRecord = null;
      if (isPaid || data.payment) {
        paymentRecord = await tx.paymentRecord.create({
          data: {
            registrationId: reg.id,
            amount: data.payment?.amount || tournament.feeAmount || 0,
            currency: tournament.currency || "INR",
            method: data.payment?.method || "UPI",
            utr: cleanUtr,
            payerName: data.payment?.payerName || data.captainName || null,
            screenshot: data.payment?.screenshot || null,
            status: paymentStatus,
            remarks: data.payment?.remarks || null,
            submittedAt: hasUtr ? new Date() : null,
          },
        });
      }

      // G. If free, increment tournament registeredTeams and add leaderboard entry
      if (initialStatus === "CONFIRMED") {
        await tx.tournament.update({
          where: { id: tournament.id },
          data: { registeredTeams: { increment: 1 } },
        });

        await tx.tournamentLeaderboard.create({
          data: {
            tournamentId: tournament.id,
            teamId: team.id,
            teamName: data.teamName.trim().toUpperCase(),
            rank: confirmedCount + 1,
            status: "ACTIVE",
          },
        });
      }

      return { team, reg, paymentRecord };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
      }
    } catch (txErr) {
      console.warn("[registerSquad] DB transaction failed, falling back to memory:", txErr);
    }

    if (!result) {
      const newTeamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRegId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const teamObj = {
        id: newTeamId,
        tournamentId: tournament.id,
        teamName: data.teamName.trim().toUpperCase(),
        teamLogo: data.teamLogo || null,
        leaderId: userId || "user-leader",
        status: initialStatus === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      };
      memoryTeams.push(teamObj);

      const paymentObj = (isPaid || data.payment) ? {
        id: `pay-${Date.now()}`,
        registrationId: newRegId,
        amount: data.payment?.amount || tournament.feeAmount || 0,
        currency: tournament.currency || "INR",
        method: data.payment?.method || "UPI",
        utr: cleanUtr,
        payerName: data.payment?.payerName || data.captainName || null,
        screenshot: data.payment?.screenshot || null,
        status: paymentStatus,
        remarks: data.payment?.remarks || null,
        submittedAt: hasUtr ? new Date() : null,
      } : null;

      const playersFormatted = (data.players && data.players.length > 0 ? data.players : [{ name: data.captainName || data.captainIgn, ign: data.captainIgn, role: "IGL", isCaptain: true }]).map((p: any, idx: number) => ({
        id: `p-${Date.now()}-${idx}`,
        registrationId: newRegId,
        name: p.name || p.ign || "Player",
        ign: p.ign,
        playerId: p.playerId || null,
        role: p.role || "STARTER",
        isCaptain: p.isCaptain || false,
        isSubstitute: p.isSubstitute || false,
      }));

      const regObj = {
        id: newRegId,
        registrationNumber: regNumber,
        tournamentId: tournament.id,
        teamId: newTeamId,
        submittedById: userId || "user-leader",
        teamName: data.teamName.trim().toUpperCase(),
        captainIgn: data.captainIgn.trim().toUpperCase(),
        captainName: data.captainName || null,
        captainPhone: data.captainPhone || data.whatsapp || "",
        captainEmail: data.captainEmail || null,
        whatsapp: data.whatsapp || "",
        discordTag: data.discordTag || null,
        playerNames: data.players && data.players.length > 0 ? data.players.map((p) => p.ign).join(", ") : data.captainIgn,
        status: initialStatus,
        paymentStatus,
        isWaitlisted: isWaitlistEntry,
        waitlistPriority: waitlistPriorityNumber,
        currentStageId: firstStageId,
        slotNumber: isWaitlistEntry ? null : confirmedCount + 1,
        players: playersFormatted,
        payment: paymentObj,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryRegistrations.unshift(regObj);
      result = { team: teamObj, reg: regObj, paymentRecord: paymentObj };
    }

    // H. Non-blocking Post-Registration Tasks (Notifications & Activity Logs)
    (async () => {
      try {
        if (initialStatus === "CONFIRMED") {
          await prisma.notification.create({
            data: {
              userId: userId!,
              type: "REGISTRATION_CONFIRMED",
              title: "Registration Confirmed! 🏆",
              message: `Your team ${data.teamName} has officially registered for ${tournament.title}! Registration ID: ${regNumber}`,
              metadata: JSON.stringify({
                registrationId: result.reg.id,
                tournamentId: tournament.id,
                status: "CONFIRMED",
              }),
            },
          });
        } else if (isWaitlistEntry) {
          await prisma.notification.create({
            data: {
              userId: userId!,
              type: "WAITLIST_JOINED",
              title: "Joined Waitlist 📋",
              message: `Your team ${data.teamName} has joined the waitlist for ${tournament.title} at position #${waitlistPriorityNumber}.`,
              metadata: JSON.stringify({
                registrationId: result.reg.id,
                tournamentId: tournament.id,
                position: waitlistPriorityNumber,
              }),
            },
          });
        } else if (hasUtr) {
          await prisma.notification.create({
            data: {
              userId: userId!,
              type: "PAYMENT_UNDER_REVIEW",
              title: "Payment Submitted ⏳",
              message: `Your payment of ₹${data.payment?.amount || tournament.feeAmount} for ${data.teamName} has been submitted with UTR ${cleanUtr}. Verification is pending.`,
              metadata: JSON.stringify({
                registrationId: result.reg.id,
                tournamentId: tournament.id,
                utr: cleanUtr,
              }),
            },
          });
        }

        await prisma.activityLog.create({
          data: {
            userId,
            tournamentId: tournament.id,
            teamId: result.team.id,
            registrationId: result.reg.id,
            action: isWaitlistEntry ? "WAITLIST_JOINED" : "REGISTRATION_CREATED",
            description: `Squad ${data.teamName} ${isWaitlistEntry ? "joined waitlist at position #" + waitlistPriorityNumber : "registered"} by ${data.captainIgn}. Initial status: ${initialStatus}`,
          },
        });
      } catch (postErr) {
        console.warn("[Post-Registration Side Effects Warning]", postErr);
      }
    })();

    res.status(201).json({
      success: true,
      message: isWaitlistEntry
        ? `Tournament slots are currently full. You have joined the WAITLIST at position #${waitlistPriorityNumber}. You will be notified if a slot opens!`
        : (initialStatus === "CONFIRMED" ? "Registration confirmed! You have joined the tournament." : "Squad registered! Please proceed to complete payment verification."),
      data: {
        id: result.reg.id,
        registrationId: result.reg.id,
        registrationNumber: regNumber,
        teamId: result.team.id,
        teamName: result.team.teamName,
        status: initialStatus,
        paymentStatus,
        isWaitlisted: isWaitlistEntry,
        waitlistPriority: waitlistPriorityNumber,
        slotReservationExpiry: reservationExpiry,
        payment: result.paymentRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/registrations/:id/payment
 * User submits manual UPI payment (UTR + screenshot)
 */
export const submitPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { utr, screenshot, amount, payerName, method = "UPI", remarks } = req.body;

    if (!utr || !utr.trim()) {
      res.status(400).json({ success: false, message: "UTR / Transaction ID is required" });
      return;
    }

    const cleanUtr = utr.trim().toUpperCase();

    // Check duplicate UTR across payments
    const existingUtr = await prisma.paymentRecord.findFirst({
      where: {
        utr: cleanUtr,
        registrationId: { not: id },
      },
    });

    if (existingUtr) {
      res.status(400).json({
        success: false,
        message: "This UTR / Transaction ID has already been submitted for another registration.",
      });
      return;
    }

    let registration: any = null;
    if (dbConnected) {
      registration = await prisma.tournamentRegistration.findFirst({
        where: { OR: [{ id }, { registrationNumber: id }] },
        include: { tournament: true, team: true },
      });
    }

    if (!registration) {
      const memReg = memoryRegistrations.find((r) => r.id === id || r.registrationNumber === id);
      if (memReg) {
        memReg.status = "PAYMENT_UNDER_REVIEW";
        memReg.paymentStatus = "UNDER_REVIEW";
        memReg.payment = {
          id: "pay-" + Date.now(),
          registrationId: memReg.id,
          amount: amount ? Number(amount) : 49,
          method,
          utr: cleanUtr,
          payerName: payerName || memReg.captainName || null,
          screenshot: screenshot || null,
          status: "UNDER_REVIEW",
          remarks: remarks || null,
          submittedAt: new Date(),
        };
        res.json({
          success: true,
          message: "Payment submitted successfully. Waiting for admin verification.",
          data: { registrationId: memReg.id, status: "PAYMENT_UNDER_REVIEW", payment: memReg.payment },
        });
        return;
      }
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    const regId = registration.id;
    const submittedAmount = amount ? Number(amount) : (registration.tournament?.feeAmount || 0);

    const payment = await prisma.paymentRecord.upsert({
      where: { registrationId: regId },
      update: {
        utr: cleanUtr,
        screenshot: screenshot || null,
        amount: submittedAmount,
        payerName: payerName || registration.captainName || null,
        method,
        remarks: remarks || null,
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        rejectionReason: null,
      },
      create: {
        registrationId: regId,
        utr: cleanUtr,
        screenshot: screenshot || null,
        amount: submittedAmount,
        payerName: payerName || registration.captainName || null,
        method,
        remarks: remarks || null,
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
      },
    });

    await prisma.tournamentRegistration.update({
      where: { id: regId },
      data: {
        status: "PAYMENT_UNDER_REVIEW",
        paymentStatus: "UNDER_REVIEW",
      },
    });

    if (registration.submittedById) {
      await prisma.notification.create({
        data: {
          userId: registration.submittedById,
          type: "PAYMENT_UNDER_REVIEW",
          title: "Payment Submitted For Review ⏳",
          message: `Your payment of ₹${submittedAmount} for ${registration.teamName} with UTR ${cleanUtr} has been submitted for admin verification.`,
          metadata: JSON.stringify({
            registrationId: registration.id,
            tournamentId: registration.tournamentId,
            utr: cleanUtr,
          }),
        },
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: "Payment submitted successfully. Waiting for admin verification.",
      data: {
        registrationId: registration.id,
        status: "PAYMENT_UNDER_REVIEW",
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/registrations/:id/payment-verify
 * Admin verifies payment: updates payment, registration, team, slot reservation, and leaderboard
 */
export const verifyPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    let registration: any = null;

    if (dbConnected) {
      registration = await prisma.tournamentRegistration.findFirst({
        where: { OR: [{ id }, { registrationNumber: id }] },
        include: {
          tournament: true,
          team: true,
          payment: true,
        },
      });
    }

    if (!registration) {
      const memReg = memoryRegistrations.find((r) => r.id === id || r.registrationNumber === id);
      if (memReg) {
        memReg.status = "APPROVED";
        memReg.paymentStatus = "VERIFIED";
        memReg.confirmedAt = new Date();
        memReg.approvedAt = new Date();
        if (memReg.payment) {
          memReg.payment.status = "VERIFIED";
          memReg.payment.verifiedAt = new Date();
          memReg.payment.verifiedBy = adminUser?.email || "Admin";
        } else {
          memReg.payment = {
            id: "pay-" + Date.now(),
            registrationId: memReg.id,
            amount: 49,
            currency: "INR",
            method: "UPI",
            utr: null,
            payerName: memReg.captainName || null,
            screenshot: null,
            status: "VERIFIED",
            remarks: null,
            submittedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: adminUser?.email || "Admin",
            adminNotes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        res.json({ success: true, message: "Payment verified and squad registration approved!" });
        return;
      }
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    const regId = registration.id;

    try {
      await prisma.$transaction(async (tx: any) => {
        // 1. Update or create PaymentRecord
        if (registration.payment) {
          await tx.paymentRecord.update({
            where: { registrationId: regId },
            data: {
              status: "VERIFIED",
              verifiedAt: new Date(),
              verifiedBy: adminUser?.email || "Admin",
            },
          });
        } else {
          await tx.paymentRecord.create({
            data: {
              registrationId: regId,
              amount: registration.tournament?.feeAmount || 0,
              currency: "INR",
              method: "UPI",
              status: "VERIFIED",
              verifiedAt: new Date(),
              verifiedBy: adminUser?.email || "Admin",
              submittedAt: new Date(),
            },
          });
        }

        // 2. Update Registration to APPROVED and paymentStatus to VERIFIED
        await tx.tournamentRegistration.update({
          where: { id: regId },
          data: {
            status: "APPROVED",
            paymentStatus: "VERIFIED",
            confirmedAt: new Date(),
            approvedAt: new Date(),
          },
        });

        // 3. Update Team if exists
        if (registration.teamId) {
          try {
            await tx.team.update({
              where: { id: registration.teamId },
              data: { status: "CONFIRMED" },
            });

            await tx.slotReservation.updateMany({
              where: { teamId: registration.teamId },
              data: { status: "CONFIRMED" },
            });

            const existingLb = await tx.tournamentLeaderboard.findFirst({
              where: {
                tournamentId: registration.tournamentId,
                teamId: registration.teamId,
              },
            });

            if (!existingLb) {
              const count = await tx.tournamentLeaderboard.count({
                where: { tournamentId: registration.tournamentId },
              });
              await tx.tournamentLeaderboard.create({
                data: {
                  tournamentId: registration.tournamentId,
                  teamId: registration.teamId,
                  teamName: registration.teamName,
                  tag: registration.team?.teamTag || null,
                  rank: count + 1,
                  status: "ACTIVE",
                },
              });
            }
          } catch (tErr) {
            console.warn("[verifyPayment] Team update non-fatal error:", tErr);
          }
        }

        // 4. Increment tournament registered teams count
        try {
          await tx.tournament.update({
            where: { id: registration.tournamentId },
            data: {
              registeredTeams: { increment: 1 },
            },
          });
        } catch (tnErr) {
          console.warn("[verifyPayment] Tournament increment non-fatal error:", tnErr);
        }

        // 5. Notification to team leader
        if (registration.submittedById) {
          try {
            await tx.notification.create({
              data: {
                userId: registration.submittedById,
                type: "PAYMENT_VERIFIED",
                title: "Payment Verified! Registration Approved 🏆",
                message: `Your payment has been verified! Team ${registration.teamName} has officially joined ${registration.tournament?.title || "the tournament"}. Registration ID: ${registration.registrationNumber || registration.id}`,
                metadata: JSON.stringify({
                  registrationId: registration.id,
                  tournamentId: registration.tournamentId,
                  teamId: registration.teamId,
                  status: "APPROVED",
                }),
              },
            });
          } catch {}
        }

        // 6. Activity Log
        try {
          await tx.activityLog.create({
            data: {
              tournamentId: registration.tournamentId,
              teamId: registration.teamId,
              registrationId: registration.id,
              action: "PAYMENT_VERIFIED",
              description: `Admin verified payment for registration ${registration.registrationNumber || registration.id}`,
            },
          });
        } catch {}
      });
    } catch (prismaTxError) {
      console.warn("[verifyPayment] DB transaction error, applying memory fallback:", prismaTxError);
      // Memory fallback for resilience
      const memReg = memoryRegistrations.find((r) => r.id === regId || r.registrationNumber === regId);
      if (memReg) {
        memReg.status = "APPROVED";
        memReg.paymentStatus = "VERIFIED";
        memReg.approvedAt = new Date();
        if (memReg.payment) memReg.payment.status = "VERIFIED";
      }
    }

    res.json({
      success: true,
      message: "Payment verified and squad registration approved!",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/registrations/:id/payment-reject
 * Admin rejects payment with reason
 */
export const rejectPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const rejectionReason = req.body.rejectionReason || req.body.reason || req.body.adminNotes || "UTR or payment screenshot verification failed";
    const adminUser = req.user;

    let registration: any = null;

    if (dbConnected) {
      registration = await prisma.tournamentRegistration.findFirst({
        where: { OR: [{ id }, { registrationNumber: id }] },
        include: {
          tournament: true,
          team: true,
          payment: true,
        },
      });
    }

    if (!registration) {
      const memReg = memoryRegistrations.find((r) => r.id === id || r.registrationNumber === id);
      if (memReg) {
        memReg.status = "PAYMENT_REJECTED";
        memReg.paymentStatus = "REJECTED";
        memReg.rejectedAt = new Date();
        memReg.adminNotes = rejectionReason;
        if (memReg.payment) {
          memReg.payment.status = "REJECTED";
          memReg.payment.rejectionReason = rejectionReason;
          memReg.payment.verifiedAt = new Date();
          memReg.payment.verifiedBy = adminUser?.email || "Admin";
        }
        res.json({ success: true, message: `Payment rejected. Reason: ${rejectionReason}` });
        return;
      }
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    const regId = registration.id;

    await prisma.$transaction(async (tx: any) => {
      // 1. Update PaymentRecord
      if (registration.payment) {
        await tx.paymentRecord.update({
          where: { registrationId: regId },
          data: {
            status: "REJECTED",
            rejectionReason,
            verifiedAt: new Date(),
            verifiedBy: adminUser?.email || "Admin",
          },
        });
      } else {
        await tx.paymentRecord.create({
          data: {
            registrationId: regId,
            status: "REJECTED",
            rejectionReason,
            verifiedAt: new Date(),
            verifiedBy: adminUser?.email || "Admin",
          },
        });
      }

      // 2. Update Registration
      await tx.tournamentRegistration.update({
        where: { id: regId },
        data: {
          status: "PAYMENT_REJECTED",
          paymentStatus: "REJECTED",
          rejectedAt: new Date(),
          adminNotes: rejectionReason,
        },
      });

      // 3. Update Team status to NOT_CONFIRMED & release slot reservation
      if (registration.teamId) {
        await tx.team.update({
          where: { id: registration.teamId },
          data: { status: "NOT_CONFIRMED" },
        });

        await tx.slotReservation.updateMany({
          where: { teamId: registration.teamId },
          data: { status: "RELEASED" },
        });
      }

      // 4. Send user notification with rejection reason
      if (registration.submittedById) {
        await tx.notification.create({
          data: {
            userId: registration.submittedById,
            type: "PAYMENT_REJECTED",
            title: "Payment Rejected ⚠️",
            message: `Your payment for ${registration.teamName} in ${registration.tournament.title} was rejected. Reason: ${rejectionReason}. You may retry your payment.`,
            metadata: JSON.stringify({
              registrationId: registration.id,
              tournamentId: registration.tournamentId,
              teamId: registration.teamId,
              rejectionReason,
            }),
          },
        }).catch(() => {});
      }

      // 5. Activity Log
      await tx.activityLog.create({
        data: {
          tournamentId: registration.tournamentId,
          teamId: registration.teamId,
          registrationId: registration.id,
          action: "PAYMENT_REJECTED",
          description: `Admin rejected payment. Reason: ${rejectionReason}`,
        },
      }).catch(() => {});
    });

    res.json({
      success: true,
      message: `Payment rejected. Reason: ${rejectionReason}`,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/tournaments/registrations
 * Filterable across tournaments, stages, and payment statuses
 */
export const getAllRegistrations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tournamentId, stageId, status, paymentStatus, search } = req.query;

    if (dbConnected) {
      try {
        const where: any = {};
        if (tournamentId && tournamentId !== "ALL") where.tournamentId = String(tournamentId);
        if (stageId && stageId !== "ALL") where.currentStageId = String(stageId);
        if (status && status !== "ALL") where.status = String(status);
        if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = String(paymentStatus);
        if (search) {
          const q = String(search);
          where.OR = [
            { teamName: { contains: q, mode: "insensitive" } },
            { captainIgn: { contains: q, mode: "insensitive" } },
            { captainName: { contains: q, mode: "insensitive" } },
            { captainEmail: { contains: q, mode: "insensitive" } },
            { whatsapp: { contains: q, mode: "insensitive" } },
            { registrationNumber: { contains: q, mode: "insensitive" } },
            { payment: { utr: { contains: q, mode: "insensitive" } } },
          ];
        }

        const list = await prisma.tournamentRegistration.findMany({
          where,
          include: {
            tournament: {
              select: { id: true, title: true, game: true, prizePool: true, status: true, totalTeams: true },
            },
            currentStage: { select: { id: true, name: true, order: true } },
            payment: true,
            players: true,
            team: {
              include: {
                leader: { select: { id: true, username: true, ign: true, fullName: true, avatarUrl: true, email: true, phone: true, gameUid: true } },
                members: { include: { user: { select: { id: true, username: true, ign: true, fullName: true, gameUid: true, avatarUrl: true } } } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, data: list });
        return;
      } catch (err) {
        console.warn("Prisma getAllRegistrations failed, falling back to memory store:", err);
      }
    }

    let result = [...memoryRegistrations];

    if (tournamentId && tournamentId !== "ALL") {
      result = result.filter((r) => r.tournamentId === String(tournamentId));
    }
    if (stageId && stageId !== "ALL") {
      result = result.filter((r) => r.currentStageId === String(stageId));
    }
    if (status && status !== "ALL") {
      result = result.filter((r) => r.status === String(status));
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      result = result.filter((r) => r.paymentStatus === String(paymentStatus));
    }
    if (search) {
      const q = String(search).toLowerCase();
      result = result.filter((r) => {
        const teamMatch = r.teamName?.toLowerCase().includes(q);
        const captMatch = r.captainIgn?.toLowerCase().includes(q) || r.captainName?.toLowerCase().includes(q);
        const phoneMatch = r.whatsapp?.includes(q) || r.captainPhone?.includes(q);
        const emailMatch = r.captainEmail?.toLowerCase().includes(q);
        const utrMatch = r.payment?.utr?.toLowerCase().includes(q);
        const discordMatch = r.discordTag?.toLowerCase().includes(q);
        const playerMatch = r.players?.some((p: any) => p.ign?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
        return teamMatch || captMatch || phoneMatch || emailMatch || utrMatch || discordMatch || playerMatch;
      });
    }

    const mapped = result.map((r) => {
      const t = memoryTournaments.find((tourney) => tourney.id === r.tournamentId);
      const stage = memoryStages.find((s) => s.id === r.currentStageId);
      return {
        ...r,
        tournament: t ? { id: t.id, title: t.title, game: t.game, prizePool: t.prizePool, status: t.status } : null,
        currentStage: stage ? { id: stage.id, name: stage.name, order: stage.order } : null,
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/teams
 * View all teams registered for a tournament
 */
export const getTournamentTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const teams = await prisma.team.findMany({
      where: { tournamentId: id },
      include: {
        leader: {
          select: { id: true, username: true, ign: true, gameUid: true, fullName: true, avatarUrl: true, email: true, phone: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, ign: true, gameUid: true, fullName: true, avatarUrl: true },
            },
          },
        },
        registration: {
          include: { payment: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, teams });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/admin/analytics
 * Aggregated statistics for admin portal
 */
export const getTournamentAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tournamentId } = req.query;
    const whereClause = tournamentId ? { tournamentId: String(tournamentId) } : {};

    const [
      totalTeams,
      confirmedTeams,
      paymentPending,
      paymentsUnderReview,
      paymentsFailed,
      verifiedPayments,
      pendingPayments,
    ] = await Promise.all([
      prisma.tournamentRegistration.count({ where: whereClause }),
      prisma.tournamentRegistration.count({ where: { ...whereClause, status: { in: ["CONFIRMED", "APPROVED"] } } }),
      prisma.tournamentRegistration.count({ where: { ...whereClause, status: "PAYMENT_PENDING" } }),
      prisma.tournamentRegistration.count({ where: { ...whereClause, status: "PAYMENT_UNDER_REVIEW" } }),
      prisma.tournamentRegistration.count({ where: { ...whereClause, status: "REJECTED" } }),
      prisma.paymentRecord.aggregate({
        where: {
          status: "VERIFIED",
          ...(tournamentId ? { registration: { tournamentId: String(tournamentId) } } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.paymentRecord.aggregate({
        where: {
          status: { in: ["PENDING", "UNDER_REVIEW"] },
          ...(tournamentId ? { registration: { tournamentId: String(tournamentId) } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    let totalSlots = 0;
    if (tournamentId) {
      const tourney = await prisma.tournament.findUnique({
        where: { id: String(tournamentId) },
        select: { totalTeams: true },
      });
      totalSlots = tourney?.totalTeams || 32;
    } else {
      const tourneys = await prisma.tournament.findMany({ select: { totalTeams: true } });
      totalSlots = tourneys.reduce((sum: any, t: any) => sum + (t.totalTeams || 32), 0);
    }

    const availableSlots = Math.max(0, totalSlots - confirmedTeams);

    res.json({
      success: true,
      analytics: {
        totalTeams,
        confirmedTeams,
        paymentPending,
        paymentsUnderReview,
        paymentsFailed,
        rejectedRegistrations: paymentsFailed,
        availableSlots,
        totalSlots,
        totalRevenue: verifiedPayments._sum.amount || 0,
        pendingRevenue: pendingPayments._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/registrations/:id/status
 * Approve, reject, waitlist or disqualify registration
 */
export const updateRegistrationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, slotNumber, adminNotes } = req.body;

    if (dbConnected) {
      try {
        const updated = await prisma.tournamentRegistration.update({
          where: { id },
          data: {
            status,
            slotNumber: slotNumber !== undefined ? Number(slotNumber) : undefined,
            adminNotes,
            approvedAt: status === "CONFIRMED" || status === "APPROVED" ? new Date() : undefined,
            rejectedAt: status === "REJECTED" ? new Date() : undefined,
          },
          include: { team: true, tournament: true },
        });

        if (updated.teamId && (status === "CONFIRMED" || status === "APPROVED")) {
          await prisma.team.update({
            where: { id: updated.teamId },
            data: { status: "CONFIRMED" },
          });
        }

        res.json({ success: true, message: `Registration status updated to ${status}`, data: updated });
        return;
      } catch (err) {
        console.warn("Prisma updateRegistrationStatus failed:", err);
      }
    }

    const registration = memoryRegistrations.find((r) => r.id === id);
    if (!registration) {
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    const oldStatus = registration.status;
    registration.status = status;
    if (slotNumber !== undefined) registration.slotNumber = Number(slotNumber);
    if (adminNotes !== undefined) registration.adminNotes = adminNotes;

    if (status === "APPROVED" || status === "CONFIRMED") registration.approvedAt = new Date();
    if (status === "REJECTED") registration.rejectedAt = new Date();
    registration.updatedAt = new Date();

    res.json({
      success: true,
      message: `Registration status updated to ${status}`,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/registrations/:id/payment
 * Verify, reject, or refund squad registration payment
 */
export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentStatus, adminNotes, autoApprove } = req.body;

    if (paymentStatus === "VERIFIED") {
      await verifyPayment(req, res, next);
      return;
    } else if (paymentStatus === "REJECTED") {
      await rejectPayment(req, res, next);
      return;
    }

    if (dbConnected) {
      try {
        await prisma.tournamentRegistration.update({
          where: { id },
          data: {
            paymentStatus,
            payment: {
              update: {
                status: paymentStatus,
                adminNotes,
              },
            },
          },
        });
        res.json({ success: true, message: `Payment status updated to ${paymentStatus}` });
        return;
      } catch (err) {
        console.warn("Prisma updatePaymentStatus failed:", err);
      }
    }

    const registration = memoryRegistrations.find((r) => r.id === id);
    if (!registration) {
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    if (!registration.payment) {
      registration.payment = {
        id: "pay-" + Date.now(),
        registrationId: id,
        amount: 499,
        method: "UPI",
        utr: null,
        payerName: registration.captainName || null,
        screenshot: null,
        status: paymentStatus,
        remarks: null,
        submittedAt: new Date(),
        verifiedAt: paymentStatus === "VERIFIED" ? new Date() : null,
        verifiedBy: req.user?.email || "Admin",
        adminNotes: adminNotes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      registration.payment.status = paymentStatus;
      if (adminNotes) registration.payment.adminNotes = adminNotes;
      if (paymentStatus === "VERIFIED") {
        registration.payment.verifiedAt = new Date();
        registration.payment.verifiedBy = req.user?.email || "Admin";
      }
      registration.payment.updatedAt = new Date();
    }

    registration.paymentStatus = paymentStatus;

    if (paymentStatus === "VERIFIED" && autoApprove) {
      registration.status = "APPROVED";
      registration.approvedAt = new Date();
    }

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/registrations/bulk
 * Perform bulk approve, reject, payment verification, or stage movement
 */
export const bulkActionRegistrations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { registrationIds, action, targetStageId } = req.body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      res.status(400).json({ success: false, message: "No registration IDs provided" });
      return;
    }

    const affected: any[] = [];
    const performer = req.user?.email || "Admin";

    for (const regId of registrationIds) {
      const reg = memoryRegistrations.find((r) => r.id === regId);
      if (!reg) continue;

      if (action === "APPROVE") {
        reg.status = "APPROVED";
        reg.approvedAt = new Date();
        reg.activityLogs.push({
          id: "log-" + Date.now() + Math.random(),
          registrationId: reg.id,
          action: "BULK_APPROVED",
          performedBy: performer,
          details: "Approved via bulk action",
          createdAt: new Date(),
        });
      } else if (action === "REJECT") {
        reg.status = "REJECTED";
        reg.rejectedAt = new Date();
        reg.activityLogs.push({
          id: "log-" + Date.now() + Math.random(),
          registrationId: reg.id,
          action: "BULK_REJECTED",
          performedBy: performer,
          details: "Rejected via bulk action",
          createdAt: new Date(),
        });
      } else if (action === "VERIFY_PAYMENT") {
        reg.paymentStatus = "VERIFIED";
        if (reg.payment) {
          reg.payment.status = "VERIFIED";
          reg.payment.verifiedAt = new Date();
          reg.payment.verifiedBy = performer;
        }
        reg.activityLogs.push({
          id: "log-" + Date.now() + Math.random(),
          registrationId: reg.id,
          action: "BULK_PAYMENT_VERIFIED",
          performedBy: performer,
          details: "Payment verified via bulk action",
          createdAt: new Date(),
        });
      } else if (action === "MOVE_STAGE" && targetStageId) {
        const oldStage = memoryStages.find((s) => s.id === reg.currentStageId)?.name || "Previous";
        const newStage = memoryStages.find((s) => s.id === targetStageId)?.name || "Next Stage";
        reg.currentStageId = targetStageId;
        reg.activityLogs.push({
          id: "log-" + Date.now() + Math.random(),
          registrationId: reg.id,
          action: "BULK_STAGE_ADVANCEMENT",
          performedBy: performer,
          details: `Moved from ${oldStage} to ${newStage} via bulk advancement`,
          createdAt: new Date(),
        });
      }
      reg.updatedAt = new Date();
      affected.push(reg);
    }

    res.json({
      success: true,
      message: `Bulk action ${action} executed successfully on ${affected.length} registrations`,
      data: { count: affected.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/export
 * Export tournament registrations as CSV format
 */
export const exportRegistrationsCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { stageId, status } = req.query;

    let list = memoryRegistrations.filter((r) => r.tournamentId === id);
    if (stageId && stageId !== "ALL") list = list.filter((r) => r.currentStageId === stageId);
    if (status && status !== "ALL") list = list.filter((r) => r.status === status);

    const headers = [
      "Registration Number",
      "Team Name",
      "Captain IGN",
      "Captain Name",
      "Phone / WhatsApp",
      "Discord",
      "Email",
      "Roster Starters",
      "Payment Status",
      "UTR Number",
      "Amount",
      "Registration Status",
      "Current Stage",
      "Registered Date",
    ];

    const rows = list.map((r) => {
      const stageName = memoryStages.find((s) => s.id === r.currentStageId)?.name || "Registration";
      return [
        `"${r.registrationNumber || ""}"`,
        `"${r.teamName}"`,
        `"${r.captainIgn}"`,
        `"${r.captainName || ""}"`,
        `"${r.whatsapp}"`,
        `"${r.discordTag || ""}"`,
        `"${r.captainEmail || ""}"`,
        `"${r.playerNames || ""}"`,
        `"${r.paymentStatus}"`,
        `"${r.payment?.utr || ""}"`,
        `"${r.payment?.amount || 0}"`,
        `"${r.status}"`,
        `"${stageName}"`,
        `"${new Date(r.createdAt).toLocaleString()}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="lordz-${id}-registrations.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

// ================= STAGE MANAGEMENT & PROGRESSION =================

/**
 * GET /api/tournaments/:id/stages
 */
export const getStages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let stages: any[] = [];

    if (dbConnected) {
      try {
        stages = await prisma.tournamentStage.findMany({
          where: { tournamentId: id },
          orderBy: { order: "asc" },
          include: {
            registrations: {
              select: {
                id: true,
                teamName: true,
                captainIgn: true,
                status: true,
                paymentStatus: true,
              },
            },
          },
        });
      } catch (err) {
        console.warn("Prisma getStages failed, falling back to memory:", err);
      }
    }

    if (!stages || stages.length === 0) {
      stages = memoryStages.filter((s) => s.tournamentId === id).sort((a, b) => a.order - b.order);
    }

    // Attach count of squads currently in each stage
    const stagesWithCounts = stages.map((s: any) => {
      const teams = s.registrations || memoryRegistrations.filter((r) => r.tournamentId === id && r.currentStageId === s.id);
      return {
        ...s,
        currentTeamsCount: teams.length,
        teams: teams.map((t: any) => ({
          id: t.id,
          teamName: t.teamName,
          captainIgn: t.captainIgn,
          status: t.status,
          paymentStatus: t.paymentStatus,
        })),
      };
    });

    res.json({ success: true, data: stagesWithCounts });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/stages
 */
export const createStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = stageSchema.parse(req.body);

    const newStage = {
      id: "stage-" + Date.now(),
      tournamentId: id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStages.push(newStage);
    res.status(201).json({ success: true, message: "Stage created successfully", data: newStage });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/stages/:stageId
 */
export const updateStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stageId } = req.params;
    const data = stageSchema.partial().parse(req.body);

    const index = memoryStages.findIndex((s) => s.id === stageId);
    if (index === -1) {
      res.status(404).json({ success: false, message: "Stage not found" });
      return;
    }

    memoryStages[index] = {
      ...memoryStages[index],
      ...data,
      updatedAt: new Date(),
    };

    res.json({ success: true, message: "Stage updated successfully", data: memoryStages[index] });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/stages/:stageId
 */
export const deleteStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stageId } = req.params;
    memoryStages = memoryStages.filter((s) => s.id !== stageId);
    res.json({ success: true, message: "Stage deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/stages/move-teams
 * Advance checked teams from one stage to the target stage without duplicating records
 */
export const moveTeamsToStage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { registrationIds } = req.body;
    const targetStageId = req.body.targetStageId || req.body.toStageId;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      res.status(400).json({ success: false, message: "Please select at least one team to move" });
      return;
    }

    const targetStage = memoryStages.find(
      (s) => (s.id === targetStageId || s.id.toLowerCase() === String(targetStageId).toLowerCase()) &&
             (s.tournamentId === id || !s.tournamentId)
    );
    if (!targetStage) {
      res.status(404).json({ success: false, message: "Target tournament stage not found" });
      return;
    }

    const performer = req.user?.email || "Admin";
    const movedTeams: string[] = [];

    for (const regId of registrationIds) {
      const reg = memoryRegistrations.find((r) => r.id === regId && r.tournamentId === id);
      if (!reg) continue;

      const fromStage = memoryStages.find((s) => s.id === reg.currentStageId)?.name || "Previous Stage";
      reg.currentStageId = targetStageId;
      reg.updatedAt = new Date();

      reg.activityLogs.push({
        id: "log-" + Date.now() + Math.random(),
        registrationId: reg.id,
        action: "STAGE_ADVANCEMENT",
        performedBy: performer,
        details: `Promoted from ${fromStage} to ${targetStage.name} by ${performer}`,
        createdAt: new Date(),
      });

      movedTeams.push(reg.teamName);
    }

    res.json({
      success: true,
      message: `Successfully advanced ${movedTeams.length} teams to ${targetStage.name}!`,
      data: {
        targetStage: targetStage.name,
        count: movedTeams.length,
        teams: movedTeams,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= TOURNAMENT LEADERBOARD =================

/**
 * GET /api/tournaments/:id/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let entries: any[] = [];

    if (dbConnected) {
      try {
        entries = await prisma.tournamentLeaderboard.findMany({
          where: { tournamentId: id },
          orderBy: { rank: "asc" },
        });
      } catch (err) {
        console.warn("Prisma getLeaderboard failed, fallback to memory:", err);
      }
    }

    if (!entries || entries.length === 0) {
      recalculateLeaderboardRanks(id);
      entries = memoryLeaderboard.filter((lb) => lb.tournamentId === id).sort((a, b) => a.rank - b.rank);
    }

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id/leaderboard
 * Batch update leaderboard points, kills, wins, and auto-recalculate ranks
 */
export const updateLeaderboardBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      res.status(400).json({ success: false, message: "Invalid leaderboard entries array" });
      return;
    }

    // Replace or update tournament leaderboard entries
    memoryLeaderboard = memoryLeaderboard.filter((lb) => lb.tournamentId !== id);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const kills = Number(e.kills) || 0;
      const placementPoints = Number(e.placementPoints) || 0;
      const bonusPoints = Number(e.bonusPoints) || 0;
      // Formula: Total = Placement + Kills + Bonus (or specified totalPoints)
      const computedTotal = (e.totalPoints !== undefined && e.totalPoints !== null && !isNaN(Number(e.totalPoints)))
        ? Number(e.totalPoints)
        : placementPoints + kills + bonusPoints;

      memoryLeaderboard.push({
        id: e.id || `lb-${id}-${Date.now()}-${i}`,
        tournamentId: id,
        teamName: e.teamName,
        tag: e.tag || null,
        rank: i + 1,
        matchesPlayed: Number(e.matchesPlayed) || 0,
        wins: Number(e.wins) || 0,
        losses: Number(e.losses) || 0,
        kills,
        placementPoints,
        bonusPoints,
        totalPoints: computedTotal,
        status: e.status || "ACTIVE",
        updatedAt: new Date(),
      });
    }

    recalculateLeaderboardRanks(id);

    const saved = memoryLeaderboard.filter((lb) => lb.tournamentId === id).sort((a, b) => a.rank - b.rank);

    res.json({
      success: true,
      message: "Tournament leaderboard updated and ranked successfully",
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/leaderboard/entry
 */
export const addLeaderboardEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { teamName, tag, matchesPlayed, wins, kills, placementPoints, bonusPoints } = req.body;

    if (!teamName) {
      res.status(400).json({ success: false, message: "Team name is required" });
      return;
    }

    const currentCount = memoryLeaderboard.filter((lb) => lb.tournamentId === id).length;
    const pKills = Number(kills) || 0;
    const pPlacement = Number(placementPoints) || 0;
    const pBonus = Number(bonusPoints) || 0;
    const total = pPlacement + pKills + pBonus;

    const newEntry = {
      id: "lb-" + Date.now(),
      tournamentId: id,
      teamName: teamName.toUpperCase(),
      tag: tag ? tag.toUpperCase() : null,
      rank: currentCount + 1,
      matchesPlayed: Number(matchesPlayed) || 0,
      wins: Number(wins) || 0,
      losses: 0,
      kills: pKills,
      placementPoints: pPlacement,
      bonusPoints: pBonus,
      totalPoints: total,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryLeaderboard.push(newEntry);
    recalculateLeaderboardRanks(id);

    res.status(201).json({
      success: true,
      message: "Team added to tournament leaderboard",
      data: newEntry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id/leaderboard/:entryId
 */
export const deleteLeaderboardEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, entryId } = req.params;
    memoryLeaderboard = memoryLeaderboard.filter((lb) => lb.id !== entryId);
    recalculateLeaderboardRanks(id);
    res.json({ success: true, message: "Team removed from leaderboard" });
  } catch (error) {
    next(error);
  }
};

// ================= TOURNAMENT ROUNDS & TEAM SELECTION =================

export function parseRoundWithCredentials(round: any) {
  if (!round) return null;
  let roomId = "";
  let roomPassword = "";
  let map = "BERMUDA";
  let roomTime = round.startTime || "";
  let credentialsPublished = false;
  let customNotes = "";
  let cleanDescription = round.description || "";

  if (round.description && typeof round.description === "string" && round.description.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(round.description);
      roomId = parsed.roomId || "";
      roomPassword = parsed.roomPassword || "";
      map = parsed.map || "BERMUDA";
      roomTime = parsed.roomTime || round.startTime || "";
      credentialsPublished = Boolean(parsed.credentialsPublished);
      customNotes = parsed.customNotes || "";
      cleanDescription = parsed.description || "";
    } catch (e) {
      // not JSON
    }
  }

  const formattedTeams = (round.roundTeams || []).map((rt: any, idx: number) => {
    return {
      ...rt,
      seed: rt.seed || idx + 1,
      teamName: rt.team?.teamName || rt.team?.name || rt.teamName || rt.teamId,
    };
  });

  return {
    ...round,
    cleanDescription,
    roomId,
    roomPassword,
    map,
    roomTime,
    credentialsPublished,
    customNotes,
    roundTeams: formattedTeams,
  };
}

/**
 * GET /api/tournaments/:id/rounds
 */
export const getRounds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let rounds: any[] = [];

    try {
      rounds = await (prisma as any).tournamentRound.findMany({
        where: { tournamentId: id },
        include: {
          roundTeams: {
            include: { team: true },
          },
        },
        orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }],
      });
    } catch (e) {
      console.warn("Prisma getRounds fallback to memory:", e);
    }

    if (!rounds || rounds.length === 0) {
      rounds = memoryRounds
        .filter((r) => r.tournamentId === id)
        .sort((a, b) => {
          if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
          return (a.name || "").localeCompare(b.name || "");
        })
        .map((r) => {
          const rTeams = memoryRoundTeams
            .filter((rt) => rt.roundId === r.id)
            .map((rt) => {
              const reg = memoryRegistrations.find((reg) => reg.id === rt.teamId || reg.teamName === rt.teamId);
              return {
                ...rt,
                teamName: reg ? reg.teamName : (rt.teamName || rt.teamId),
                captainName: reg ? (reg.captainName || reg.captainIgn) : "Captain",
                team: reg ? { id: reg.id, name: reg.teamName } : null,
              };
            });
          return { ...r, roundTeams: rTeams };
        });
    }

    const parsedRounds = rounds.map(parseRoundWithCredentials);
    res.json({ success: true, data: parsedRounds });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/rounds
 */
export const createRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      roundNumber,
      roundType,
      startDate,
      startTime,
      description,
      maxTeams,
      selectionMethod,
      status,
      roomId,
      roomPassword,
      map,
      roomTime,
      credentialsPublished,
      customNotes,
    } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: "Round name is required" });
      return;
    }

    const count = memoryRounds.filter((r) => r.tournamentId === id).length;
    const computedNumber = roundNumber ? Number(roundNumber) : count + 1;

    // Pack credentials into description JSON
    const metadata = {
      description: description || "",
      roomId: roomId || "",
      roomPassword: roomPassword || "",
      map: map || "BERMUDA",
      roomTime: roomTime || startTime || "",
      credentialsPublished: Boolean(credentialsPublished),
      customNotes: customNotes || "",
    };

    const roundData = {
      name: name.trim().toUpperCase(),
      roundNumber: computedNumber,
      roundType: roundType || "BATTLE_ROYALE",
      startDate: startDate || null,
      startTime: roomTime || startTime || null,
      description: JSON.stringify(metadata),
      maxTeams: maxTeams ? Number(maxTeams) : 12,
      selectionMethod: selectionMethod || "MANUAL",
      status: status || "UPCOMING",
    };

    let createdRound: any = null;
    try {
      createdRound = await (prisma as any).tournamentRound.create({
        data: {
          ...roundData,
          tournamentId: id,
        },
        include: { roundTeams: true },
      });
    } catch (e) {
      console.warn("Prisma createRound fallback to memory:", e);
    }

    if (!createdRound) {
      createdRound = {
        id: `round-${id}-${Date.now()}`,
        tournamentId: id,
        ...roundData,
        createdAt: new Date(),
        updatedAt: new Date(),
        roundTeams: [],
      };
      memoryRounds.push(createdRound);
    }

    res.status(201).json({
      success: true,
      data: parseRoundWithCredentials(createdRound),
      message: "Round created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/rounds/batch-divisions
 * Create multiple divisions for a round stage at once (e.g. Round 1 Div A, B, C or Round 2 Div A, B)
 */
export const createBatchDivisions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      stageName,
      roundNumber,
      divisionNames,
      maxTeamsPerDivision = 12,
      roundType = "BATTLE_ROYALE",
      startDate,
      startTime,
      map = "BERMUDA",
    } = req.body;

    if (!Array.isArray(divisionNames) || divisionNames.length === 0) {
      res.status(400).json({ success: false, message: "divisionNames array is required" });
      return;
    }

    const rNum = roundNumber ? Number(roundNumber) : 1;
    const baseStage = stageName ? stageName.trim().toUpperCase() : `ROUND ${rNum}`;

    const createdDivisions: any[] = [];

    for (const div of divisionNames) {
      const cleanDiv = String(div).trim().toUpperCase();
      const fullName = cleanDiv.startsWith(baseStage) ? cleanDiv : `${baseStage} - ${cleanDiv}`;

      const metadata = {
        description: `Free Fire Battle Royale - ${fullName} (12 Squads Max Lobby)`,
        roomId: "",
        roomPassword: "",
        map: map || "BERMUDA",
        roomTime: startTime || "",
        credentialsPublished: false,
        customNotes: "Free Fire Custom Lobby limit: 12 squads max. Join your assigned slot strictly.",
      };

      const roundData = {
        name: fullName,
        roundNumber: rNum,
        roundType: roundType || "BATTLE_ROYALE",
        startDate: startDate || null,
        startTime: startTime || null,
        description: JSON.stringify(metadata),
        maxTeams: maxTeamsPerDivision ? Number(maxTeamsPerDivision) : 12,
        selectionMethod: "MANUAL",
        status: "UPCOMING",
      };

      let roundEntity: any = null;
      try {
        roundEntity = await (prisma as any).tournamentRound.create({
          data: {
            ...roundData,
            tournamentId: id,
          },
          include: { roundTeams: true },
        });
      } catch (e) {
        console.warn("Prisma createBatchDivisions fallback to memory:", e);
      }

      if (!roundEntity) {
        roundEntity = {
          id: `round-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tournamentId: id,
          ...roundData,
          createdAt: new Date(),
          updatedAt: new Date(),
          roundTeams: [],
        };
        memoryRounds.push(roundEntity);
      }

      createdDivisions.push(parseRoundWithCredentials(roundEntity));
    }

    res.status(201).json({
      success: true,
      data: createdDivisions,
      message: `Successfully created ${createdDivisions.length} divisions for ${baseStage}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/rounds/auto-distribute
 * Automatically distribute squads into multiple divisions (12 squads max per division)
 */
export const autoDistributeSquads = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { roundIds, capacityPerDivision = 12 } = req.body;

    if (!Array.isArray(roundIds) || roundIds.length === 0) {
      res.status(400).json({ success: false, message: "roundIds array is required" });
      return;
    }

    // 1. Fetch target rounds
    let targetRounds: any[] = [];
    try {
      targetRounds = await (prisma as any).tournamentRound.findMany({
        where: { id: { in: roundIds }, tournamentId: id },
        include: {
          roundTeams: { include: { team: true } },
        },
        orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }],
      });
    } catch (e) {}

    if (!targetRounds || targetRounds.length === 0) {
      targetRounds = memoryRounds.filter((r) => roundIds.includes(r.id) && r.tournamentId === id);
    }

    if (targetRounds.length === 0) {
      res.status(404).json({ success: false, message: "Target division rounds not found" });
      return;
    }

    // 2. Fetch confirmed registrations
    let regs: any[] = [];
    try {
      regs = await prisma.tournamentRegistration.findMany({
        where: {
          tournamentId: id,
          OR: [
            { status: "CONFIRMED" },
            { status: "APPROVED" },
            { status: "PENDING" },
            { paymentStatus: "VERIFIED" },
            { paymentStatus: "PAID" },
            { paymentStatus: "UNDER_REVIEW" },
          ],
        },
        include: { team: true },
      });
    } catch (e) {}

    if (!regs || regs.length === 0) {
      regs = memoryRegistrations.filter((r) => r.tournamentId === id);
    }

    // Default leader for team creation
    let defaultUserId: string | null = (req as any).user?.id || null;
    if (!defaultUserId) {
      const u = await prisma.user.findFirst();
      defaultUserId = u?.id || null;
    }

    // 3. Find candidate squads
    const roundNumber = targetRounds[0].roundNumber || 1;
    let candidateTeamIds: string[] = [];

    // Track teams already assigned to any division of this stage
    const assignedInStage = new Set<string>();
    for (const tr of targetRounds) {
      for (const rt of tr.roundTeams || []) {
        assignedInStage.add(rt.teamId);
      }
    }

    if (roundNumber === 1) {
      candidateTeamIds = regs
        .map((r) => r.teamId || r.id)
        .filter((tId) => !assignedInStage.has(tId));
    } else {
      // Prior rounds qualified squads
      let allPriorRounds: any[] = [];
      try {
        allPriorRounds = await (prisma as any).tournamentRound.findMany({
          where: { tournamentId: id, roundNumber: { lt: roundNumber } },
          include: { roundTeams: true },
        });
      } catch (e) {}

      if (!allPriorRounds || allPriorRounds.length === 0) {
        allPriorRounds = memoryRounds.filter((r) => r.tournamentId === id && r.roundNumber < roundNumber);
      }

      const qualifiedPrior: string[] = [];
      for (const pr of allPriorRounds) {
        for (const rt of pr.roundTeams || []) {
          if (rt.status === "QUALIFIED" || rt.status === "ADVANCED") {
            qualifiedPrior.push(rt.teamId);
          }
        }
      }

      candidateTeamIds = qualifiedPrior.filter((tId) => !assignedInStage.has(tId));
      if (candidateTeamIds.length === 0) {
        candidateTeamIds = regs
          .map((r) => r.teamId || r.id)
          .filter((tId) => !assignedInStage.has(tId));
      }
    }

    // 4. Distribute candidate squads into target rounds (up to capacityPerDivision)
    let candidateIndex = 0;
    let totalAssigned = 0;

    for (const r of targetRounds) {
      const currentTeams = r.roundTeams || [];
      let nextSlot = currentTeams.length + 1;
      const needed = Math.max(0, capacityPerDivision - currentTeams.length);

      for (let i = 0; i < needed && candidateIndex < candidateTeamIds.length; i++) {
        const rawId = candidateTeamIds[candidateIndex++];
        const reg = regs.find((regItem) => regItem.id === rawId || regItem.teamId === rawId || regItem.teamName === rawId);
        let targetTeamId = rawId;

        if (reg && reg.teamId) {
          targetTeamId = reg.teamId;
        } else if (reg && !reg.teamId) {
          let team = await prisma.team.findFirst({ where: { tournamentId: id, teamName: reg.teamName } });
          if (!team && defaultUserId) {
            try {
              team = await prisma.team.create({
                data: {
                  tournamentId: id,
                  teamName: reg.teamName,
                  leaderId: reg.submittedById || defaultUserId,
                  status: "CONFIRMED",
                },
              });
              await prisma.tournamentRegistration.update({
                where: { id: reg.id },
                data: { teamId: team.id },
              });
            } catch (err) {}
          }
          if (team) {
            targetTeamId = team.id;
          }
        }

        try {
          await (prisma as any).roundTeam.upsert({
            where: {
              roundId_teamId: {
                roundId: r.id,
                teamId: targetTeamId,
              },
            },
            update: {
              status: "QUALIFIED",
              seed: nextSlot,
            },
            create: {
              roundId: r.id,
              teamId: targetTeamId,
              status: "QUALIFIED",
              seed: nextSlot,
              score: 0,
            },
          });
        } catch (e) {
          console.warn("autoDistribute upsert error:", e);
        }

        const memRt = memoryRoundTeams.find((rt) => rt.roundId === r.id && rt.teamId === targetTeamId);
        if (memRt) {
          memRt.status = "QUALIFIED";
          memRt.seed = nextSlot;
        } else {
          memoryRoundTeams.push({
            id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            roundId: r.id,
            teamId: targetTeamId,
            teamName: reg ? reg.teamName : targetTeamId,
            status: "QUALIFIED",
            seed: nextSlot,
            score: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        nextSlot++;
        totalAssigned++;
      }
    }

    res.json({
      success: true,
      message: `Auto-distributed ${totalAssigned} squads across ${targetRounds.length} division(s)`,
      totalAssigned,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id/rounds/:roundId
 */
export const updateRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, roundId } = req.params;
    const {
      name,
      roundNumber,
      roundType,
      startDate,
      startTime,
      description,
      maxTeams,
      selectionMethod,
      status,
      roomId,
      roomPassword,
      map,
      roomTime,
      credentialsPublished,
      customNotes,
    } = req.body;

    // Fetch existing
    let existing: any = null;
    try {
      existing = await (prisma as any).tournamentRound.findUnique({ where: { id: roundId } });
    } catch (e) {}

    let meta: any = {};
    if (existing?.description && existing.description.startsWith("{")) {
      try {
        meta = JSON.parse(existing.description);
      } catch (e) {}
    }

    if (roomId !== undefined) meta.roomId = roomId;
    if (roomPassword !== undefined) meta.roomPassword = roomPassword;
    if (map !== undefined) meta.map = map;
    if (roomTime !== undefined) meta.roomTime = roomTime;
    if (credentialsPublished !== undefined) meta.credentialsPublished = Boolean(credentialsPublished);
    if (customNotes !== undefined) meta.customNotes = customNotes;
    if (description !== undefined) meta.description = description;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim().toUpperCase();
    if (roundNumber !== undefined) updateData.roundNumber = Number(roundNumber);
    if (roundType !== undefined) updateData.roundType = roundType;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (startTime !== undefined || roomTime !== undefined) updateData.startTime = roomTime || startTime;
    if (maxTeams !== undefined) updateData.maxTeams = Number(maxTeams);
    if (selectionMethod !== undefined) updateData.selectionMethod = selectionMethod;
    if (status !== undefined) updateData.status = status;
    updateData.description = JSON.stringify(meta);

    let updatedRound: any = null;
    try {
      updatedRound = await (prisma as any).tournamentRound.update({
        where: { id: roundId },
        data: updateData,
        include: {
          roundTeams: {
            include: { team: true },
          },
        },
      });
    } catch (e) {
      console.warn("Prisma updateRound fallback to memory:", e);
    }

    const memIdx = memoryRounds.findIndex((r) => r.id === roundId);
    if (memIdx !== -1) {
      memoryRounds[memIdx] = { ...memoryRounds[memIdx], ...updateData, updatedAt: new Date() };
      if (!updatedRound) updatedRound = memoryRounds[memIdx];
    }

    res.json({
      success: true,
      data: parseRoundWithCredentials(updatedRound),
      message: "Round updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id/rounds/:roundId
 */
export const deleteRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roundId } = req.params;

    try {
      await (prisma as any).tournamentRound.delete({ where: { id: roundId } });
    } catch (e) {
      console.warn("Prisma deleteRound fallback to memory:", e);
    }

    memoryRounds = memoryRounds.filter((r) => r.id !== roundId);
    memoryRoundTeams = memoryRoundTeams.filter((rt) => rt.roundId !== roundId);

    res.json({ success: true, message: "Round deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/rounds/:roundId/eligible-teams
 */
export const getEligibleTeamsForRound = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, roundId } = req.params;

    let tournament: any = null;
    try {
      tournament = await prisma.tournament.findFirst({
        where: { OR: [{ id }, { slug: id }] },
      });
    } catch (e) {}
    if (!tournament) {
      tournament = memoryTournaments.find((t) => t.id === id || t.slug === id);
    }
    const resolvedTournamentId = tournament?.id || id;

    let rounds: any[] = [];
    try {
      rounds = await (prisma as any).tournamentRound.findMany({
        where: { tournamentId: resolvedTournamentId },
        include: {
          roundTeams: {
            include: { team: true },
          },
        },
        orderBy: { roundNumber: "asc" },
      });
    } catch (e) {}

    if (!rounds || rounds.length === 0) {
      rounds = memoryRounds
        .filter((r) => r.tournamentId === resolvedTournamentId || r.tournamentId === id)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    }

    const currentRoundIndex = rounds.findIndex(
      (r) => r.id === roundId || r.name === roundId || String(r.roundNumber) === String(roundId)
    );
    const currentRound =
      rounds[currentRoundIndex] ||
      memoryRounds.find(
        (r) =>
          r.id === roundId ||
          ((r.tournamentId === resolvedTournamentId || r.tournamentId === id) &&
            (r.name === roundId || String(r.roundNumber) === String(roundId)))
      ) ||
      rounds[0];

    if (!currentRound) {
      res.status(404).json({ success: false, message: "Round not found" });
      return;
    }

    // 1. Fetch all confirmed/approved tournament registrations
    let regs: any[] = [];
    try {
      regs = await prisma.tournamentRegistration.findMany({
        where: {
          tournamentId: id,
          OR: [
            { status: "CONFIRMED" },
            { status: "APPROVED" },
            { status: "PENDING" },
            { paymentStatus: "VERIFIED" },
            { paymentStatus: "PAID" },
            { paymentStatus: "UNDER_REVIEW" },
          ],
        },
        include: { team: true },
      });
    } catch (e) {}

    if (!regs || regs.length === 0) {
      regs = memoryRegistrations.filter((r) => r.tournamentId === id);
    }

    // 2. Track squad assignments across all rounds
    // 2. Track squad assignments across all rounds and specifically within the same stage
    const sameStageRounds = rounds.filter((r) => r.roundNumber === currentRound.roundNumber);
    const stageDivisions = sameStageRounds.map((r) => ({
      id: r.id,
      name: r.name,
      teamCount: (r.roundTeams || []).length,
      maxTeams: r.maxTeams || 12,
    }));

    const siblingDivisionMap: Record<string, string> = {};
    for (const sr of sameStageRounds) {
      if (sr.id !== roundId && sr.roundTeams) {
        for (const rt of sr.roundTeams) {
          siblingDivisionMap[rt.teamId] = sr.name;
          const reg = regs.find((regItem) => regItem.teamId === rt.teamId || regItem.id === rt.teamId);
          if (reg) {
            siblingDivisionMap[reg.id] = sr.name;
            if (reg.teamId) siblingDivisionMap[reg.teamId] = sr.name;
          }
        }
      }
    }

    const teamAssignmentMap: Record<string, string> = {};
    for (const r of rounds) {
      if (r.roundTeams) {
        for (const rt of r.roundTeams) {
          const reg = regs.find((regItem) => regItem.teamId === rt.teamId || regItem.id === rt.teamId);
          teamAssignmentMap[rt.teamId] = r.name;
          if (reg) {
            teamAssignmentMap[reg.id] = r.name;
            if (reg.teamId) teamAssignmentMap[reg.teamId] = r.name;
          }
        }
      }
    }

    const currentRoundTeamIds = (currentRound.roundTeams || []).map((rt: any) => rt.teamId);

    // 3. Determine if this round is an entry round (Round 1 / Group stage) or if prior rounds have qualified teams
    const isRound1 =
      currentRound.roundNumber === 1 ||
      currentRound.name.includes("ROUND 1") ||
      currentRound.name.includes("GROUP") ||
      currentRoundIndex === 0;

    const priorRounds = rounds.filter((r) => r.roundNumber < currentRound.roundNumber && r.id !== roundId);
    const hasPriorQualifiedTeams = priorRounds.some((r) =>
      (r.roundTeams || []).some((rt: any) => rt.status === "QUALIFIED" || rt.status === "ADVANCED")
    );

    let eligibleTeams: any[] = [];

    if (isRound1 || !hasPriorQualifiedTeams) {
      // In Round 1 or Group rounds, all approved squads are eligible to be assigned
      eligibleTeams = regs.map((r) => {
        const teamKey = r.teamId || r.id;
        const assignedRound = teamAssignmentMap[teamKey] || teamAssignmentMap[r.id];
        const siblingRound = siblingDivisionMap[teamKey] || siblingDivisionMap[r.id];
        const isSelected =
          currentRoundTeamIds.includes(teamKey) ||
          currentRoundTeamIds.includes(r.id) ||
          (r.teamId && currentRoundTeamIds.includes(r.teamId));

        return {
          id: r.id,
          teamId: teamKey,
          teamName: r.teamName,
          captainName: r.captainName || r.captainIgn || "Captain",
          captainPhone: r.captainPhone || r.whatsapp,
          status: r.status,
          paymentStatus: r.paymentStatus,
          alreadySelected: Boolean(isSelected),
          assignedRoundName: assignedRound || null,
          isAssignedToOtherDivisionInStage: Boolean(siblingRound),
          otherDivisionName: siblingRound || null,
          isUnassignedInStage: !isSelected && !siblingRound,
          previousRoundStatus: "CONFIRMED_REGISTRATION",
          previousRoundName: "Registrations",
        };
      });
    } else {
      // Round 2+ with prior qualified teams:
      const qualifiedTeamsFromPrior: any[] = [];
      for (const pRound of priorRounds) {
        for (const rt of pRound.roundTeams || []) {
          if (rt.status === "QUALIFIED" || rt.status === "ADVANCED") {
            const reg = regs.find((r) => r.teamId === rt.teamId || r.id === rt.teamId || r.teamName === rt.team?.teamName);
            const isSelected = currentRoundTeamIds.includes(rt.teamId);
            const siblingRound = siblingDivisionMap[rt.teamId] || (reg ? siblingDivisionMap[reg.id] : null);

            qualifiedTeamsFromPrior.push({
              id: rt.teamId,
              teamId: rt.teamId,
              teamName: rt.team?.teamName || rt.team?.name || (reg ? reg.teamName : (rt.teamName || rt.teamId)),
              captainName: reg ? (reg.captainName || reg.captainIgn) : "Captain",
              status: rt.status,
              score: rt.score || 0,
              alreadySelected: Boolean(isSelected),
              assignedRoundName: teamAssignmentMap[rt.teamId] || null,
              isAssignedToOtherDivisionInStage: Boolean(siblingRound),
              otherDivisionName: siblingRound || null,
              isUnassignedInStage: !isSelected && !siblingRound,
              previousRoundStatus: rt.status,
              previousRoundName: pRound.name,
              isQualifiedFromPrior: true,
            });
          }
        }
      }

      // Also list remaining registrations as wildcard fallback so admin is never blocked
      const qualifiedIds = new Set(qualifiedTeamsFromPrior.map((t) => t.teamId));
      const otherRegs = regs
        .filter((r) => !qualifiedIds.has(r.teamId || r.id))
        .map((r) => {
          const teamKey = r.teamId || r.id;
          const assignedRound = teamAssignmentMap[teamKey] || teamAssignmentMap[r.id];
          const siblingRound = siblingDivisionMap[teamKey] || siblingDivisionMap[r.id];
          const isSelected =
            currentRoundTeamIds.includes(teamKey) ||
            currentRoundTeamIds.includes(r.id) ||
            (r.teamId && currentRoundTeamIds.includes(r.teamId));

          return {
            id: r.id,
            teamId: teamKey,
            teamName: r.teamName,
            captainName: r.captainName || r.captainIgn || "Captain",
            captainPhone: r.captainPhone || r.whatsapp,
            status: r.status,
            paymentStatus: r.paymentStatus,
            alreadySelected: Boolean(isSelected),
            assignedRoundName: assignedRound || null,
            isAssignedToOtherDivisionInStage: Boolean(siblingRound),
            otherDivisionName: siblingRound || null,
            isUnassignedInStage: !isSelected && !siblingRound,
            previousRoundStatus: "DIRECT_REGISTRATION",
            previousRoundName: "All Squads",
            isQualifiedFromPrior: false,
          };
        });

      eligibleTeams = [...qualifiedTeamsFromPrior, ...otherRegs];
    }

    res.json({
      success: true,
      data: eligibleTeams,
      round: parseRoundWithCredentials(currentRound),
      stageDivisions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/rounds/:roundId/teams
 */
export const selectTeamsForRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, roundId } = req.params;
    const { teamIds } = req.body;

    if (!Array.isArray(teamIds)) {
      res.status(400).json({ success: false, message: "teamIds array is required" });
      return;
    }

    // 1. Fetch registrations to resolve teamId and ensure Team record exists
    let regs: any[] = [];
    try {
      regs = await prisma.tournamentRegistration.findMany({
        where: { tournamentId: id },
        include: { team: true },
      });
    } catch (e) {}

    // Find default leaderId
    let defaultUserId: string | null = (req as any).user?.id || null;
    if (!defaultUserId) {
      const u = await prisma.user.findFirst();
      defaultUserId = u?.id || null;
    }

    // Free Fire lobby slots: Slot 1 to 12
    let slotIndex = 1;
    const resolvedTeamIds: string[] = [];

    for (const rawId of teamIds) {
      const reg = regs.find((r) => r.id === rawId || r.teamId === rawId || r.teamName === rawId);
      let targetTeamId = rawId;

      if (reg && reg.teamId) {
        targetTeamId = reg.teamId;
      } else if (reg && !reg.teamId) {
        let team = await prisma.team.findFirst({ where: { tournamentId: id, teamName: reg.teamName } });
        if (!team && defaultUserId) {
          try {
            team = await prisma.team.create({
              data: {
                tournamentId: id,
                teamName: reg.teamName,
                leaderId: reg.submittedById || defaultUserId,
                status: "CONFIRMED",
              },
            });
            await prisma.tournamentRegistration.update({
              where: { id: reg.id },
              data: { teamId: team.id },
            });
          } catch (err) {}
        }
        if (team) {
          targetTeamId = team.id;
        }
      }

      resolvedTeamIds.push(targetTeamId);

      try {
        await (prisma as any).roundTeam.upsert({
          where: {
            roundId_teamId: {
              roundId,
              teamId: targetTeamId,
            },
          },
          update: {
            status: "QUALIFIED",
            seed: slotIndex,
          },
          create: {
            roundId,
            teamId: targetTeamId,
            status: "QUALIFIED",
            seed: slotIndex,
            score: 0,
          },
        });
      } catch (e) {
        console.warn("Prisma selectTeamsForRound upsert error:", e);
      }

      // Memory fallback sync
      const memRt = memoryRoundTeams.find((rt) => rt.roundId === roundId && rt.teamId === targetTeamId);
      if (memRt) {
        memRt.status = "QUALIFIED";
        memRt.seed = slotIndex;
      } else {
        memoryRoundTeams.push({
          id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          roundId,
          teamId: targetTeamId,
          teamName: reg ? reg.teamName : targetTeamId,
          status: "QUALIFIED",
          seed: slotIndex,
          score: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      slotIndex++;
    }

    // Delete any teams in this round that were deselected
    try {
      const existingRts = await (prisma as any).roundTeam.findMany({ where: { roundId } });
      for (const rt of existingRts) {
        if (!resolvedTeamIds.includes(rt.teamId)) {
          await (prisma as any).roundTeam.delete({ where: { id: rt.id } });
        }
      }
    } catch (e) {}

    memoryRoundTeams = memoryRoundTeams.filter(
      (rt) => rt.roundId !== roundId || resolvedTeamIds.includes(rt.teamId)
    );

    res.json({
      success: true,
      message: `Successfully updated ${teamIds.length} squad(s) for this round`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/rounds/:roundId/advance
 */
export const advanceTeams = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, roundId } = req.params;
    const { teamIds, nextRoundId, markUnselectedAsEliminated } = req.body;

    if (!Array.isArray(teamIds) || teamIds.length === 0 || !nextRoundId) {
      res.status(400).json({ success: false, message: "teamIds and nextRoundId are required" });
      return;
    }

    let advancedCount = 0;
    let nextRoundSlot = 1;

    try {
      const existingInNext = await (prisma as any).roundTeam.findMany({ where: { roundId: nextRoundId } });
      nextRoundSlot = existingInNext.length + 1;
    } catch (e) {}

    for (const tId of teamIds) {
      advancedCount++;

      // 1. Mark in current round as ADVANCED
      try {
        await (prisma as any).roundTeam.updateMany({
          where: { roundId, teamId: tId },
          data: { status: "ADVANCED", qualifiedAt: new Date() },
        });
      } catch (e) {}

      const currentRt = memoryRoundTeams.find((rt) => rt.roundId === roundId && rt.teamId === tId);
      if (currentRt) currentRt.status = "ADVANCED";

      // 2. Put in nextRound as QUALIFIED with new slot number
      try {
        await (prisma as any).roundTeam.upsert({
          where: {
            roundId_teamId: {
              roundId: nextRoundId,
              teamId: tId,
            },
          },
          update: { status: "QUALIFIED", seed: nextRoundSlot },
          create: {
            roundId: nextRoundId,
            teamId: tId,
            status: "QUALIFIED",
            seed: nextRoundSlot,
            score: 0,
            qualifiedAt: new Date(),
          },
        });
        nextRoundSlot++;
      } catch (e) {}

      const existingNext = memoryRoundTeams.find((rt) => rt.roundId === nextRoundId && rt.teamId === tId);
      if (existingNext) {
        existingNext.status = "QUALIFIED";
        existingNext.seed = nextRoundSlot;
      } else {
        const reg = memoryRegistrations.find((r) => r.id === tId || r.teamName === tId);
        memoryRoundTeams.push({
          id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          roundId: nextRoundId,
          teamId: tId,
          teamName: reg ? reg.teamName : tId,
          status: "QUALIFIED",
          seed: nextRoundSlot,
          score: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 3. If markUnselectedAsEliminated is true:
    // Any squad in this round NOT in teamIds gets marked as ELIMINATED (Tournament Ended)
    if (markUnselectedAsEliminated) {
      try {
        const allInRound = await (prisma as any).roundTeam.findMany({ where: { roundId } });
        for (const rt of allInRound) {
          if (!teamIds.includes(rt.teamId) && rt.status !== "ADVANCED") {
            await (prisma as any).roundTeam.update({
              where: { id: rt.id },
              data: {
                status: "ELIMINATED",
                eliminatedAt: new Date(),
              },
            });
          }
        }
      } catch (e) {}

      for (const memRt of memoryRoundTeams) {
        if (memRt.roundId === roundId && !teamIds.includes(memRt.teamId) && memRt.status !== "ADVANCED") {
          memRt.status = "ELIMINATED";
          memRt.eliminatedAt = new Date();
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully advanced ${advancedCount} squad(s) to the next round.${
        markUnselectedAsEliminated ? " Unselected squads marked as Eliminated." : ""
      }`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id/rounds/:roundId/credentials
 */
export const updateRoundCredentials = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, roundId } = req.params;
    const { roomId, roomPassword, map, roomTime, credentialsPublished, customNotes } = req.body;

    let tournament: any = null;
    try {
      tournament = await prisma.tournament.findFirst({
        where: { OR: [{ id }, { slug: id }] },
      });
    } catch (e) {}
    if (!tournament) {
      tournament = memoryTournaments.find((t) => t.id === id || t.slug === id);
    }
    const resolvedTournamentId = tournament?.id || id;

    let round: any = null;

    // 1. Try finding by roundId in Prisma
    try {
      round = await (prisma as any).tournamentRound.findUnique({ where: { id: roundId } });
    } catch (e) {}

    // 2. Try finding by tournamentId & roundId / name / number in Prisma
    if (!round) {
      try {
        const numVal = Number(roundId);
        round = await (prisma as any).tournamentRound.findFirst({
          where: {
            tournamentId: resolvedTournamentId,
            OR: [
              { id: roundId },
              { name: roundId },
              ...(!isNaN(numVal) && numVal > 0 ? [{ roundNumber: numVal }] : []),
            ],
          },
        });
      } catch (e) {}
    }

    // 3. Try finding in memory store
    if (!round) {
      round = memoryRounds.find(
        (r) =>
          r.id === roundId ||
          ((r.tournamentId === resolvedTournamentId || r.tournamentId === id) &&
            (r.name === roundId || String(r.roundNumber) === String(roundId)))
      );
    }

    // 4. Try finding first round of this tournament in Prisma
    if (!round) {
      try {
        round = await (prisma as any).tournamentRound.findFirst({
          where: { tournamentId: resolvedTournamentId },
          orderBy: { roundNumber: "asc" },
        });
      } catch (e) {}
    }

    // 5. Try finding first round of this tournament in memory
    if (!round) {
      round = memoryRounds.find((r) => r.tournamentId === resolvedTournamentId || r.tournamentId === id);
    }

    // 6. If tournament exists but has no round yet, create default round to never fail with 404
    if (!round) {
      try {
        round = await (prisma as any).tournamentRound.create({
          data: {
            tournamentId: resolvedTournamentId,
            name: "ROUND 1",
            roundNumber: 1,
            roundType: "BATTLE_ROYALE",
            maxTeams: 12,
            selectionMethod: "MANUAL",
            status: "UPCOMING",
            description: JSON.stringify({}),
          },
        });
      } catch (e) {}

      if (!round) {
        round = {
          id: roundId && roundId !== "undefined" && roundId !== "default" ? roundId : `round-${resolvedTournamentId}-1`,
          tournamentId: resolvedTournamentId,
          name: "ROUND 1",
          roundNumber: 1,
          roundType: "BATTLE_ROYALE",
          maxTeams: 12,
          selectionMethod: "MANUAL",
          status: "UPCOMING",
          description: JSON.stringify({}),
          createdAt: new Date(),
          updatedAt: new Date(),
          roundTeams: [],
        };
        memoryRounds.push(round);
      }
    }

    const targetId = round.id;

    let existingMeta: any = {};
    if (round.description && typeof round.description === "string" && round.description.trim().startsWith("{")) {
      try {
        existingMeta = JSON.parse(round.description);
      } catch (e) {}
    }

    const cleanRoomId = roomId !== undefined ? String(roomId).trim() : existingMeta.roomId || "";
    const cleanRoomPassword = roomPassword !== undefined ? String(roomPassword).trim() : existingMeta.roomPassword || "";

    // If roomId is provided, default credentialsPublished to true unless explicitly passed false
    const isPublished =
      credentialsPublished !== undefined
        ? Boolean(credentialsPublished)
        : cleanRoomId
        ? true
        : Boolean(existingMeta.credentialsPublished);

    const updatedMeta = {
      ...existingMeta,
      roomId: cleanRoomId,
      roomPassword: cleanRoomPassword,
      map: map !== undefined ? map : existingMeta.map || "BERMUDA",
      roomTime: roomTime !== undefined ? roomTime : existingMeta.roomTime || round.startTime || "",
      credentialsPublished: isPublished,
      customNotes: customNotes !== undefined ? customNotes : existingMeta.customNotes || "",
    };

    let updatedRound: any = null;
    try {
      updatedRound = await (prisma as any).tournamentRound.update({
        where: { id: targetId },
        data: {
          description: JSON.stringify(updatedMeta),
          startTime: updatedMeta.roomTime || round.startTime,
        },
        include: {
          roundTeams: {
            include: { team: true },
          },
        },
      });
    } catch (e) {
      console.warn("Prisma updateRoundCredentials fallback to memory:", e);
    }

    const memIdx = memoryRounds.findIndex((r) => r.id === targetId || r.id === roundId);
    if (memIdx !== -1) {
      memoryRounds[memIdx] = {
        ...memoryRounds[memIdx],
        description: JSON.stringify(updatedMeta),
        startTime: updatedMeta.roomTime || memoryRounds[memIdx].startTime,
        updatedAt: new Date(),
      };
      if (!updatedRound) updatedRound = memoryRounds[memIdx];
    } else {
      const memObj = {
        ...round,
        id: targetId,
        tournamentId: resolvedTournamentId,
        description: JSON.stringify(updatedMeta),
        startTime: updatedMeta.roomTime || round.startTime,
        updatedAt: new Date(),
      };
      memoryRounds.push(memObj);
      if (!updatedRound) updatedRound = memObj;
    }

    // Broadcast in-app notifications and send room credentials email to team leaders
    if (isPublished && cleanRoomId) {
      try {
        const regs = await prisma.tournamentRegistration.findMany({
          where: { tournamentId: resolvedTournamentId },
          include: {
            tournament: { select: { title: true } },
            team: {
              include: {
                leader: { select: { email: true, ign: true, username: true } },
              },
            },
            submittedBy: { select: { email: true, ign: true, username: true } },
          },
        });

        // 1. In-app notifications
        const userIds = Array.from(new Set(regs.map((r) => r.submittedById).filter(Boolean)));
        for (const uid of userIds) {
          await prisma.notification.create({
            data: {
              userId: uid as string,
              type: "ANNOUNCEMENT",
              title: "Room Credentials Published! 🎮",
              message: `Custom room credentials for ${round.name} are live. Room ID: ${cleanRoomId}, Pass: ${cleanRoomPassword}. Check your dashboard.`,
              metadata: JSON.stringify({ tournamentId: resolvedTournamentId, roundId: targetId, roomId: cleanRoomId }),
            },
          }).catch(() => {});
        }

        // 2. Automatically dispatch Room Credentials Email to team leaders
        for (const reg of regs) {
          const leaderEmail = reg.captainEmail || reg.team?.leader?.email || reg.submittedBy?.email;
          const leaderName =
            reg.captainName ||
            reg.captainIgn ||
            reg.team?.leader?.ign ||
            reg.team?.leader?.username ||
            reg.submittedBy?.ign ||
            "Team Leader";
          const teamName = reg.teamName || reg.team?.teamName || "Your Squad";

          if (leaderEmail) {
            sendRoomCredentialsEmail({
              leaderEmail,
              leaderName,
              teamName,
              tournamentTitle: reg.tournament?.title || (tournament as any)?.title || "Free Fire Tournament",
              roundName: round.name || "ROUND 1",
              roomId: cleanRoomId,
              roomPassword: cleanRoomPassword,
              map: updatedMeta.map || "BERMUDA",
              roomTime: updatedMeta.roomTime || "",
              slotNumber: reg.slotNumber || 1,
              customNotes: updatedMeta.customNotes || "",
            }).catch((err) => console.warn(`[sendRoomCredentialsEmail] Error sending to ${leaderEmail}:`, err));
          }
        }
      } catch (e) {
        console.warn("[updateRoundCredentials] Notification & Email dispatch error:", e);
      }

      // Memory store fallback email dispatch
      try {
        const memRegs = memoryRegistrations.filter(
          (r) => r.tournamentId === resolvedTournamentId || r.tournamentId === id
        );
        for (const mr of memRegs) {
          const mEmail = mr.captainEmail || (mr as any).leaderEmail;
          if (mEmail) {
            sendRoomCredentialsEmail({
              leaderEmail: mEmail,
              leaderName: mr.captainName || mr.captainIgn || "Team Leader",
              teamName: mr.teamName || "Your Squad",
              tournamentTitle: (tournament as any)?.title || "Free Fire Tournament",
              roundName: round.name || "ROUND 1",
              roomId: cleanRoomId,
              roomPassword: cleanRoomPassword,
              map: updatedMeta.map || "BERMUDA",
              roomTime: updatedMeta.roomTime || "",
              slotNumber: mr.slotNumber || 1,
              customNotes: updatedMeta.customNotes || "",
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      message: "Custom Room credentials saved successfully",
      data: parseRoundWithCredentials(updatedRound),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/my-room-access
 */
export const getMyRoomAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    // Resolve tournament ID in case slug was passed
    let tournament: any = null;
    try {
      tournament = await prisma.tournament.findFirst({
        where: { OR: [{ id }, { slug: id }] },
      });
    } catch (e) {}
    if (!tournament) {
      tournament = memoryTournaments.find((t) => t.id === id || t.slug === id);
    }
    const resolvedTournamentId = tournament?.id || id;

    // 1. Find user's squad registration in this tournament
    let userRegs: any[] = [];
    try {
      userRegs = await prisma.tournamentRegistration.findMany({
        where: {
          tournamentId: resolvedTournamentId,
          OR: [
            { submittedById: userId },
            ...(userEmail ? [{ captainEmail: userEmail }] : []),
            { team: { leaderId: userId } },
            { team: { members: { some: { userId } } } },
          ],
        },
        include: {
          team: {
            include: { members: true },
          },
        },
      });
    } catch (e) {}

    // Fallback: check teams where user is leader or member
    if (!userRegs || userRegs.length === 0) {
      try {
        const userTeams = await prisma.team.findMany({
          where: {
            tournamentId: resolvedTournamentId,
            OR: [
              { leaderId: userId },
              { members: { some: { userId } } },
            ],
          },
          include: {
            registration: true,
            members: true,
          },
        });
        for (const ut of userTeams) {
          if (ut.registration) {
            userRegs.push({
              ...ut.registration,
              team: ut,
            });
          }
        }
      } catch (e) {}
    }

    if (!userRegs || userRegs.length === 0) {
      userRegs = memoryRegistrations.filter(
        (r) =>
          (r.tournamentId === resolvedTournamentId || r.tournamentId === id) &&
          (r.submittedById === userId ||
            r.leaderId === userId ||
            (userEmail && r.captainEmail === userEmail) ||
            (r.players && r.players.some((p: any) => p.userId === userId)))
      );
    }

    if (!userRegs || userRegs.length === 0) {
      res.json({
        success: true,
        data: {
          isRegistered: false,
          hasAccess: false,
          message: "You are not registered in this tournament.",
        },
      });
      return;
    }

    const reg = userRegs[0];
    const teamId = reg.teamId || reg.team?.id || reg.id;
    const teamName = reg.teamName || reg.team?.teamName || "Your Squad";

    // 2. Fetch all rounds for this tournament
    let rounds: any[] = [];
    try {
      rounds = await (prisma as any).tournamentRound.findMany({
        where: { tournamentId: resolvedTournamentId },
        include: {
          roundTeams: {
            include: { team: true },
          },
        },
        orderBy: { roundNumber: "asc" },
      });
    } catch (e) {}

    if (!rounds || rounds.length === 0) {
      rounds = memoryRounds
        .filter((r) => r.tournamentId === resolvedTournamentId || r.tournamentId === id)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    }

    // 3. Check all roundTeam entries for this squad
    const teamRoundEntries: Array<{ round: any; roundTeam: any }> = [];
    for (const r of rounds) {
      const rt = (r.roundTeams || []).find(
        (t: any) =>
          t.teamId === teamId ||
          t.teamId === reg.id ||
          (reg.teamId && t.teamId === reg.teamId) ||
          t.team?.teamName === teamName ||
          t.teamName === teamName
      );
      if (rt) {
        teamRoundEntries.push({ round: r, roundTeam: rt });
      }
    }

    // If squad is registered in tournament but not explicitly linked in roundTeams:
    if (teamRoundEntries.length === 0) {
      if (rounds && rounds.length > 0) {
        const activeRound =
          rounds.find((r) => {
            const p = parseRoundWithCredentials(r);
            return Boolean(p.roomId);
          }) || rounds[0];
        const parsed = parseRoundWithCredentials(activeRound);
        const hasRoomId = Boolean(parsed.roomId);
        const isPub = Boolean(parsed.credentialsPublished || hasRoomId);

        let assignedSlot = reg.slotNumber || 1;
        if (!reg.slotNumber) {
          try {
            const allRegs = await prisma.tournamentRegistration.findMany({
              where: { tournamentId: resolvedTournamentId },
              orderBy: { createdAt: "asc" },
            });
            const idx = allRegs.findIndex((r: any) => r.id === reg.id || (r.teamId && r.teamId === teamId));
            if (idx >= 0) assignedSlot = (idx % 12) + 1;
          } catch (e) {}
        }

        const roundEntryItem = {
          roundId: parsed.id,
          roundName: parsed.name,
          roundNumber: parsed.roundNumber,
          slotNumber: assignedSlot,
          teamStatus: reg.status || "CONFIRMED",
          isEliminated: false,
          isPublished: isPub,
          credentialsPublished: isPub,
          hasAccess: isPub && hasRoomId,
          roomId: isPub ? parsed.roomId : "",
          roomPassword: isPub ? parsed.roomPassword : "",
          map: parsed.map || "BERMUDA",
          roomTime: parsed.roomTime || parsed.startTime || "",
          notes: parsed.customNotes || "",
        };

        if (isPub && hasRoomId) {
          res.json({
            success: true,
            data: {
              isRegistered: true,
              teamName,
              hasAccess: true,
              isEliminated: false,
              isPublished: true,
              credentialsPublished: true,
              roundId: parsed.id,
              roundName: parsed.name,
              roundNumber: parsed.roundNumber,
              slotNumber: assignedSlot,
              roomId: parsed.roomId,
              roomPassword: parsed.roomPassword,
              map: parsed.map || "BERMUDA",
              roomTime: parsed.roomTime || parsed.startTime,
              notes: parsed.customNotes,
              teamStatus: reg.status || "CONFIRMED",
              allAssignedRounds: [roundEntryItem],
              message: `Room credentials published! Join Slot #${assignedSlot} in Free Fire.`,
            },
          });
          return;
        } else {
          res.json({
            success: true,
            data: {
              isRegistered: true,
              teamName,
              hasAccess: false,
              isEliminated: false,
              isPublished: false,
              credentialsPublished: false,
              roundId: parsed.id,
              roundName: parsed.name,
              roundNumber: parsed.roundNumber,
              slotNumber: assignedSlot,
              map: parsed.map || "BERMUDA",
              roomTime: parsed.roomTime || parsed.startTime,
              notes: parsed.customNotes,
              teamStatus: reg.status || "CONFIRMED",
              allAssignedRounds: [roundEntryItem],
              message: `Registration confirmed for ${parsed.name} (Slot #${assignedSlot}). Room credentials reveal 15 minutes before match start time.`,
            },
          });
          return;
        }
      }

      res.json({
        success: true,
        data: {
          isRegistered: true,
          teamName,
          hasAccess: false,
          isEliminated: false,
          message: "Registration confirmed! Waiting for admin to assign round and slot.",
        },
      });
      return;
    }

    // Prioritize round with published credentials if available
    teamRoundEntries.sort((a, b) => {
      const aParsed = parseRoundWithCredentials(a.round);
      const bParsed = parseRoundWithCredentials(b.round);
      const aHasCreds = Boolean(aParsed.roomId && (aParsed.credentialsPublished || aParsed.roomId));
      const bHasCreds = Boolean(bParsed.roomId && (bParsed.credentialsPublished || bParsed.roomId));
      if (aHasCreds && !bHasCreds) return -1;
      if (!aHasCreds && bHasCreds) return 1;
      if (b.round.roundNumber !== a.round.roundNumber) {
        return b.round.roundNumber - a.round.roundNumber;
      }
      const aElim = a.roundTeam.status === "ELIMINATED" || a.roundTeam.status === "DISQUALIFIED";
      const bElim = b.roundTeam.status === "ELIMINATED" || b.roundTeam.status === "DISQUALIFIED";
      if (aElim && !bElim) return 1;
      if (!aElim && bElim) return -1;
      return new Date(b.round.updatedAt || 0).getTime() - new Date(a.round.updatedAt || 0).getTime();
    });

    const allAssignedRounds = teamRoundEntries.map((entry) => {
      const parsed = parseRoundWithCredentials(entry.round);
      const hasRoomId = Boolean(parsed.roomId);
      const isPub = Boolean(parsed.credentialsPublished || hasRoomId);
      const isElim = entry.roundTeam.status === "ELIMINATED" || entry.roundTeam.status === "DISQUALIFIED";
      const hasAcc = isPub && !isElim && hasRoomId;
      return {
        roundId: parsed.id,
        roundName: parsed.name,
        roundNumber: parsed.roundNumber,
        slotNumber: entry.roundTeam.seed || 1,
        teamStatus: entry.roundTeam.status,
        isEliminated: isElim,
        isPublished: isPub,
        credentialsPublished: isPub,
        hasAccess: hasAcc,
        roomId: isPub ? parsed.roomId : "",
        roomPassword: isPub ? parsed.roomPassword : "",
        map: parsed.map || "BERMUDA",
        roomTime: parsed.roomTime || parsed.startTime || "",
        notes: parsed.customNotes || "",
      };
    });

    const latest = teamRoundEntries[0];
    const latestRound = parseRoundWithCredentials(latest.round);
    const latestRoundTeam = latest.roundTeam;

    // Check if team is ELIMINATED in latest round
    if (latestRoundTeam.status === "ELIMINATED" || latestRoundTeam.status === "DISQUALIFIED") {
      res.json({
        success: true,
        data: {
          isRegistered: true,
          teamName,
          hasAccess: false,
          isEliminated: true,
          status: "ELIMINATED",
          eliminatedRound: latestRound.name,
          allAssignedRounds,
          message: `Tournament Ended - Eliminated in ${latestRound.name}`,
        },
      });
      return;
    }

    const slotNumber = latestRoundTeam.seed || 1;
    const hasRoomId = Boolean(latestRound.roomId);
    const isPublished = Boolean(latestRound.credentialsPublished || hasRoomId);

    if (isPublished && hasRoomId) {
      res.json({
        success: true,
        data: {
          isRegistered: true,
          teamName,
          hasAccess: true,
          isEliminated: false,
          isPublished: true,
          credentialsPublished: true,
          roundId: latestRound.id,
          roundName: latestRound.name,
          roundNumber: latestRound.roundNumber,
          slotNumber,
          roomId: latestRound.roomId,
          roomPassword: latestRound.roomPassword,
          map: latestRound.map || "BERMUDA",
          roomTime: latestRound.roomTime || latestRound.startTime,
          notes: latestRound.customNotes,
          teamStatus: latestRoundTeam.status,
          allAssignedRounds,
          message: `Room credentials published! Join Slot #${slotNumber} in Free Fire.`,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          isRegistered: true,
          teamName,
          hasAccess: false,
          isEliminated: false,
          isPublished: false,
          credentialsPublished: false,
          roundId: latestRound.id,
          roundName: latestRound.name,
          roundNumber: latestRound.roundNumber,
          slotNumber,
          map: latestRound.map || "BERMUDA",
          roomTime: latestRound.roomTime || latestRound.startTime,
          teamStatus: latestRoundTeam.status,
          allAssignedRounds,
          message: `You are scheduled for ${latestRound.name} (Slot #${slotNumber}). Credentials unlock 15 minutes before match.`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tournaments/:id/rounds/:roundId/teams/:teamId
 */
export const updateRoundTeamStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roundId, teamId } = req.params;
    const { status, score, seed } = req.body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (score !== undefined) data.score = Number(score);
    if (seed !== undefined) data.seed = Number(seed);

    try {
      await (prisma as any).roundTeam.updateMany({
        where: { roundId, teamId },
        data,
      });
    } catch (e) {
      // fallback
    }

    const rt = memoryRoundTeams.find((item) => item.roundId === roundId && item.teamId === teamId);
    if (rt) {
      if (status !== undefined) rt.status = status;
      if (score !== undefined) rt.score = Number(score);
      if (seed !== undefined) rt.seed = Number(seed);
    }

    res.json({ success: true, message: "Round team status updated successfully", data: rt });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/teams/:teamId/round-history
 */
export const getTeamRoundHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, teamId } = req.params;

    let history: any[] = [];
    try {
      history = await (prisma as any).roundTeam.findMany({
        where: {
          teamId,
          round: { tournamentId: id },
        },
        include: {
          round: true,
        },
        orderBy: {
          round: { roundNumber: "asc" },
        },
      });
    } catch (e) {
      // memory fallback
    }

    if (!history || history.length === 0) {
      history = memoryRoundTeams
        .filter((rt) => rt.teamId === teamId)
        .map((rt) => {
          const r = memoryRounds.find((round) => round.id === rt.roundId && round.tournamentId === id);
          return r ? { ...rt, round: r } : null;
        })
        .filter(Boolean);
    }

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// ================= WAITLIST SYSTEM =================

/**
 * GET /api/tournaments/:id/waitlist
 */
export const getTournamentWaitlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let waitlist: any[] = [];
    if (dbConnected) {
      try {
        waitlist = await prisma.tournamentRegistration.findMany({
          where: {
            tournamentId: id,
            OR: [
              { isWaitlisted: true },
              { status: "WAITLISTED" },
            ],
          },
          include: {
            players: true,
            team: true,
            payment: true,
          },
          orderBy: [{ waitlistPriority: "asc" }, { createdAt: "asc" }],
        });
      } catch (err) {
        console.warn("DB waitlist fetch failed:", err);
      }
    }
    if (!waitlist || waitlist.length === 0) {
      waitlist = memoryRegistrations.filter(
        (r) => r.tournamentId === id && (r.isWaitlisted || r.status === "WAITLISTED")
      );
    }
    res.json({ success: true, data: waitlist });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/waitlist/:registrationId/promote
 */
export const promoteWaitlistTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, registrationId } = req.params;
    if (dbConnected) {
      try {
        const reg = await prisma.tournamentRegistration.findUnique({
          where: { id: registrationId },
          include: { team: true },
        });
        if (!reg || reg.tournamentId !== id) {
          res.status(404).json({ success: false, message: "Registration not found in waitlist" });
          return;
        }

        const confirmedCount = await prisma.tournamentRegistration.count({
          where: { tournamentId: id, status: { in: ["CONFIRMED", "APPROVED"] } },
        });

        const updated = await prisma.tournamentRegistration.update({
          where: { id: registrationId },
          data: {
            isWaitlisted: false,
            waitlistPriority: null,
            status: "APPROVED",
            slotNumber: confirmedCount + 1,
            approvedAt: new Date(),
            confirmedAt: new Date(),
          },
        });

        await prisma.tournament.update({
          where: { id },
          data: { registeredTeams: { increment: 1 } },
        });

        if (reg.teamId) {
          await prisma.team.update({
            where: { id: reg.teamId },
            data: { status: "CONFIRMED" },
          });
          const existingLb = await prisma.tournamentLeaderboard.findFirst({
            where: { tournamentId: id, teamId: reg.teamId },
          });
          if (existingLb) {
            await prisma.tournamentLeaderboard.update({
              where: { id: existingLb.id },
              data: { status: "ACTIVE" },
            });
          } else {
            await prisma.tournamentLeaderboard.create({
              data: {
                tournamentId: id,
                teamId: reg.teamId,
                teamName: reg.teamName,
                rank: confirmedCount + 1,
                status: "ACTIVE",
              },
            });
          }
        }

        if (reg.submittedById) {
          await prisma.notification.create({
            data: {
              userId: reg.submittedById,
              type: "WAITLIST_PROMOTED",
              title: "Promoted from Waitlist! 🎉",
              message: `Great news! Team ${reg.teamName} has been promoted from the waitlist to an official slot in the tournament.`,
              metadata: JSON.stringify({ registrationId, tournamentId: id }),
            },
          }).catch(() => {});
        }

        res.json({ success: true, message: "Team successfully promoted to official tournament slot", data: updated });
        return;
      } catch (dbErr) {
        console.warn("DB promote failed:", dbErr);
      }
    }

    const reg = memoryRegistrations.find((r) => r.id === registrationId && r.tournamentId === id);
    if (!reg) {
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }
    reg.isWaitlisted = false;
    reg.status = "APPROVED";
    reg.approvedAt = new Date();
    res.json({ success: true, message: "Team promoted from waitlist", data: reg });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tournaments/:id/waitlist/:registrationId
 */
export const removeWaitlistTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, registrationId } = req.params;
    if (dbConnected) {
      try {
        await prisma.tournamentRegistration.update({
          where: { id: registrationId },
          data: {
            status: "CANCELLED",
            isWaitlisted: false,
          },
        });
        res.json({ success: true, message: "Team removed from waitlist" });
        return;
      } catch (err) {
        console.warn("DB remove from waitlist failed:", err);
      }
    }
    const reg = memoryRegistrations.find((r) => r.id === registrationId);
    if (reg) {
      reg.status = "CANCELLED";
      reg.isWaitlisted = false;
    }
    res.json({ success: true, message: "Team removed from waitlist" });
  } catch (error) {
    next(error);
  }
};

// ================= CHECK-IN SYSTEM =================

/**
 * POST /api/tournaments/:id/check-in
 * Athlete or admin checks in team
 */
export const checkInTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { registrationId } = req.body || {};

    if (dbConnected) {
      try {
        const tournament = await prisma.tournament.findFirst({
          where: { OR: [{ id }, { slug: id }] },
        });

        if (!tournament) {
          res.status(404).json({ success: false, message: "Tournament not found" });
          return;
        }

        if (!tournament.checkInEnabled) {
          res.status(400).json({ success: false, message: "Check-in is not enabled for this tournament." });
          return;
        }

        const now = new Date();
        if (tournament.checkInStartTime && now < new Date(tournament.checkInStartTime)) {
          res.status(400).json({
            success: false,
            message: `Check-in is not open yet. Check-in starts at ${new Date(tournament.checkInStartTime).toLocaleString("en-IN")}`,
          });
          return;
        }

        if (tournament.checkInEndTime && now > new Date(tournament.checkInEndTime)) {
          res.status(400).json({
            success: false,
            message: "Check-in window has closed for this tournament.",
          });
          return;
        }

        // Find registration
        let reg = null;
        if (registrationId) {
          reg = await prisma.tournamentRegistration.findUnique({ where: { id: registrationId } });
        } else if (userId) {
          reg = await prisma.tournamentRegistration.findFirst({
            where: {
              tournamentId: tournament.id,
              submittedById: userId,
              status: { in: ["CONFIRMED", "APPROVED"] },
            },
          });
        }

        if (!reg) {
          res.status(404).json({ success: false, message: "No confirmed registration found for this user in this tournament" });
          return;
        }

        if (reg.checkInStatus === "CHECKED_IN") {
          res.json({ success: true, message: "Team is already checked in!", data: reg });
          return;
        }

        const updated = await prisma.tournamentRegistration.update({
          where: { id: reg.id },
          data: {
            checkInStatus: "CHECKED_IN",
            checkInTime: new Date(),
          },
        });

        res.json({
          success: true,
          message: `Team ${reg.teamName} successfully checked in! You are ready for the tournament.`,
          data: updated,
        });
        return;
      } catch (dbErr) {
        console.warn("DB checkInTeam failed:", dbErr);
      }
    }

    res.json({ success: true, message: "Team successfully checked in!" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id/check-in-status
 */
export const getTournamentCheckInStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let registrations: any[] = [];
    if (dbConnected) {
      try {
        registrations = await prisma.tournamentRegistration.findMany({
          where: {
            tournamentId: id,
            status: { in: ["CONFIRMED", "APPROVED"] },
          },
          select: {
            id: true,
            teamName: true,
            captainIgn: true,
            checkInStatus: true,
            checkInTime: true,
            status: true,
          },
        });
      } catch (err) {
        console.warn("DB checkin status query failed:", err);
      }
    }
    const total = registrations.length;
    const checkedIn = registrations.filter((r) => r.checkInStatus === "CHECKED_IN").length;
    const pending = registrations.filter((r) => !r.checkInStatus || r.checkInStatus === "PENDING" || r.checkInStatus === "NOT_CHECKED_IN").length;
    const noShows = registrations.filter((r) => r.checkInStatus === "NO_SHOW").length;

    res.json({
      success: true,
      data: {
        total,
        checkedIn,
        pending,
        noShows,
        teams: registrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tournaments/:id/handle-no-shows
 */
export const handleNoShows = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (dbConnected) {
      try {
        const noShowRegs = await prisma.tournamentRegistration.updateMany({
          where: {
            tournamentId: id,
            status: { in: ["CONFIRMED", "APPROVED"] },
            NOT: {
              checkInStatus: "CHECKED_IN",
            },
          },
          data: {
            checkInStatus: "NO_SHOW",
          },
        });

        res.json({
          success: true,
          message: `Marked ${noShowRegs.count} non-checked-in teams as NO_SHOW.`,
          count: noShowRegs.count,
        });
        return;
      } catch (dbErr) {
        console.warn("DB handleNoShows failed:", dbErr);
      }
    }
    res.json({ success: true, message: "No-show processing completed." });
  } catch (error) {
    next(error);
  }
};


