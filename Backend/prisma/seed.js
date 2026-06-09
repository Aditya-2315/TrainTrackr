import { PrismaClient } from "../generated/index.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const name = process.env.HEAD_TRAINER_NAME;
  const email = process.env.HEAD_TRAINER_EMAIL;
  const password = process.env.HEAD_TRAINER_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      "Missing HEAD_TRAINER_NAME, HEAD_TRAINER_EMAIL or HEAD_TRAINER_PASSWORD in .env"
    );
    process.exit(1);
  }

  // Check if already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Head trainer already exists (${email}), skipping.`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create head trainer + trainer profile
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "HEAD_TRAINER",
      status: "ACTIVE",
      trainerProfile: {
        create: { isApproved: true },
      },
    },
  });

  console.log(`✅ Head trainer created: ${user.name} (${user.email})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());