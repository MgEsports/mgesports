import app from "../server.js";
import http from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lordz-esports-ultra-secure-jwt-secret-key-2026-prod";

async function runTests() {
  const PORT = 5588;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[TEST] Server listening on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  // Generate valid admin token
  const adminToken = jwt.sign(
    { id: "test-admin-id", email: "admin@lordz.gg", role: "ADMIN" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`http://localhost:${PORT}/health`);
    console.log(`1. Health Check: HTTP ${healthRes.status}`);
    if (healthRes.status !== 200) throw new Error("Health check failed");

    // 2. Fetch tournaments
    const listRes = await fetch(`${baseUrl}/tournaments`);
    const listJson = (await listRes.json()) as any;
    console.log(`2. Get Tournaments: HTTP ${listRes.status}, count = ${listJson.data?.length}`);
    if (!listJson.success) throw new Error("Failed to get tournaments");

    // 3. Create a Tournament with UPI, Banner, and Stages
    const createRes = await fetch(`${baseUrl}/tournaments`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "LORDZ FREE FIRE PRO INVITATIONAL",
        game: "FREE FIRE MAX",
        gameCategory: "FREE FIRE MAX",
        status: "REGISTRATION_OPEN",
        prizePool: "₹2,50,000",
        entryFee: "₹499",
        feeAmount: 499,
        slots: "128",
        totalTeams: 128,
        date: "APR 20 - MAY 05, 2026",
        format: "BATTLE ROYALE SQUAD (4+1)",
        tagline: "India's premier high-stakes esports showdown",
        description: "Official LORDZ national tournament featuring 128 elite squads competing across 3 phases.",
        rules: "Standard Free Fire Max competitive tournament rules apply. No emulators.",
        upiId: "lordzesports@upi",
        upiQrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=lordzesports@upi",
        stages: [
          { name: "Qualifiers (Round 1)", order: 1, status: "UPCOMING" },
          { name: "Semi-Finals (Round 2)", order: 2, status: "UPCOMING" },
          { name: "Grand Finals", order: 3, status: "UPCOMING" },
        ],
      }),
    });

    const createJson = (await createRes.json()) as any;
    console.log(`3. Create Tournament: HTTP ${createRes.status}, id = ${createJson.data?.id}`);
    if (!createJson.success || !createJson.data?.id) throw new Error("Create tournament failed: " + JSON.stringify(createJson));
    const tournamentId = createJson.data.id;

    // 4. Verify detail & registration counts
    const detailRes = await fetch(`${baseUrl}/tournaments/${tournamentId}`);
    const detailJson = (await detailRes.json()) as any;
    console.log(`4. Verify Detail: Title = "${detailJson.data?.title}", Slots = "${detailJson.data?.slots}", Registered = ${detailJson.data?.registeredTeams}`);
    if (detailJson.data?.registeredTeams !== 0) throw new Error("Initial registeredTeams should be 0");

    // 5. Squad Registration with Players and UPI payment
    const regPayload = {
      teamName: "TEAM SOUL ESPORTS",
      captainName: "Naman Mathur",
      captainIgn: "SOUL_MORTAL",
      captainPhone: "+91 98765 43210",
      captainEmail: "mortal@soul.gg",
      whatsapp: "+91 98765 43210",
      discordTag: "mortal#0001",
      players: [
        { name: "Naman Mathur", ign: "SOUL_MORTAL", playerId: "10029384", role: "IGL", isCaptain: true, isSubstitute: false },
        { name: "Viper", ign: "SOUL_VIPER", playerId: "10029385", role: "Rusher", isCaptain: false, isSubstitute: false },
        { name: "Regaltos", ign: "SOUL_REGALTOS", playerId: "10029386", role: "Support", isCaptain: false, isSubstitute: false },
        { name: "Aman", ign: "SOUL_AMAN", playerId: "10029387", role: "Sniper", isCaptain: false, isSubstitute: false },
        { name: "Sangwan", ign: "SOUL_SANGWAN", playerId: "10029388", role: "Substitute", isCaptain: false, isSubstitute: true },
      ],
      payment: {
        amount: 499,
        method: "UPI",
        utr: "492019284910",
        payerName: "Naman Mathur",
        notes: "Paid via PhonePe",
      },
    };

    const regRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload),
    });

    const regJson = (await regRes.json()) as any;
    console.log(`5. Squad Registration: HTTP ${regRes.status}, regNumber = ${regJson.data?.registrationNumber}`);
    if (!regJson.success) throw new Error("Squad registration failed: " + JSON.stringify(regJson));
    const regId = regJson.data.id || regJson.data.registrationId;

    // 6. Verify Tournament count updated to 1
    const detailAfterReg = (await fetch(`${baseUrl}/tournaments/${tournamentId}`).then((r) => r.json())) as any;
    console.log(`6. Count After Reg: Registered = ${detailAfterReg.data?.registeredTeams} / ${detailAfterReg.data?.slots}`);
    if (detailAfterReg.data?.registeredTeams !== 1) throw new Error("registeredTeams should be 1 after registration");

    // 7. Verify Admin Registration List & Filters
    const adminRegs = (await fetch(`${baseUrl}/tournaments/registrations?tournamentId=${tournamentId}`, {
      headers: adminHeaders,
    }).then((r) => r.json())) as any;
    console.log(`7. Admin Registrations: Count = ${adminRegs.data?.length}, Team = ${adminRegs.data?.[0]?.teamName}`);
    if (adminRegs.data?.length !== 1 || adminRegs.data[0].teamName !== "TEAM SOUL ESPORTS") {
      throw new Error("Admin registration listing does not match");
    }

    // 8. Admin Payment Verification & Approval
    const payVerifyRes = await fetch(`${baseUrl}/tournaments/registrations/${regId}/payment`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ paymentStatus: "VERIFIED" }),
    });
    console.log(`8a. Verify Payment: HTTP ${payVerifyRes.status}`);

    const statusRes = await fetch(`${baseUrl}/tournaments/registrations/${regId}/status`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ status: "APPROVED" }),
    });
    console.log(`8b. Approve Registration: HTTP ${statusRes.status}`);

    // 9. Stage Progression: Move team from Round 1 to Round 2
    const stagesRes = (await fetch(`${baseUrl}/tournaments/${tournamentId}/stages`).then((r) => r.json())) as any;
    const stage1 = stagesRes.data?.[0];
    const stage2 = stagesRes.data?.[1];

    if (stage1 && stage2) {
      const moveRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/stages/move-teams`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          registrationIds: [regId],
          fromStageId: stage1.id,
          toStageId: stage2.id,
        }),
      });
      const moveJson = (await moveRes.json()) as any;
      console.log(`9. Stage Progression (${stage1.name} -> ${stage2.name}): HTTP ${moveRes.status}, count = ${moveJson.movedCount}`);
    }

    // 10. Leaderboard Entry & Auto-Ranking calculation
    const lbPayload = [
      {
        teamName: "TEAM SOUL ESPORTS",
        matchesPlayed: 5,
        wins: 3,
        kills: 42,
        placementPoints: 60,
        killPoints: 42,
        bonusPoints: 5,
        totalPoints: 107,
      },
      {
        teamName: "GODLIKE ESPORTS",
        matchesPlayed: 5,
        wins: 1,
        kills: 35,
        placementPoints: 45,
        killPoints: 35,
        bonusPoints: 0,
        totalPoints: 80,
      },
    ];

    const lbUpdateRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/leaderboard`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ entries: lbPayload }),
    });
    const lbJson = (await lbUpdateRes.json()) as any;
    console.log(`10. Update Leaderboard: HTTP ${lbUpdateRes.status}, rank 1 = ${lbJson.data?.[0]?.teamName} (${lbJson.data?.[0]?.totalPoints} pts)`);
    if (lbJson.data?.[0]?.teamName !== "TEAM SOUL ESPORTS" || lbJson.data?.[0]?.rank !== 1) {
      throw new Error("Leaderboard auto-ranking failed");
    }

    // 11. CSV Export
    const csvRes = await fetch(`${baseUrl}/tournaments/${tournamentId}/export`, {
      headers: adminHeaders,
    });
    const csvText = await csvRes.text();
    console.log(`11. CSV Export: HTTP ${csvRes.status}, rows = ${csvText.split("\n").length}`);
    if (!csvText.includes("Registration Number") || !csvText.includes("TEAM SOUL ESPORTS")) {
      throw new Error("CSV Export missing expected content");
    }

    console.log("\n=========================================");
    console.log("✅ ALL 11 E2E TOURNAMENT SUITE TESTS PASSED!");
    console.log("=========================================\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
