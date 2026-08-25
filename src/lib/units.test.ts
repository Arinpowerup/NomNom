import { describe, expect, it } from "vitest";
import { chineseMeasureWord, displayUnit } from "./units";

describe("ingredient-aware Chinese units", () => {
  it("uses natural measure words for common ingredients", () => {
    expect(chineseMeasureWord("鸡蛋")).toBe("个");
    expect(chineseMeasureWord("牛排")).toBe("块");
    expect(chineseMeasureWord("小白菜")).toBe("把");
  });
  it("localises every supported unit in the Chinese interface", () => {
    expect(displayUnit("g", "zh", "牛排")).toBe("克");
    expect(displayUnit("kg", "zh", "牛排")).toBe("千克");
    expect(displayUnit("pack", "zh", "小白菜")).toBe("包");
    expect(displayUnit("ml", "zh", "牛奶")).toBe("毫升");
  });
});
