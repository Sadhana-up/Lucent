import { PrismaClient } from "@prisma/client";
import { SeededUser } from "./user-seeder";

export interface ProductData {
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
  status?: string;
  deletedAt?: Date | null;
}

export const PRODUCTS: ProductData[] = [
  // ── Glow Lab Skincare (Aria Chen) ──────────────────────────────────────────
  {
    title: "Gentle Foam Cleanser",
    slug: "gentle-foam-cleanser",
    description:
      "A mild, pH-balanced amino-acid foam cleanser that purifies without compromising the epidermal barrier. Formulated with green tea extract, panthenol, and triple hyaluronic acid to leave sensitive skin calm and hydrated.",
    price: 1250,
    discountPrice: 990,
    stock: 120,
    skinType: "sensitive, normal, dry",
    skinConcerns: "dryness, sensitivity, redness",
    ingredients:
      "Water, Glycerin, Sodium Cocoyl Glycinate, Cocamidopropyl Betaine, Camellia Sinensis (Green Tea) Leaf Extract, Sodium Hyaluronate, Panthenol, Chamomilla Recutita (Matricaria) Flower Extract, Allantoin, Citric Acid",
    usageInstructions:
      "Pump 1-2 times onto wet hands, massage gently over face in circular motions for 60 seconds, then rinse thoroughly with lukewarm water. Use morning and evening.",
    categorySlug: "cleansers",
    imageCategory: "cleanser",
    sellerEmail: "aria@glowlab.com",
    status: "ACTIVE",
  },
  {
    title: "Vitamin C Brightening Serum 15%",
    slug: "vitamin-c-brightening-serum",
    description:
      "An advanced antioxidant serum pairing 15% stabilized Ethyl Ascorbic Acid with Ferulic Acid and Vitamin E. Visibly diminishes post-acne dark marks, boosts collagen synthesis, and shields against UV-induced free radicals.",
    price: 2450,
    discountPrice: 2150,
    stock: 65,
    skinType: "all",
    skinConcerns: "dullness, hyperpigmentation, uneven tone",
    ingredients:
      "Water, 3-O-Ethyl Ascorbic Acid, Propanediol, Ferulic Acid, Tocopherol (Vitamin E), Sodium Hyaluronate, Centella Asiatica Extract, Polyacrylate Crosspolymer-6, Phenoxyethanol, Ethylhexylglycerin",
    usageInstructions:
      "Dispense 3-4 drops onto clean, dry skin in the morning before moisturizer. Follow immediately with broad-spectrum SPF 50.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "aria@glowlab.com",
    status: "ACTIVE",
  },
  {
    title: "Hydra-Gel Water Cream",
    slug: "hydra-gel-moisturizer",
    description:
      "An ultra-refreshing, non-comedogenic oil-free moisturizer that delivers continuous 24-hour hydration. Enriched with blue copper peptides and betaine for plump, glass-like skin without heaviness.",
    price: 1850,
    discountPrice: 1550,
    stock: 90,
    skinType: "oily, combination",
    skinConcerns: "dehydration, excess oil, enlarged pores",
    ingredients:
      "Water, Butylene Glycol, Glycerin, Betaine, Copper Tripeptide-1, Trehalose, Ammonium Acryloyldimethyltaurate/VP Copolymer, Ceramide NP, 1,2-Hexanediol, Sodium Hyaluronate",
    usageInstructions:
      "Smooth an almond-sized amount over face and neck after serum. Excellent as a lightweight primer before makeup.",
    categorySlug: "moisturizers",
    imageCategory: "moisturizer",
    sellerEmail: "aria@glowlab.com",
    status: "ACTIVE",
  },
  {
    title: "Centella Soothing Cica Balm",
    slug: "centella-soothing-cica-balm",
    description:
      "An intensive barrier-rescue balm concentrated with 5% Madecassoside, Asiaticoside, and Panthenol. Relieves sudden flare-ups, windburn, and post-procedure reactivity.",
    price: 1650,
    discountPrice: null,
    stock: 0, // OUT OF STOCK to test stock display and checkout gating
    skinType: "sensitive, dry",
    skinConcerns: "barrier damage, redness, irritation",
    ingredients:
      "Centella Asiatica Leaf Water, Caprylic/Capric Triglyceride, Glycerin, Madecassoside, Asiaticoside, Panthenol, Butyrospermum Parkii (Shea) Butter, Ceramide EOP, Ceramide AP",
    usageInstructions:
      "Warm a small amount between fingertips and gently press into irritated zones. Can be used as a targeted spot treatment or slugging layer.",
    categorySlug: "moisturizers",
    imageCategory: "moisturizer",
    sellerEmail: "aria@glowlab.com",
    status: "OUT_OF_STOCK",
  },
  {
    title: "Heartleaf Calming Relief Toner",
    slug: "heartleaf-calming-relief-toner",
    description:
      "Formulated with 77% Houttuynia Cordata (Heartleaf) extract harvested at peak potency to soothe inflammation, rebalance skin pH after cleansing, and reduce surface sebum without drying.",
    price: 1450,
    discountPrice: 1250,
    stock: 75,
    skinType: "oily, sensitive, combination",
    skinConcerns: "redness, breakouts, oiliness",
    ingredients:
      "Houttuynia Cordata Extract (77%), Water, 1,2-Hexanediol, Glycerin, Betaine, Panthenol, Saccharum Officinarum (Sugarcane) Extract, Portulaca Oleracea Extract, Disodium EDTA",
    usageInstructions:
      "Apply with hands or a cotton pad after cleansing. Layer 2-3 times for enhanced hydration (the '7-skin' technique).",
    categorySlug: "toners",
    imageCategory: "toner",
    sellerEmail: "aria@glowlab.com",
    status: "ACTIVE",
  },

  // ── Skinchemy (Marcus Rivera) ───────────────────────────────────────────────
  {
    title: "Salicylic Acid 2% BHA Pore Liquid",
    slug: "salicylic-acid-exfoliant",
    description:
      "A fast-absorbing leave-on liquid exfoliant that penetrates deep into pore linings to dissolve trapped sebum, clear blackheads, and smooth rough keratinized texture.",
    price: 1950,
    discountPrice: 1650,
    stock: 80,
    skinType: "oily, combination",
    skinConcerns: "blackheads, acne, textured skin",
    ingredients:
      "Water, Methylpropanediol, Salicylic Acid (2%), Polysorbate 20, Camellia Oleifera (Green Tea) Leaf Extract, Sodium Hydroxide, Tetrasodium EDTA, Phenoxyethanol",
    usageInstructions:
      "Apply with a cotton pad over clean skin at night. Start 2-3 nights per week, gradually increasing to nightly. Do not rinse.",
    categorySlug: "exfoliants",
    imageCategory: "exfoliant",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "Niacinamide 10% + Zinc 1% Minimizer",
    slug: "niacinamide-pore-minimizer",
    description:
      "A clinical-strength formula containing 10% pure Niacinamide and 1% Zinc PCA to regulate sebum activity, visibly shrink congested pores, and accelerate post-inflammatory recovery.",
    price: 1400,
    discountPrice: null,
    stock: 110,
    skinType: "oily, combination",
    skinConcerns: "enlarged pores, oiliness, uneven tone",
    ingredients:
      "Water, Niacinamide (10%), Zinc PCA (1%), Pentylene Glycol, Tamarindus Indica Seed Gum, Xanthan Gum, Isoceteth-20, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin",
    usageInstructions:
      "Dispense 3-4 drops onto face morning and evening prior to heavier creams. If irritation occurs, alternate days.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "Oil-Free Mattifying Gel-Lotion",
    slug: "oil-free-mattifying-moisturizer",
    description:
      "A weightless daily fluid infused with micro-silica spheres and bio-fermented green tea to absorb excess shine for up to 8 hours while supplying essential humectants.",
    price: 1550,
    discountPrice: 1350,
    stock: 55,
    skinType: "oily",
    skinConcerns: "shine, acne, clogged pores",
    ingredients:
      "Water, Dimethicone, Silica, Glycerin, Niacinamide, Butylene Glycol, Salix Alba (Willow) Bark Extract, Ammonium Polyacryloyldimethyl Taurate, Caprylyl Glycol",
    usageInstructions:
      "Apply evenly across T-zone and cheeks in the morning and as needed for midday shine control.",
    categorySlug: "moisturizers",
    imageCategory: "moisturizer",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "Charcoal Detox Deep Cleanser",
    slug: "charcoal-detox-cleanser",
    description:
      "Activated bamboo charcoal draws out urban particulate pollutants, micro-dirt, and stubborn oxidized sebum from pores without stripping essential natural lipids.",
    price: 1100,
    discountPrice: 950,
    stock: 70,
    skinType: "oily, combination",
    skinConcerns: "pollution, congestion, blackheads",
    ingredients:
      "Water, Myristic Acid, Glycerin, Stearic Acid, Potassium Hydroxide, Lauric Acid, Charcoal Powder, Volcanic Ash, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Disodium EDTA",
    usageInstructions:
      "Lather a pea-sized amount with water until rich and velvety. Massage across face for 1 minute, focusing on nose and chin, then rinse.",
    categorySlug: "cleansers",
    imageCategory: "cleanser",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "AHA 10% Fruit Enzyme Glow Peel",
    slug: "aha-fruit-enzyme-glow-peel",
    description:
      "Dual chemical peel uniting Glycolic Acid, Lactic Acid, and Papaya enzymes to dislodge dead surface cells, fading stubborn sun discoloration and revealing radiant skin.",
    price: 2100,
    discountPrice: 1800,
    stock: 45,
    skinType: "normal, dry, combination",
    skinConcerns: "dullness, rough texture, hyperpigmentation",
    ingredients:
      "Water, Glycolic Acid (7%), Lactic Acid (3%), Papaya Fruit Extract, Aloe Barbadensis Leaf Juice, Arginine, Propanediol, Sodium Hyaluronate, Hydroxyethylcellulose",
    usageInstructions:
      "Apply a thin layer to clean dry skin at night. Leave on for 10 minutes, then rinse with lukewarm water. Use 1-2 times weekly only.",
    categorySlug: "exfoliants",
    imageCategory: "exfoliant",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },

  // ── Botana Beauty (Priya Sharma) ───────────────────────────────────────────
  {
    title: "Turmeric Glow Clarifying Mask",
    slug: "turmeric-glow-face-mask",
    description:
      "An Ayurvedic antioxidant mask packed with organically grown Himalayan Kasturi Manjal (wild turmeric), Kaolin clay, and saffron stigmas to restore lit-from-within clarity and calm inflammatory blemishes.",
    price: 1750,
    discountPrice: 1450,
    stock: 50,
    skinType: "all",
    skinConcerns: "dullness, hyperpigmentation, uneven tone",
    ingredients:
      "Kaolin, Water, Curcuma Aromatica (Wild Turmeric) Root Powder, Crocus Sativus (Saffron) Stigma Extract, Glycyrrhiza Glabra (Licorice) Root Extract, Sweet Almond Oil, Glycerin, Xanthan Gum",
    usageInstructions:
      "Apply an even layer over face, avoiding the eye contour. Leave on for 12-15 minutes until semi-dry, then emulsify with wet hands and rinse.",
    categorySlug: "masks",
    imageCategory: "mask",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },
  {
    title: "Rose Water Hydrating Essence Toner",
    slug: "rose-water-hydrating-toner",
    description:
      "Pure steam-distilled organic Damask rose hydrosol combined with Tremella mushroom beta-glucan to plump depleted moisture reservoirs and infuse immediate petal-soft resilience.",
    price: 1350,
    discountPrice: 1150,
    stock: 65,
    skinType: "dry, sensitive, normal",
    skinConcerns: "dryness, tightness, dehydration",
    ingredients:
      "Rosa Damascena (Rose) Flower Water (85%), Glycerin, Tremella Fuciformis (Mushroom) Extract, Sodium Hyaluronate, Centella Asiatica Extract, Allantoin, Pelargonium Graveolens Flower Oil",
    usageInstructions:
      "Mist generously over face after cleansing, or pour into palms and press gently into skin. Reapply throughout the day for a revitalizing pick-me-up.",
    categorySlug: "toners",
    imageCategory: "toner",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },
  {
    title: "Saffron Anti-Aging Eye Cream",
    slug: "saffron-anti-aging-eye-cream",
    description:
      "A decadent, nutrient-dense eye contour treatment combining Kashmiri saffron, palmitoyl tripeptides, and cold-pressed coffee bean oil to brighten dark circles and soften dynamic smile lines.",
    price: 2600,
    discountPrice: 2250,
    stock: 3, // LOW STOCK (3 left) to test low-stock badge and admin alerts
    skinType: "all",
    skinConcerns: "dark circles, fine lines, puffiness",
    ingredients:
      "Water, Butyrospermum Parkii Butter, Crocus Sativus Flower Extract, Coffea Arabica Seed Extract, Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7, Niacinamide, Squalane, Cetearyl Alcohol",
    usageInstructions:
      "Pat half a pump using your ring finger around the orbital bone morning and night until fully absorbed.",
    categorySlug: "eye-creams",
    imageCategory: "eyeCream",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },
  {
    title: "Kumkumadi Miraculous Night Oil",
    slug: "kumkumadi-miraculous-night-oil",
    description:
      "A classical 16-herb Ayurvedic formulation infused with pure saffron strands, sandalwood, and lotus pollen in cold-pressed sesame oil. Accelerates cell turnover for luminous morning skin.",
    price: 3200,
    discountPrice: 2850,
    stock: 40,
    skinType: "dry, mature, normal",
    skinConcerns: "aging, hyperpigmentation, dullness",
    ingredients:
      "Sesamum Indicum (Sesame) Seed Oil, Crocus Sativus (Saffron), Santalum Album (Sandalwood), Nelumbo Nucifera (Lotus) Flower, Vetiveria Zizanioides Root, Rubia Cordifolia Root, Tocopherol",
    usageInstructions:
      "Warm 3-4 drops in palms and gently press onto damp face and neck at night as the final step in your routine.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },
  {
    title: "Vitamin E & Shea Body Soufflé",
    slug: "vitamin-e-body-lotion",
    description:
      "A whipped, fast-absorbing body balm pairing unrefined African shea butter with concentrated d-alpha tocopherol to heal rough elbows, knees, and dry cracked skin.",
    price: 1450,
    discountPrice: 1250,
    stock: 95,
    skinType: "all",
    skinConcerns: "roughness, dryness, body barrier",
    ingredients:
      "Water, Butyrospermum Parkii (Shea) Butter, Caprylic/Capric Triglyceride, Glycerin, Tocopherol (Vitamin E), Simmondsia Chinensis (Jojoba) Seed Oil, Cetearyl Olivate, Sorbitan Olivate",
    usageInstructions:
      "Massage liberally over body right after showering while skin is slightly damp to lock in maximum hydration.",
    categorySlug: "body-lotions",
    imageCategory: "bodyLotion",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },

  // ── Bare Glow (Jordan Hayes - Unverified store applicant) ──────────────────
  {
    title: "Everyday Invisible SPF 50 Mineral Fluid",
    slug: "everyday-spf-50-sunscreen",
    description:
      "A breakthrough 100% non-nano zinc oxide sunscreen offering broad-spectrum UVA/UVB PA++++ protection. Absorbs with zero white cast, greasy sheen, or pore congestion on all Fitzpatrick tones.",
    price: 1950,
    discountPrice: 1699,
    stock: 130,
    skinType: "all",
    skinConcerns: "sun protection, premature aging, dark spots",
    ingredients:
      "Zinc Oxide (18.5%), Water, Isododecane, Caprylic/Capric Triglyceride, Butyloctyl Salicylate, Niacinamide, Silica, Polyglyceryl-4 Diisostearate, Bisabolol, Tocopherol",
    usageInstructions:
      "Apply a generous nickel-sized amount as the last step in your morning routine 15 minutes before sun exposure. Reapply every 2 hours.",
    categorySlug: "sunscreens",
    imageCategory: "sunscreen",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT",
  },
  {
    title: "Ceramide Repair & Peptide Lip Treatment",
    slug: "ceramide-repair-lip-treatment",
    description:
      "An intensive restorative balm with 3 biomimetic ceramides, vegan squalane, and palmitoyl oligopeptides that repairs chronically chapped, flaking lips overnight.",
    price: 750,
    discountPrice: 650,
    stock: 140,
    skinType: "all",
    skinConcerns: "chapped lips, flaking, dehydration",
    ingredients:
      "Bis-Diglyceryl Polyacyladipate-2, Ricinus Communis Seed Oil, Butyrospermum Parkii Butter, Squalane, Ceramide NP, Ceramide AP, Palmitoyl Tripeptide-38, Tocopheryl Acetate",
    usageInstructions:
      "Glide over lips as needed throughout the day or apply a thicker layer at bedtime as an overnight lip sleeping mask.",
    categorySlug: "lip-care",
    imageCategory: "lipCare",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT",
  },
  {
    title: "Overnight Barrier Sleeping Mask",
    slug: "overnight-barrier-sleeping-mask",
    description:
      "A cocooning hydro-gel jelly mask with 1% ectoin and polyglutamic acid that seals moisture into stressed skin while you sleep, preventing trans-epidermal water loss in dry climates.",
    price: 1850,
    discountPrice: 1550,
    stock: 60,
    skinType: "dry, sensitive, normal",
    skinConcerns: "dehydration, dullness, tired skin",
    ingredients:
      "Water, Glycerin, Propanediol, Ectoin, Polyglutamic Acid, Panthenol, Centella Asiatica Extract, Carbomer, Tromethamine, 1,2-Hexanediol, Ethylhexylglycerin",
    usageInstructions:
      "Spread an even layer over face as the final step of evening skincare. Leave overnight and rinse with water in the morning.",
    categorySlug: "masks",
    imageCategory: "mask",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT",
  },
  {
    title: "Multi-Peptide Matrix Serum",
    slug: "multi-peptide-matrix-serum",
    description:
      "A concentrated 5-peptide matrix designed to boost skin elasticity, soften expression lines, and strengthen dermal density.",
    price: 2750,
    discountPrice: null,
    stock: 50,
    skinType: "all",
    skinConcerns: "aging, loss of firmness, fine lines",
    ingredients:
      "Water, Glycerin, Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7, Acetyl Hexapeptide-8, Copper Tripeptide-1, Sodium Hyaluronate, Butylene Glycol",
    usageInstructions:
      "Apply 4-5 drops morning and night before heavier moisturizers.",
    categorySlug: "serums",
    imageCategory: "serum",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT", // DRAFT status for seller drafting tests
  },
  {
    title: "Caffeine 5% Under-Eye Depuffing Gel",
    slug: "caffeine-under-eye-depuffing-gel",
    description:
      "A cooling, rapidly absorbed water-gel packed with 5% high-solubility green tea caffeine and EGCG to visibly reduce morning eye bags and dark discoloration.",
    price: 1350,
    discountPrice: 1150,
    stock: 75,
    skinType: "all",
    skinConcerns: "puffiness, dark circles",
    ingredients:
      "Water, Caffeine (5%), Epigallocatechin Gallatyl Glucoside (EGCG), Glycerin, Propanediol, Hydroxyethylcellulose, Hyaluronic Acid, Glycine, Lactic Acid",
    usageInstructions:
      "Gently roll or tap a tiny bead under each eye contour in the morning.",
    categorySlug: "eye-creams",
    imageCategory: "eyeCream",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT",
  },
  {
    title: "Ultra-Light Dewy Sunscreen SPF 50+ PA++++",
    slug: "ultra-light-dewy-sunscreen-spf-50",
    description:
      "A weightless hybrid sunscreen delivering invisible UV defense with a radiant glass-skin finish. Formulated with adenosine and ectoin to protect against blue light and environmental stressors.",
    price: 2100,
    discountPrice: 1850,
    stock: 95,
    skinType: "dry, normal, combination",
    skinConcerns: "dullness, sun protection, barrier support",
    ingredients:
      "Water, Dibutyl Adipate, Propanediol, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Polysilicone-15, Niacinamide, Ectoin, Adenosine, Tocopherol",
    usageInstructions:
      "Apply liberally 15 minutes before sun exposure as the last step of skincare. Reapply every two hours.",
    categorySlug: "sunscreens",
    imageCategory: "sunscreen",
    sellerEmail: "jordan@bareglow.com",
    status: "DRAFT",
  },
  {
    title: "Clarifying Kaolin & Zinc Clay Mask",
    slug: "clarifying-kaolin-zinc-clay-mask",
    description:
      "Deep pore purifying French green clay mask fortified with 2% Zinc PCA and tea tree leaf extract to absorb congested sebum without cracking or stripping hydration.",
    price: 1650,
    discountPrice: null,
    stock: 45,
    skinType: "oily, combination",
    skinConcerns: "congested pores, blackheads, excess shine",
    ingredients:
      "Kaolin, Water, Glycerin, Zinc PCA, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Bentonite, Allantoin, Phenoxyethanol",
    usageInstructions:
      "Apply an even layer to cleansed skin avoiding eye and lip areas. Leave on for 10-12 minutes, then rinse with warm water.",
    categorySlug: "masks",
    imageCategory: "mask",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "Overnight Nourishing Butter Lip Mask",
    slug: "overnight-nourishing-butter-lip-mask",
    description:
      "Intensive conditioning lip mask infused with wild Himalayan honey, murumuru butter, and sea buckthorn oil. Melts into lips to eliminate dead flaking skin overnight.",
    price: 950,
    discountPrice: 850,
    stock: 80,
    skinType: "all",
    skinConcerns: "chapped lips, dry flakiness",
    ingredients:
      "Astrocaryum Murumuru Seed Butter, Ricinus Communis (Castor) Seed Oil, Butyrospermum Parkii (Shea) Butter, Hippophae Rhamnoides (Sea Buckthorn) Fruit Oil, Honey, Tocopheryl Acetate",
    usageInstructions:
      "Generously coat lips before bedtime. Can also be applied during the day as a high-gloss protective balm.",
    categorySlug: "lip-care",
    imageCategory: "lipCare",
    sellerEmail: "priya@botanabeauty.com",
    status: "ACTIVE",
  },
  {
    title: "AHA 12% Exfoliating Smoothing Body Lotion",
    slug: "aha-12-exfoliating-smoothing-body-lotion",
    description:
      "Clinical-strength exfoliating body moisturizer featuring 10% Lactic Acid and 2% Glycolic Acid to eradicate keratosis pilaris (strawberry skin) and rough elbow patches.",
    price: 2200,
    discountPrice: 1950,
    stock: 60,
    skinType: "rough, dry, textured body skin",
    skinConcerns: "keratosis pilaris, body breakouts, rough texture",
    ingredients:
      "Water, Lactic Acid (10%), Glycolic Acid (2%), Caprylic/Capric Triglyceride, Glycerin, Sodium Hydroxide, Dimethicone, Ceramide NP, Squalane",
    usageInstructions:
      "Massage over clean, dry body skin once daily. Follow with broad-spectrum sunscreen on sun-exposed body parts.",
    categorySlug: "body-lotions",
    imageCategory: "bodyLotion",
    sellerEmail: "marcus@skinchemy.com",
    status: "ACTIVE",
  },
  {
    title: "Discontinued Walnut Shell Scrub",
    slug: "discontinued-walnut-shell-scrub",
    description:
      "Archived historical SKU kept to demonstrate order history preservation and database foreign key integrity.",
    price: 850,
    discountPrice: null,
    stock: 0,
    skinType: "oily",
    skinConcerns: "rough texture",
    ingredients: "Water, Juglans Regia (Walnut) Shell Powder, Sodium Laureth Sulfate",
    usageInstructions: "Archived product.",
    categorySlug: "exfoliants",
    imageCategory: "exfoliant",
    sellerEmail: "marcus@skinchemy.com",
    status: "ARCHIVED",
    deletedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000),
  },
];

