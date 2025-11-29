# Dual Database Load Distribution

## Distribution Strategy

### Primary DB (`DATABASE_URL`) - Transactional & Critical
**READ & WRITE:**
- ✅ Users, Teams, Tournaments
- ✅ Matches, Games, Scores
- ✅ Payments, Memberships
- ✅ Real-time gameplay data

**Why:** Critical transactional data, needs ACID guarantees

---

### Analytics DB (`ANALYTICS_DATABASE_URL`) - Analytics & Logs
**WRITE-ONLY (from app):**
- ✅ Activity logs (all user actions)
- ✅ Achievement unlocks
- ✅ Email queue/logs
- ✅ Event tracking

**READ FOR:**
- ✅ Activity feeds
- ✅ Achievement progress
- ✅ Email status/history
- ✅ Analytics dashboards

**Why:** Write-heavy, read for reporting, doesn't need immediate consistency

---

## Implementation

### Files Updated

| File | Change | DB Used |
|------|--------|---------|
| `lib/activity-logger.ts` | All operations | Analytics DB |
| `lib/achievements/checker.ts` | Read criteria (Primary), Write unlocks (Analytics) | Both |
| `lib/email-queue.ts` | Email logging | Analytics DB |

### Usage Examples

```typescript
// Activity logging → Analytics DB
import { logActivity } from "@/lib/activity-logger";
await logActivity(userId, "GAME_PLAYED", matchId);

// Achievements → Read from Primary, Write to Analytics
import { checkAndUnlockAchievements } from "@/lib/achievements/checker";
await checkAndUnlockAchievements(userId);

// Email logging → Analytics DB
import { queueEmail } from "@/lib/email-queue";
await queueEmail(email, subject, body, userId);

// Gameplay data → Primary DB (unchanged)
import { prisma } from "@/lib/db";
const user = await prisma.user.findUnique({ where: { id } });
```

---

## Performance Benefits

### Load Distribution
- **Primary DB:** Handles critical transactional queries only
- **Analytics DB:** Absorbs all logging and tracking writes
- **Reduced contention:** Separate connection pools

### Expected Improvements
- 🚀 Faster match operations (no activity logging overhead)
- 🚀 Better scalability (analytics won't slow down gameplay)
- 🚀 Independent scaling per database

---

## Monitoring

Watch these metrics:
- Primary DB: Query latency, connections
- Analytics DB: Write throughput, disk usage
- Cross-DB queries: Minimize these

---

**Status:** ✅ Implemented and Active
**Risk:** Low - Primary DB unchanged, analytics is additive
**Rollback:** Easy - just revert to `prisma` imports
