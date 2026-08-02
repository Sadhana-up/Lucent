import "dotenv/config"; // loads .env — if you keep keys in .env.local, see note at bottom
import fs from "fs";
import path from "path";

const SEED_DIR = path.join(process.cwd(), "public", "seed");
const PRODUCTS_DIR = path.join(SEED_DIR, "products");
const AVATARS_DIR = path.join(SEED_DIR, "avatars");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

if (!PEXELS_API_KEY) {
  console.error(
    "❌ Missing PEXELS_API_KEY. Get a free key at https://www.pexels.com/api/ and add it to your .env file."
  );
  process.exit(1);
}

// Real search terms — Pexels returns actual matching photos for these,
// unlike Picsum's arbitrary numeric IDs.
const PRODUCT_QUERIES: Record<string, string> = {
  cleanser: "facial cleanser bottle",
  serum: "skincare serum dropper bottle",
  moisturizer: "moisturizer cream jar",
  sunscreen: "sunscreen bottle skincare",
  exfoliant: "face scrub exfoliant jar",
  toner: "skincare toner bottle",
  mask: "face mask skincare jar",
  eyeCream: "eye cream jar skincare",
  lipCare: "lip balm skincare",
  bodyLotion: "body lotion bottle",
};

const IMAGES_PER_PRODUCT = 3;
const AVATAR_QUERY = "portrait face person";
const AVATAR_COUNT = 9;

function ensureDirectories() {
  for (const dir of [SEED_DIR, PRODUCTS_DIR, AVATARS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchPexels(query: string, perPage: number): Promise<string[]> {
  const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY! },
  });

  if (!res.ok) {
    throw new Error(`Pexels search failed (${res.status}) for "${query}": ${await res.text()}`);
  }

  const data = await res.json();
  // "large" is a good size/quality tradeoff. Options: original, large2x, large, medium, small
  return (data.photos ?? []).map((p: any) => p.src.large as string);
}

async function downloadImage(url: string, destPathNoExt: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const ext = contentType.includes("png") ? ".png" : ".jpg";
  const destPath = `${destPathNoExt}${ext}`;

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return destPath;
}

async function downloadProductImages(): Promise<Record<string, string[]>> {
  console.log("📦 Downloading product images from Pexels...");
  const imageMap: Record<string, string[]> = {};

  for (const [category, query] of Object.entries(PRODUCT_QUERIES)) {
    // Skip categories that already have enough images (any extension)
    const existing = fs
      .readdirSync(PRODUCTS_DIR)
      .filter((f) => f.startsWith(`${category}-`))
      .sort();

    if (existing.length >= IMAGES_PER_PRODUCT) {
      console.log(`  ✓ ${category} already has ${existing.length} images, skipping`);
      imageMap[category] = existing.map((f) => `/seed/products/${f}`);
      continue;
    }

    imageMap[category] = [];
    try {
      const urls = await searchPexels(query, IMAGES_PER_PRODUCT);
      for (let i = 0; i < urls.length; i++) {
        const destNoExt = path.join(PRODUCTS_DIR, `${category}-${i + 1}`);
        const destPath = await downloadImage(urls[i], destNoExt);
        const filename = path.basename(destPath);
        console.log(`  ✓ Downloaded ${filename}`);
        imageMap[category].push(`/seed/products/${filename}`);
        await sleep(250); // stay comfortably under Pexels' rate limit
      }
    } catch (err) {
      console.error(`  ✗ Failed category "${category}":`, (err as Error).message);
      // Note: nothing is pushed for failed downloads, so imageMap never
      // points at files that don't exist.
    }
  }

  return imageMap;
}

async function downloadAvatarImages(): Promise<string[]> {
  console.log("👤 Downloading avatar images from Pexels...");

  const existing = fs
    .readdirSync(AVATARS_DIR)
    .filter((f) => f.startsWith("avatar-"))
    .sort();

  if (existing.length >= AVATAR_COUNT) {
    console.log(`  ✓ Avatars already exist (${existing.length}), skipping`);
    return existing.map((f) => `/seed/avatars/${f}`);
  }

  const avatars: string[] = [];
  try {
    const urls = await searchPexels(AVATAR_QUERY, AVATAR_COUNT);
    for (let i = 0; i < urls.length; i++) {
      const destNoExt = path.join(AVATARS_DIR, `avatar-${i + 1}`);
      const destPath = await downloadImage(urls[i], destNoExt);
      const filename = path.basename(destPath);
      console.log(`  ✓ Downloaded ${filename}`);
      avatars.push(`/seed/avatars/${filename}`);
      await sleep(250);
    }
  } catch (err) {
    console.error(`  ✗ Failed avatars:`, (err as Error).message);
  }

  return avatars;
}

export async function seedImages(): Promise<{
  productImages: Record<string, string[]>;
  avatars: string[];
}> {
  ensureDirectories();

  // Sequential, not Promise.all — keeps us well under Pexels' rate limit
  const productImages = await downloadProductImages();
  const avatars = await downloadAvatarImages();

  console.log("✅ All images downloaded to public/seed/\n");
  return { productImages, avatars };
}

// Run directly
if (require.main === module) {
  seedImages()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
