import type {
  AppData,
  DishCategory,
  MealPlan,
  Recipe,
  Role,
  ShoppingList,
  StockItem,
} from "../types";
import {
  calculateShoppingItems,
  mergeIngredients,
  scaleIngredients,
} from "./calculations";

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const iso = () => new Date().toISOString();

export function addCategory(data: AppData, name: string): AppData {
  const clean = name.trim();
  if (!clean) throw new Error("Category name is required");
  if (
    data.categories.some(
      (item) => item.name.toLowerCase() === clean.toLowerCase(),
    )
  )
    throw new Error("Category already exists");
  return {
    ...data,
    categories: [
      ...data.categories,
      { id: id("category"), name: clean, createdAt: iso() },
    ],
  };
}

export function updateCategory(data: AppData, category: DishCategory): AppData {
  if (!category.name.trim()) throw new Error("Category name is required");
  return {
    ...data,
    categories: data.categories.map((item) =>
      item.id === category.id
        ? { ...category, name: category.name.trim() }
        : item,
    ),
  };
}

export function deleteCategory(data: AppData, categoryId: string): AppData {
  if (data.categories.length <= 1)
    throw new Error("At least one category is required");
  const categories = data.categories.filter((item) => item.id !== categoryId);
  return {
    ...data,
    categories,
    recipes: data.recipes.map((recipe) =>
      recipe.category === categoryId
        ? { ...recipe, category: categories[0].id, updatedAt: iso() }
        : recipe,
    ),
  };
}

export function addRole(
  data: AppData,
  name: string,
  color = "#e66b45",
): AppData {
  if (!name.trim()) throw new Error("Role name is required");
  return {
    ...data,
    roles: [
      ...data.roles,
      { id: id("role"), name: name.trim(), color, createdAt: iso() },
    ],
  };
}
export function updateRole(data: AppData, role: Role): AppData {
  return {
    ...data,
    roles: data.roles.map((r) => (r.id === role.id ? role : r)),
  };
}
export function deleteRole(data: AppData, roleId: string): AppData {
  return { ...data, roles: data.roles.filter((r) => r.id !== roleId) };
}
export function saveRecipe(
  data: AppData,
  recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt"> & { id?: string },
): AppData {
  if (!recipe.name.trim() || recipe.servings <= 0 || !recipe.ingredients.length)
    throw new Error("Invalid recipe");
  const old = recipe.id
    ? data.recipes.find((r) => r.id === recipe.id)
    : undefined;
  const next: Recipe = {
    ...recipe,
    id: recipe.id ?? id("recipe"),
    createdAt: old?.createdAt ?? iso(),
    updatedAt: iso(),
  };
  return {
    ...data,
    recipes: old
      ? data.recipes.map((r) => (r.id === next.id ? next : r))
      : [...data.recipes, next],
  };
}
export function deleteRecipe(data: AppData, recipeId: string): AppData {
  return { ...data, recipes: data.recipes.filter((r) => r.id !== recipeId) };
}
export function getOrCreatePlan(
  data: AppData,
  date: string,
  meal: MealPlan["meal"],
): MealPlan {
  return (
    data.mealPlans.find((p) => p.date === date && p.meal === meal) ?? {
      id: id("meal"),
      date,
      meal,
      diners: 2,
      dishes: [],
      confirmed: false,
    }
  );
}
export function updatePlan(data: AppData, plan: MealPlan): AppData {
  const exists = data.mealPlans.some((p) => p.id === plan.id);
  return {
    ...data,
    mealPlans: exists
      ? data.mealPlans.map((p) => (p.id === plan.id ? plan : p))
      : [...data.mealPlans, plan],
  };
}
export function orderDish(
  data: AppData,
  date: string,
  meal: MealPlan["meal"],
  recipeId: string,
  roleId: string,
): AppData {
  const plan = getOrCreatePlan(data, date, meal);
  const dish = plan.dishes.find((d) => d.recipeId === recipeId);
  const dishes = dish
    ? plan.dishes.map((d) =>
        d.recipeId === recipeId
          ? {
              ...d,
              orderedBy: d.orderedBy.includes(roleId)
                ? d.orderedBy
                : [...d.orderedBy, roleId],
            }
          : d,
      )
    : [
        ...plan.dishes,
        {
          recipeId,
          orderedBy: [roleId],
          votes: [],
          confirmed: false,
          completed: false,
        },
      ];
  return updatePlan(data, { ...plan, dishes });
}
export function toggleVote(
  data: AppData,
  planId: string,
  recipeId: string,
  roleId: string,
): AppData {
  const plan = data.mealPlans.find((p) => p.id === planId);
  if (!plan) return data;
  return updatePlan(data, {
    ...plan,
    dishes: plan.dishes.map((d) =>
      d.recipeId === recipeId
        ? {
            ...d,
            votes: d.votes.includes(roleId)
              ? d.votes.filter((v) => v !== roleId)
              : [...d.votes, roleId],
          }
        : d,
    ),
  });
}
export function confirmDish(
  data: AppData,
  planId: string,
  recipeId: string,
): AppData {
  const plan = data.mealPlans.find((p) => p.id === planId);
  if (!plan) return data;
  return updatePlan(data, {
    ...plan,
    confirmed: true,
    dishes: plan.dishes.map((d) =>
      d.recipeId === recipeId ? { ...d, confirmed: true } : d,
    ),
  });
}
export function completeDish(
  data: AppData,
  planId: string,
  recipeId: string,
): AppData {
  const plan = data.mealPlans.find((p) => p.id === planId);
  const dish = plan?.dishes.find((d) => d.recipeId === recipeId);
  const recipe = data.recipes.find((r) => r.id === recipeId);
  if (!plan || !dish || !recipe || dish.completed) return data;
  const required = scaleIngredients(recipe, plan.diners);
  const stock = data.stock.map((s) => ({ ...s }));
  for (const item of required) {
    const found = stock.find(
      (s) =>
        s.name.toLowerCase() === item.name.toLowerCase() &&
        s.unit === item.unit,
    );
    if (!found || found.quantity < item.quantity)
      throw new Error(`INSUFFICIENT:${item.name}`);
    found.quantity -= item.quantity;
    found.updatedAt = iso();
  }
  const next = updatePlan(
    { ...data, stock },
    {
      ...plan,
      dishes: plan.dishes.map((d) =>
        d.recipeId === recipeId
          ? { ...d, completed: true, completedAt: iso() }
          : d,
      ),
    },
  );
  const historyDish = {
    name: recipe.name,
    orderedBy: dish.orderedBy.map(
      (rid) => data.roles.find((r) => r.id === rid)?.name ?? "已删除角色",
    ),
    votes: dish.votes.map(
      (rid) => data.roles.find((r) => r.id === rid)?.name ?? "已删除角色",
    ),
    completed: true,
  };
  const existing = next.history.find(
    (h) => h.date === plan.date && h.meal === plan.meal,
  );
  return {
    ...next,
    history: existing
      ? next.history.map((h) =>
          h.id === existing.id
            ? {
                ...h,
                dishes: [
                  ...h.dishes.filter((d) => d.name !== recipe.name),
                  historyDish,
                ],
              }
            : h,
        )
      : [
          ...next.history,
          {
            id: id("history"),
            date: plan.date,
            meal: plan.meal,
            diners: plan.diners,
            dishes: [historyDish],
          },
        ],
  };
}
export function updateHistoryPhoto(
  data: AppData,
  historyId: string,
  image: string,
): AppData {
  if (!image.startsWith("data:image/")) throw new Error("INVALID_IMAGE");
  return {
    ...data,
    history: data.history.map((entry) =>
      entry.id === historyId ? { ...entry, image } : entry,
    ),
  };
}

