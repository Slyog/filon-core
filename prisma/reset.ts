import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete all persisted data (actions first due to foreign key constraints)
  await prisma.action.deleteMany();
  await prisma.step.deleteMany();
  await prisma.track.deleteMany();
  await prisma.score.deleteMany();
  await prisma.journeyState.deleteMany();
  await prisma.goal.deleteMany();

  console.log("✅ Database reset complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
