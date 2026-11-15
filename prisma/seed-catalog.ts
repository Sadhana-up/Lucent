import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { PRODUCTS } from "./seeders/product-seeder";

const CATEGORIES = [
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

function getSellerEmail(): string | undefined {
  const flag = process.argv.find((arg) => arg.startsWith("--seller="));
  const value = flag?.split("=").slice(1).join("=") ?? process.env.SELLER_EMAIL;
  return value?.trim() || undefined;
}

function getImagesFor(imageCategory: string): string[] {
  const dir = path.join(process.cwd(), "public", "seed", "products");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.startsWith(`${imageCategory}-`))
    .sort()
    .map((file) => `/seed/products/${file}`);
}

async function main() {
  const sellerEmail = getSellerEmail();

  if (!sellerEmail) {
    console.error(
      "Missing seller. Usage: npx tsx prisma/seed-catalog.ts --seller=you@example.com"
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const seller = await prisma.sellerProfile.findFirst({
      where: { user: { email: sellerEmail } },
    });

    if (!seller) {
      console.error(
        `No seller store found for "${sellerEmail}". Create a seller account and store first (sign in -> /seller), then rerun.`
      );
      process.exit(1);
    }

    for (const category of CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category,
      });
    }

    const categories = await prisma.category.findMany();
    const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));

    let created = 0;
    let updated = 0;
    let imagesAdded = 0;

    for (const product of PRODUCTS) {
      const data = {
        sellerId: seller.id,
        categoryId: categoryIds.get(product.categorySlug) ?? null,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        skinType: product.skinType,
        skinConcerns: product.skinConcerns,
        ingredients: product.ingredients,
        usageInstructions: product.usageInstructions,
        status: "ACTIVE",
      };

      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
        select: { id: true },
      });

      const saved = await prisma.product.upsert({
        where: { slug: product.slug },
        update: data,
        create: data,
      });

      if (existing) updated += 1;
      else created += 1;

      const images = getImagesFor(product.imageCategory);
      for (let i = 0; i < images.length; i += 1) {
        const found = await prisma.productImage.findFirst({
          where: { productId: saved.id, url: images[i] },
        });

        if (!found) {
          await prisma.productImage.create({
            data: {
              productId: saved.id,
              url: images[i],
              isPrimary: i === 0,
            },
          });
          imagesAdded += 1;
        }
      }
    }

    console.log(
      `Catalog seeded for ${seller.storeName} (${sellerEmail}) - created=${created} updated=${updated} imagesAdded=${imagesAdded}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
