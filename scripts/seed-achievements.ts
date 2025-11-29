import { PrismaClient as AnalyticsPrismaClient } from "../app/prisma-analytics";
import { seedAchievements } from "@/lib/achievements/checker";

const analyticsDb = new AnalyticsPrismaClient();

async function main() {
  console.log("Seeding achievements to analytics DB...");
  await seedAchievements();
  console.log("Achievements seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await analyticsDb.$disconnect();
  });
