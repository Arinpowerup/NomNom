import type { AppData } from "../types";
import { saveCloudData } from "./cloudData";

export const migrationBackupKey = (householdId: string) => `nomnom:pre-cloud:${householdId}`;

export async function migrateLocalData(householdId: string, userId: string, local: AppData) {
  if (local.version !== 1 || !Array.isArray(local.recipes) || !Array.isArray(local.mealPlans)) throw new Error("本地数据格式无效，未执行迁移");
  localStorage.setItem(migrationBackupKey(householdId), JSON.stringify(local));
  await saveCloudData(householdId, userId, structuredClone(local));
  localStorage.setItem(`nomnom:cloud-migrated:${householdId}`, new Date().toISOString());
}
