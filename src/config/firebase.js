import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Your Firebase configuration
// Get these from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Auto sign-in anonymously for guest access
let authInitialized = false;
let authPromise = null;

const ensureAuth = () => {
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve, reject) => {
    if (authInitialized && auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        authInitialized = true;
        console.log('✅ Firebase Auth: Already signed in as guest');
        unsubscribe();
        resolve(user);
      } else {
        try {
          console.log('🔑 Firebase Auth: Signing in as guest...');
          const result = await signInAnonymously(auth);
          authInitialized = true;
          console.log('✅ Firebase Auth: Guest signed in successfully');
          unsubscribe();
          resolve(result.user);
        } catch (error) {
          console.error('❌ Firebase Auth error:', error);
          unsubscribe();
          reject(error);
        }
      }
    });
  });

  return authPromise;
};

export { db, auth, ensureAuth };
