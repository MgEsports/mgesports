import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

function formatNomineeHelper(n: any, canExposeResults: boolean, totalVotes: number) {
  const voteCount = canExposeResults ? n._count.votes : undefined;
  const percentage =
    canExposeResults && totalVotes > 0
      ? Math.round((n._count.votes / totalVotes) * 1000) / 10
      : canExposeResults
      ? 0
      : undefined;

  const playerObj = {
    id: n.id,
    ign: n.name,
    realName: n.name,
    role: n.role || "CREATOR",
    team: n.team || "LORD ESPORTS",
    image: n.imageUrl || "",
    avatarUrl: n.imageUrl || "",
    bio: n.bio || "",
    about: n.bio || "",
  };

  return {
    id: n.id,
    votingEventId: n.votingEventId,
    playerId: n.playerId || n.id,
    name: n.name,
    role: n.role || "CREATOR",
    team: n.team || "LORD ESPORTS",
    imageUrl: n.imageUrl || "",
    bio: n.bio || "",
    category: n.category || null,
    platform: n.platform || null,
    displayOrder: n.displayOrder,
    voteCount,
    percentage,
    player: playerObj,
  };
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * GET /api/voting/active-events
 * Fetches ALL currently published community voting events/sections (e.g. Best Player, Best Creator, etc.).
 * Supports optional authentication to include user's voting status across all sections.
 */
export const getActiveVotingEvents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();

    const events = await prisma.votingEvent.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        nominees: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    let userVotesMap: Record<string, { nomineeId: string; createdAt: Date }> = {};

    if (req.user?.id && events.length > 0) {
      const userVotes = await prisma.vote.findMany({
        where: {
          userId: req.user.id,
          votingEventId: { in: events.map((e: any) => e.id) },
        },
      });
      userVotes.forEach((uv: any) => {
        userVotesMap[uv.votingEventId] = {
          nomineeId: uv.nomineeId,
          createdAt: uv.createdAt,
        };
      });
    }

    const formattedEvents = events.map((event: any) => {
      const isClosedOrExpired = event.status === "CLOSED" || now > event.endDate;
      const canExposeResults = event.isLiveResults || isClosedOrExpired;
      const totalVotes = event._count.votes;

      const formattedNominees = event.nominees.map((n: any) =>
        formatNomineeHelper(n, canExposeResults, totalVotes)
      );

      const userVote = userVotesMap[event.id];

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        category: event.category || "BEST_PLAYER",
        description: event.description,
        bannerImage: event.bannerImage,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        isLiveResults: event.isLiveResults,
        isExpired: now > event.endDate,
        isUpcoming: now < event.startDate,
        isActive: event.status === "PUBLISHED" && now >= event.startDate && now <= event.endDate,
        totalVotes: canExposeResults ? totalVotes : undefined,
        nominees: formattedNominees,
        userVotingStatus: {
          hasVoted: Boolean(userVote),
          votedNomineeId: userVote?.nomineeId || null,
          votedAt: userVote?.createdAt || null,
        },
      };
    });

    res.json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/voting/active
 * Fetches the currently active or published community voting event.
 * Supports optional authentication to include user's voting status.
 */
