import type { AppData } from "../types";
import { initialData, seedCategories } from "../data/seed";

const DB_NAME = "family-menu-db";
const STORE = "app";
const KEY = "state";

const cloneInitial = (): AppData => structuredClone(initialData);

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadData(): Promise<AppData> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      const saved = request.result as AppData | undefined;
      resolve(
        saved
          ? {
              ...saved,
              preferences: saved.preferences ?? { theme: "warm" },
              categories: saved.categories ?? structuredClone(seedCategories),
            }
          : cloneInitial(),
      );
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveData(data: AppData): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetData(): Promise<AppData> {
  const data = cloneInitial();
  await saveData(data);
  return data;
}
