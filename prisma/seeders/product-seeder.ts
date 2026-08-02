import { PrismaClient } from "@prisma/client";
import { SeededUser } from "./user-seeder";

interface ProductData {
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  skinType: string;
  skinConcerns: string;
  ingredients: string;
  usageInstructions: string;
  categorySlug: string;
  imageCategory: string;
  sellerEmail: string;
}

const PRODUCTS: ProductData[] = [
  // Glow Lab Skincare products
  {
    title: "Gentle Foam Cleanser",
    slug: "gentle-foam-cleanser",
    description:
      "A mild, pH-balanced foam cleanser that removes impurities without stripping the skin. Formulated with green tea extract and hyaluronic acid for a refreshing, hydrated cleanse.",
    price: 24.99,
    discountPrice: 19.99,
    stock: 150,
    skinType: "all",
    skinConcerns: "dryness, sensitivity",
    ingredients: "Water, Glycerin, Cocamidopropyl Betaine, Sodium Cocoyl Isethionate, Green Tea Extract, Hyaluronic Acid, Aloe Vera, Chamomile Extract",
    usageInstructions: "Apply a small amount to damp skin, massage gently in circular motions, then rinse with lukewarm water. Use morning and evening.",
    categorySlug: "cleansers",
    imageCategory: "cleanser",
    sellerEmail: "aria@glowlab.com",
  },
  {
    title: "Vitamin C Brightening Serum",
    slug: "vitamin-c-brightening-serum",
    description:
      "A potent 20% Vitamin C serum with ferulic acid and vitamin E to brighten skin tone, reduce dark spots, and protect against environmental damage.",
    price: 38.99,
    discountPrice: null,
    stock: 85,
    skinType: "all",
    skinConcerns: "dullness, hyperpigmentation, aging",
    ingredients: "Ascorbic Acid (Vitamin C), Ferulic Acid, Vitamin E, Hyaluronic Acid, Glycerin, Water, Aloe Vera",
    usageInstructions: "Apply 3-4 drops to clean skin before moisturizer. Use in the morning for best results. Follow with sunscreen.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "aria@glowlab.com",
  },
  {
    title: "Hydra-Gel Moisturizer",
    slug: "hydra-gel-moisturizer",
    description:
      "A lightweight, oil-free gel moisturizer that provides intense hydration without clogging pores. Perfect for combination and oily skin types.",
    price: 29.99,
    discountPrice: 24.99,
    stock: 120,
    skinType: "combination,oily",
    skinConcerns: "dehydration, oiliness",
    ingredients: "Water, Hyaluronic Acid, Niacinamide, Glycerin, Squalane, Centella Asiatica Extract, Green Tea Extract",
    usageInstructions: "Apply a thin layer to face and neck after cleansing and serum. Use morning and evening.",
    categorySlug: "moisturizers",
    imageCategory: "moisturizer",
    sellerEmail: "aria@glowlab.com",
  },
  // Skincare By Marcus products
  {
    title: "Salicylic Acid Exfoliant",
    slug: "salicylic-acid-exfoliant",
    description:
      "A powerful 2% BHA exfoliant that penetrates deep into pores to unclog and prevent breakouts. Leaves skin smooth and clear without over-drying.",
    price: 22.99,
    discountPrice: null,
    stock: 95,
    skinType: "oily,combination",
    skinConcerns: "acne, blackheads, clogged pores",
    ingredients: "Salicylic Acid (2%), Green Tea Extract, Witch Hazel, Glycerin, Allantoin, Water",
    usageInstructions: "Apply to clean skin using a cotton pad. Start with every other day, gradually increase to daily use. Avoid eye area.",
    categorySlug: "exfoliants",
    imageCategory: "exfoliant",
    sellerEmail: "marcus@skinchemy.com",
  },
  {
    title: "Niacinamide Pore Minimizer",
    slug: "niacinamide-pore-minimizer",
    description:
      "A concentrated 10% niacinamide serum that minimizes the appearance of pores, controls excess oil, and improves skin texture over time.",
    price: 27.99,
    discountPrice: 22.99,
    stock: 110,
    skinType: "oily,combination",
    skinConcerns: "large pores, oiliness, uneven texture",
    ingredients: "Niacinamide (10%), Zinc PCA, Hyaluronic Acid, Glycerin, Panthenol, Water",
    usageInstructions: "Apply 4-5 drops to clean skin. Can be used morning and evening. Follow with moisturizer.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "marcus@skinchemy.com",
  },
  {
    title: "Oil-Free Mattifying Moisturizer",
    slug: "oil-free-mattifying-moisturizer",
    description:
      "A shine-control moisturizer with a matte finish that keeps skin hydrated while controlling oil production throughout the day.",
    price: 26.99,
    discountPrice: null,
    stock: 88,
    skinType: "oily",
    skinConcerns: "oiliness, shine, acne",
    ingredients: "Water, Niacinamide, Silica, Zinc PCA, Glycerin, Green Tea Extract, Witch Hazel",
    usageInstructions: "Apply a pea-sized amount to face after cleansing. Use under sunscreen in the morning.",
    categorySlug: "moisturizers",
    imageCategory: "moisturizer",
    sellerEmail: "marcus@skinchemy.com",
  },
  // Botana Beauty products
  {
    title: "Turmeric Glow Face Mask",
    slug: "turmeric-glow-face-mask",
    description:
      "A luxurious Ayurvedic face mask with turmeric, saffron, and sandalwood that brightens complexion and gives skin a natural, radiant glow.",
    price: 34.99,
    discountPrice: 29.99,
    stock: 75,
    skinType: "all",
    skinConcerns: "dullness, uneven tone, aging",
    ingredients: "Turmeric Extract, Saffron, Sandalwood, Raw Honey, Yogurt Extract, Rose Water, Vitamin E",
    usageInstructions: "Apply an even layer to clean face. Leave on for 15-20 minutes. Rinse with lukewarm water. Use 1-2 times per week.",
    categorySlug: "masks",
    imageCategory: "mask",
    sellerEmail: "priya@botanabeauty.com",
  },
  {
    title: "Rose Water Hydrating Toner",
    slug: "rose-water-hydrating-toner",
    description:
      "A pure, alcohol-free rose water toner that balances pH, tightens pores, and provides a base layer of hydration before serums and moisturizers.",
    price: 19.99,
    discountPrice: null,
    stock: 130,
    skinType: "all",
    skinConcerns: "dehydration, sensitivity, large pores",
    ingredients: "Pure Rose Water, Glycerin, Hyaluronic Acid, Aloe Vera, Chamomile Extract",
    usageInstructions: "Spray onto face or apply with cotton pad after cleansing. Use morning and evening before serum.",
    categorySlug: "toners",
    imageCategory: "toner",
    sellerEmail: "priya@botanabeauty.com",
  },
  {
    title: "Saffron Anti-Aging Eye Cream",
    slug: "saffron-anti-aging-eye-cream",
    description:
      "A rich, nourishing eye cream with saffron, retinol, and peptides that reduces fine lines, dark circles, and puffiness around the delicate eye area.",
    price: 42.99,
    discountPrice: 36.99,
    stock: 60,
    skinType: "dry,mature",
    skinConcerns: "fine lines, dark circles, puffiness",
    ingredients: "Saffron Extract, Retinol, Peptides, Caffeine, Vitamin K, Shea Butter, Jojoba Oil",
    usageInstructions: "Gently tap a small amount around the eye area using your ring finger. Use morning and evening.",
    categorySlug: "eye-creams",
    imageCategory: "eyeCream",
    sellerEmail: "priya@botanabeauty.com",
  },
  // Bare Glow products
  {
    title: "Everyday SPF 50 Sunscreen",
    slug: "everyday-spf-50-sunscreen",
    description:
      "A lightweight, non-greasy mineral sunscreen with SPF 50 that provides broad-spectrum protection without white cast. Suitable for all skin tones.",
    price: 32.99,
    discountPrice: null,
    stock: 140,
    skinType: "all",
    skinConcerns: "sun protection, aging, hyperpigmentation",
    ingredients: "Zinc Oxide (20%), Niacinamide, Hyaluronic Acid, Vitamin E, Green Tea Extract, Squalane",
    usageInstructions: "Apply generously to face and neck 15 minutes before sun exposure. Reapply every 2 hours when outdoors.",
    categorySlug: "sunscreens",
    imageCategory: "sunscreen",
    sellerEmail: "jordan@bareglow.com",
  },
  {
    title: "Charcoal Detox Cleanser",
    slug: "charcoal-detox-cleanser",
    description:
      "A deep-cleansing charcoal cleanser that draws out impurities, unclogs pores, and leaves skin feeling fresh and purified without tightness.",
    price: 21.99,
    discountPrice: 18.99,
    stock: 105,
    skinType: "oily,combination",
    skinConcerns: "oiliness, acne, clogged pores",
    ingredients: "Activated Charcoal, Tea Tree Oil, Glycerin, Aloe Vera, Green Tea Extract, Ginkgo Biloba",
    usageInstructions: "Massage onto damp skin for 60 seconds. Rinse thoroughly. Use morning and evening.",
    categorySlug: "cleansers",
    imageCategory: "cleanser",
    sellerEmail: "jordan@bareglow.com",
  },
  {
    title: "Ceramide Repair Lip Treatment",
    slug: "ceramide-repair-lip-treatment",
    description:
      "A deeply hydrating lip treatment with ceramides, shea butter, and hyaluronic acid that repairs dry, cracked lips and maintains moisture barrier.",
    price: 14.99,
    discountPrice: null,
    stock: 160,
    skinType: "all",
    skinConcerns: "dry lips, chapping",
    ingredients: "Ceramides, Shea Butter, Hyaluronic Acid, Vitamin E, Jojoba Oil, Beeswax",
    usageInstructions: "Apply to lips as needed throughout the day. Can be used under lipstick or alone.",
    categorySlug: "lip-care",
    imageCategory: "lipCare",
    sellerEmail: "jordan@bareglow.com",
  },
  {
    title: "Vitamin E Body Lotion",
    slug: "vitamin-e-body-lotion",
    description:
      "A nourishing full-body lotion enriched with vitamin E, shea butter, and coconut oil that provides 24-hour hydration for dry, rough skin.",
    price: 18.99,
    discountPrice: 15.99,
    stock: 175,
    skinType: "dry,normal",
    skinConcerns: "body dryness, rough texture",
    ingredients: "Vitamin E, Shea Butter, Coconut Oil, Glycerin, Aloe Vera, Oat Extract",
    usageInstructions: "Apply generously to body after shower while skin is still slightly damp. Massage until absorbed.",
    categorySlug: "body-lotions",
    imageCategory: "bodyLotion",
    sellerEmail: "jordan@bareglow.com",
  },
];

