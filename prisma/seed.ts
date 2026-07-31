import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Lucent marketplace...");

  // 1. Seed Default Categories
  const categories = [
    { name: "Cleansers & Washes", slug: "cleansers", description: "Gentle daily cleansers, foaming washes, and oil cleansers." },
    { name: "Serums & Treatments", slug: "serums", description: "Targeted serums for acne, hyperpigmentation, and aging." },
    { name: "Moisturizers & Creams", slug: "moisturizers", description: "Hydrating creams, light gels, and barrier repair lotions." },
    { name: "Sunscreens & SPF", slug: "sunscreens", description: "Broad-spectrum mineral and chemical daily sunscreens." },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 2. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lucent.dev" },
    update: { role: "admin" },
    create: {
      name: "Lucent Super Admin",
      email: "admin@lucent.dev",
      emailVerified: true,
      role: "admin",
    },
  });

  console.log("✅ Admin user seeded:", adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
