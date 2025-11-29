import { PrismaClient } from "@/app/prisma";

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const newBuildTime = new Date().toISOString();

  console.log(`Updating lastBuildTime to: ${newBuildTime}`);

  try {
    await prisma.appConfig.upsert({
      where: { key: "lastBuildTime" },
      update: {
        value: newBuildTime,
      },
      create: {
        key: "lastBuildTime",
        value: newBuildTime,
      },
    });

    console.log("Successfully updated lastBuildTime in the database.");
  } catch (error) {
    console.error("Error updating build time:", error);
    process.exit(1); // Exit with an error code
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
main();