export const getActiveVotingEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();

    // Support filtering by category or id if query param is passed
    const whereClause: any = { status: "PUBLISHED" };
    if (req.query.id) whereClause.id = String(req.query.id);
    if (req.query.category) whereClause.category = String(req.query.category);

    // Find the published voting event
    const event = await prisma.votingEvent.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        nominees: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!event) {
      res.json({
        success: true,
        data: null,
        message: "No active voting event at this time.",
      });
      return;
    }

    // Determine user voting state if authenticated
    let hasVoted = false;
    let votedNomineeId: string | null = null;
    let votedAt: Date | null = null;

    if (req.user?.id) {
      const userVote = await prisma.vote.findUnique({
        where: {
          votingEventId_userId: {
            votingEventId: event.id,
            userId: req.user.id,
          },
        },
      });

      if (userVote) {
        hasVoted = true;
        votedNomineeId = userVote.nomineeId;
        votedAt = userVote.createdAt;
      }
    }

    const isClosedOrExpired = event.status === "CLOSED" || now > event.endDate;
    const canExposeResults = event.isLiveResults || isClosedOrExpired;
    const totalVotes = event._count.votes;

    // Map nominees with manual candidate info
    const formattedNominees = event.nominees.map((n: any) =>
      formatNomineeHelper(n, canExposeResults, totalVotes)
    );

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        category: event.category || "BEST_PLAYER",
        description: event.description,
        bannerImage: event.bannerImage,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        isLiveResults: event.isLiveResults,
        isExpired: now > event.endDate,
        isUpcoming: now < event.startDate,
        isActive: event.status === "PUBLISHED" && now >= event.startDate && now <= event.endDate,
        totalVotes: canExposeResults ? totalVotes : undefined,
        nominees: formattedNominees,
        userVotingStatus: {
          hasVoted,
          votedNomineeId,
          votedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/voting/events/:id
 * Fetches a specific public voting event.
 */
export const getVotingEventById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const now = new Date();

    const event = await prisma.votingEvent.findUnique({
      where: { id },
      include: {
        nominees: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found" });
      return;
    }

    // Public users can only see PUBLISHED, CLOSED, or ARCHIVED events
    const isAdmin =
      req.user && ["ADMIN", "SUPER_ADMIN", "TOURNAMENT_ADMIN", "CONTENT_EDITOR"].includes(req.user.role);
    if (event.status === "DRAFT" && !isAdmin) {
      res.status(403).json({ success: false, message: "Event not available for public viewing" });
      return;
    }

    let hasVoted = false;
    let votedNomineeId: string | null = null;
    let votedAt: Date | null = null;

    if (req.user?.id) {
      const userVote = await prisma.vote.findUnique({
        where: {
          votingEventId_userId: {
            votingEventId: event.id,
            userId: req.user.id,
          },
        },
      });
      if (userVote) {
        hasVoted = true;
        votedNomineeId = userVote.nomineeId;
        votedAt = userVote.createdAt;
      }
    }

    const isClosedOrExpired = event.status === "CLOSED" || now > event.endDate;
    const canExposeResults = event.isLiveResults || isClosedOrExpired || isAdmin;
    const totalVotes = event._count.votes;

    const formattedNominees = event.nominees.map((n: any) =>
      formatNomineeHelper(n, Boolean(canExposeResults), totalVotes)
    );

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        bannerImage: event.bannerImage,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        isLiveResults: event.isLiveResults,
        isExpired: now > event.endDate,
        isUpcoming: now < event.startDate,
        isActive: event.status === "PUBLISHED" && now >= event.startDate && now <= event.endDate,
        totalVotes: canExposeResults ? totalVotes : undefined,
        nominees: formattedNominees,
        userVotingStatus: {
          hasVoted,
          votedNomineeId,
          votedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/voting/events/:id/vote
 * Submits an authenticated user's vote for a nominated candidate.
 * Strictly enforces 1 vote per user per event via backend validation & database constraint.
 */
export const submitVote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: votingEventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required to cast your vote." });
      return;
    }

    const voteSchema = z.object({
      nomineeId: z.string().min(1, "Nominee ID is required"),
    });

    const { nomineeId } = voteSchema.parse(req.body);
    const now = new Date();

    // 1. Verify event exists
    const event = await prisma.votingEvent.findUnique({
      where: { id: votingEventId },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found." });
      return;
    }

    // 2. Verify event status
    if (event.status !== "PUBLISHED") {
      res.status(400).json({
        success: false,
        message: `Voting is currently ${event.status.toLowerCase()} and not accepting votes.`,
      });
      return;
    }

    // 3. Verify schedule window
    if (now < event.startDate) {
      res.status(400).json({ success: false, message: "Voting has not opened yet for this event." });
      return;
    }
    if (now > event.endDate) {
      res.status(400).json({ success: false, message: "Voting has closed for this event." });
      return;
    }

    // 4. Verify nominee belongs to this event
    const nominee = await prisma.votingNominee.findFirst({
      where: {
        id: nomineeId,
        votingEventId: event.id,
      },
    });

    if (!nominee) {
      res.status(400).json({ success: false, message: "Nominated candidate was not found in this event." });
      return;
    }

    // 5. Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        votingEventId_userId: {
          votingEventId: event.id,
          userId,
        },
      },
    });

    if (existingVote) {
      res.status(409).json({
        success: false,
        message: "You have already cast your vote in this voting event.",
      });
      return;
    }

    // 6. Record vote in transaction
    const newVote = await prisma.vote.create({
      data: {
        votingEventId: event.id,
        nomineeId: nominee.id,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: `Vote successfully cast for ${nominee.name}!`,
      data: {
        voteId: newVote.id,
        nomineeId: nominee.id,
        playerIgn: nominee.name,
        votedAt: newVote.createdAt,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Duplicate vote prevented: You have already voted in this event.",
      });
      return;
    }
    next(error);
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

const nomineeInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Candidate name is required"),
  role: z.string().optional().default("CREATOR"),
  team: z.string().optional().default("LORD ESPORTS"),
  imageUrl: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
});

const createEventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().optional().nullable(),
    category: z.string().optional().default("BEST_PLAYER"),
    description: z.string().optional().nullable(),
    bannerImage: z.string().optional().nullable(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("DRAFT"),
    isLiveResults: z.boolean().default(false),
    nominees: z.array(nomineeInputSchema).optional(),
    playerIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => (data.nominees && data.nominees.length > 0) || (data.playerIds && data.playerIds.length > 0),
    { message: "Please add at least one candidate for this event.", path: ["nominees"] }
  );

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().optional().nullable(),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  isLiveResults: z.boolean().optional(),
  nominees: z.array(nomineeInputSchema).optional(),
  playerIds: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/voting/events
 * Admin list of all voting events with nominee count and vote counts.
 */
export const getAllVotingEventsAdmin = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await prisma.votingEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nominees: {
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: {
          select: { votes: true, nominees: true },
        },
      },
    });

    const formatted = events.map((e: any) => {
      let leadingNominee = null;
      if (e._count.votes > 0) {
        const sorted = [...e.nominees].sort((a: any, b: any) => b._count.votes - a._count.votes);
        if (sorted.length > 0 && sorted[0]._count.votes > 0) {
          leadingNominee = {
            ign: sorted[0].name,
            votes: sorted[0]._count.votes,
          };
        }
      }

      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        category: e.category || "BEST_PLAYER",
        description: e.description,
        bannerImage: e.bannerImage,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        isLiveResults: e.isLiveResults,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        nomineesCount: e._count.nominees,
        totalVotes: e._count.votes,
        leadingNominee,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/voting/events/:id
 * Admin detail view for a specific event with its candidates.
 */
export const getVotingEventAdminById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id },
      include: {
        nominees: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found" });
      return;
    }

    const totalVotes = event._count.votes;
    const formattedNominees = event.nominees.map((n: any) =>
      formatNomineeHelper(n, true, totalVotes)
    );

    res.json({
      success: true,
      data: {
        ...event,
        category: event.category || "BEST_PLAYER",
        totalVotes,
        nominees: formattedNominees,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/voting/events
 * Admin creates a new voting event with manually entered candidate players/creators.
 */
export const createVotingEventAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createEventSchema.parse(req.body);

    const start = new Date(parsed.startDate);
    const end = new Date(parsed.endDate);

    if (end <= start) {
      res.status(400).json({ success: false, message: "End date must be after start date." });
      return;
    }

    // Determine candidates list
    let candidateList = parsed.nominees || [];
    if (candidateList.length === 0 && parsed.playerIds && parsed.playerIds.length > 0) {
      const showcasePlayers = await prisma.player.findMany({
        where: { id: { in: parsed.playerIds } },
      });
      candidateList = showcasePlayers.map((p: any) => ({
        name: p.ign,
        role: p.role,
        team: p.team,
        imageUrl: p.avatarUrl || null,
        bio: p.featuredQuote || null,
        category: null,
        platform: null,
      }));
    }

    if (candidateList.length === 0) {
      res.status(400).json({ success: false, message: "At least one candidate is required." });
      return;
    }

    // Generate unique slug if not provided
    const baseSlug = (parsed.slug || parsed.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create event & nominees in a transaction
    const newEvent = await prisma.$transaction(async (tx: any) => {
      const event = await tx.votingEvent.create({
        data: {
          title: parsed.title,
          slug,
          category: parsed.category || "BEST_PLAYER",
          description: parsed.description || "",
          bannerImage: parsed.bannerImage || null,
          startDate: start,
          endDate: end,
          status: parsed.status,
          isLiveResults: parsed.isLiveResults,
        },
      });

      // Insert candidates
      for (let i = 0; i < candidateList.length; i++) {
        const nom = candidateList[i];
        await tx.votingNominee.create({
          data: {
            votingEventId: event.id,
            name: nom.name.trim(),
            role: nom.role?.trim() || "CREATOR",
            team: nom.team?.trim() || "LORD ESPORTS",
            imageUrl: nom.imageUrl?.trim() || null,
            bio: nom.bio?.trim() || null,
            category: nom.category?.trim() || null,
            platform: nom.platform?.trim() || null,
            displayOrder: i,
          },
        });
      }

      return event;
    });

    res.status(201).json({
      success: true,
      message: "Voting event successfully created with candidates!",
      data: newEvent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/voting/events/:id
 * Admin updates an existing voting event and its candidate nominees.
 */
export const updateVotingEventAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = updateEventSchema.parse(req.body);

    const event = await prisma.votingEvent.findUnique({
      where: { id },
      include: { nominees: true },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found." });
      return;
    }

    const updateData: any = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.slug !== undefined) updateData.slug = parsed.slug;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.bannerImage !== undefined) updateData.bannerImage = parsed.bannerImage;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.isLiveResults !== undefined) updateData.isLiveResults = parsed.isLiveResults;

    if (parsed.startDate !== undefined) {
      updateData.startDate = new Date(parsed.startDate);
    }
    if (parsed.endDate !== undefined) {
      updateData.endDate = new Date(parsed.endDate);
    }

    const startCheck = updateData.startDate || event.startDate;
    const endCheck = updateData.endDate || event.endDate;
    if (endCheck <= startCheck) {
      res.status(400).json({ success: false, message: "End date must be after start date." });
      return;
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      // Update core event fields
      const ev = await tx.votingEvent.update({
        where: { id },
        data: updateData,
      });

      // Update candidates if provided
      if (parsed.nominees && Array.isArray(parsed.nominees)) {
        const submittedNomineeIds = parsed.nominees
          .map((n) => n.id)
          .filter((nId): nId is string => Boolean(nId));

        // Delete nominees removed by admin
        for (const existingNominee of event.nominees) {
          if (!submittedNomineeIds.includes(existingNominee.id)) {
            await tx.vote.deleteMany({ where: { nomineeId: existingNominee.id } });
            await tx.votingNominee.delete({ where: { id: existingNominee.id } });
          }
        }

        // Upsert nominees
        for (let i = 0; i < parsed.nominees.length; i++) {
          const nom = parsed.nominees[i];
          if (nom.id && event.nominees.some((e: any) => e.id === nom.id)) {
            await tx.votingNominee.update({
              where: { id: nom.id },
              data: {
                name: nom.name.trim(),
                role: nom.role?.trim() || "CREATOR",
                team: nom.team?.trim() || "LORD ESPORTS",
                imageUrl: nom.imageUrl?.trim() || null,
                bio: nom.bio?.trim() || null,
                category: nom.category?.trim() || null,
                platform: nom.platform?.trim() || null,
                displayOrder: i,
              },
            });
          } else {
            await tx.votingNominee.create({
              data: {
                votingEventId: id,
                name: nom.name.trim(),
                role: nom.role?.trim() || "CREATOR",
                team: nom.team?.trim() || "LORD ESPORTS",
                imageUrl: nom.imageUrl?.trim() || null,
                bio: nom.bio?.trim() || null,
                category: nom.category?.trim() || null,
                platform: nom.platform?.trim() || null,
                displayOrder: i,
              },
            });
          }
        }
      }

      return ev;
    });

    res.json({
      success: true,
      message: "Voting event updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/voting/events/:id/status
 * Quick status transition (DRAFT, PUBLISHED, CLOSED, ARCHIVED).
 */
export const updateVotingEventStatusAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = z
      .object({
        status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]),
      })
      .parse(req.body);

    const event = await prisma.votingEvent.findUnique({
      where: { id },
      include: {
        _count: { select: { nominees: true } },
      },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found" });
      return;
    }

    if (status === "PUBLISHED" && event._count.nominees === 0) {
      res.status(400).json({
        success: false,
        message: "Cannot publish an event without any candidates.",
      });
      return;
    }

    const updated = await prisma.votingEvent.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: `Event status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/voting/events/:id/results
 * Returns comprehensive voting results, leaderboard ranking, and percentage share.
 */
export const getVotingEventResultsAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id },
      include: {
        nominees: {
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found" });
      return;
    }

    const totalVotes = event._count.votes;

    // Sort by vote count descending
    const sortedNominees = [...event.nominees].sort((a: any, b: any) => b._count.votes - a._count.votes);

    // Assign rank with deterministic tie handling
    let currentRank = 1;
    let prevVotes: number | null = null;

    const leaderboard = sortedNominees.map((n: any, idx: number) => {
      const votes = n._count.votes;
      if (prevVotes !== null && votes < prevVotes) {
        currentRank = idx + 1;
      }
      prevVotes = votes;

      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0;
      const playerObj = {
        id: n.id,
        ign: n.name,
        realName: n.name,
        role: n.role || "ATHLETE",
        team: n.team || "LORD ESPORTS",
        image: n.imageUrl || "",
        avatarUrl: n.imageUrl || "",
        bio: n.bio || "",
      };

      return {
        rank: currentRank,
        nomineeId: n.id,
        playerId: n.playerId || n.id,
        name: n.name,
        role: n.role || "ATHLETE",
        team: n.team || "LORD ESPORTS",
        imageUrl: n.imageUrl || "",
        votes,
        percentage,
        nominee: {
          id: n.id,
          name: n.name,
          role: n.role || "ATHLETE",
          team: n.team || "LORD ESPORTS",
          imageUrl: n.imageUrl || "",
          bio: n.bio || "",
        },
        player: playerObj,
      };
    });

    res.json({
      success: true,
      data: {
        eventId: event.id,
        title: event.title,
        category: event.category || "BEST_PLAYER",
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        totalVotes,
        nomineesCount: event.nominees.length,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/voting/events/:id
 * Admin deletion: Removes voting event along with any recorded votes and nominees in a transaction.
 */
export const deleteVotingEventAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id },
    });

    if (!event) {
      res.status(404).json({ success: false, message: "Voting event not found" });
      return;
    }

    // Safely delete all votes, nominees, and the event in a transaction
    await prisma.$transaction(async (tx: any) => {
      await tx.vote.deleteMany({ where: { votingEventId: id } });
      await tx.votingNominee.deleteMany({ where: { votingEventId: id } });
      await tx.votingEvent.delete({ where: { id } });
    });

    res.json({
      success: true,
      message: "Voting event and all associated records deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
