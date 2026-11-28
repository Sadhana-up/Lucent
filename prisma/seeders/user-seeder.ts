import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

export interface SeededUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isSeller: boolean;
  storeName?: string;
  storeSlug?: string;
  bio?: string;
  isVerified?: boolean;
}

export async function seedUsers(
  prisma: PrismaClient,
  avatars: string[]
): Promise<SeededUser[]> {
  console.log("👤 Seeding users, credentials, and customer address books...");

  const usersData = [
    // ── SELLERS (4 realistic brands) ──────────────────────────────────────────
    {
      name: "Aria Chen",
      email: "aria@glowlab.com",
      role: "seller",
      phone: "+977-9811223344",
      skinType: "combination",
      skinConcerns: "sensitivity, barrier support",
      isSeller: true,
      storeName: "Glow Lab Skincare",
      storeSlug: "glow-lab",
      bio: "Clean, botanical skincare formulated for sensitive and reactive skin barriers.",
      isVerified: true,
      verifiedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
    },
    {
      name: "Marcus Rivera",
      email: "marcus@skinchemy.com",
      role: "seller",
      phone: "+977-9822334455",
      skinType: "oily",
      skinConcerns: "acne, enlarged pores",
      isSeller: true,
      storeName: "Skinchemy",
      storeSlug: "skinchemy",
      bio: "High-potency clinical actives and targeted acid formulations for blemish-prone skin.",
      isVerified: true,
      verifiedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000),
    },
    {
      name: "Priya Sharma",
      email: "priya@botanabeauty.com",
      role: "seller",
      phone: "+977-9833445566",
      skinType: "dry",
      skinConcerns: "hyperpigmentation, dullness",
      isSeller: true,
      storeName: "Botana Beauty",
      storeSlug: "botana-beauty",
      bio: "Ayurvedic herbs and Himalayan botanical extracts infused with modern cosmetic science.",
      isVerified: true,
      verifiedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    },
    {
      name: "Jordan Hayes",
      email: "jordan@bareglow.com",
      role: "seller",
      phone: "+977-9844556677",
      skinType: "normal",
      skinConcerns: "hydration, anti-pollution",
      isSeller: true,
      storeName: "Bare Glow",
      storeSlug: "bare-glow",
      bio: "Minimalist skincare routines designed for modern urban environments.",
      isVerified: false, // Pending verification for admin pipeline testing!
      verifiedAt: null,
    },

    // ── CUSTOMERS (with detailed skin profiles) ───────────────────────────────
    {
      name: "Sophie Kim",
      email: "sophie@example.com",
      role: "customer",
      phone: "+977-9800000001",
      skinType: "sensitive",
      skinConcerns: "redness, dryness, eczema",
      isSeller: false,
      addresses: [
        {
          label: "Home",
          fullName: "Sophie Kim",
          phone: "+977-9800000001",
          address: "House 42, Lazimpat Road",
          city: "Kathmandu",
          district: "Kathmandu",
          province: "Bagmati",
          postalCode: "44600",
          isDefault: true,
        },
        {
          label: "Studio / Office",
          fullName: "Sophie Kim",
          phone: "+977-9800000001",
          address: "Creative Hub, Jhamsikhel",
          city: "Lalitpur",
          district: "Lalitpur",
          province: "Bagmati",
          postalCode: "44700",
          isDefault: false,
        },
      ],
    },
    {
      name: "Ethan Brooks",
      email: "ethan@example.com",
      role: "customer",
      phone: "+977-9800000002",
      skinType: "oily",
      skinConcerns: "acne, post-acne marks, sebum control",
      isSeller: false,
      addresses: [
        {
          label: "Apartment",
          fullName: "Ethan Brooks",
          phone: "+977-9800000002",
          address: "Lakeside Marg, Street 14",
          city: "Pokhara",
          district: "Kaski",
          province: "Gandaki",
          postalCode: "33700",
          isDefault: true,
        },
      ],
    },
    {
      name: "Luna Martinez",
      email: "luna@example.com",
      role: "customer",
      phone: "+977-9800000003",
      skinType: "combination",
      skinConcerns: "dullness, uneven texture, dark circles",
      isSeller: false,
      addresses: [
        {
          label: "Home",
          fullName: "Luna Martinez",
          phone: "+977-9800000003",
          address: "Suryabinayak Heights, Ward 5",
          city: "Bhaktapur",
          district: "Bhaktapur",
          province: "Bagmati",
          postalCode: "44800",
          isDefault: true,
        },
      ],
    },
    {
      name: "Noah Patel",
      email: "noah@example.com",
      role: "customer",
      phone: "+977-9800000004",
      skinType: "dry",
      skinConcerns: "flakiness, fine lines, dehydration",
      isSeller: false,
      addresses: [
        {
          label: "Residence",
          fullName: "Noah Patel",
          phone: "+977-9800000004",
          address: "Main Road, Ward 2",
          city: "Biratnagar",
          district: "Morang",
          province: "Koshi",
          postalCode: "56600",
          isDefault: true,
        },
      ],
    },
    {
      name: "Zoe Williams",
      email: "zoe@example.com",
      role: "customer",
      phone: "+977-9800000005",
      skinType: "normal",
      skinConcerns: "hydration, UV damage prevention",
      isSeller: false,
      addresses: [
        {
          label: "Home",
          fullName: "Zoe Williams",
          phone: "+977-9800000005",
          address: "Baneshwor Heights, Ward 10",
          city: "Kathmandu",
          district: "Kathmandu",
          province: "Bagmati",
          postalCode: "44600",
          isDefault: true,
        },
      ],
    },
    {
      name: "Aarav Shrestha",
      email: "aarav@example.com",
      role: "customer",
      phone: "+977-9800000006",
      skinType: "oily",
      skinConcerns: "blemishes, blackheads",
      isSeller: false,
      addresses: [
        {
          label: "Home",
          fullName: "Aarav Shrestha",
          phone: "+977-9800000006",
          address: "Traffic Chowk, Ward 7",
          city: "Butwal",
          district: "Rupandehi",
          province: "Lumbini",
          postalCode: "32907",
          isDefault: true,
        },
      ],
    },

    // ── BANNED USER (to test account suspension UI & API) ────────────────────
    {
      name: "Vikram Thapa",
      email: "banned@example.com",
      role: "customer",
      phone: "+977-9800000099",
      skinType: "normal",
      skinConcerns: "none",
      isSeller: false,
      banned: true,
      banReason: "Suspended by Administrator for fraudulent refund chargebacks and automated review spamming.",
      banExpires: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  ];

  const seededUsers: SeededUser[] = [];
  const defaultPasswordHash = await hashPassword("password123");

  for (let i = 0; i < usersData.length; i++) {
    const data = usersData[i];
    const avatar = avatars[i % avatars.length] || `/seed/avatars/avatar-${(i % 9) + 1}.jpg`;

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        skinType: data.skinType,
        skinConcerns: data.skinConcerns,
        banned: (data as any).banned ?? false,
        banReason: (data as any).banReason ?? null,
        banExpires: (data as any).banExpires ?? null,
      },
      create: {
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
        phone: data.phone,
        image: avatar,
        skinType: data.skinType,
        skinConcerns: data.skinConcerns,
        onboardingCompleted: true,
        banned: (data as any).banned ?? false,
        banReason: (data as any).banReason ?? null,
        banExpires: (data as any).banExpires ?? null,
      },
    });

    // Create credential account so user can log in with password123
    await prisma.account.upsert({
      where: {
        providerId_accountId: { providerId: "credential", accountId: user.id },
      },
      update: { password: defaultPasswordHash },
      create: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: defaultPasswordHash,
      },
    });

    console.log(`  ✓ ${user.name} (${user.role})${user.banned ? " [BANNED]" : ""}`);

    // If seller, upsert store profile
    if (data.isSeller && data.storeName && data.storeSlug) {
      await prisma.sellerProfile.upsert({
        where: { userId: user.id },
        update: {
          storeName: data.storeName,
          bio: data.bio,
          contactEmail: data.email,
          phone: data.phone,
          isVerified: data.isVerified ?? false,
          verifiedAt: data.verifiedAt ?? null,
        },
        create: {
          userId: user.id,
          storeName: data.storeName,
          storeSlug: data.storeSlug,
          bio: data.bio,
          contactEmail: data.email,
          phone: data.phone,
          isVerified: data.isVerified ?? false,
          verifiedAt: data.verifiedAt ?? null,
        },
      });
      console.log(`    └─ Store: ${data.storeName} (${data.isVerified ? "Verified" : "Pending Approval"})`);
    }

    // If customer has address fixtures, seed them
    if ("addresses" in data && Array.isArray((data as any).addresses)) {
      for (const addr of (data as any).addresses) {
        const existing = await prisma.address.findFirst({
          where: { userId: user.id, address: addr.address },
        });
        if (!existing) {
          await prisma.address.create({
            data: {
              userId: user.id,
              label: addr.label,
              fullName: addr.fullName,
              phone: addr.phone,
              address: addr.address,
              city: addr.city,
              district: addr.district,
              province: addr.province,
              country: "NP",
              postalCode: addr.postalCode,
              isDefault: addr.isDefault,
            },
          });
        }
      }
    }

    seededUsers.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || undefined,
      isSeller: data.isSeller,
      storeName: data.storeName,
      storeSlug: data.storeSlug,
      bio: data.bio,
      isVerified: data.isVerified,
    });
  }

  console.log(`✅ Seeded ${seededUsers.length} users with credential accounts and addresses\n`);
  return seededUsers;
}
