import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { AppState, Flashcard, DailyLog, UserProfile } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfigJson);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    if (firebaseConfigJson.firestoreDatabaseId) {
      db = getFirestore(firebaseApp, firebaseConfigJson.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User> {
  const firebaseAuth = getFirebaseAuth();
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  await fbSignOut(firebaseAuth);
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  const firebaseAuth = getFirebaseAuth();
  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Load all user data from Firestore
 */
export async function loadUserDataFromFirestore(userId: string): Promise<Partial<AppState> | null> {
  try {
    const firestore = getFirebaseFirestore();

    // 1. User doc (settings & stats)
    const userDocRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    let settings = undefined;
    let stats = undefined;
    if (userSnap.exists()) {
      const data = userSnap.data();
      settings = data.settings;
      stats = data.stats;
    }

    // 2. Cards collection
    const cardsColRef = collection(firestore, 'users', userId, 'cards');
    const cardsSnap = await getDocs(cardsColRef);
    const cards: Flashcard[] = [];
    cardsSnap.forEach((docSnap) => {
      cards.push(docSnap.data() as Flashcard);
    });

    // 3. Daily Logs collection
    const logsColRef = collection(firestore, 'users', userId, 'dailyLogs');
    const logsSnap = await getDocs(logsColRef);
    const dailyLogs: DailyLog[] = [];
    logsSnap.forEach((docSnap) => {
      dailyLogs.push(docSnap.data() as DailyLog);
    });

    if (!userSnap.exists() && cards.length === 0 && dailyLogs.length === 0) {
      return null;
    }

    return {
      settings,
      stats,
      cards,
      dailyLogs,
    };
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    throw error;
  }
}

/**
 * Save complete application state to Firestore
 */
export async function syncAppStateToFirestore(userId: string, state: AppState): Promise<void> {
  try {
    const firestore = getFirebaseFirestore();

    // 1. Set user document
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        settings: state.settings,
        stats: state.stats,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Batch write cards
    const batch = writeBatch(firestore);
    state.cards.forEach((card) => {
      const cardRef = doc(firestore, 'users', userId, 'cards', card.id);
      batch.set(cardRef, { ...card, userId }, { merge: true });
    });

    // 3. Batch write daily logs
    state.dailyLogs.forEach((log) => {
      const logRef = doc(firestore, 'users', userId, 'dailyLogs', log.id);
      batch.set(logRef, { ...log, userId }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a card from Firestore
 */
export async function deleteCardFromFirestore(userId: string, cardId: string): Promise<void> {
  try {
    const firestore = getFirebaseFirestore();
    const cardRef = doc(firestore, 'users', userId, 'cards', cardId);
    await deleteDoc(cardRef);
  } catch (e) {
    console.error('Error deleting card from Firestore', e);
  }
}

/**
 * Delete a daily log from Firestore
 */
export async function deleteLogFromFirestore(userId: string, logId: string): Promise<void> {
  try {
    const firestore = getFirebaseFirestore();
    const logRef = doc(firestore, 'users', userId, 'dailyLogs', logId);
    await deleteDoc(logRef);
  } catch (e) {
    console.error('Error deleting log from Firestore', e);
  }
}
