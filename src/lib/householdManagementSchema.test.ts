import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const membersMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/202609010007_household_members.sql"), "utf8");
const leaveMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/202609010008_leave_household.sql"), "utf8");

describe("household management database contract", () => {
  it("protects member lookup and enables household realtime updates", () => {
    expect(membersMigration).toContain("list_household_members");
    expect(membersMigration).toContain("Household access required");
    expect(membersMigration).toContain("alter publication supabase_realtime add table public.households");
  });

  it("supports safe owner succession when leaving a household", () => {
    expect(leaveMigration).toContain("leave_household");
    expect(leaveMigration).toContain("set owner_id = successor_id");
    expect(leaveMigration).toContain("delete from public.households");
  });
});