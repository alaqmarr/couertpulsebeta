# Safe Database Commands

## ALWAYS USE THESE SCRIPTS

### Primary Database (READ-ONLY - Never Push!)
```bash
npm run db:generate       # Generate Prisma client (SAFE)
npm run db:studio         # Open Prisma Studio to view data
```

### Analytics Database
```bash
npm run analytics:generate  # Generate analytics Prisma client
npm run analytics:push      # Push schema to analytics DB
npm run analytics:studio    # Open Prisma Studio for analytics
npm run analytics:seed      # Seed achievements
```

### Setup (Both Databases)
```bash
npm run db:setup           # Generate both Prisma clients
```

---

## FORBIDDEN COMMANDS (WILL RESET PRIMARY DB)

**NEVER RUN THESE:**
- ❌ `npx prisma db push` (targets primary DB!)
- ❌ `npx prisma db push --force-reset`
- ❌ `npx prisma migrate reset`

**ONLY USE:**
- ✅ `npm run analytics:push` (safe - targets analytics only)
- ✅ `npm run db:generate` (safe - no DB changes)

---

## Recovery

If primary DB is reset:
1. Restore from Neon backup
2. Run `npm run db:setup`
3. Run `npm run analytics:push`
4. Run `npm run analytics:seed`
