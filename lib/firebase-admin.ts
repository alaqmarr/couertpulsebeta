import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Primary Firebase (Transactional - Live Scores, Real-time updates)
const primaryFirebaseConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Secondary Firebase (Analytics - Activity logs, historical data)
const analyticsFirebaseConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_TWO,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL_TWO,
    privateKey: process.env.FIREBASE_PRIVATE_KEY_TWO?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL_TWO,
};

// Initialize Primary Firebase App
let primaryApp;
if (!getApps().find((app) => app.name === "primary")) {
  primaryApp = initializeApp(primaryFirebaseConfig, "primary");
} else {
  primaryApp = getApp("primary");
}

// Initialize Analytics Firebase App
let analyticsApp;
if (!getApps().find((app) => app.name === "analytics")) {
  analyticsApp = initializeApp(analyticsFirebaseConfig, "analytics");
} else {
  analyticsApp = getApp("analytics");
}

// Export databases
export const primaryDatabase = getDatabase(primaryApp);
export const analyticsDatabase = getDatabase(analyticsApp);

// Legacy exports for backwards compatibility
export const adminDb = primaryDatabase;
export const adminDbAnalytics = analyticsDatabase;

// Helper to get appropriate database
export function getFirebaseDB(type: "primary" | "analytics" = "primary") {
  return type === "primary" ? primaryDatabase : analyticsDatabase;
}
