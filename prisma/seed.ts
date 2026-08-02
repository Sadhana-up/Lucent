import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedImages } from "./seeders/image-seeder";
import { seedUsers } from "./seeders/user-seeder";
import { seedProducts } from "./seeders/product-seeder";

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

  // 4. Seed Products
  await seedProducts(prisma, users, productImages);

  // 5. Seed Admin User
  console.log("👑 Seeding admin...");
  await prisma.user.upsert({
    where: { email: "admin@lucent.dev" },
    update: {},
    create: {
      name: "Lucent Admin",
      email: "admin@lucent.dev",
      emailVerified: true,
      role: "admin",
      image: avatars[0],
    },
  });
  console.log("  ✓ Admin user: admin@lucent.dev\n");

  console.log("🎉 Seed completed successfully!");
  console.log("─────────────────────────────────────");
  console.log("📧 Seller Accounts:");
  console.log("   aria@glowlab.com");
  console.log("   marcus@skinchemy.com");
  console.log("   priya@botanabeauty.com");
  console.log("   jordan@bareglow.com");
  console.log("");
  console.log("📧 Customer Accounts:");
  console.log("   sophie@example.com");
  console.log("   ethan@example.com");
  console.log("   luna@example.com");
  console.log("   noah@example.com");
  console.log("   zoe@example.com");
  console.log("");
  console.log("🔑 Admin: admin@lucent.dev");
  console.log("💡 Use 'Forgot Password' to set passwords");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
