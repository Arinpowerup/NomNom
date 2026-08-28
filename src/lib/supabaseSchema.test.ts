import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const sql = readFileSync(resolve("supabase/migrations/202608280001_initial_auth_and_households.sql"), "utf8");
describe("Supabase foundation migration", () => {
  it("enables RLS on every exposed table", () => { for (const table of ["profiles","households","household_members","household_states","household_invites"]) expect(sql).toContain(`alter table public.${table} enable row level security`); });
  it("blocks anonymous table access and scopes data to authenticated households", () => { expect(sql).toContain("from anon,authenticated"); expect(sql).toContain("private.user_household_ids()"); expect(sql).toContain("to authenticated"); expect(sql).toContain("(select auth.uid())"); });
});
