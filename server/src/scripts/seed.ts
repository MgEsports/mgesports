import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

async function main() {
  console.log("🌱 Starting Lord Esports database seeding...");

  // 1. Create Super Admin
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("LordzAdmin2026!", adminSalt);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@lordz.gg" },
    update: {
      passwordHash: adminHash,
      role: "ADMIN",
      ign: "LORDZ_OVERLORD",
      fullName: "Lordz Administrator",
    },
    create: {
      email: "admin@lordz.gg",
      passwordHash: adminHash,
      role: "ADMIN",
      ign: "LORDZ_OVERLORD",
      fullName: "Lordz Administrator",
      phone: "+91 98765 00001",
      discord: "admin#0001",
    },
  });
  console.log("✅ Admin created: admin@lordz.gg (Password: LordzAdmin2026!)");

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
  const tournaments = [
    {
      id: "fog-season-2",
      title: "FLAME OF GLORY - FINALS",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "LIVE",
      prizePool: "₹50,000",
      entryFee: "FREE ENTRY",
      slots: "32 TEAMS",
      date: "LIVE TODAY • 6:00 PM IST",
      format: "BATTLE ROYALE • 6 MATCHES",
      featured: true,
      tagline: "The pinnacle championship of South Indian esports supremacy.",
      streamUrl: "https://www.youtube.com",
      registeredTeams: 32,
      totalTeams: 32,
    },
    {
      id: "lordz-clutch-cup",
      title: "LORDZ CLUTCH CUP S1",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "UPCOMING",
      prizePool: "₹1,00,000",
      entryFee: "₹250 / SQUAD",
      slots: "64 TEAMS",
      date: "SEP 20, 2026 • 5:00 PM IST",
      format: "BERMUDA & PURGATORY • HARDCORE",
      featured: true,
      tagline: "India's fiercest mobile Free Fire squads clash for the crown.",
      registeredTeams: 48,
      totalTeams: 64,
    },
    {
      id: "tamil-nadu-clash",
      title: "TAMIL NADU INVITATIONAL",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "UPCOMING",
      prizePool: "₹35,000",
      entryFee: "INVITE ONLY",
      slots: "18 TEAMS",
      date: "SEP 25, 2026 • 7:00 PM IST",
      format: "BERMUDA MASTERS",
      featured: false,
      tagline: "Elite regional showdown organized directly by Lordz.",
      registeredTeams: 16,
      totalTeams: 18,
    },
    {
      id: "val-ignite-series",
      title: "IGNITE PROTOCOL: PURGATORY",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "UPCOMING",
      prizePool: "₹75,000",
      entryFee: "FREE ENTRY",
      slots: "32 TEAMS",
      date: "OCT 02, 2026 • 4:00 PM IST",
      format: "BATTLE ROYALE • 6 ROUNDS",
      featured: false,
      tagline: "High-octane Free Fire MAX championship for emerging squads.",
      registeredTeams: 22,
      totalTeams: 32,
    },
    {
      id: "daily-grind-scrims",
      title: "LORDZ DAILY TIER-1 SCRIMS",
      game: "FREE FIRE",
      gameCategory: "FREE FIRE",
      status: "LIVE",
      prizePool: "₹5,000 DAILY",
      entryFee: "FREE VERIFIED",
      slots: "12 TEAMS",
      date: "EVERYDAY • 8:00 PM IST",
      format: "TIER 1 PRO SCRIMS",
      featured: false,
      tagline: "High-cadence tournament preparation against vetted top squads.",
      registeredTeams: 12,
      totalTeams: 12,
    },
    {
      id: "fog-season-1",
      title: "FLAME OF GLORY S1",
      game: "FREE FIRE MAX",
      gameCategory: "FREE FIRE MAX",
      status: "COMPLETED",
      prizePool: "₹25,000",
      entryFee: "COMPLETED",
      slots: "24 TEAMS",
      date: "AUGUST 2026",
      format: "CHAMPIONSHIP FINALS",
      featured: false,
      tagline: "Season 1 concluded with Lord Esports podium triumph.",
      registeredTeams: 24,
      totalTeams: 24,
    },
  ];

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`✅ Seeded ${tournaments.length} Tournaments`);

  // 4. Seed Tournament Registrations
  const sampleRegistrations = [
    {
      tournamentId: "lordz-clutch-cup",
      teamName: "SOUL WARRIORS",
      captainIgn: "SOUL_VIPER",
      whatsapp: "+91 98765 43210",
      discordTag: "viper#1234",
      status: "APPROVED",
      slotNumber: 1,
    },
    {
      tournamentId: "lordz-clutch-cup",
      teamName: "GODLIKE CLAN",
      captainIgn: "JONATHAN_X",
      whatsapp: "+91 98450 11223",
      discordTag: "jonathan#9988",
      status: "APPROVED",
      slotNumber: 2,
    },
    {
      tournamentId: "tamil-nadu-clash",
      teamName: "VEERA TAMIZHAN",
      captainIgn: "TAMIL_HUNTER",
      whatsapp: "+91 97890 55443",
      discordTag: "hunter#4433",
      status: "PENDING",
    },
    {
      tournamentId: "fog-season-2",
      teamName: "DFG ESPORTS",
      captainIgn: "DFG_MAHESH",
      whatsapp: "+91 99000 88776",
      discordTag: "dfg_lead#0001",
      status: "APPROVED",
      slotNumber: 3,
    },
  ];

  for (const reg of sampleRegistrations) {
    await prisma.tournamentRegistration.create({ data: reg });
  }
  console.log(`✅ Seeded ${sampleRegistrations.length} Sample Registrations`);

  // 5. Seed Matches
  const matches = [
    {
      id: "match-live-1",
      tournamentId: "fog-season-2",
      tournamentName: "FLAME OF GLORY S2",
      status: "LIVE",
      stage: "GRAND FINALS • MATCH 3",
      game: "FREE FIRE MAX",
      map: "BERMUDA",
      teamAName: "LORD ESPORTS",
      teamATag: "LORD",
      teamAScore: 38,
      teamAPoints: 22,
      teamBName: "DFG ESPORTS",
      teamBTag: "DFG",
      teamBScore: 53,
      teamBPoints: 32,
      streamUrl: "https://www.youtube.com",
    },
    {
      id: "match-up-1",
      tournamentId: "fog-season-2",
      tournamentName: "FLAME OF GLORY S2",
      status: "UPCOMING",
      stage: "GRAND FINALS • MATCH 4",
      game: "FREE FIRE MAX",
      map: "PURGATORY",
      teamAName: "LORD ESPORTS",
      teamATag: "LORD",
      teamBName: "TB ESPORTS",
      teamBTag: "TBE",
      startTime: "TODAY • 7:45 PM IST",
      countdownSeconds: 8075,
    },
    {
      id: "match-res-1",
      tournamentId: "fog-season-2",
      tournamentName: "FLAME OF GLORY S2",
      status: "RESULT",
      stage: "GRAND FINALS • MATCH 2",
      game: "FREE FIRE MAX",
      map: "KALAHARI",
      teamAName: "LORD ESPORTS",
      teamATag: "LORD",
      teamAScore: 24,
      teamAPoints: 12,
      teamBName: "EYEGLACIERS",
      teamBTag: "EYE",
      teamBScore: 14,
      teamBPoints: 8,
      winner: "LORD ESPORTS",
    },
  ];

  for (const m of matches) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Seeded ${matches.length} Match fixtures`);

  // 6. Seed Standings
  const standings = [
    { rank: "01", team: "DFG ESPORTS", tag: "DFG", chickenDinner: "01", matches: "02", position: "21", finishes: "32", total: "53", isTopThree: true, sortOrder: 1 },
    { rank: "02", team: "TB ESPORTS", tag: "TBE", chickenDinner: "01", matches: "02", position: "20", finishes: "31", total: "51", isTopThree: true, sortOrder: 2 },
    { rank: "03", team: "LORD ESPORTS", tag: "LORDZ", chickenDinner: "00", matches: "02", position: "16", finishes: "22", total: "38", isTopThree: true, sortOrder: 3 },
    { rank: "04", team: "EYEGLACIERS", tag: "EYE", chickenDinner: "00", matches: "02", position: "13", finishes: "12", total: "25", isTopThree: false, sortOrder: 4 },
    { rank: "05", team: "DW ESP", tag: "DWE", chickenDinner: "00", matches: "02", position: "10", finishes: "15", total: "25", isTopThree: false, sortOrder: 5 },
    { rank: "06", team: "ELITE BLAZE ESPORTS", tag: "EBE", chickenDinner: "00", matches: "02", position: "12", finishes: "03", total: "15", isTopThree: false, sortOrder: 6 },
    { rank: "07", team: "ST UNITY", tag: "STU", chickenDinner: "00", matches: "02", position: "10", finishes: "03", total: "13", isTopThree: false, sortOrder: 7 },
    { rank: "08", team: "GODLIKE INVINCIBLE", tag: "GLI", chickenDinner: "00", matches: "02", position: "08", finishes: "04", total: "12", isTopThree: false, sortOrder: 8 },
  ];

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
  const players = [
    {
      id: "player-beast",
      ign: "BEAST",
      realName: "Akash Sharma",
      jerseyNumber: "00",
      role: "IGL",
      game: "FREE FIRE MAX",
      team: "LORD ESPORTS",
      kdRatio: "4.82",
      headshotRate: "68%",
      matchesPlayed: 142,
      featuredQuote: "Tactics win rounds. Pure conviction wins championships.",
      isCaptain: true,
      sortOrder: 1,
    },
    {
      id: "player-shadow",
      ign: "SHADOW",
      realName: "Vikram Raman",
      jerseyNumber: "07",
      role: "RUSHER",
      game: "FREE FIRE MAX",
      team: "LORD ESPORTS",
      kdRatio: "5.15",
      headshotRate: "72%",
      matchesPlayed: 128,
      featuredQuote: "First through the smoke, last man standing.",
      isCaptain: false,
      sortOrder: 2,
    },
    {
      id: "player-falcon",
      ign: "FALCON",
      realName: "Karthik Raja",
      jerseyNumber: "21",
      role: "SNIPER",
      game: "FREE FIRE MAX",
      team: "LORD ESPORTS",
      kdRatio: "4.40",
      headshotRate: "81%",
      matchesPlayed: 115,
      featuredQuote: "One bullet, one territory secured.",
      isCaptain: false,
      sortOrder: 3,
    },
    {
      id: "player-viper",
      ign: "VIPER",
      realName: "Dinesh Kumar",
      jerseyNumber: "99",
      role: "SUPPORT",
      game: "FREE FIRE MAX",
      team: "LORD ESPORTS",
      kdRatio: "3.95",
      headshotRate: "59%",
      matchesPlayed: 134,
      featuredQuote: "Covering the angles that secure the crown.",
      isCaptain: false,
      sortOrder: 4,
    },
  ];

  for (const p of players) {
    await prisma.player.upsert({
      where: { ign: p.ign },
      update: p,
      create: p,
    });
  }
  console.log(`✅ Seeded ${players.length} Pro Athletes`);

  // 8. Seed Old Players / Legends Section
  const legends = [
    {
      id: "legend-thunder",
      ign: "THUNDER",
      realName: "Praveen Raj",
      role: "FOUNDING RUSHER",
      activeYears: "2023 - 2024",
      retiredJerseyNumber: "10",
      achievements: "Inaugural Booyah MVP, Season 1 Regional Champion, 32 Squad Wipes",
      hallOfFameBio: "Pioneered the hyper-aggressive Clock Tower breach tactics that defined early Lordz dominance. Retired after lifting the Season 1 trophy.",
      sortOrder: 1,
    },
    {
      id: "legend-phantom",
      ign: "PHANTOM",
      realName: "Suresh Iyer",
      role: "TACTICAL SNIPER",
      activeYears: "2022 - 2024",
      retiredJerseyNumber: "03",
      achievements: "88% Career Headshot Accuracy, National Tier-1 Clutch King",
      hallOfFameBio: "Regarded as one of the deadliest AWM sharpshooters in South Indian mobile esports history. Anchored the team during the historic 2023 championship run.",
      sortOrder: 2,
    },
    {
      id: "legend-cyclone",
      ign: "CYCLONE",
      realName: "Aravind Swamy",
      role: "SENIOR STRATEGIST",
      activeYears: "2023 - 2025",
      retiredJerseyNumber: "44",
      achievements: "2x Grand Finals MVP, Hall of Fame Inductee 2025",
      hallOfFameBio: "Architect of Lordz' signature late-zone rotation protocols. Mentored the current roster including Beast and Shadow.",
      sortOrder: 3,
    },
  ];

  for (const l of legends) {
    await prisma.legend.upsert({
      where: { ign: l.ign },
      update: l,
      create: l,
    });
  }
  console.log(`✅ Seeded ${legends.length} Hall of Fame Legends`);

  // 9. Seed Merchandise Products
  const products = [
    {
      id: "lordz-pro-jersey-2026",
      name: "LORDZ PRO COMBAT JERSEY 2026",
      slug: "lordz-pro-jersey-2026",
      subtitle: "Official 2026-27 Athlete Edition • Black & Gold Temple Dravidian Edition",
      description: "Engineered for high-pressure competition. Crafted with breathable micro-poly, Dravidian temple gopuram architectural line art, and battle flame aesthetics.",
      price: 1299,
      originalPrice: 1999,
      stock: 150,
      category: "JERSEY",
      sizes: JSON.stringify(["S", "M", "L", "XL", "2XL"]),
      isAvailable: true,
      isFeatured: true,
    },
    {
      id: "lordz-stealth-hoodie",
      name: "LORDZ STEALTH CLAN HOODIE",
      slug: "lordz-stealth-hoodie",
      subtitle: "Heavyweight 380 GSM Fleece with Metallic Gold Crest",
      description: "Premium fleece pullover with gold-embroidered Lordz crest, kangaroo pocket, and thumbhole cuffs.",
      price: 2499,
      originalPrice: 3299,
      stock: 75,
      category: "HOODIE",
      sizes: JSON.stringify(["M", "L", "XL", "2XL"]),
      isAvailable: true,
      isFeatured: false,
    },
    {
      id: "lordz-pro-compression-sleeves",
      name: "LORDZ PRO ARM COMPRESSION SLEEVES",
      slug: "lordz-pro-compression-sleeves",
      subtitle: "Friction-Free Esports Gaming Sleeve Pair",
      description: "Ultra-low friction gaming sleeves designed for glasspad and speed mousepad precision tracking.",
      price: 499,
      originalPrice: 799,
      stock: 300,
      category: "ACCESSORY",
      sizes: JSON.stringify(["M", "L"]),
      isAvailable: true,
      isFeatured: false,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: prod,
      create: prod,
    });
  }
  console.log(`✅ Seeded ${products.length} Merchandise products`);

  // 10. Seed Sample Orders
  const sampleOrders = [
    {
      orderNumber: "LZ-2026-1042",
      productName: "LORDZ PRO COMBAT JERSEY 2026",
      customerName: "Rahul Verma",
      customerEmail: "rahul.v@gmail.com",
      customerPhone: "+91 98765 11223",
      address: "Flat 402, Royal Palms, Anna Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      size: "L",
      customIgn: "BEAST",
      customNumber: "00",
      totalAmount: 1299,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      orderStatus: "SHIPPED",
      trackingNumber: "DTDC-TN-992140",
    },
    {
      orderNumber: "LZ-2026-1088",
      productName: "LORDZ PRO COMBAT JERSEY 2026",
      customerName: "Sneha Reddy",
      customerEmail: "sneha.r@gmail.com",
      customerPhone: "+91 97890 33445",
      address: "Plot 89, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      size: "M",
      customIgn: "SHADOW",
      customNumber: "07",
      totalAmount: 1299,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      orderStatus: "PROCESSING",
    },
    {
      orderNumber: "LZ-2026-1120",
      productName: "LORDZ PRO COMBAT JERSEY 2026",
      customerName: "Amitabh Sen",
      customerEmail: "amitabh@outlook.com",
      customerPhone: "+91 99112 88776",
      address: "14/B Park Street",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700016",
      size: "XL",
      customIgn: "CLUTCH_GOD",
      customNumber: "99",
      totalAmount: 1299,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      orderStatus: "PENDING",
    },
  ];

  for (const ord of sampleOrders) {
    await prisma.order.upsert({
      where: { orderNumber: ord.orderNumber },
      update: ord,
      create: ord,
    });
  }
  console.log(`✅ Seeded ${sampleOrders.length} Sample Orders`);

  // 11. Seed News Articles
  const articles = [
    {
      id: "news-1",
      title: "FLAME OF GLORY S2 GRAND FINALS COMMENCES WITH ₹50,000 AT STAKE",
      slug: "flame-of-glory-s2-grand-finals",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      excerpt: "32 of the sharpest mobile esports squads converge in a 6-round showdown. Lord Esports enters as the heavyweight contender.",
      content: "The battle lines are drawn as Flame of Glory Season 2 reaches its climax. Over 32 verified Tier-1 squads have fought through grueling qualifiers across 4 regional brackets to earn their spots in the Grand Finals. With a total prize purse of ₹50,000 and the prestigious Flame of Glory trophy on the line, every point, every frag, and every late-game rotation will determine the legacy of this season.\n\nLord Esports enters the finals holding the #1 seed following a dominant group-stage run led by IGL Beast. Official broadcast coverage begins at 18:00 IST with multi-cam casters and real-time telemetry streaming live on our YouTube and partner channels.",
      category: "TOURNAMENT",
      date: "SEP 12, 2026",
      readTime: "3 MIN READ",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      author: "Lord Editorial",
      published: true,
      featured: true,
    },
    {
      id: "news-2",
      title: "OFFICIAL REVEAL: THE 2026-27 LORD PRO JERSEY UNVEILED",
      slug: "2026-27-lord-pro-jersey-unveiled",
      coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      excerpt: "Crafted with temple gopuram gold line art and battle flame motifs, representing the warrior heritage of South Indian competitive gaming.",
      content: "Today, Lord Esports proudly unveils the official 2026-27 Pro Combat Jersey, built in partnership with leading performance apparel designers. Incorporating traditional Tamil temple gopuram golden vectors merged with aerodynamic honeycomb moisture-wicking weave, the new kit symbolizes our unwavering ambition to dominate both national and international tournaments.\n\nPre-orders for the limited Supporter Edition are now officially open with customized gamer tags on the back. Clan members and community champions will receive priority dispatch before the first live LAN tournament.",
      category: "TEAM",
      date: "SEP 10, 2026",
      readTime: "2 MIN READ",
      badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      author: "Branding Desk",
      published: true,
      featured: false,
    },
    {
      id: "news-3",
      title: "BEAST NAMED IGL OF THE MONTH AFTER RECORD-BREAKING CLUTCHES",
      slug: "beast-igl-of-the-month",
      coverImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
      excerpt: "With a 4.82 K/D and unmatched late-circle tactical rotations, Beast leads Lord Esports into the championship tier.",
      content: "Following an electrifying month of competitive play, our primary In-Game Leader 'Beast' has officially been awarded IGL of the Month by the national esports circuit. Across 28 tournament matches, Beast delivered a record-setting 4.82 K/D ratio, over 14,000 total damage output, and led the roster through four consecutive 1v3 final circle clutches.\n\n'This recognition belongs to the whole squad,' Beast commented. 'Our synergy, callouts, and scrim discipline have leveled up tremendously. We are hungry for the national trophy.'",
      category: "PLAYER",
      date: "SEP 05, 2026",
      readTime: "4 MIN READ",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      author: "Scouting Team",
      published: true,
      featured: false,
    },
    {
      id: "news-4",
      title: "TIER-1 DAILY SCRIMS PROGRAM PASSES 500+ VERIFIED PLAYERS",
      slug: "tier-1-scrims-500-verified-players",
      coverImage: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80",
      excerpt: "Our Discord-integrated grassroots scrim infrastructure now hosts daily lobbies with live anti-cheat and automated scoreboard logging.",
      content: "Lord Esports' dedicated Grassroots Scrim Initiative has crossed a landmark milestone of 500 verified players and 60 registered squads. Operating daily across 3 tiers (Tier-3 Challenger, Tier-2 Contender, Tier-1 Elite), our automated custom lobby system provides aspiring competitors with professional-grade competitive experience.\n\nTop-performing grassroots squads from weekly scoreboards earn direct invitations to showmatches and scouting trials with our academy coaches.",
      category: "COMMUNITY",
      date: "AUG 28, 2026",
      readTime: "3 MIN READ",
      badgeColor: "bg-neutral-800 text-neutral-300 border-neutral-700",
      author: "Community Lead",
      published: true,
      featured: false,
    },
  ];

  for (const art of articles) {
    await prisma.newsArticle.upsert({
      where: { slug: art.slug },
      update: art,
      create: art,
    });
  }
  console.log(`✅ Seeded ${articles.length} News Articles`);

  // 12. Seed Partners
  const partners = [
    { id: "esports-pro", name: "ESPORTS PRO", category: "Tournament Platform", tier: "MAIN SPONSOR", logoImage: "/uploads/partner-esportspro.png", sortOrder: 1 },
    { id: "espotz-live", name: "ESPOTZ LIVE", category: "Livestream Production", tier: "BROADCAST PARTNER", logoImage: "/uploads/partner-espotz.png", sortOrder: 2 },
    { id: "infinix", name: "INFINIX", category: "Official Gaming Smartphone", tier: "MAIN SPONSOR", logoImage: "/uploads/partner-infinix.png", sortOrder: 3 },
    { id: "free-fire-max", name: "FREE FIRE MAX", category: "Official Battle Royale Title", tier: "OFFICIAL PARTNER", logoImage: "/uploads/partner-freefire.png", sortOrder: 4 },
    { id: "fusion-crystals", name: "FUSION CRYSTALS", category: "Energy & Performance", tier: "OFFICIAL PARTNER", logoImage: "/uploads/partner-fusion.png", sortOrder: 5 },
    { id: "esports-world-cup", name: "ESPORTS WORLD CUP", category: "Global Circuit", tier: "OFFICIAL PARTNER", logoImage: "/uploads/partner-ewc.png", sortOrder: 6 },
  ];

  for (const part of partners) {
    await prisma.partner.upsert({
      where: { id: part.id },
      update: part,
      create: part,
    });
  }
  console.log(`✅ Seeded ${partners.length} Partners`);

  // 13. Seed Media Items
  const media = [
    {
      id: "media-sh-1",
      type: "VIDEOS",
      title: "T1 GRAND FINALS HIGHLIGHTS ( LORD.LUFFY)",
      duration: "00:30",
      views: "89K VIEWS",
      date: "LAST WEEK",
      game: "FREE FIRE MAX",
      youtubeId: "o-1d_Ez_LcA",
      thumbnail: "https://img.youtube.com/vi/o-1d_Ez_LcA/hqdefault.jpg",
      tag: "PREMIERE",
      featured: true,
      description: "Official Grand Finals highlights of Lord Esports starring Lord Luffy dominating Bermuda.",
    },
    {
      id: "media-hl-1",
      type: "HIGHLIGHTS",
      title: "BEAST 1v4 CLUTCH TO SECURE MATCH 2 BOOYAH",
      duration: "01:18",
      views: "34K VIEWS",
      date: "YESTERDAY",
      game: "FREE FIRE MAX",
      youtubeId: "sphPuFUveuM",
      thumbnail: "https://img.youtube.com/vi/sphPuFUveuM/hqdefault.jpg",
      tag: "CLUTCH",
      featured: true,
      description: "Insane 1v4 spray transfer in the final zone by team captain Beast to seal the championship booyah.",
    },
    {
      id: "media-vid-1",
      type: "VIDEOS",
      title: "FLAME OF GLORY S2 • OFFICIAL TRAILER & TEAM REVEAL",
      duration: "02:45",
      views: "48K VIEWS",
      date: "2 DAYS AGO",
      game: "FREE FIRE MAX",
      youtubeId: "fJ9rUzIMcZQ",
      thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
      tag: "FEATURED",
      featured: true,
      description: "The grand cinematic reveal of Flame of Glory Season 2, featuring all 32 qualified squads.",
    },
    {
      id: "media-hl-2",
      type: "HIGHLIGHTS",
      title: "LORDZ SQUAD WIPE VS EYEGLACIERS • FINAL CIRCLE",
      duration: "00:54",
      views: "21K VIEWS",
      date: "3 DAYS AGO",
      game: "FREE FIRE MAX",
      youtubeId: "o-1d_Ez_LcA",
      thumbnail: "https://img.youtube.com/vi/o-1d_Ez_LcA/hqdefault.jpg",
      tag: "TOP PLAY",
      featured: true,
      description: "Flawless tactical smoke push and coordinated flank eliminating the tournament favorites.",
    },
  ];

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
    { key: "liveTicker", value: "🔥 FLAME OF GLORY S2 GRAND FINALS LIVE NOW • PRIZE POOL ₹50,000 • WATCH STREAM ON YOUTUBE", category: "TICKER" },
    { key: "emergencyBanner", value: "OFFICIAL REGISTRATIONS OPEN FOR LORDZ CLUTCH CUP S1 (₹1,00,000 PRIZE POOL)", category: "HERO" },
    { key: "emergencyBannerActive", value: "true", category: "HERO" },
    { key: "tournamentsCount", value: "25+", category: "STATS" },
    { key: "playersCount", value: "500+", category: "STATS" },
    { key: "teamsCount", value: "50+", category: "STATS" },
    { key: "prizePoolCount", value: "₹5L+", category: "STATS" },
    { key: "discordUrl", value: "https://discord.gg/Q8KR7tU96", category: "SOCIAL" },
    { key: "whatsappUrl", value: "https://whatsapp.com/channel/0029Vb8sSc66hENsTW35hd11", category: "SOCIAL" },
    { key: "whatsappScrimsUrl", value: "https://whatsapp.com/channel/0029Vb8fM218kyySLfM90o0l", category: "SOCIAL" },
    { key: "youtubeUrl", value: "https://youtube.com/@lord-esportz07", category: "SOCIAL" },
    { key: "instagramUrl", value: "https://www.instagram.com/lord.esportz", category: "SOCIAL" },
    { key: "businessEmail", value: "lordesportz75@gmail.com", category: "CONTACT" },
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
