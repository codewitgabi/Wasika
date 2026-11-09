import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load env files itself. Match Next.js: .env.local wins over .env.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need Neon's direct (unpooled) connection: the pooler breaks
    // the advisory locks `prisma migrate` uses. The app itself uses DATABASE_URL.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
