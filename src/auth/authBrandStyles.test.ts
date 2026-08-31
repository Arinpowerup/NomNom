import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("authentication brand styles", () => {
  it("centers the full-width brand without a background", () => {
    expect(styles).toMatch(/\.auth-brand\s*\{[^}]*width:\s*100%[^}]*justify-items:\s*center[^}]*background:\s*transparent/s);
  });

  it("renders the logo mark without a colored tile", () => {
    expect(styles).toMatch(/\.auth-brand \.auth-mark\s*\{[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  });
});
