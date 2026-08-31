import { describe, expect, it } from "vitest";
import {
  addStock,
  confirmDish,
  exportData,
  generateShoppingList,
  importData,
  orderDish,
  recommend,
  stockPurchased,
} from "./appActions";
import { initialData } from "../data/seed";

describe("shopping, recommendations and backups", () => {
  it("classifies ready and almost-ready recipes", () => {
    let data = addStock(initialData, {
      name: "鸡蛋",
      quantity: 4,
      unit: "piece",
    });
    data = addStock(data, { name: "番茄", quantity: 3, unit: "piece" });
    const result = recommend(data.recipes, data.stock, 2);
    expect(result.find((x) => x.recipe.id === "r2")?.missing).toHaveLength(0);
    expect(result.every((x) => x.missing.length <= 2)).toBe(true);
  });
  it("reports partial egg stock as recognized inventory", () => {
    const data = addStock(initialData, { name: "鸡蛋", quantity: 2, unit: "piece" });
    const result = recommend(data.recipes, data.stock, 2);
    expect(result.find((x) => x.recipe.id === "r2")?.missing).toContainEqual(
      expect.objectContaining({
        name: "鸡蛋", quantity: 2, inStock: 2, required: 4, unit: "piece",
      }),
    );
  });
  it("generates a list and stocks purchased items only once", () => {
    let data = orderDish(initialData, "2026-08-24", "dinner", "r2", "role-me");
    data = confirmDish(data, data.mealPlans[0].id, "r2");
    data = generateShoppingList(data, "2026-08-24", "2026-08-24", "today");
    const list = data.shoppingLists[0];
    list.items[0].purchased = true;
    data = stockPurchased(data, list.id);
    const first = data.stock.reduce((n, s) => n + s.quantity, 0);
    data = stockPurchased(data, list.id);
    expect(data.stock.reduce((n, s) => n + s.quantity, 0)).toBe(first);
    expect(data.shoppingLists[0].items[0].stocked).toBe(true);
  });
  it("round-trips a complete backup", () => {
    const restored = importData(exportData(initialData));
    expect(restored.recipes.map((r) => r.id)).toEqual(
      initialData.recipes.map((r) => r.id),
    );
    expect(restored.version).toBe(1);
  });
});
