import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/styles.css", "utf8");

describe("default Snoopy theme contrast", () => {
  it("uses white controls with black text and translucent orange selection", () => {
    expect(styles).toContain(
      ".app-shell.theme-snoopy button:not(.danger):not(.bottom-nav button)",
    );
    expect(styles).toMatch(/color: #1f1f1f;\s+background: #ffffff;/);
    expect(styles).toMatch(
      /\.selected \{[\s\S]*background: rgba\(240, 160, 40, 0\.16\);/,
    );
    expect(styles).not.toContain("background: #1f1f1f;");
  });

  it("uses a soft home hero border and shadow", () => {
    expect(styles).toMatch(
      /\.theme-snoopy \.hero \{[\s\S]*border: 1px solid #ddd1bd;[\s\S]*box-shadow: 0 14px 34px rgba\(82, 59, 31, 0\.1\);/,
    );
    expect(styles).not.toContain("box-shadow: 10px 10px 0");
  });
});

describe("Snoopy home hero motion", () => {
  it("mirrors a static character while keeping only steam animated", () => {
    expect(styles).toMatch(
      /\.kitchen-mascot-image \{[\s\S]*transform: scaleX\(-1\);/,
    );
    expect(styles).not.toContain("animation: snoopy-cook-bob");
    expect(styles).not.toContain("@keyframes snoopy-cook-bob");
    expect(styles).toMatch(
      /\.cooking-steam \{[\s\S]*left: 13%;[\s\S]*animation: cooking-steam-rise/,
    );
    expect(styles).toContain("@keyframes cooking-steam-rise");
  });
});
