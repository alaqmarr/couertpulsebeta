import { defineConfig } from "@prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/analytics.prisma",
  datasource: {
    url: process.env.ANALYTICS_DATABASE_URL ?? "",
  },
});
