import { Router } from "express";
import { authenticate, optionalAuth, requireRole } from "../middleware/auth.js";

// Controllers
import * as authCtrl from "../controllers/authController.js";
import * as tournamentCtrl from "../controllers/tournamentController.js";
import * as notificationCtrl from "../controllers/notificationController.js";
import * as teamCtrl from "../controllers/teamController.js";
import * as matchCtrl from "../controllers/matchController.js";
import * as standingCtrl from "../controllers/standingController.js";
import * as playerCtrl from "../controllers/playerController.js";
import * as legendCtrl from "../controllers/legendController.js";
import * as merchCtrl from "../controllers/merchandiseController.js";
import * as orderCtrl from "../controllers/orderController.js";
import * as newsCtrl from "../controllers/newsController.js";
import * as partnerCtrl from "../controllers/partnerController.js";
import * as mediaCtrl from "../controllers/mediaController.js";
import * as settingCtrl from "../controllers/settingController.js";
import * as analyticsCtrl from "../controllers/analyticsController.js";
import * as userCtrl from "../controllers/userController.js";
import * as uploadCtrl from "../controllers/uploadController.js";
import * as planCtrl from "../controllers/partnerPlanController.js";
import * as votingCtrl from "../controllers/votingController.js";
import { cacheMiddleware, delCache, getCacheStatus } from "../config/cache.js";

const invalidate = (pattern: string) => (_req: any, _res: any, next: any) => {
  delCache(pattern).catch(() => {});
  next();
};

const router = Router();

// Cache health & status route
router.get("/cache/status", (_req, res) => {
  res.json({ success: true, ...getCacheStatus() });
});

// ================= AUTH ROUTES =================
router.post("/auth/login", authCtrl.login);
router.post("/auth/register", authCtrl.register);
router.post("/auth/forgot-password", authCtrl.forgotPassword);
router.post("/auth/verify-otp", authCtrl.verifyResetOtp);
router.post("/auth/reset-password", authCtrl.resetPassword);
router.post("/auth/logout", authCtrl.logout);
router.get("/auth/me", authenticate, authCtrl.getMe);
router.put("/auth/profile", authenticate, authCtrl.updateProfile);

// ================= NOTIFICATIONS & INVITATIONS =================
router.get("/notifications", authenticate, notificationCtrl.getNotifications);
router.put("/notifications/read-all", authenticate, notificationCtrl.markAllNotificationsRead);
router.put("/notifications/:id/read", authenticate, notificationCtrl.markNotificationRead);
router.post("/invitations/:id/respond", authenticate, notificationCtrl.respondToInvitation);

// ================= PLAYER SEARCH & TEAM ROSTER =================
router.get("/players/search", optionalAuth, teamCtrl.searchPlayers);
router.get("/my-tournaments", authenticate, teamCtrl.getMyTournaments);
router.post("/teams/:teamId/invite", authenticate, teamCtrl.invitePlayerToTeam);
router.delete("/teams/:teamId/members/:memberId", authenticate, teamCtrl.removePlayerFromTeam);
router.post(
  "/teams/:teamId/override-roster",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  teamCtrl.adminOverrideRoster
);

// ================= TOURNAMENT ROUTES =================
router.get("/tournaments", tournamentCtrl.getTournaments);
router.get(
  "/tournaments/admin/analytics",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.getTournamentAnalytics
);
router.get(
  "/tournaments/registrations",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.getAllRegistrations
);
router.post(
  "/tournaments/registrations/:id/payment",
  authenticate,
  invalidate("http:*tournaments*"),
  tournamentCtrl.submitPayment
);
router.put(
  "/tournaments/registrations/:id/payment-verify",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.verifyPayment
);
router.put(
  "/tournaments/registrations/:id/payment-reject",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.rejectPayment
);
router.put(
  "/tournaments/registrations/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.updateRegistrationStatus
);
router.put(
  "/tournaments/registrations/:id/payment",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.updatePaymentStatus
);
router.post(
  "/tournaments/registrations/bulk",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.bulkActionRegistrations
);
router.get(
  "/tournaments/:id/export",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.exportRegistrationsCsv
);
router.get("/tournaments/:id/teams", tournamentCtrl.getTournamentTeams);
router.post(
  "/tournaments/:id/duplicate",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.duplicateTournament
);

// Tournament Waitlist
router.get("/tournaments/:id/waitlist", tournamentCtrl.getTournamentWaitlist);
router.post(
  "/tournaments/:id/waitlist/:registrationId/promote",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.promoteWaitlistTeam
);
router.delete(
  "/tournaments/:id/waitlist/:registrationId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.removeWaitlistTeam
);

// Tournament Check-In
router.post("/tournaments/:id/check-in", authenticate, tournamentCtrl.checkInTeam);
router.post("/tournaments/:id/checkin", authenticate, tournamentCtrl.checkInTeam);
router.get("/tournaments/:id/check-in-status", tournamentCtrl.getTournamentCheckInStatus);
router.get("/tournaments/:id/matches", matchCtrl.getMatches);
router.post(
  "/tournaments/:id/handle-no-shows",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.handleNoShows
);

