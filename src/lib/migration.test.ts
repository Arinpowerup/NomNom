import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialData } from "../data/seed";
const saveCloudData = vi.hoisted(() => vi.fn());
vi.mock("./cloudData", () => ({ saveCloudData }));
import { migrateLocalData, migrationBackupKey } from "./migration";
describe("local to cloud migration", () => { beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); }); it("backs up local data before uploading it to the household", async () => { saveCloudData.mockResolvedValue(undefined); await migrateLocalData("h1", "u1", initialData); expect(JSON.parse(localStorage.getItem(migrationBackupKey("h1"))!)).toEqual(initialData); expect(saveCloudData).toHaveBeenCalledWith("h1", "u1", initialData); expect(localStorage.getItem("nomnom:cloud-migrated:h1")).toBeTruthy(); }); it("refuses malformed local data", async () => { await expect(migrateLocalData("h1", "u1", { version: 9 } as never)).rejects.toThrow("格式无效"); expect(saveCloudData).not.toHaveBeenCalled(); }); });
