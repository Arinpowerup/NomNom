import type { AppData, DishCategory, Recipe } from "../types";

const now = new Date().toISOString();
export const seedCategories: DishCategory[] = [
  { id: "meat", name: "肉类", nameEn: "Meat", createdAt: now },
  { id: "vegetable", name: "青菜", nameEn: "Vegetables", createdAt: now },
  { id: "diet", name: "减脂", nameEn: "Light", createdAt: now },
  { id: "cold", name: "凉菜", nameEn: "Cold Dishes", createdAt: now },
  { id: "soup", name: "汤", nameEn: "Soup", createdAt: now },
  { id: "dessert", name: "甜品", nameEn: "Desserts", createdAt: now },
];
export const seedRecipes: Recipe[] = [
  {
    id: "r1",
    name: "柠香鸡胸沙拉",
    nameEn: "Lemon Chicken Salad",
    category: "diet",
    description: "清爽高蛋白，适合轻食晚餐。",
    descriptionEn: "A fresh, high-protein light meal.",
    servings: 2,
    ingredients: [
      { name: "鸡胸肉", quantity: 300, unit: "g" },
      { name: "生菜", quantity: 200, unit: "g" },
      { name: "柠檬", quantity: 1, unit: "piece" },
    ],
    steps: ["鸡胸肉腌制十分钟。", "平底锅煎熟后切片。", "与生菜和柠檬汁拌匀。"],
    stepsEn: [
      "Marinate the chicken for 10 minutes.",
      "Pan-fry and slice.",
      "Toss with lettuce and lemon juice.",
    ],
    builtIn: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "r2",
    name: "番茄炒蛋",
    nameEn: "Tomato Scrambled Eggs",
    category: "meat",
    description: "酸甜下饭的家常菜。",
    descriptionEn: "A sweet and tangy family classic.",
    servings: 2,
    ingredients: [
      { name: "番茄", quantity: 3, unit: "piece" },
      { name: "鸡蛋", quantity: 4, unit: "piece" },
    ],
    steps: [
      "番茄切块，鸡蛋打散。",
      "鸡蛋炒至凝固后盛出。",
      "炒软番茄，倒回鸡蛋调味。",
    ],
    stepsEn: [
      "Cut tomatoes and beat eggs.",
      "Cook eggs until just set.",
      "Soften tomatoes, return eggs and season.",
    ],
    builtIn: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "r3",
    name: "菌菇鸡汤锅",
    nameEn: "Mushroom Chicken Hotpot",
    category: "soup",
    description: "暖胃鲜香的家庭汤锅。",
    descriptionEn: "A warming, savory family hotpot.",
    servings: 4,
    ingredients: [
      { name: "鸡肉", quantity: 800, unit: "g" },
      { name: "香菇", quantity: 200, unit: "g" },
      { name: "清水", quantity: 2, unit: "l" },
    ],
    steps: [
      "鸡肉焯水。",
      "鸡肉与清水炖煮四十分钟。",
      "加入香菇继续煮十五分钟。",
    ],
    stepsEn: [
      "Blanch the chicken.",
      "Simmer with water for 40 minutes.",
      "Add mushrooms and cook 15 minutes.",
    ],
    builtIn: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "r4",
    name: "牛奶小餐包",
    nameEn: "Milk Dinner Rolls",
    category: "dessert",
    description: "柔软香甜的早餐面包。",
    descriptionEn: "Soft and lightly sweet breakfast rolls.",
    servings: 4,
    ingredients: [
      { name: "高筋面粉", quantity: 300, unit: "g" },
      { name: "牛奶", quantity: 180, unit: "ml" },
      { name: "酵母", quantity: 4, unit: "g" },
    ],
    steps: [
      "所有材料揉成光滑面团。",
      "发酵至两倍大后分割整形。",
      "二次发酵后以180度烤18分钟。",
    ],
    stepsEn: [
      "Knead into a smooth dough.",
      "Proof until doubled, divide and shape.",
      "Proof again and bake at 180°C for 18 minutes.",
    ],
    builtIn: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const initialData: AppData = {
  version: 1,
  preferences: {
    theme: "snoopy",
    appName: "NomNom",
    enabledMeals: ["lunch", "dinner"],
    fontScale: 1,
  },
  categories: seedCategories,
  roles: [{ id: "role-me", name: "我", color: "#e66b45", createdAt: now }],
  recipes: seedRecipes,
  mealPlans: [],
  stock: [],
  shoppingLists: [],
  history: [],
};
