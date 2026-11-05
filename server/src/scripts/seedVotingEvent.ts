import { prisma } from "../config/prisma.js";

async function seedVoting() {
  console.log("Checking for existing voting events...");
  const existing = await prisma.votingEvent.findFirst({
    where: { title: "MVP OF THE SEASON 2026" },
  });

  if (existing) {
    console.log("MVP OF THE SEASON 2026 event already exists. ID:", existing.id);
    return;
  }

  const players = await prisma.player.findMany();
  if (players.length === 0) {
    console.log("No players found to nominate.");
    return;
  }

  console.log(`Found ${players.length} players. Creating MVP OF THE SEASON 2026 event...`);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const event = await prisma.votingEvent.create({
    data: {
      title: "MVP OF THE SEASON 2026",
      slug: "mvp-of-the-season-2026",
      description:
        "Vote for the championship athlete who delivered the most decisive clutch rounds, heroic squad wipes, and game-changing calls this season.",
      status: "PUBLISHED",
      startDate: now,
      endDate: nextMonth,
      isLiveResults: true,
      nominees: {
        create: players.map((p: any, idx: number) => ({
          name: p.ign,
          role: p.role,
          team: p.team,
          imageUrl: p.avatarUrl,
          bio: p.featuredQuote || null,
          displayOrder: idx,
        })),
      },
    },
    include: {
      nominees: true,
    },
  });

  console.log("Successfully created voting event:", event.title);
  console.log("Nominees count:", event.nominees.length);
}

seedVoting()
  .catch((e) => {
    console.error("Error seeding voting event:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
