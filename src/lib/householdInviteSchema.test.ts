import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const sql = readFileSync(resolve("supabase/migrations/202608280005_fix_household_invite_codes.sql"), "utf8");

it("generates invite codes without relying on an extension search path", () => {
  expect(sql).toContain("gen_random_uuid()");
  expect(sql).not.toContain("gen_random_bytes");
  expect(sql).toContain("create or replace function public.create_household_invite");
});