export async function seedProducts(
  prisma: PrismaClient,
  users: SeededUser[],
  productImages: Record<string, string[]>
): Promise<void> {
  console.log("📦 Seeding products...");

  const sellerMap = new Map<string, string>();
  for (const user of users) {
    if (user.isSeller && user.storeSlug) {
      sellerMap.set(user.email, user.storeSlug);
    }
  }

  // Get all categories
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Get all seller profiles
  const sellerProfiles = await prisma.sellerProfile.findMany();
  const profileMap = new Map(sellerProfiles.map((p) => [p.storeSlug, p.id]));

  for (const product of PRODUCTS) {
    const storeSlug = sellerMap.get(product.sellerEmail);
    if (!storeSlug) continue;

    const sellerId = profileMap.get(storeSlug);
    if (!sellerId) continue;

    const categoryId = categoryMap.get(product.categorySlug);

    const images = productImages[product.imageCategory] || [];
    const primaryImage = images[0] || "/seed/products/cleanser-1.jpg";

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        sellerId,
        categoryId: categoryId || null,
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
      },
    });

    // Add product images
    for (let i = 0; i < images.length; i++) {
      const existingImage = await prisma.productImage.findFirst({
        where: { productId: created.id, url: images[i] },
      });

      if (!existingImage) {
        await prisma.productImage.create({
          data: {
            productId: created.id,
            url: images[i],
            isPrimary: i === 0,
          },
        });
      }
    }

    console.log(`  ✓ ${product.title}`);
  }

  console.log(`✅ Seeded ${PRODUCTS.length} products\n`);
}
