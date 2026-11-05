import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanClientHandover() {
  console.log("🧹 Starting database cleanup for client handover...");

  try {
    // 1. Delete all tournament-related child and parent records
    console.log("Deleting registration activity logs...");
    await prisma.registrationActivityLog.deleteMany();

    console.log("Deleting stage progressions...");
    await prisma.stageProgression.deleteMany();

    console.log("Deleting payment records...");
    await prisma.paymentRecord.deleteMany();

    console.log("Deleting registration players...");
    await prisma.registrationPlayer.deleteMany();

    console.log("Deleting tournament registrations...");
    await prisma.tournamentRegistration.deleteMany();

    console.log("Deleting slot reservations...");
    await prisma.slotReservation.deleteMany();

    console.log("Deleting round teams...");
    await prisma.roundTeam.deleteMany();

    console.log("Deleting tournament rounds...");
    await prisma.tournamentRound.deleteMany();

    console.log("Deleting tournament stages...");
    await prisma.tournamentStage.deleteMany();

    console.log("Deleting tournament leaderboards...");
    await prisma.tournamentLeaderboard.deleteMany();

    console.log("Deleting team members...");
    await prisma.teamMember.deleteMany();

    console.log("Deleting team invitations...");
    await prisma.teamInvitation.deleteMany();

    console.log("Deleting teams...");
    await prisma.team.deleteMany();

    console.log("Deleting standings...");
    await prisma.standing.deleteMany();

    console.log("Deleting matches...");
    await prisma.match.deleteMany();

    console.log("Deleting tournaments...");
    await prisma.tournament.deleteMany();

    // 2. Delete all orders
    console.log("Deleting merchandise orders...");
    await prisma.order.deleteMany();

    // 3. Delete partner inquiries
    console.log("Deleting partner inquiries...");
    await prisma.partnerInquiry.deleteMany();

    // 4. Delete user votes
    console.log("Deleting votes...");
    await prisma.vote.deleteMany();

    // 5. Delete notifications and logs
    console.log("Deleting notifications...");
    await prisma.notification.deleteMany();

    console.log("Deleting activity logs...");
    await prisma.activityLog.deleteMany();

    console.log("Deleting audit logs...");
    await prisma.auditLog.deleteMany();

    // 6. Delete all non-admin users (preserve ADMIN and SUPER_ADMIN)
    console.log("Deleting non-admin test users...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          notIn: ["ADMIN", "SUPER_ADMIN"],
        },
      },
    });
    console.log(`Deleted ${deletedUsers.count} test player accounts.`);

    // 7. Verify remaining admins
    const remainingAdmins = await prisma.user.findMany({
      select: { email: true, role: true, fullName: true },
    });
    console.log("Remaining Admin Accounts for Client Handover:", remainingAdmins);

    console.log("✨ Client handover database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanClientHandover();
