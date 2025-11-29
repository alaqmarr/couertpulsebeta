# DATABASE RECOVERY & SAFE SETUP

## IMMEDIATE ACTION REQUIRED

**If your primary database was reset:**
1. Go to Neon dashboard
2. Restore your primary database from the 2-hour backup
3. Use database: `ep-fragrant-scene-a1mbdqmr` (PRIMARY)

---

## CORRECT DATABASE MAPPING

Based on your `.env`:

### Primary Database (HAS YOUR DATA)
```
DATABASE_URL="postgresql://...@ep-fragrant-scene-a1mbdqmr-pooler..."
```
**This should have:** Users, Teams, Tournaments, ALL your data

### Analytics Database (EMPTY, SAFE TO RESET)
```
ANALYTICS_DATABASE_URL="postgresql://...@ep-floral-wave-a1xx68gw-pooler..."
```
**This should be:** Empty, ready for analytics

---

## SAFE COMMANDS TO RUN (AFTER RESTORE)

### Step 1: Verify Primary DB is NOT touched
```bash
# ONLY regenerate Prisma client, DO NOT push
npx prisma generate
```

### Step 2: Setup Analytics DB ONLY
```bash
# Push ONLY to analytics database
npx prisma db push --schema=prisma/analytics.prisma --accept-data-loss
npx prisma generate --schema=prisma/analytics.prisma
```

### Step 3: Verify
- Check Neon dashboard that primary DB (`ep-fragrant-scene-a1mbdqmr`) has all your data
- Check analytics DB (`ep-floral-wave-a1xx68gw`) is empty/newly created

---

## WHAT WENT WRONG

The issue: When I ran `npx prisma db push` without `--schema` flag, it used `DATABASE_URL` which points to your primary database.

**NEVER run these commands without being explicit:**
- ❌ `npx prisma db push` (targets DATABASE_URL - PRIMARY!)
- ✅ `npx prisma db push --schema=prisma/analytics.prisma` (safe - targets analytics)

---

## PREVENTION GOING FORWARD

1. **Always restore before any schema changes**
   - Keep your 2-hour backup ready
   - Test on analytics DB first

2. **Use explicit schema flags**
   - Primary: `npx prisma generate` (OK to run)
   - Analytics: `npx prisma generate --schema=prisma/analytics.prisma`

3. **NEVER run db push on primary without backup**
   - Your schema.prisma should remain stable
   - Only push to analytics DB

---

## RECOVERY CHECKLIST

- [ ] Restore primary DB from Neon backup (2 hours ago)
- [ ] Verify data is back in Neon dashboard
- [ ] Run `npx prisma generate` (just client, no push)
- [ ] Setup analytics DB with explicit schema flag
- [ ] Test that app works

**Once you've restored, let me know and I'll guide you through the safe setup.**
