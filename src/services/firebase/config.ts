import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBvwGY2uIVOc9B7mHYiPIvFnebhdsfB2ak",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vibeathon-7b277.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://vibeathon-7b277-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vibeathon-7b277",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vibeathon-7b277.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "909432426012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:909432426012:web:2bfa2c148e52c44a1d99d9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WZD4Y3S8XZ"
};

// Initialize Firebase with error handling
let app: any;
let analytics: any;
let db: any;
let auth: any;
let storage: any;
let realtimeDb: any;

try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  realtimeDb = getDatabase(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Fallback to mock services in development
  if (import.meta.env.DEV) {
    db = { collection: () => ({ onSnapshot: () => () => {} }) };
    auth = { currentUser: null };
    storage = { ref: () => ({}) };
    realtimeDb = { ref: () => ({}) };
  }
}

export { analytics, db, auth, storage, realtimeDb };
export default app;