import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

/**
 * Purge any expired or near-expired Firebase Auth tokens from Web Storage
 * and legacy IndexedDB before initializing Firebase Auth so that stale tokens
 * never trigger a failing securetoken.googleapis.com refresh request that blocks Firestore.
 */
function purgeExpiredCachedAuthTokens(): void {
  if (typeof window === 'undefined') return;
  const nowWithBuffer = Date.now() + 5 * 60 * 1000; // 5 minutes buffer

  const cleanStorage = (storage: Storage) => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('firebase:authUser:')) {
          const raw = storage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const exp = Number(parsed?.stsTokenManager?.expirationTime || 0);
              if (!exp || exp <= nowWithBuffer) {
                keysToRemove.push(key);
              }
            } catch {
              keysToRemove.push(key);
            }
          }
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    } catch {
      // Ignore storage access errors
    }
  };

  cleanStorage(window.sessionStorage);
  cleanStorage(window.localStorage);

  try {
    if (window.indexedDB && typeof window.indexedDB.deleteDatabase === 'function') {
      window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
    }
  } catch {
    // Ignore IndexedDB cleanup errors
  }
}

purgeExpiredCachedAuthTokens();

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const TEACHER_ADMIN_EMAIL = 'tienduongbp2011@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot after auth state is ready
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await auth.authStateReady();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}

testFirestoreConnection();

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

export function cleanFirestoreValue(val: unknown): unknown {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreValue(item));
  }
  const cleanedObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (v !== undefined) {
      cleanedObj[k] = cleanFirestoreValue(v);
    }
  }
  return cleanedObj;
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && k !== 'id') {
      result[k] = cleanFirestoreValue(v);
    }
  }
  return result;
}

export async function safeCreateOrSetDoc(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  opType: OperationType = OperationType.CREATE
): Promise<void> {
  const validId = sanitizeId(docId);
  const path = `${collectionName}/${validId}`;
  try {
    await setDoc(doc(db, collectionName, validId), stripUndefined(data));
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function safeUpdateDoc(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const validId = sanitizeId(docId);
  const path = `${collectionName}/${validId}`;
  try {
    await updateDoc(doc(db, collectionName, validId), stripUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function safeDeleteDoc(collectionName: string, docId: string): Promise<void> {
  const validId = sanitizeId(docId);
  const path = `${collectionName}/${validId}`;
  try {
    await deleteDoc(doc(db, collectionName, validId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function safeGetDoc<T>(collectionName: string, docId: string): Promise<T | null> {
  const validId = sanitizeId(docId);
  const path = `${collectionName}/${validId}`;
  try {
    const snap = await getDoc(doc(db, collectionName, validId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as object) } as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logoutFirebase() {
  return signOut(auth);
}
