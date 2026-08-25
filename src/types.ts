export type Language = "zh" | "en";
export type MealType = "breakfast" | "lunch" | "dinner";
export type Unit =
  "g" | "kg" | "ml" | "l" | "piece" | "grain" | "slice" | "pack" | "box";
export type Category = string;
export type AppTheme = "warm" | "glass" | "custom";

export interface Role {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  createdAt: string;
}
export interface DishCategory {
  id: string;
  name: string;
  nameEn?: string;
  createdAt: string;
}
export interface Ingredient {
  name: string;
  quantity: number;
  unit: Unit;
}
export interface Recipe {
  id: string;
  name: string;
  nameEn?: string;
  category: Category;
  description: string;
  descriptionEn?: string;
  image?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  stepsEn?: string[];
  builtIn?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface MenuDish {
  recipeId: string;
  orderedBy: string[];
  votes: string[];
  confirmed: boolean;
  completed: boolean;
  completedAt?: string;
}
export interface MealPlan {
  id: string;
  date: string;
  meal: MealType;
  diners: number;
  dishes: MenuDish[];
  confirmed: boolean;
}
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
}
export interface ShoppingItem {
  id: string;
  name: string;
  unit: Unit;
  required: number;
  inStock: number;
  quantity: number;
  source: "calculated" | "recommendation" | "manual";
  purchased: boolean;
  stocked: boolean;
}
export interface ShoppingList {
  id: string;
  name: string;
  from: string;
  to: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}
export interface HistoryEntry {
  id: string;
  date: string;
  meal: MealType;
  diners: number;
  dishes: Array<{
    name: string;
    orderedBy: string[];
    votes: string[];
    completed: boolean;
  }>;
}
export interface AppData {
  version: 1;
  preferences: {
    theme: AppTheme;
    customBackground?: string;
  };
  categories: DishCategory[];
  roles: Role[];
  recipes: Recipe[];
  mealPlans: MealPlan[];
  stock: StockItem[];
  shoppingLists: ShoppingList[];
  history: HistoryEntry[];
}
