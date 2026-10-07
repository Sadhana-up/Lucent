import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

try {
  process.loadEnvFile(".env");
} catch {
  // .env may not exist — DATABASE_URL can be provided via the shell
}

const email = process.argv[2];
const password = process.argv[3];
const makeAdmin = process.argv.includes("--make-admin");

if (!email || !password) {
  console.error("Usage: npx tsx scripts/set-admin-password.ts <email> <password> [--make-admin]");
  process.exit(1);
}

if (password.length < 8 || password.length > 128) {
  console.error("Password must be between 8 and 128 characters.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Pass it in the environment or in .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const hashed = await hashPassword(password);

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: user.id },
    },
    update: { password: hashed },
    create: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashed,
    },
  });

  if (makeAdmin && user.role !== "admin") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
  }

  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(`✅ Password set for ${email}`);
  console.log(`   Role: ${updated?.role}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
