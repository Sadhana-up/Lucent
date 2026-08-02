import { PrismaClient } from "@prisma/client";

export interface SeededUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isSeller: boolean;
  storeName?: string;
  storeSlug?: string;
  bio?: string;
}

export async function seedUsers(
  prisma: PrismaClient,
  avatars: string[]
): Promise<SeededUser[]> {
  console.log("👤 Seeding users...");

  const usersData = [
    // SELLERS (4 sellers with store profiles)
    {
      name: "Aria Chen",
      email: "aria@glowlab.com",
      role: "seller",
      skinType: "combination",
      isSeller: true,
      storeName: "Glow Lab Skincare",
      storeSlug: "glow-lab",
      bio: "Clean beauty enthusiast creating plant-based skincare for sensitive skin.",
    },
    {
      name: "Marcus Rivera",
      email: "marcus@skinchemy.com",
      role: "seller",
      skinType: "oily",
      isSeller: true,
      storeName: "Skinchemy",
      storeSlug: "skinchemy",
      bio: "Science-backed formulations for acne-prone and oily skin types.",
    },
    {
      name: "Priya Sharma",
      email: "priya@botanabeauty.com",
      role: "seller",
      skinType: "dry",
      isSeller: true,
      storeName: "Botana Beauty",
      storeSlug: "botana-beauty",
      bio: "Ayurvedic-inspired skincare using ancient botanical ingredients.",
    },
    {
      name: "Jordan Hayes",
      email: "jordan@bareglow.com",
      role: "seller",
      skinType: "normal",
      isSeller: true,
      storeName: "Bare Glow",
      storeSlug: "bare-glow",
      bio: "Minimalist skincare for the modern, busy professional.",
    },
    // CUSTOMERS (5 customers)
    {
      name: "Sophie Kim",
      email: "sophie@example.com",
      role: "customer",
      skinType: "sensitive",
      isSeller: false,
    },
    {
      name: "Ethan Brooks",
      email: "ethan@example.com",
      role: "customer",
      skinType: "oily",
      isSeller: false,
    },
    {
      name: "Luna Martinez",
      email: "luna@example.com",
      role: "customer",
      skinType: "combination",
      isSeller: false,
    },
    {
      name: "Noah Patel",
      email: "noah@example.com",
      role: "customer",
      skinType: "dry",
      isSeller: false,
    },
    {
      name: "Zoe Williams",
      email: "zoe@example.com",
      role: "customer",
      skinType: "normal",
      isSeller: false,
    },
  ];

  const seededUsers: SeededUser[] = [];

  for (let i = 0; i < usersData.length; i++) {
    const data = usersData[i];
    const avatar = avatars[i % avatars.length];

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
        image: avatar,
        skinType: data.skinType,
        onboardingCompleted: true,
      },
    });

    console.log(`  ✓ ${user.name} (${user.role})`);

    if (data.isSeller && data.storeName && data.storeSlug) {
      await prisma.sellerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          storeName: data.storeName,
          storeSlug: data.storeSlug,
          bio: data.bio,
          contactEmail: data.email,
          isVerified: true,
        },
      });
      console.log(`    └─ Store: ${data.storeName}`);
    }

    seededUsers.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSeller: data.isSeller,
      storeName: data.storeName,
      storeSlug: data.storeSlug,
      bio: data.bio,
    });
  }

  console.log(`✅ Seeded ${seededUsers.length} users\n`);
  return seededUsers;
}
