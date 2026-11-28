import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { seedImages } from "./seeders/image-seeder";
import { seedUsers } from "./seeders/user-seeder";
import { seedProducts } from "./seeders/product-seeder";
import { seedOrdersAndReviews } from "./seeders/order-seeder";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting Lucent Marketplace Seed...\n");

  // 1. Seed Default Categories
  console.log("📁 Seeding categories...");
  const categories = [
    {
      name: "Cleansers & Washes",
      slug: "cleansers",
      description: "Gentle daily cleansers, foaming washes, and oil cleansers.",
    },
    {
      name: "Serums & Treatments",
      slug: "serums",
      description: "Targeted serums for acne, hyperpigmentation, and aging.",
    },
    {
      name: "Moisturizers & Creams",
      slug: "moisturizers",
      description: "Hydrating creams, light gels, and barrier repair lotions.",
    },
    {
      name: "Sunscreens & SPF",
      slug: "sunscreens",
      description: "Broad-spectrum mineral and chemical daily sunscreens.",
    },
    {
      name: "Exfoliants & Peels",
      slug: "exfoliants",
      description: "Chemical and physical exfoliants for smoother skin.",
    },
    {
      name: "Toners & Mists",
      slug: "toners",
      description: "Hydrating toners, pH balancers, and refreshing mists.",
    },
    {
      name: "Face Masks",
      slug: "masks",
      description: "Sheet masks, clay masks, and overnight treatments.",
    },
    {
      name: "Eye Creams",
      slug: "eye-creams",
      description: "Targeted treatments for the delicate eye area.",
    },
    {
      name: "Lip Care",
      slug: "lip-care",
      description: "Lip balms, treatments, and scrubs.",
    },
    {
      name: "Body Lotions",
      slug: "body-lotions",
      description: "Full-body moisturizers and treatments.",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`  ✓ ${cat.name}`);
  }
  console.log("");

  // 2. Seed Images (download from Picsum)
  const { productImages, avatars } = await seedImages();

  // 3. Seed Users
  const users = await seedUsers(prisma, avatars);

  // 4. Seed Admin User
  console.log("👑 Seeding admin...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lucent.dev" },
    update: { role: "admin" },
    create: {
      name: "Lucent Admin",
      email: "admin@lucent.dev",
      emailVerified: true,
      role: "admin",
      image: avatars[0] || "/seed/avatars/avatar-1.jpg",
    },
  });

  const adminHash = await hashPassword("password123");
  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: adminUser.id },
    },
    update: { password: adminHash },
    create: {
      userId: adminUser.id,
      providerId: "credential",
      accountId: adminUser.id,
      password: adminHash,
    },
  });
  console.log("  ✓ Admin user: admin@lucent.dev (password: password123)\n");

  // 5. Seed Products
  await seedProducts(prisma, users, productImages);

  // 6. Seed Orders, Reviews, Carts, Wishlists, and Audit Logs
  await seedOrdersAndReviews(prisma);

  console.log("🎉 Seed completed successfully!");
  console.log("──────────────────────────────────────────────────────────────────");
  console.log("🔑 All seeded accounts have password: password123");
  console.log("──────────────────────────────────────────────────────────────────");
  console.log("👑 Admin Account:");
  console.log("   Email: admin@lucent.dev");
  console.log("");
  console.log("🏪 Verified Seller Accounts:");
  console.log("   Aria Chen:    aria@glowlab.com       (Glow Lab Skincare)");
  console.log("   Marcus Rivera: marcus@skinchemy.com   (Skinchemy)");
  console.log("   Priya Sharma:  priya@botanabeauty.com (Botana Beauty)");
  console.log("");
  console.log("⏳ Unverified Seller Account (Pending Admin Verification):");
  console.log("   Jordan Hayes:  jordan@bareglow.com    (Bare Glow)");
  console.log("");
  console.log("🛍️ Customer Accounts (with Addresses & Skin Profiles):");
  console.log("   Sophie Kim:   sophie@example.com (Sensitive / Redness)");
  console.log("   Ethan Wright: ethan@example.com  (Oily / Acne)");
  console.log("   Luna Thapa:   luna@example.com   (Combination / Pores)");
  console.log("   Noah Patel:   noah@example.com   (Dry / Flakiness)");
  console.log("   Zoe Jenkins:  zoe@example.com    (Normal / Dullness)");
  console.log("   Aarav KC:     aarav@example.com  (Acne-prone)");
  console.log("");
  console.log("🚫 Banned Account (For Ban/Unban Flow Testing):");
  console.log("   banned@example.com");
  console.log("──────────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
