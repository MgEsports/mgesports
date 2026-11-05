import { prisma } from "../config/prisma.js";

async function main() {
  console.log("Updating VotingEvent and VotingNominee schema in DB...");

  // Add category column to VotingEvent if not exists
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."VotingEvent" 
    ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'BEST_PLAYER';
  `);
  console.log("Added category column to VotingEvent.");

  // Add category and platform column to VotingNominee if not exists
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."VotingNominee" 
    ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT NULL;
  `);
  console.log("Added category and platform columns to VotingNominee.");

  // Check if we need to seed or update existing events
  const count = await prisma.votingEvent.count();
  console.log(`Current voting events count: ${count}`);

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
