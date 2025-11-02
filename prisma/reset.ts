import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 🧹 Delete all persisted data (edges first due to foreign key constraints)
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.meta.deleteMany();

  // 🌱 Re-seed motion test nodes
  await prisma.node.createMany({
    data: [
      { id: "motion-test-1", label: "💡 Idea Node", x: 150, y: 100 },
      { id: "motion-test-2", label: "⚙️ Process Node", x: 400, y: 150 },
      { id: "motion-test-3", label: "🎯 Goal Node", x: 250, y: 300 },
      { id: "motion-test-4", label: "🔄 Activity Node", x: 550, y: 280 },
    ],
  });

  console.log("✅ Database cleared and motion test nodes seeded.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
