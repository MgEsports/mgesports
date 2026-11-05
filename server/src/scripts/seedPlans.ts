import { prisma } from "../config/prisma.js";

export const initialPartnerPlans = [
  {
    slug: "bronze",
    name: "Bronze Partner",
    badge: "BRONZE",
    badgeColor: "bronze",
    price: "₹499",
    billing: "/ Month",
    tag: "Essential Esports Visibility",
    subheading: null,
    features: JSON.stringify([
      "Official Partner Role",
      "Private Partner Discord Access",
      "Early Tournament Updates",
      "Partner Certificate (Digital)",
    ]),
    ctaText: "SUBSCRIBE BRONZE",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "silver",
    name: "Silver Partner",
    badge: "SILVER",
    badgeColor: "silver",
    price: "₹999",
    billing: "/ Month",
    tag: "Suitable For: Growing Teams & Creators",
    subheading: "EVERYTHING IN BRONZE",
    features: JSON.stringify([
      "Priority Tournament Registration",
      "Reserved Slot (Selected Events)",
      "Monthly Social Media Mention",
    ]),
    ctaText: "SUBSCRIBE SILVER",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "gold",
    name: "Gold Partner",
    badge: "GOLD ★ MOST POPULAR",
    badgeColor: "gold",
    price: "₹1,999",
    billing: "/ Month",
    tag: "Best Value for Competitive Guilds & Brands",
    subheading: "EVERYTHING IN SILVER",
    features: JSON.stringify([
      "Guaranteed Tournament Slot",
      "Logo on Website & Live Streams",
      "Promotional Video / Post per Month",
      "Discord Announcement Feature",
    ]),
    ctaText: "SUBSCRIBE GOLD",
    isPopular: true,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 3,
    isActive: true,
  },
  {
    slug: "diamond",
    name: "Diamond Partner",
    badge: "DIAMOND",
    badgeColor: "diamond",
    price: "₹3,999",
    billing: "/ Month",
    tag: "For Brands & Professional Esports Orgs",
    subheading: "EVERYTHING IN GOLD",
    features: JSON.stringify([
      "Co-Branding Opportunities",
      "Custom Tournament Sponsorship",
      "Dedicated Channel in Discord",
      "Direct Collaboration & Sponsorship Deals",
    ]),
    ctaText: "SUBSCRIBE DIAMOND",
    isPopular: false,
    isLifetime: false,
    limitedSlots: false,
    sortOrder: 4,
    isActive: true,
  },
  {
    slug: "lifetime",
    name: "Lifetime Partner",
    badge: "LIFETIME",
    badgeColor: "lifetime",
    price: "₹9,999",
    billing: "One-Time",
    tag: "LIMITED SLOTS AVAILABLE",
    subheading: null,
    features: JSON.stringify([
      "Permanent Partner Role",
      "Website Hall of Partners",
      "Lifetime Priority Access",
      "Special Recognition During Major Events",
    ]),
    ctaText: "GET LIFETIME ACCESS",
    isPopular: false,
    isLifetime: true,
    limitedSlots: true,
    sortOrder: 5,
    isActive: true,
  },
];

async function seedPlans() {
  console.log("🌱 Seeding Partner Plans...");
  for (const plan of initialPartnerPlans) {
    await prisma.partnerPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log("✅ Seeded 5 Partner Plans successfully!");
}

seedPlans()
  .catch((e) => {
    console.error("Error seeding plans:", e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
