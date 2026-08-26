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
      const isLegacyCategoryData = Boolean(saved && !saved.categories);
      const legacyCategoryMap: Record<string, string> = {
        light: "diet",
        home: "meat",
        hotpot: "soup",
        bakery: "dessert",
      };
      resolve(
        saved
          ? {
              ...saved,
              preferences: saved.preferences
                ? {
                    appName: "NomNom",
                    ...saved.preferences,
                    enabledMeals: saved.preferences.enabledMeals ?? [
                      "lunch",
                      "dinner",
                    ],
                  }
                : {
                    theme: "snoopy",
                    appName: "NomNom",
                    enabledMeals: ["lunch", "dinner"],
                  },
              categories: saved.categories ?? structuredClone(seedCategories),
              recipes: isLegacyCategoryData
                ? saved.recipes.map((recipe) => ({
                    ...recipe,
                    category:
                      legacyCategoryMap[recipe.category] ?? recipe.category,
                  }))
                : saved.recipes,
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
