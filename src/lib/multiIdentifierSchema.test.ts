import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve("supabase/migrations/202608310006_multi_identifier_profiles.sql"), "utf8");
const client = readFileSync(resolve("src/lib/supabase.ts"), "utf8");

describe("multi-identifier authentication schema", () => {
  it("stores email and split international phone fields", () => {
    expect(sql).toContain("add column if not exists email text");
    expect(sql).toContain("add column if not exists country_code text");
    expect(sql).toContain("add column if not exists phone_number text");
    expect(sql).toContain("country_code in ('+61', '+86')");
  });
  it("populates profiles for both email and phone auth users", () => {
    expect(sql).toContain("create or replace function public.handle_new_user()");
    expect(sql).toContain("new.phone like '+61%'");
    expect(sql).toContain("new.phone like '+86%'");
  });
  it("persists and refreshes Supabase sessions", () => {
    expect(client).toContain("persistSession: true");
    expect(client).toContain("autoRefreshToken: true");
  });
});