// Stages & Team Progression
router.get("/tournaments/:id/stages", tournamentCtrl.getStages);
router.post(
  "/tournaments/:id/stages",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.createStage
);
router.put(
  "/tournaments/stages/:stageId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.updateStage
);
router.delete(
  "/tournaments/stages/:stageId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.deleteStage
);
router.post(
  "/tournaments/:id/stages/move-teams",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.moveTeamsToStage
);

// Tournament Rounds & Team Selection / Progression
router.get("/tournaments/:id/rounds", tournamentCtrl.getRounds);
router.post(
  "/tournaments/:id/rounds",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.createRound
);
router.post(
  "/tournaments/:id/rounds/batch-divisions",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.createBatchDivisions
);
router.post(
  "/tournaments/:id/rounds/auto-distribute",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.autoDistributeSquads
);
router.put(
  "/tournaments/:id/rounds/:roundId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.updateRound
);
router.delete(
  "/tournaments/:id/rounds/:roundId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.deleteRound
);
router.get(
  "/tournaments/:id/rounds/:roundId/eligible-teams",
  tournamentCtrl.getEligibleTeamsForRound
);
router.post(
  "/tournaments/:id/rounds/:roundId/teams",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.selectTeamsForRound
);
router.post(
  "/tournaments/:id/rounds/:roundId/advance",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.advanceTeams
);
router.put(
  "/tournaments/:id/rounds/:roundId/teams/:teamId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.updateRoundTeamStatus
);
router.put(
  "/tournaments/:id/rounds/:roundId/credentials",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.updateRoundCredentials
);
router.get(
  "/tournaments/:id/my-room-access",
  authenticate,
  tournamentCtrl.getMyRoomAccess
);
router.get(
  "/tournaments/:id/teams/:teamId/round-history",
  tournamentCtrl.getTeamRoundHistory
);


// Tournament Leaderboard
router.get("/tournaments/:id/leaderboard", tournamentCtrl.getLeaderboard);
router.put(
  "/tournaments/:id/leaderboard",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.updateLeaderboardBatch
);
router.post(
  "/tournaments/:id/leaderboard/entry",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.addLeaderboardEntry
);
router.delete(
  "/tournaments/:id/leaderboard/:entryId",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  tournamentCtrl.deleteLeaderboardEntry
);

router.get("/tournaments/:id", tournamentCtrl.getTournamentById);
router.post(
  "/tournaments",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.createTournament
);
router.put(
  "/tournaments/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.updateTournament
);
router.delete(
  "/tournaments/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*tournaments*"),
  tournamentCtrl.deleteTournament
);
router.post(
  "/tournaments/:id/register",
  optionalAuth,
  invalidate("http:*tournaments*"),
  tournamentCtrl.registerSquad
);

// ================= MATCH CENTER ROUTES =================
router.get("/matches", matchCtrl.getMatches);
router.get("/matches/:id/credentials", authenticate, matchCtrl.getMatchCredentials);
router.post(
  "/matches",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  matchCtrl.createMatch
);
router.put(
  "/matches/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  matchCtrl.updateMatch
);
router.delete(
  "/matches/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  matchCtrl.deleteMatch
);

// ================= STANDINGS ROUTES =================
router.get("/standings", cacheMiddleware(60), standingCtrl.getStandings);
router.put(
  "/standings/batch",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  standingCtrl.updateStandingsBatch
);

// ================= PLAYERS ROUTES =================
router.get("/players", cacheMiddleware(180), playerCtrl.getPlayers);
router.get(
  "/players/admin/all",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN", "CONTENT_EDITOR"),
  playerCtrl.getAllPlayersAdmin
);
router.post(
  "/players",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*players*"),
  playerCtrl.createPlayer
);
router.put(
  "/players/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*players*"),
  playerCtrl.updatePlayer
);
router.delete(
  "/players/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  invalidate("http:*players*"),
  playerCtrl.deletePlayer
);

// ================= LEGENDS / OLD PLAYERS ROUTES =================
router.get("/legends", cacheMiddleware(300), legendCtrl.getLegends);
router.post(
  "/legends",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  legendCtrl.createLegend
);
router.put(
  "/legends/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  legendCtrl.updateLegend
);
router.delete(
  "/legends/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  legendCtrl.deleteLegend
);

// ================= MERCHANDISE ROUTES =================
router.get("/merchandise", cacheMiddleware(180), merchCtrl.getProducts);
router.post(
  "/merchandise",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*merchandise*"),
  merchCtrl.createProduct
);
router.put(
  "/merchandise/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*merchandise*"),
  merchCtrl.updateProduct
);
router.delete(
  "/merchandise/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*merchandise*"),
  merchCtrl.deleteProduct
);

