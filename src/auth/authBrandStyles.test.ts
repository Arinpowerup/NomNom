import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("authentication brand styles", () => {
  it("centers the full-width brand container without its own background", () => {
    expect(styles).toMatch(/\.auth-brand\s*\{[^}]*width:\s*100%[^}]*justify-items:\s*center[^}]*background:\s*transparent/s);
  });

  it("uses an orange frosted-glass tile behind the login logo", () => {
    expect(styles).toMatch(/\.auth-brand \.auth-mark\s*\{[^}]*linear-gradient[^}]*backdrop-filter:\s*blur\(18px\)/s);
  });

  it("uses the same frosted-glass treatment for in-app brand marks", () => {
    expect(styles).toMatch(/\.app-shell \.brand-mark\s*\{[^}]*linear-gradient[^}]*backdrop-filter:\s*blur\(16px\)/s);
  });
});
