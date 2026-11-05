import { Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

/**
 * Get all in-app notifications and pending invitations for authenticated user
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const [notifications, unreadCount, pendingInvitations] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, read: false },
      }),
      prisma.teamInvitation.findMany({
        where: {
          invitedUserId: req.user.id,
          status: "PENDING",
        },
        include: {
          team: {
            include: {
              tournament: {
                select: {
                  id: true,
                  title: true,
                  game: true,
                  date: true,
                  prizePool: true,
                  status: true,
                },
              },
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
              ign: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pendingInvitations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { read: true },
    });

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for authenticated user
 */
export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to a team invitation (ACCEPT or REJECT)
 */
export const respondToInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { action } = req.body; // "ACCEPT" or "REJECT"

    if (!["ACCEPT", "REJECT"].includes(action)) {
      res.status(400).json({ success: false, message: "Action must be ACCEPT or REJECT" });
      return;
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            tournament: true,
            leader: true,
          },
        },
      },
    });

    if (!invitation) {
      res.status(404).json({ success: false, message: "Invitation not found" });
      return;
    }

    if (invitation.invitedUserId !== req.user.id) {
      res.status(403).json({ success: false, message: "You are not authorized to respond to this invitation" });
      return;
    }

    if (invitation.status !== "PENDING") {
      res.status(400).json({ success: false, message: `Invitation is already ${invitation.status.toLowerCase()}` });
      return;
    }

    const responder = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, ign: true, fullName: true },
    });
    const responderName = responder?.ign || responder?.username || responder?.fullName || "A player";

    if (action === "ACCEPT") {
      // Check if tournament allows multiple teams
      if (!invitation.team.tournament.allowMultipleTeams) {
        const existingMembership = await prisma.teamMember.findFirst({
          where: {
            userId: req.user.id,
            invitationStatus: "ACCEPTED",
            team: {
              tournamentId: invitation.tournamentId,
              id: { not: invitation.teamId },
            },
          },
        });

        if (existingMembership) {
          res.status(400).json({
            success: false,
            message: "You're already registered with another team for this tournament.",
          });
          return;
        }
      }

      // Check roster lock date
      if (
        invitation.team.tournament.rosterLockDate &&
        new Date() > new Date(invitation.team.tournament.rosterLockDate)
      ) {
        res.status(400).json({
          success: false,
          message: "Roster has been locked for this tournament. Invitations can no longer be accepted.",
        });
        return;
      }

      // Atomically accept invitation & add to team
      await prisma.$transaction([
        prisma.teamInvitation.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        }),
        prisma.teamMember.upsert({
          where: {
            teamId_userId: {
              teamId: invitation.teamId,
              userId: req.user.id,
            },
          },
          update: {
            invitationStatus: "ACCEPTED",
          },
          create: {
            teamId: invitation.teamId,
            userId: req.user.id,
            role: "STARTER",
            invitationStatus: "ACCEPTED",
          },
        }),
        prisma.notification.create({
          data: {
            userId: invitation.team.leaderId,
            type: "INVITATION_ACCEPTED",
            title: "Invitation Accepted! 🎉",
            message: `${responderName} accepted your invitation to join ${invitation.team.teamName} for ${invitation.team.tournament.title}.`,
            metadata: JSON.stringify({
              tournamentId: invitation.tournamentId,
              teamId: invitation.teamId,
              userId: req.user.id,
            }),
          },
        }),
      ]);

      res.json({
        success: true,
        message: `Successfully joined ${invitation.team.teamName}!`,
      });
    } else {
      // REJECT
      await prisma.$transaction([
        prisma.teamInvitation.update({
          where: { id },
          data: {
            status: "REJECTED",
            respondedAt: new Date(),
          },
        }),
        prisma.teamMember.deleteMany({
          where: {
            teamId: invitation.teamId,
            userId: req.user.id,
          },
        }),
        prisma.notification.create({
          data: {
            userId: invitation.team.leaderId,
            type: "INVITATION_REJECTED",
            title: "Invitation Declined",
            message: `${responderName} declined your invitation to join ${invitation.team.teamName}.`,
            metadata: JSON.stringify({
              tournamentId: invitation.tournamentId,
              teamId: invitation.teamId,
              userId: req.user.id,
            }),
          },
        }),
      ]);

      res.json({
        success: true,
        message: "Invitation declined.",
      });
    }
  } catch (error) {
    next(error);
  }
};
