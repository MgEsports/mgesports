import { prisma } from "../config/prisma.js";

async function main() {
  await prisma.$connect();
  const count = await prisma.tournament.updateMany({
    data: {
      entryFee: "FREE PRE-ENTRY",
      feeAmount: 0,
    },
  });
  console.log(`Updated ${count.count} tournaments in Neon PostgreSQL to FREE PRE-ENTRY.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
