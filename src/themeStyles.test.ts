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

describe("Snoopy home hero artwork", () => {
  it("integrates the static chef trio with a translucent orange backdrop", () => {
    expect(styles).toMatch(
      /\.kitchen-mascot::before \{[\s\S]*rgba\(240, 160, 40, 0\.16\);/,
    );
    expect(styles).not.toContain("transform: scaleX(-1)");
  });
});
describe("Snoopy recipe search artwork", () => {
  it("aligns the transparent trio to the border and adapts on narrow screens", () => {
    expect(styles).toContain("bottom: calc(100% - 2px);");
    expect(styles).toContain("transform: translateX(-50%);");
    expect(styles).toContain("@media (max-width: 560px)");
    expect(styles).toContain("flex-wrap: wrap;");
    expect(styles).toContain("flex-basis: 100%;");
  });
});
