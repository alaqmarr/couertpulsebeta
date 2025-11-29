import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Primary Firebase Config (Client-side - Real-time scores)
const primaryFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Analytics Firebase Config (Client-side - Activity timeline)
const analyticsFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_TWO,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TWO,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL_TWO,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_TWO,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TWO,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TWO,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_TWO,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_TWO,
};

// Initialize Primary Firebase App
const primaryApp = !getApps().find((app) => app.name === "[DEFAULT]")
  ? initializeApp(primaryFirebaseConfig)
  : getApp();

// Initialize Analytics Firebase App
const analyticsApp = !getApps().find((app) => app.name === "analytics")
  ? initializeApp(analyticsFirebaseConfig, "analytics")
  : getApp("analytics");

// Export databases
export const db = getDatabase(primaryApp);
export const analyticsDb = getDatabase(analyticsApp);

// Backward compatibility
export { db as rtdb };