// ================= ORDERS ROUTES =================
router.post("/orders", optionalAuth, orderCtrl.createOrder);
router.get("/orders/track", orderCtrl.trackOrder);
router.get("/orders/my-orders", authenticate, orderCtrl.getMyOrders);
router.get(
  "/orders",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  orderCtrl.getOrders
);
router.put(
  "/orders/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN"),
  orderCtrl.updateOrderStatus
);

// ================= NEWS ROUTES =================
router.get("/news", cacheMiddleware(180), newsCtrl.getArticles);
router.get(
  "/news/admin/all",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  newsCtrl.getAllArticlesAdmin
);
router.post(
  "/news",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*news*"),
  newsCtrl.createArticle
);
router.put(
  "/news/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*news*"),
  newsCtrl.updateArticle
);
router.delete(
  "/news/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*news*"),
  newsCtrl.deleteArticle
);

// ================= PARTNERS ROUTES =================
router.get("/partners", partnerCtrl.getPartners);
router.get(
  "/partners/admin/all",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  partnerCtrl.getAllPartnersAdmin
);
router.post(
  "/partners",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*partners*"),
  partnerCtrl.createPartner
);
router.put(
  "/partners/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*partners*"),
  partnerCtrl.updatePartner
);
router.delete(
  "/partners/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*partners*"),
  partnerCtrl.deletePartner
);

// ================= PARTNER PLANS & INQUIRIES ROUTES =================
router.get("/partner-plans", planCtrl.getPartnerPlans);
router.get(
  "/partner-plans/admin/all",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  planCtrl.getAllPartnerPlansAdmin
);
router.put(
  "/partner-plans/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  planCtrl.updatePartnerPlan
);
router.post("/partner-inquiries", planCtrl.createPartnerInquiry);
router.get(
  "/partner-inquiries",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  planCtrl.getPartnerInquiries
);
router.put(
  "/partner-inquiries/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  planCtrl.updatePartnerInquiry
);
router.delete(
  "/partner-inquiries/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  planCtrl.deletePartnerInquiry
);

// ================= MEDIA ROUTES =================
router.get("/media", cacheMiddleware(180), mediaCtrl.getMedia);
router.post(
  "/media",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*media*"),
  mediaCtrl.createMedia
);
router.put(
  "/media/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*media*"),
  mediaCtrl.updateMedia
);
router.delete(
  "/media/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR"),
  invalidate("http:*media*"),
  mediaCtrl.deleteMedia
);

// ================= SETTINGS ROUTES =================
router.get("/settings", cacheMiddleware(300), settingCtrl.getSettings);
router.put(
  "/settings",
  authenticate,
  requireRole("SUPER_ADMIN"),
  invalidate("http:*settings*"),
  settingCtrl.updateSettings
);

// ================= ANALYTICS ROUTES =================
router.get(
  "/analytics/dashboard",
  authenticate,
  requireRole("SUPER_ADMIN", "TOURNAMENT_ADMIN", "CONTENT_EDITOR"),
  analyticsCtrl.getDashboardMetrics
);

// ================= ADMIN USER MANAGEMENT =================
router.get(
  "/admin/users",
  authenticate,
  requireRole("SUPER_ADMIN"),
  userCtrl.getAdminUsers
);
router.post(
  "/admin/users",
  authenticate,
  requireRole("SUPER_ADMIN"),
  userCtrl.createAdminUser
);
router.put(
  "/admin/users/:id",
  authenticate,
  requireRole("SUPER_ADMIN"),
  userCtrl.updateAdminUser
);
router.delete(
  "/admin/users/:id",
  authenticate,
  requireRole("SUPER_ADMIN"),
  userCtrl.deleteAdminUser
);

// ================= UPLOAD ROUTE =================
router.post("/upload", optionalAuth, uploadCtrl.handleUpload);

// ================= VOTING ROUTES =================
// Public
router.get("/voting/active", optionalAuth, votingCtrl.getActiveVotingEvent);
router.get("/voting/active-events", optionalAuth, votingCtrl.getActiveVotingEvents);
router.get("/voting/events/:id", optionalAuth, votingCtrl.getVotingEventById);
router.post("/voting/events/:id/vote", authenticate, votingCtrl.submitVote);

// Admin
router.get(
  "/admin/voting/events",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.getAllVotingEventsAdmin
);
router.post(
  "/admin/voting/events",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.createVotingEventAdmin
);
router.get(
  "/admin/voting/events/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.getVotingEventAdminById
);
router.put(
  "/admin/voting/events/:id",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.updateVotingEventAdmin
);
router.put(
  "/admin/voting/events/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.updateVotingEventStatusAdmin
);
router.get(
  "/admin/voting/events/:id/results",
  authenticate,
  requireRole("SUPER_ADMIN", "CONTENT_EDITOR", "TOURNAMENT_ADMIN"),
  votingCtrl.getVotingEventResultsAdmin
);
router.delete(
  "/admin/voting/events/:id",
  authenticate,
  requireRole("SUPER_ADMIN"),
  votingCtrl.deleteVotingEventAdmin
);

export default router;
