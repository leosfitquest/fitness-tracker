/**
 * offlineStore.ts — IndexedDB-based offline queue + cache
 * 
 * When the network is unavailable, mutations are queued in IndexedDB.
 * When network returns, the queue is flushed automatically.
 */

const DB_NAME = 'fitquest-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'mutation-queue';
const CACHE_STORE = 'data-cache';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ============= MUTATION QUEUE =============

export type QueuedMutation = {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'upsert' | 'delete';
  data: any;
  userId?: string;
  createdAt: string;
};

export async function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'createdAt'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  store.add({ ...mutation, createdAt: new Date().toISOString() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const store = tx.objectStore(QUEUE_STORE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearQueuedMutation(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllQueued(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============= DATA CACHE =============

export async function setCacheItem(key: string, data: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);
  store.put({ key, data, updatedAt: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCacheItem<T = any>(key: string): Promise<T | null> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readonly');
  const store = tx.objectStore(CACHE_STORE);
  const request = store.get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.data ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function removeCacheItem(key: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);
  store.delete(key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============= NETWORK UTILITIES =============

export function isOnline(): boolean {
  return navigator.onLine;
}

/** Flush all queued mutations to Supabase. Returns count of successfully flushed items. */
export async function flushQueue(
  executor: (mutation: QueuedMutation) => Promise<boolean>
): Promise<number> {
  const items = await getQueuedMutations();
  let flushed = 0;

  for (const item of items) {
    try {
      const success = await executor(item);
      if (success && item.id != null) {
        await clearQueuedMutation(item.id);
        flushed++;
      }
    } catch (err) {
      console.warn('[Offline Queue] Failed to flush mutation:', item, err);
      // Stop flushing on first error (likely still offline)
      break;
    }
  }

  return flushed;
}

// ============= AUTO-SYNC LISTENER =============

let syncListenerAttached = false;
let syncCallback: (() => void) | null = null;

export function onOnlineSync(callback: () => void) {
  syncCallback = callback;
  if (!syncListenerAttached) {
    window.addEventListener('online', () => {
      console.log('[Offline] Back online — triggering sync');
      syncCallback?.();
    });
    syncListenerAttached = true;
  }
}

// Save active workout to IndexedDB (survives app close)
export async function saveActiveWorkoutCache(state: any): Promise<void> {
  await setCacheItem('active-workout', state);
}

export async function loadActiveWorkoutCache(): Promise<any | null> {
  return getCacheItem('active-workout');
}

export async function clearActiveWorkoutCache(): Promise<void> {
  await removeCacheItem('active-workout');
}