export function addStock(
  data: AppData,
  item: Pick<StockItem, "name" | "quantity" | "unit">,
): AppData {
  const found = data.stock.find(
    (s) =>
      s.name.toLowerCase() === item.name.trim().toLowerCase() &&
      s.unit === item.unit,
  );
  return found
    ? {
        ...data,
        stock: data.stock.map((s) =>
          s.id === found.id
            ? { ...s, quantity: s.quantity + item.quantity, updatedAt: iso() }
            : s,
        ),
      }
    : {
        ...data,
        stock: [
          ...data.stock,
          {
            ...item,
            name: item.name.trim(),
            id: id("stock"),
            createdAt: iso(),
            updatedAt: iso(),
          },
        ],
      };
}
export function generateShoppingList(
  data: AppData,
  from: string,
  to: string,
  name: string,
): AppData {
  const plans = data.mealPlans.filter((p) => p.date >= from && p.date <= to);
  const list: ShoppingList = {
    id: id("list"),
    name,
    from,
    to,
    items: calculateShoppingItems(plans, data.recipes, data.stock),
    createdAt: iso(),
    updatedAt: iso(),
  };
  return { ...data, shoppingLists: [...data.shoppingLists, list] };
}
export function stockPurchased(data: AppData, listId: string): AppData {
  let next = data;
  const list = data.shoppingLists.find((l) => l.id === listId);
  if (!list) return data;
  for (const item of list.items.filter((i) => i.purchased && !i.stocked))
    next = addStock(next, {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  return {
    ...next,
    shoppingLists: next.shoppingLists.map((l) =>
      l.id === listId
        ? {
            ...l,
            items: l.items.map((i) =>
              i.purchased && !i.stocked ? { ...i, stocked: true } : i,
            ),
            updatedAt: iso(),
          }
        : l,
    ),
  };
}
export function recommend(recipes: Recipe[], stock: StockItem[], diners = 2) {
  return recipes
    .map((recipe) => {
      const needs = scaleIngredients(recipe, diners);
      const missing = needs.flatMap((i) => {
        const have = stock
          .filter(
            (s) =>
              s.name.toLowerCase() === i.name.toLowerCase() &&
              s.unit === i.unit,
          )
          .reduce((a, b) => a + b.quantity, 0);
        return have >= i.quantity
          ? []
          : [{ ...i, quantity: i.quantity - have }];
      });
      return { recipe, missing };
    })
    .filter((x) => x.missing.length <= 2);
}
export function exportData(data: AppData) {
  return JSON.stringify({
    format: "nomnom-backup",
    exportedAt: iso(),
    data,
  });
}
export function importData(raw: string): AppData {
  const parsed = JSON.parse(raw);
  if (
    !["nomnom-backup", "family-menu-backup"].includes(parsed.format) ||
    parsed.data?.version !== 1 ||
    !Array.isArray(parsed.data.recipes)
  )
    throw new Error("INVALID_BACKUP");
  return parsed.data;
}
