import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialData } from "../data/seed";

const mocks = vi.hoisted(() => ({ from: vi.fn(), upsert: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { from: mocks.from } }));
import { loadCloudData, saveCloudData } from "./cloudData";

describe("household cloud data", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }), upsert: mocks.upsert }); });
  it("loads only the selected household state", async () => { mocks.maybeSingle.mockResolvedValue({ data: { data: initialData }, error: null }); await expect(loadCloudData("family-1")).resolves.toEqual(initialData); expect(mocks.from).toHaveBeenCalledWith("household_states"); });
  it("upserts shared state with the authenticated editor", async () => { mocks.upsert.mockResolvedValue({ error: null }); await saveCloudData("family-1", "user-1", initialData); expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ household_id: "family-1", updated_by: "user-1", data: initialData }), { onConflict: "household_id" }); });
});
