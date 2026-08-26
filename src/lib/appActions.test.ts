import { describe, expect, it } from "vitest";
import {
  addCategory,
  addRole,
  completeDish,
  deleteCategory,
  deleteRecipe,
  importData,
  orderDish,
  saveRecipe,
  toggleVote,
  updateHistoryPhoto,
  updateCategory,
} from "./appActions";
import { initialData } from "../data/seed";
import type { AppData } from "../types";

describe("roles and recipes", () => {
  it("adds roles and validates blank names", () => {
    expect(addRole(initialData, "家人").roles).toHaveLength(2);
    expect(() => addRole(initialData, " ")).toThrow();
  });
  it("creates and deletes custom recipes", () => {
    const next = saveRecipe(initialData, {
      name: "青菜",
      category: "home",
      description: "",
      servings: 2,
      ingredients: [{ name: "青菜", quantity: 300, unit: "g" }],
      steps: ["炒熟"],
    });
    expect(next.recipes).toHaveLength(5);
    expect(deleteRecipe(next, next.recipes[4].id).recipes).toHaveLength(4);
  });
});
describe("custom recipe categories", () => {
  it("provides the six requested default categories", () => {
    expect(initialData.categories.map((item) => item.name)).toEqual([
      "肉类",
      "青菜",
      "减脂",
      "凉菜",
      "汤",
      "甜品",
    ]);
  });
  it("adds and renames a category while rejecting duplicate names", () => {
    let data = addCategory(initialData, "主食");
    const added = data.categories.at(-1)!;
    data = updateCategory(data, { ...added, name: "面食" });
    expect(data.categories.at(-1)?.name).toBe("面食");
    expect(() => addCategory(data, "肉类")).toThrow("Category already exists");
  });
  it("moves recipes safely when their category is deleted", () => {
    const data = deleteCategory(initialData, "meat");
    expect(data.categories.some((item) => item.id === "meat")).toBe(false);
    expect(data.recipes.find((recipe) => recipe.id === "r2")?.category).toBe(
      data.categories[0].id,
    );
  });
});
describe("menu safety rules", () => {
  it("merges same dish orders and one vote per role", () => {
    let data = addRole(initialData, "家人");
    data = orderDish(data, "2026-08-24", "dinner", "r2", "role-me");
    data = orderDish(data, "2026-08-24", "dinner", "r2", data.roles[1].id);
    expect(data.mealPlans[0].dishes).toHaveLength(1);
    expect(data.mealPlans[0].dishes[0].orderedBy).toHaveLength(2);
    data = toggleVote(data, data.mealPlans[0].id, "r2", "role-me");
    data = toggleVote(data, data.mealPlans[0].id, "r2", "role-me");
    expect(data.mealPlans[0].dishes[0].votes).toHaveLength(0);
  });
  it("never double-decrements completed dishes", () => {
    let data: AppData = {
      ...initialData,
      stock: [
        {
          id: "s1",
          name: "番茄",
          quantity: 5,
          unit: "piece",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "s2",
          name: "鸡蛋",
          quantity: 8,
          unit: "piece",
          createdAt: "",
          updatedAt: "",
        },
      ],
    };
    data = orderDish(data, "2026-08-24", "dinner", "r2", "role-me");
    const pid = data.mealPlans[0].id;
    data = completeDish(data, pid, "r2");
    expect(data.stock.find((s) => s.name === "鸡蛋")?.quantity).toBe(4);
    data = completeDish(data, pid, "r2");
    expect(data.stock.find((s) => s.name === "鸡蛋")?.quantity).toBe(4);
  });
  it("does not block completion when existing inventory is insufficient", () => {
    let data: AppData = {
      ...initialData,
      stock: [
        {
          id: "s1",
          name: "番茄",
          quantity: 1,
          unit: "piece",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "s2",
          name: "鸡蛋",
          quantity: 1,
          unit: "piece",
          createdAt: "",
          updatedAt: "",
        },
      ],
    };
    data = orderDish(data, "2026-08-24", "dinner", "r2", "role-me");

    expect(() => {
      data = completeDish(data, data.mealPlans[0].id, "r2");
    }).not.toThrow();
    expect(data.mealPlans[0].dishes[0].completed).toBe(true);
    expect(data.stock.every((item) => item.quantity === 0)).toBe(true);
  });
  it("updates only the selected history photo and validates image data", () => {
    const data: AppData = {
      ...initialData,
      history: [
        {
          id: "history-one",
          date: "2026-08-25",
          meal: "dinner",
          diners: 2,
          dishes: [],
        },
        {
          id: "history-two",
          date: "2026-08-24",
          meal: "lunch",
          diners: 1,
          dishes: [],
        },
      ],
    };
    const next = updateHistoryPhoto(
      data,
      "history-one",
      "data:image/png;base64,AAAA",
    );
    expect(next.history[0].image).toBe("data:image/png;base64,AAAA");
    expect(next.history[1].image).toBeUndefined();
    expect(() =>
      updateHistoryPhoto(data, "history-one", "data:text/plain;base64,AAAA"),
    ).toThrow("INVALID_IMAGE");
  });
  it("rejects invalid backups", () =>
    expect(() => importData('{"hello":1}')).toThrow("INVALID_BACKUP"));
});
