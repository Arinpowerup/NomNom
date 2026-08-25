import { beforeEach, describe, expect, it } from "vitest";
import { loadData, saveData } from "./db";
import { initialData } from "../data/seed";
import type { AppData } from "../types";

beforeEach(async () => {
  await saveData(structuredClone(initialData));
});
describe("indexed db persistence", () => {
  it("loads seed data and persists changes", async () => {
    const data = await loadData();
    expect(data.recipes.length).toBeGreaterThanOrEqual(4);
    data.roles.push({ id: "two", name: "家人", color: "#000", createdAt: "" });
    await saveData(data);
    expect((await loadData()).roles.some((r) => r.id === "two")).toBe(true);
  });
  it("migrates legacy categories and appearance preferences without data loss", async () => {
    const legacy = structuredClone(initialData) as Partial<AppData>;
    delete legacy.categories;
    delete legacy.preferences;
    legacy.recipes![0].category = "light";
    await saveData(legacy as AppData);
    const migrated = await loadData();
    expect(migrated.categories).toHaveLength(6);
    expect(migrated.preferences.theme).toBe("snoopy");
    expect(migrated.recipes[0].category).toBe("diet");
  });
});
