
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

async function main() {
  console.log("🌱 Starting Lord Esports database seeding...");

  // 1. Create Super Admin
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("mgadmin@123", adminSalt);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@mgesports.live" },
    update: {
      passwordHash: adminHash,
      role: "ADMIN",
      ign: "admin",
      fullName: "Administrator",
    },
    create: {
      email: "admin@mgesports.live",
      passwordHash: adminHash,
      role: "ADMIN",
      ign: "LORDZ_OVERLORD",
      fullName: "Lordz Administrator",
      phone: "+91 0000 00001",
      discord: "admin#0001",
    },
  });

  console.log("✅ Admin created: admin@mgesports.live (Password: mgadmin@123)");

  // 2. Additional Admin Account
  await prisma.user.upsert({
    where: { email: "tournaments@lordz.gg" },
    update: { role: "ADMIN" },
    create: {
      email: "tournaments@lordz.gg",
      passwordHash: adminHash,
      role: "ADMIN",
      ign: "LORDZ_MARSHAL",
      fullName: "Tournament Ops Admin",
      phone: "+91 98765 00002",
      discord: "marshal#0002",
    },
  });

  // 3. Seed Tournaments
  const tournaments: any[] = [];

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`✅ Seeded ${tournaments.length} Tournaments`);

  // 4. Seed Tournament Registrations
  const sampleRegistrations: any[] = [];

  for (const reg of sampleRegistrations) {
    await prisma.tournamentRegistration.create({ data: reg });
  }
  console.log(`✅ Seeded ${sampleRegistrations.length} Sample Registrations`);

  // 5. Seed Matches
  const matches: any[] = [];

  for (const m of matches) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Seeded ${matches.length} Match fixtures`);

  // 6. Seed Standings
  const standings: any[] = [];

  for (const s of standings) {
    await prisma.standing.create({
      data: {
        tournamentId: "fog-season-2",
        ...s,
      },
    });
  }
  console.log(`✅ Seeded ${standings.length} Standings rows`);

  // 7. Seed Active Pro Players
  const players: any[] = [];

  for (const p of players) {
    await prisma.player.upsert({
      where: { ign: p.ign },
      update: p,
      create: p,
    });
  }
  console.log(`✅ Seeded ${players.length} Pro Athletes`);

  // 8. Seed Old Players / Legends Section
  const legends: any[] = [];

  for (const l of legends) {
    await prisma.legend.upsert({
      where: { ign: l.ign },
      update: l,
      create: l,
    });
  }
  console.log(`✅ Seeded ${legends.length} Hall of Fame Legends`);

  // 9. Seed Merchandise Products
  const products: any[] = [];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: prod,
      create: prod,
    });
  }
  console.log(`✅ Seeded ${products.length} Merchandise products`);

  // 10. Seed Sample Orders
  const sampleOrders: any[] = [];

  for (const ord of sampleOrders) {
    await prisma.order.upsert({
      where: { orderNumber: ord.orderNumber },
      update: ord,
      create: ord,
    });
  }
  console.log(`✅ Seeded ${sampleOrders.length} Sample Orders`);

  // 11. Seed News Articles
  const articles: any[] = [];

  for (const art of articles) {
    await prisma.newsArticle.upsert({
      where: { slug: art.slug },
      update: art,
      create: art,
    });
  }
  console.log(`✅ Seeded ${articles.length} News Articles`);

  // 12. Seed Partners
  const partners: any[] = [];

  for (const part of partners) {
    await prisma.partner.upsert({
      where: { id: part.id },
      update: part,
      create: part,
    });
  }
  console.log(`✅ Seeded ${partners.length} Partners`);

  // 13. Seed Media Items
  const media: any[] = [];

  for (const m of media) {
    await prisma.mediaItem.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Seeded ${media.length} Media items`);

  // 14. Seed Website Settings
  const defaultSettings = [
    { key: "liveTicker", value: "", category: "TICKER" },
    { key: "emergencyBanner", value: "", category: "HERO" },
    { key: "emergencyBannerActive", value: "true", category: "HERO" },
    { key: "tournamentsCount", value: "25+", category: "STATS" },
    { key: "playersCount", value: "500+", category: "STATS" },
    { key: "teamsCount", value: "50+", category: "STATS" },
    { key: "prizePoolCount", value: "₹5L+", category: "STATS" },
    { key: "discordUrl", value: "", category: "SOCIAL" },
    { key: "whatsappUrl", value: "", category: "SOCIAL" },
    { key: "whatsappScrimsUrl", value: "", category: "SOCIAL" },
    { key: "youtubeUrl", value: "", category: "SOCIAL" },
    { key: "instagramUrl", value: "", category: "SOCIAL" },
    { key: "businessEmail", value: "", category: "CONTACT" },
  ];

  for (const s of defaultSettings) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }
  console.log(`✅ Seeded ${defaultSettings.length} Website settings`);

  // 15. Create Initial Audit Log Entry
  await prisma.auditLog.create({
    data: {
      adminId: superAdmin.id,
      adminEmail: superAdmin.email,
      action: "INITIAL_SEED",
      resource: "Database",
      details: "Seeded initial Lord Esports data and Super Admin account.",
    },
  });

  console.log("🚀 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
