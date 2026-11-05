import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

/**
 * Search players by username, IGN, email, or game UID
 */
export const searchPlayers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = ((req.query.q as string) || "").trim();
    const tournamentId = req.query.tournamentId as string | undefined;

    if (!q || q.length < 2) {
      res.json({ success: true, players: [] });
      return;
    }

    const currentUserId = req.user?.id;

    // Search users matching username, ign, email, or gameUid
    const users: any[] = await (prisma.user as any).findMany({
      where: {
        AND: [
          currentUserId ? { id: { not: currentUserId } } : {},
          { status: "ACTIVE" },
          {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { ign: { contains: q, mode: "insensitive" } },
              { gameUid: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        ign: true,
        gameUid: true,
        avatarUrl: true,
        primaryGame: true,
        status: true,
      },
      take: 15,
    });

    // If tournamentId is provided, check if players are already accepted in another team for this tournament
    let results = users.map((u: any) => ({
      ...u,
      isRegisteredInTournament: false,
    }));

    if (tournamentId) {
      const tournament: any = await (prisma.tournament as any).findUnique({
        where: { id: tournamentId },
        select: { allowMultipleTeams: true },
      });

      if (tournament && !tournament.allowMultipleTeams) {
        const userIds = users.map((u: any) => u.id);
        const registeredMemberships: any[] = await prisma.teamMember.findMany({
          where: {
            userId: { in: userIds },
            invitationStatus: "ACCEPTED",
            team: {
              tournamentId,
            },
          },
          select: { userId: true },
        });

        const registeredSet = new Set(registeredMemberships.map((m: any) => m.userId));
        results = results.map((u: any) => ({
          ...u,
          isRegisteredInTournament: registeredSet.has(u.id),
        }));
      }
    }

    res.json({ success: true, players: results });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tournaments that the logged-in user has joined as Leader or Member
 */
export const getMyTournaments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Find teams where user is leader OR a team member OR has a pending invitation
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { leaderId: req.user.id },
          {
            members: {
              some: {
                userId: req.user.id,
              },
            },
          },
          {
            invitations: {
              some: {
                invitedUserId: req.user.id,
                status: "PENDING",
              },
            },
          },
        ],
      },
      include: {
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            game: true,
            gameCategory: true,
            status: true,
            prizePool: true,
            entryFee: true,
            feeAmount: true,
            entryFeeType: true,
            paymentMethod: true,
            date: true,
            startTime: true,
            regDeadline: true,
            rosterLockDate: true,
            bannerImage: true,
            logoImage: true,
            format: true,
            upiId: true,
            upiQrImage: true,
          },
        },
        leader: {
          select: {
            id: true,
            username: true,
            ign: true,
            gameUid: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                ign: true,
                gameUid: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        invitations: {
          include: {
            invitedUser: {
              select: {
                id: true,
                username: true,
                ign: true,
                gameUid: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        registration: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = teams.map((team: any) => {
      const isLeader = team.leaderId === req.user!.id;
      const userMember = team.members.find((m: any) => m.userId === req.user!.id);
      const userPendingInv = team.invitations.find(
        (inv: any) => inv.invitedUserId === req.user!.id && inv.status === "PENDING"
      );
      const isInvitationPending =
        !isLeader && (userPendingInv !== undefined || userMember?.invitationStatus === "PENDING");
      const isRosterLocked =
        team.tournament.rosterLockDate && new Date() > new Date(team.tournament.rosterLockDate);

      const feeType = (team.tournament as any).entryFeeType || "PER_TEAM";
      const isFeePaidByLeader = feeType === "PER_TEAM" && team.registration?.paymentStatus === "VERIFIED";

      return {
        id: team.id,
        teamName: team.teamName,
        teamLogo: team.teamLogo,
        teamTag: team.teamTag,
        isLeader,
        isInvitationPending,
        userInvitationId: userPendingInv?.id || null,
        role: isLeader ? "LEADER" : isInvitationPending ? "INVITED" : userMember?.role || "MEMBER",
        isLocked: team.isLocked || !!isRosterLocked,
        status: isInvitationPending ? "INVITATION_PENDING" : team.status,
        entryFeeType: feeType,
        isFeePaidByLeader,
        createdAt: team.createdAt,
        tournament: team.tournament,
        leader: team.leader,
        registration: team.registration
          ? {
              id: team.registration.id,
              registrationNumber: team.registration.registrationNumber,
              status: team.registration.status,
              paymentStatus: team.registration.paymentStatus,
              slotNumber: team.registration.slotNumber,
              payment: team.registration.payment,
              createdAt: team.registration.createdAt,
            }
          : null,
        members: (team.members || []).map((m: any) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          invitationStatus: m.invitationStatus,
          joinedAt: m.joinedAt,
          user: m.user,
        })),
        pendingInvitations: isLeader
          ? (team.invitations || [])
              .filter((inv: any) => inv.status === "PENDING")
              .map((inv: any) => ({
                id: inv.id,
                status: inv.status,
                invitedUser: inv.invitedUser,
                createdAt: inv.createdAt,
              }))
          : [],
      };
    });

    res.json({ success: true, tournaments: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Team leader invites a player to their team
 */
export const invitePlayerToTeam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { teamId } = req.params;
    const { userId, role = "STARTER" } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: "Player ID is required" });
      return;
    }

    if (userId === req.user.id) {
      res.status(400).json({ success: false, message: "You cannot invite yourself" });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: true,
        members: true,
      },
    });

    if (!team) {
      res.status(404).json({ success: false, message: "Team not found" });
      return;
    }

    if (team.leaderId !== req.user.id) {
      res.status(403).json({ success: false, message: "Only the Team Leader can invite players" });
      return;
    }

    // Check roster lock date
    if (team.tournament.rosterLockDate && new Date() > new Date(team.tournament.rosterLockDate)) {
      res.status(400).json({
        success: false,
        message: "Roster has been locked for this tournament. Modifications are disabled.",
      });
      return;
    }

    // Check if target user exists and is active
    const invitedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, status: true, fullName: true, ign: true },
    });

    if (!invitedUser || invitedUser.status !== "ACTIVE") {
      res.status(400).json({ success: false, message: "User is invalid or banned" });
      return;
    }

    // Check if player is already in this team
    const alreadyInTeam = (team.members || []).some((m: any) => m.userId === userId);
    if (alreadyInTeam) {
      res.status(400).json({ success: false, message: "Player is already a member of this team" });
      return;
    }

    // Check if player is already registered in another team for this tournament
    if (!team.tournament.allowMultipleTeams) {
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          userId,
          invitationStatus: "ACCEPTED",
          team: {
            tournamentId: team.tournamentId,
            id: { not: team.id },
          },
        },
      });

      if (existingMembership) {
        res.status(400).json({
          success: false,
          message: "This player is already registered with another team for this tournament.",
        });
        return;
      }
    }

    // Check if an invitation is already pending
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        invitedUserId: userId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      res.status(400).json({ success: false, message: "An invitation is already pending for this player" });
      return;
    }

    // Create invitation and notification
    const leader = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, ign: true, fullName: true },
    });
    const leaderName = leader?.ign || leader?.username || leader?.fullName || "Team Leader";

    const [invitation] = await prisma.$transaction([
      prisma.teamInvitation.create({
        data: {
          tournamentId: team.tournamentId,
          teamId: team.id,
          invitedUserId: userId,
          invitedById: req.user.id,
          status: "PENDING",
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: "TEAM_INVITATION",
          title: "Tournament Team Invitation ⚔️",
          message: `${leaderName} invited you to join ${team.teamName} for ${team.tournament.title}.`,
          metadata: JSON.stringify({
            tournamentId: team.tournamentId,
            teamId: team.id,
            teamName: team.teamName,
            invitedById: req.user.id,
            leaderName,
          }),
        },
      }),
    ]);

    res.json({
      success: true,
      message: `Invitation sent to ${invitedUser.ign || invitedUser.username}`,
      invitation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Team leader removes a player from their team
 */
export const removePlayerFromTeam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { teamId, memberId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { tournament: true },
    });

    if (!team) {
      res.status(404).json({ success: false, message: "Team not found" });
      return;
    }

    if (team.leaderId !== req.user.id) {
      res.status(403).json({ success: false, message: "Only the Team Leader can manage team members" });
      return;
    }

    // Check roster lock date
    if (team.tournament.rosterLockDate && new Date() > new Date(team.tournament.rosterLockDate)) {
      res.status(400).json({
        success: false,
        message: "Roster has been locked for this tournament. Modifications are disabled.",
      });
      return;
    }

    // Check member
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.teamId !== teamId) {
      res.status(404).json({ success: false, message: "Team member not found" });
      return;
    }

    if (member.userId === team.leaderId) {
      res.status(400).json({ success: false, message: "The Team Leader cannot be removed from the team" });
      return;
    }

    await prisma.$transaction([
      prisma.teamMember.delete({ where: { id: memberId } }),
      prisma.teamInvitation.updateMany({
        where: { teamId, invitedUserId: member.userId, status: "ACCEPTED" },
        data: { status: "CANCELLED" },
      }),
      prisma.notification.create({
        data: {
          userId: member.userId,
          type: "ROSTER_REMOVAL",
          title: "Removed from Team Roster",
          message: `You were removed from ${team.teamName} for ${team.tournament.title}.`,
          metadata: JSON.stringify({
            tournamentId: team.tournamentId,
            teamId: team.id,
          }),
        },
      }),
    ]);

    res.json({ success: true, message: `Removed ${member.user.ign || member.user.username} from the team.` });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin override: add/remove/replace player even after roster lock
 */
