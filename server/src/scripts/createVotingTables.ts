import { prisma } from "../config/prisma.js";

async function main() {
  console.log("Creating VotingEvent, VotingNominee, and Vote tables...");

  // 1. VotingEvent
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."VotingEvent" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "slug" TEXT,
      "description" TEXT,
      "bannerImage" TEXT,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "startDate" TIMESTAMP(3) NOT NULL,
      "endDate" TIMESTAMP(3) NOT NULL,
      "isLiveResults" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "VotingEvent_pkey" PRIMARY KEY ("id")
    );
  `);
  console.log("Created VotingEvent table.");

  // Unique index on slug
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "VotingEvent_slug_key" ON "public"."VotingEvent"("slug");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VotingEvent_status_idx" ON "public"."VotingEvent"("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VotingEvent_startDate_endDate_idx" ON "public"."VotingEvent"("startDate", "endDate");
  `);
  console.log("Created VotingEvent indexes.");

  // 2. VotingNominee
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."VotingNominee" (
      "id" TEXT NOT NULL,
      "votingEventId" TEXT NOT NULL,
      "playerId" TEXT NOT NULL,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "VotingNominee_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "VotingNominee_votingEventId_fkey" FOREIGN KEY ("votingEventId") REFERENCES "public"."VotingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VotingNominee_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log("Created VotingNominee table.");

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "VotingNominee_votingEventId_playerId_key" ON "public"."VotingNominee"("votingEventId", "playerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VotingNominee_votingEventId_idx" ON "public"."VotingNominee"("votingEventId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VotingNominee_playerId_idx" ON "public"."VotingNominee"("playerId");
  `);
  console.log("Created VotingNominee indexes.");

  // 3. Vote
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."Vote" (
      "id" TEXT NOT NULL,
      "votingEventId" TEXT NOT NULL,
      "nomineeId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "Vote_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Vote_votingEventId_fkey" FOREIGN KEY ("votingEventId") REFERENCES "public"."VotingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Vote_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "public"."VotingNominee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log("Created Vote table.");

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Vote_votingEventId_userId_key" ON "public"."Vote"("votingEventId", "userId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Vote_votingEventId_idx" ON "public"."Vote"("votingEventId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Vote_nomineeId_idx" ON "public"."Vote"("nomineeId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Vote_userId_idx" ON "public"."Vote"("userId");
  `);
  console.log("Created Vote indexes.");

  console.log("ALL TABLES AND INDEXES SUCCESSFULLY APPLIED!");
}

main()
  .catch((e) => console.error("Error creating tables:", e))
  .finally(() => prisma.$disconnect());
