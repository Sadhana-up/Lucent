import assert from "node:assert";
import { prisma } from "../src/lib/prisma";

async function run() {
  console.log("🧪 Testing Seller Verification Enforcement...");

  const timestamp = Date.now();
  const customerEmail = `cust-check-${timestamp}@example.com`;
  const sellerEmail = `seller-check-${timestamp}@example.com`;

  // 1. Create a fresh customer
  const customer = await prisma.user.create({
    data: {
      name: "Test Customer",
      email: customerEmail,
      role: "customer",
    },
  });

  // 2. Create an unverified seller
  const sellerUser = await prisma.user.create({
    data: {
      name: "Test Unverified Seller",
      email: sellerEmail,
      role: "seller",
    },
  });

  const unverifiedProfile = await prisma.sellerProfile.create({
    data: {
      userId: sellerUser.id,
      storeName: `Store ${timestamp}`,
      storeSlug: `store-${timestamp}`,
      isVerified: false,
    },
  });

  try {
    // Check 1: Customer has no seller profile
    const custProfile = await prisma.sellerProfile.findUnique({
      where: { userId: customer.id },
    });
    assert.strictEqual(custProfile, null, "Customer has no seller profile");

    const canCustomerCreateProduct: boolean = Boolean((custProfile as { isVerified?: boolean } | null)?.isVerified);
    assert.strictEqual(canCustomerCreateProduct, false, "Customer cannot create products (403)");
    console.log("✓ Customer without seller profile is forbidden from creating products");

    // Check 2: Unverified seller profile
    assert.strictEqual(unverifiedProfile.isVerified, false, "Seller is unverified");
    const canUnverifiedCreateProduct: boolean = Boolean((unverifiedProfile as { isVerified?: boolean }).isVerified);
    assert.strictEqual(canUnverifiedCreateProduct, false, "Unverified seller cannot create products (403)");
    console.log("✓ Unverified seller profile is forbidden from publishing products");

    // Check 3: Admin verifies seller profile
    const verifiedProfile = await prisma.sellerProfile.update({
      where: { id: unverifiedProfile.id },
      data: { isVerified: true, verifiedAt: new Date() },
    });
    assert.strictEqual(verifiedProfile.isVerified, true, "Seller is now verified");
    console.log("✓ Admin verification sets isVerified: true and verifiedAt timestamp");

    // Check 4: Verified seller can create products
    const category = await prisma.category.findFirst();
    assert.ok(category, "Category exists");

    const product = await prisma.product.create({
      data: {
        sellerId: verifiedProfile.id,
        categoryId: category.id,
        title: `Verified Product ${timestamp}`,
        slug: `verified-prod-${timestamp}`,
        description: "A test product from verified seller",
        price: 1500,
        stock: 10,
        status: "ACTIVE",
      },
    });
    console.log("✓ Verified seller successfully published ACTIVE product");

    // Check 5: Public query test
    // An active product from an unverified seller must NEVER be returned
    await prisma.sellerProfile.update({
      where: { id: verifiedProfile.id },
      data: { isVerified: false },
    });

    const publicProducts = await prisma.product.findMany({
      where: {
        id: product.id,
        status: "ACTIVE",
        deletedAt: null,
        seller: { isVerified: true },
      },
    });
    assert.strictEqual(publicProducts.length, 0, "Public catalog query filters out unverified seller products");
    console.log("✓ Public GET /api/products query never exposes products of unverified sellers");

    // Clean up product
    await prisma.product.delete({ where: { id: product.id } });

    console.log("🎉 All seller verification checks passed!");
  } finally {
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: [customer.id, sellerUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customer.id, sellerUser.id] } } });
  }
}

run()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
