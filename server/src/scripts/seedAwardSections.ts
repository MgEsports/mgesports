import { prisma } from "../config/prisma.js";

async function main() {
  console.log("Seeding multiple award voting sections...");

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. BEST PLAYER OF THE YEAR
  const existingPlayerEvent = await prisma.votingEvent.findFirst({
    where: { category: "BEST_PLAYER" },
  });

  if (!existingPlayerEvent) {
    await prisma.votingEvent.create({
      data: {
        title: "BEST PLAYER OF THE YEAR 2026",
        slug: "best-player-of-the-year-2026",
        category: "BEST_PLAYER",
        description:
          "Vote for the elite esports athlete who showcased peerless clutch performances, god-tier aim, and championship rotational leadership.",
        status: "PUBLISHED",
        startDate: now,
        endDate: nextMonth,
        isLiveResults: true,
        nominees: {
          create: [
            {
              name: "BEAST",
              role: "IGL & Tactical Anchor",
              team: "LORD ESPORTS",
              platform: "Competitive Roster",
              imageUrl: "/players/player-beast.jpg",
              bio: "Master strategist and veteran In-Game Leader for Lord Esports. Renowned for clutch circle reads.",
              displayOrder: 0,
            },
            {
              name: "FALCON",
              role: "Long-Range Sniper",
              team: "LORD ESPORTS",
              platform: "Competitive Roster",
              imageUrl: "/players/player-falcon.jpg",
              bio: "Deadly marksman known across India for unmatched sniper accuracy and securing critical high-ground vantage angles.",
              displayOrder: 1,
            },
            {
              name: "VIPER",
              role: "Clutch Tactical Support",
              team: "LORD ESPORTS",
              platform: "Competitive Roster",
              imageUrl: "/players/player-viper.jpg",
              bio: "Expert in gloo-wall fortification, utility support, and clutch revives under extreme pressure.",
              displayOrder: 2,
            },
            {
              name: "SHADOW",
              role: "Aggressive Entry Rusher",
              team: "LORD ESPORTS",
              platform: "Competitive Roster",
              imageUrl: "/players/player-shadow.jpg",
              bio: "Frontline assault powerhouse specializing in lightning-fast entry frags and decisive squad wipes.",
              displayOrder: 3,
            },
          ],
        },
      },
    });
    console.log("Created 'BEST PLAYER OF THE YEAR 2026' event.");
  } else {
    await prisma.votingEvent.update({
      where: { id: existingPlayerEvent.id },
      data: { category: "BEST_PLAYER", status: "PUBLISHED" },
    });
    console.log("Updated existing player event with category BEST_PLAYER.");
  }

  // 2. BEST CREATOR AWARD
  const existingCreatorEvent = await prisma.votingEvent.findFirst({
    where: { category: "BEST_CREATOR" },
  });

  if (!existingCreatorEvent) {
    await prisma.votingEvent.create({
      data: {
        title: "BEST CREATOR AWARD 2026",
        slug: "best-creator-award-2026",
        category: "BEST_CREATOR",
        description:
          "Honoring the most influential content creators, live streamers, and video artists who entertain, inspire, and elevate gaming culture.",
        status: "PUBLISHED",
        startDate: now,
        endDate: nextMonth,
        isLiveResults: true,
        nominees: {
          create: [
            {
              name: "Lord Frost",
              role: "YouTube Gaming Creator",
              team: "Lord Content Network",
              platform: "YouTube",
              imageUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600&auto=format&fit=crop&q=80",
              bio: "High-octane montage editor and tactical gameplay storyteller with over 500K+ engaged subscribers.",
              displayOrder: 0,
            },
            {
              name: "Blaze Valkyrie",
              role: "Live Streamer & Caster",
              team: "Lord Broadcasts",
              platform: "Twitch / YouTube",
              imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
              bio: "Official tournament community co-streamer and entertainment host delivering daily high-energy live broadcasts.",
              displayOrder: 1,
            },
            {
              name: "NeonPixel",
              role: "Short-Form Reel Creator",
              team: "Creative Media",
              platform: "Instagram / Shorts",
              imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
              bio: "Viral esports motion designer crafting cinematic 4K transitions, funny clan moments, and tournament reels.",
              displayOrder: 2,
            },
            {
              name: "CyberGhost",
              role: "Strategy & Meta Analyst",
              team: "Lord Academy",
              platform: "YouTube",
              imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
              bio: "Dedicated breakdown creator providing zone rotation strategies, weapon tier guides, and tournament deep-dives.",
              displayOrder: 3,
            },
          ],
        },
      },
    });
    console.log("Created 'BEST CREATOR AWARD 2026' event.");
  }

  // 3. COMMUNITY CHAMPION AWARD
  const existingCommunityEvent = await prisma.votingEvent.findFirst({
    where: { category: "COMMUNITY" },
  });

  if (!existingCommunityEvent) {
    await prisma.votingEvent.create({
      data: {
        title: "COMMUNITY CHAMPION AWARD",
        slug: "community-champion-award-2026",
        category: "COMMUNITY",
        description:
          "Celebrating the heart of Lord Esports: dedicated organizers, discord guardians, graphics designers, and community pillars.",
        status: "PUBLISHED",
        startDate: now,
        endDate: nextMonth,
        isLiveResults: true,
        nominees: {
          create: [
            {
              name: "Deva Dharshan",
              role: "Community Events & Scrims",
              team: "Community Staff",
              platform: "Discord",
              imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
              bio: "Host of daily custom community rooms, discord scrim tournaments, and clan game nights.",
              displayOrder: 0,
            },
            {
              name: "Tishbian Meshach",
              role: "Brand & Visual Designer",
              team: "Creative Division",
              platform: "Clan Media",
              imageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80",
              bio: "Lead creator of official clan merchandise art, wallpapers, tournament victory posters, and partner collabs.",
              displayOrder: 1,
            },
            {
              name: "Harish Sentinel",
              role: "Custom Room Security",
              team: "Tournament Ops",
              platform: "Operations",
              imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
              bio: "Ensuring 100% fair play, slot confirmation, anti-cheat surveillance, and dispute mediation across clan events.",
              displayOrder: 2,
            },
          ],
        },
      },
    });
    console.log("Created 'COMMUNITY CHAMPION AWARD' event.");
  }

  console.log("Award sections seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding awards:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