export const adminOverrideRoster = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { action, userId, memberId, role = "STARTER", reason = "Admin override" } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { tournament: true },
    });

    if (!team) {
      res.status(404).json({ success: false, message: "Team not found" });
      return;
    }

    if (action === "ADD") {
      if (!userId) {
        res.status(400).json({ success: false, message: "User ID is required" });
        return;
      }

      await prisma.$transaction([
        prisma.teamMember.upsert({
          where: { teamId_userId: { teamId, userId } },
          update: { role, invitationStatus: "ACCEPTED" },
          create: { teamId, userId, role, invitationStatus: "ACCEPTED" },
        }),
        prisma.activityLog.create({
          data: {
            adminId: req.user?.id,
            tournamentId: team.tournamentId,
            teamId: team.id,
            action: "ADMIN_ROSTER_ADD",
            description: `Admin added user ${userId} to team ${team.teamName}. Reason: ${reason}`,
          },
        }),
      ]);

      res.json({ success: true, message: "Player added by admin override." });
    } else if (action === "REMOVE") {
      if (!memberId) {
        res.status(400).json({ success: false, message: "Member ID is required" });
        return;
      }

      await prisma.$transaction([
        prisma.teamMember.delete({ where: { id: memberId } }),
        prisma.activityLog.create({
          data: {
            adminId: req.user?.id,
            tournamentId: team.tournamentId,
            teamId: team.id,
            action: "ADMIN_ROSTER_REMOVE",
            description: `Admin removed member ${memberId} from team ${team.teamName}. Reason: ${reason}`,
          },
        }),
      ]);

      res.json({ success: true, message: "Player removed by admin override." });
    } else {
      res.status(400).json({ success: false, message: "Invalid action. Use ADD or REMOVE." });
    }
  } catch (error) {
    next(error);
  }
};
