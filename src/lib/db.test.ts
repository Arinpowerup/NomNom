import { beforeEach, describe, expect, it } from "vitest";
import { loadData, saveData } from "./db";

beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("family-menu-db");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
});
describe("indexed db persistence", () => {
  it("loads seed data and persists changes", async () => {
    const data = await loadData();
    expect(data.recipes.length).toBeGreaterThanOrEqual(4);
    data.roles.push({ id: "two", name: "家人", color: "#000", createdAt: "" });
    await saveData(data);
    expect((await loadData()).roles.some((r) => r.id === "two")).toBe(true);
  });
});
