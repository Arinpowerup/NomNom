import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("mobile home hero", () => {
  it("keeps the mascot in document flow below the copy", () => {
    expect(styles).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hero\s*\{[^}]*display:\s*grid/s);
    expect(styles).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hero-art\s*\{[^}]*position:\s*relative/s);
    expect(styles).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hero > div:first-child\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s);
  });
});