export async function seedProducts(
  prisma: PrismaClient,
  users: SeededUser[],
  productImages: Record<string, string[]>
) {
  console.log("📦 Seeding comprehensive skincare catalog with realistic formulations...");

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

  let count = 0;

  for (const product of PRODUCTS) {
    const storeSlug = sellerMap.get(product.sellerEmail);
    if (!storeSlug) continue;

    const sellerId = profileMap.get(storeSlug);
    if (!sellerId) continue;

    const categoryId = categoryMap.get(product.categorySlug);

    const images = productImages[product.imageCategory] || [
      `/seed/products/${product.imageCategory}-1.jpg`,
      `/seed/products/${product.imageCategory}-2.jpg`,
      `/seed/products/${product.imageCategory}-3.jpg`,
    ];

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        skinType: product.skinType,
        skinConcerns: product.skinConcerns,
        ingredients: product.ingredients,
        usageInstructions: product.usageInstructions,
        status: product.status ?? "ACTIVE",
        deletedAt: product.deletedAt ?? null,
      },
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
        status: product.status ?? "ACTIVE",
        publishedAt: product.status === "ACTIVE" ? new Date() : null,
        deletedAt: product.deletedAt ?? null,
      },
    });

    // Add product images with sort order and primary flag
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
            sortOrder: i,
            altText: `${product.title} - view ${i + 1}`,
          },
        });
      }
    }

    count++;
    console.log(`  ✓ [${product.status ?? "ACTIVE"}] ${product.title} (Stock: ${product.stock}, Rs. ${product.price})`);
  }

  console.log(`✅ Seeded ${count} products with INCI formulations, statuses, and multi-images\n`);
}
