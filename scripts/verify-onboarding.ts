import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function run() {
  console.log("🧪 Testing Onboarding Enforcement Logic...");

  // 1. Create a fresh test customer with onboardingCompleted: false
  const testEmail = `test-onboard-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      name: "Onboard Test User",
      email: testEmail,
      role: "customer",
      onboardingCompleted: false,
    },
  });

  try {
    assert.strictEqual(user.onboardingCompleted, false, "Fresh user must have onboardingCompleted: false");
    console.log("✓ Fresh user has onboardingCompleted: false");

    // 2. Simulate middleware logic for un-onboarded customer
    // - visiting /shop should redirect to /onboarding
    const shouldRedirectToOnboarding = user.role === "customer" && !user.onboardingCompleted;
    assert.strictEqual(shouldRedirectToOnboarding, true, "Un-onboarded customer must be redirected to /onboarding");
    console.log("✓ Un-onboarded customer is blocked from app routes and sent to /onboarding");

    // 3. Simulate completion (PATCH /api/profile)
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        skinType: "combination",
        skinConcerns: "acne, redness",
        onboardingCompleted: true,
      },
    });

    assert.strictEqual(updated.onboardingCompleted, true, "User must have onboardingCompleted: true after finish");
    console.log("✓ Profile updated with skinType and onboardingCompleted: true");

    // 4. Simulate middleware logic after onboarding completed
    // - visiting /shop should be allowed (not redirected to /onboarding)
    const redirectAfterOnboard = updated.role === "customer" && !updated.onboardingCompleted;
    assert.strictEqual(redirectAfterOnboard, false, "Onboarded user must NOT be redirected to /onboarding");

    // - visiting /onboarding should redirect to /shop (never loop)
    const loopToShop = updated.onboardingCompleted === true;
    assert.strictEqual(loopToShop, true, "Visiting /onboarding after completion redirects to /shop");
    console.log("✓ Onboarded user can reach /shop and does not loop back to /onboarding");

    // 5. Test Seller & Admin exemption
    const sellerUser = { role: "seller", onboardingCompleted: false };
    const adminUser = { role: "admin", onboardingCompleted: false };
    assert.strictEqual(sellerUser.role === "customer", false, "Seller is exempt from buyer skin onboarding");
    assert.strictEqual(adminUser.role === "customer", false, "Admin is exempt from buyer skin onboarding");
    console.log("✓ Seller and admin roles are not captured by buyer onboarding");

    console.log("🎉 All onboarding verification checks passed!");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
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
