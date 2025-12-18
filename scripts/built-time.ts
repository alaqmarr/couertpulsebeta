import { prisma } from "@/lib/db";

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
    // prisma disconnection is handled by the singleton in lib/db potentially,
    // but in a script we should be explicit if we can.
    // However, lib/db exports `prisma`.
    // We can just query and exit.
    await prisma.$disconnect();
  }
}

// Execute the function
main();
