import type {
  Ingredient,
  MealPlan,
  Recipe,
  ShoppingItem,
  StockItem,
} from "../types";

export const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function scaleIngredients(recipe: Recipe, diners: number): Ingredient[] {
  const ratio = diners / recipe.servings;
  return recipe.ingredients.map((item) => ({
    ...item,
    quantity: round(item.quantity * ratio),
  }));
}

export function mergeIngredients(items: Ingredient[]): Ingredient[] {
  return [
    ...items
      .reduce((map, item) => {
        const key = `${item.name.trim().toLocaleLowerCase()}|${item.unit}`;
        const old = map.get(key);
        map.set(
          key,
          old
            ? { ...old, quantity: round(old.quantity + item.quantity) }
            : { ...item, name: item.name.trim() },
        );
        return map;
      }, new Map<string, Ingredient>())
      .values(),
  ];
}

export function calculateShoppingItems(
  plans: MealPlan[],
  recipes: Recipe[],
  stock: StockItem[],
): ShoppingItem[] {
  const ingredients = plans.flatMap((plan) =>
    plan.dishes
      .filter((d) => d.confirmed)
      .flatMap((dish) => {
        const recipe = recipes.find((r) => r.id === dish.recipeId);
        return recipe ? scaleIngredients(recipe, plan.diners) : [];
      }),
  );
  return mergeIngredients(ingredients).map((item, index) => {
    const available = stock
      .filter(
        (s) =>
          s.name.trim().toLocaleLowerCase() === item.name.toLocaleLowerCase() &&
          s.unit === item.unit,
      )
      .reduce((sum, s) => sum + s.quantity, 0);
    return {
      id: `shopping-${Date.now()}-${index}`,
      name: item.name,
      unit: item.unit,
      required: item.quantity,
      inStock: round(available),
      quantity: round(Math.max(0, item.quantity - available)),
      source: "calculated",
      purchased: false,
      stocked: false,
    };
  });
}

export function missingForRecipe(
  recipe: Recipe,
  diners: number,
  stock: StockItem[],
): Ingredient[] {
  return scaleIngredients(recipe, diners).flatMap((item) => {
    const have = stock
      .filter(
        (s) =>
          s.name.trim().toLocaleLowerCase() ===
            item.name.trim().toLocaleLowerCase() && s.unit === item.unit,
      )
      .reduce((sum, s) => sum + s.quantity, 0);
    return have >= item.quantity
      ? []
      : [{ ...item, quantity: round(item.quantity - have) }];
  });
}
