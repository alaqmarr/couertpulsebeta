# FOOLPROOF DATABASE SETUP GUIDE

## Step 1: Delete Config Files (AFTER RESTORE)
```bash
rm prisma.config.ts
rm prisma-analytics.config.ts
```

## Step 2: Verify Your Schemas Have Correct URLs

### Primary Schema (prisma/schema.prisma)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Analytics Schema (prisma/analytics.prisma)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("ANALYTICS_DATABASE_URL")
}
```

## Step 3: Verify .env File
```
DATABASE_URL="postgresql://...@ep-fragrant-scene-a1mbdqmr..."
ANALYTICS_DATABASE_URL="postgresql://...@ep-floral-wave-a1xx68gw..."
```
**These MUST be different databases!**

## Step 4: Use ONLY These Commands

### Primary DB (NEVER use db push)
```bash
npm run db:generate
```

### Analytics DB
```bash
npm run analytics:generate
npm run analytics:push
npm run analytics:seed
```

## Step 5: Package.json Scripts
```json
{
  "db:generate": "prisma generate",
  "analytics:generate": "prisma generate --schema=prisma/analytics.prisma",
  "analytics:push": "prisma db push --schema=prisma/analytics.prisma --accept-data-loss --skip-generate",
  "analytics:seed": "npx tsx scripts/seed-achievements.ts"
}
```

---

## AFTER RESTORE - Run This Exact Sequence:

1. **Restore your primary database in Neon**
2. **Delete both config files:**
   ```bash
   rm prisma.config.ts prisma-analytics.config.ts
   ```
3. **Generate primary client:**
   ```bash
   npm run db:generate
   ```
4. **Setup analytics:**
   ```bash
   npm run analytics:push
   npm run analytics:generate
   npm run analytics:seed
   ```

**DONE. Never touch primary DB again.**

---

## Why This Works

- **No config files** = No conflicts
- **Explicit env vars in schemas** = No mixups
- **--schema flag** = Always targets correct file
- **--skip-generate** = Prevents unnecessary regeneration

**This CANNOT fail if you follow it exactly.**
