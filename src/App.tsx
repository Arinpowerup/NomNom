import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChefHat,
  Clock3,
  Download,
  History,
  Home,
  Languages,
  Menu,
  PackageCheck,
  Plus,
  Refrigerator,
  Search,
  Settings,
  ShoppingBasket,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useApp } from "./context/AppContext";
import {
  addCategory,
  addRole,
  addStock,
  completeDish,
  confirmDish,
  deleteCategory,
  deleteRecipe,
  deleteRole,
  exportData,
  generateShoppingList,
  getOrCreatePlan,
  importData,
  orderDish,
  recommend,
  saveRecipe,
  stockPurchased,
  toggleVote,
  updateCategory,
  updatePlan,
  updateRole,
} from "./lib/appActions";
import { missingForRecipe } from "./lib/calculations";
import { labels, t } from "./i18n";
import type {
  Category,
  Ingredient,
  MealPlan,
  MealType,
  Recipe,
  ShoppingList,
  Unit,
} from "./types";

type Page =
  "home" | "week" | "recipes" | "fridge" | "shopping" | "history" | "settings";
const nav: [Page, typeof Home][] = [
  ["home", Home],
  ["week", CalendarDays],
  ["recipes", ChefHat],
  ["fridge", Refrigerator],
  ["shopping", ShoppingBasket],
  ["history", History],
];
const meals: MealType[] = ["breakfast", "lunch", "dinner"];
const units: Unit[] = [
  "g",
  "kg",
  "ml",
  "l",
  "piece",
  "grain",
  "slice",
  "pack",
  "box",
];
const localDate = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d);
};
const mondayOf = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay() || 7;
  return addDays(date, 1 - day);
};

export default function App() {
  const ctx = useApp();
  const [page, setPage] = useState<Page>("home");
  const [mobile, setMobile] = useState(false);
  if (!ctx.data)
    return (
      <div className="loading">
        <ChefHat /> 正在准备厨房…
      </div>
    );
  const L = labels[ctx.language];
  return (
    <div className="app-shell">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">
            <ChefHat />
          </span>
          <div>
            <strong>灶边</strong>
            <small>家庭点单</small>
          </div>
        </div>
        <nav>
          {nav.map(([key, Icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => {
                setPage(key);
                setMobile(false);
              }}
            >
              <Icon />
              {L[key]}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span>本地保存</span>
          <small>数据只留在这台电脑</small>
        </div>
      </aside>
      <main>
        <header>
          <button
            className="icon mobile-menu"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div>
            <p className="eyebrow">
              {new Intl.DateTimeFormat(
                ctx.language === "zh" ? "zh-CN" : "en-AU",
                { weekday: "long", month: "long", day: "numeric" },
              ).format(new Date())}
            </p>
            <h1>{L[page]}</h1>
          </div>
          <div className="header-actions">
            <button
              className="language"
              onClick={() =>
                ctx.setLanguage(ctx.language === "zh" ? "en" : "zh")
              }
            >
              <Languages />
              {ctx.language === "zh" ? "简体中文" : "English"}
            </button>
            <select
              aria-label="current role"
              value={ctx.currentRoleId}
              onChange={(e) => ctx.setCurrentRoleId(e.target.value)}
            >
              {ctx.data.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button className="icon" onClick={() => setPage("settings")}>
              <Settings />
            </button>
          </div>
        </header>
        <div className="content">
          {page === "home" && <HomePage />}
          {page === "week" && <WeekPage />}
          {page === "recipes" && <RecipesPage />}
          {page === "fridge" && <FridgePage />}
          {page === "shopping" && <ShoppingPage />}
          {page === "history" && <HistoryPage />}
          {page === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

function HomePage() {
  const { data, setData, language, currentRoleId } = useApp();
  const [meal, setMeal] = useState<MealType>(() =>
    new Date().getHours() < 11
      ? "breakfast"
      : new Date().getHours() < 16
        ? "lunch"
        : "dinner",
  );
  const date = localDate();
  const plan = getOrCreatePlan(data!, date, meal);
  const L = labels[language];
  const ordered = plan.dishes
    .map((d) => data!.recipes.find((r) => r.id === d.recipeId))
    .filter(Boolean) as Recipe[];
  const ready = recommend(data!.recipes, data!.stock, 2)
    .filter((x) => x.missing.length === 0)
    .slice(0, 2);
  return (
    <>
      <section className="hero">
        <div>
          <span className="pill">
            <Clock3 /> {L.today}
          </span>
          <h2>
            {language === "zh"
              ? "今晚想吃点什么？"
              : "What should we cook today?"}
          </h2>
          <p>
            {language === "zh"
              ? "一起点菜、投票，然后把想吃的变成今晚的菜单。"
              : "Pick, vote, and turn family favourites into today’s menu."}
          </p>
        </div>
        <div className="hero-art">🍲</div>
      </section>
      <div className="meal-tabs">
        {meals.map((m) => (
          <button
            className={meal === m ? "active" : ""}
            key={m}
            onClick={() => setMeal(m)}
          >
            {L[m]}
            <small>
              {data!.mealPlans.find((p) => p.date === date && p.meal === m)
                ?.dishes.length ?? 0}{" "}
              {language === "zh" ? "道菜" : "dishes"}
            </small>
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">{L[meal]}</p>
            <h3>{language === "zh" ? "这一餐的安排" : "Meal plan"}</h3>
          </div>
          <label className="diners">
            <Users />
            {L.diners}
            <input
              type="number"
              min="1"
              value={plan.diners}
              onChange={(e) =>
                setData(
                  updatePlan(data!, {
                    ...plan,
                    diners: Math.max(1, +e.target.value),
                  }),
                )
              }
            />
          </label>
        </div>
        {!ordered.length ? (
          <Empty
            text={
              language === "zh"
                ? "还没有人点菜，去菜谱挑一道吧。"
                : "No picks yet. Choose something from Recipes."
            }
          />
        ) : (
          <div className="dish-list">
            {plan.dishes.map((d) => {
              const r = data!.recipes.find((x) => x.id === d.recipeId)!;
              return <DishRow key={r.id} plan={plan} recipe={r} dish={d} />;
            })}
          </div>
        )}
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-head">
            <h3>{L.ready}</h3>
            <span className="count">{ready.length}</span>
          </div>
          {ready.length ? (
            ready.map((x) => <MiniRecipe key={x.recipe.id} recipe={x.recipe} />)
          ) : (
            <Empty
              text={
                language === "zh"
                  ? "补充冰箱食材后会出现推荐"
                  : "Add fridge items to see suggestions"
              }
            />
          )}
        </section>
        <section className="panel warm">
          <div className="section-head">
            <h3>{language === "zh" ? "本周一览" : "This week"}</h3>
            <CalendarDays />
          </div>
          <strong className="big-number">
            {data!.mealPlans
              .filter(
                (p) =>
                  p.date >= mondayOf(date) &&
                  p.date <= addDays(mondayOf(date), 6),
              )
              .reduce(
                (n, p) => n + p.dishes.filter((d) => d.confirmed).length,
                0,
              )}
          </strong>
          <p>
            {language === "zh"
              ? "道已确认菜品，提前安排，吃饭更从容。"
              : "confirmed dishes. Plan ahead and cook with ease."}
          </p>
        </section>
      </div>
    </>
  );
}

function DishRow({
  plan,
  recipe,
  dish,
}: {
  plan: MealPlan;
  recipe: Recipe;
  dish: MealPlan["dishes"][number];
}) {
  const { data, setData, currentRoleId, language } = useApp();
  const L = labels[language];
  const names = (ids: string[]) =>
    ids
      .map((id) => data!.roles.find((r) => r.id === id)?.name ?? "—")
      .join("、");
  const finish = () => {
    try {
      setData(completeDish(data!, plan.id, recipe.id));
    } catch (e) {
      alert(
        language === "zh"
          ? `库存不足：${String(e).split(":").pop()}`
          : `Insufficient stock: ${String(e).split(":").pop()}`,
      );
    }
  };
  return (
    <article className="dish-row">
      <RecipeImage recipe={recipe} />
      <div className="grow">
        <h4>
          {language === "en" && recipe.nameEn ? recipe.nameEn : recipe.name}
        </h4>
        <p>
          {language === "zh" ? "点菜：" : "Picked by: "}
          {names(dish.orderedBy)} · {dish.votes.length}{" "}
          {language === "zh" ? "票" : "votes"}
        </p>
      </div>
      <div className="row-actions">
        <button
          className={
            dish.votes.includes(currentRoleId) ? "soft selected" : "soft"
          }
          onClick={() =>
            setData(toggleVote(data!, plan.id, recipe.id, currentRoleId))
          }
        >
          {dish.votes.includes(currentRoleId) ? L.voted : L.vote}
        </button>
        {!dish.confirmed && (
          <button
            onClick={() => setData(confirmDish(data!, plan.id, recipe.id))}
          >
            {L.confirm}
          </button>
        )}
        {dish.confirmed && !dish.completed && (
          <button onClick={finish}>{L.complete}</button>
        )}
        {dish.completed && <span className="done">✓ {L.done}</span>}
      </div>
    </article>
  );
}

function WeekPage() {
  const { data, setData, language, currentRoleId } = useApp();
  const [anchor, setAnchor] = useState(localDate());
  const [start, setStart] = useState(mondayOf(anchor));
  const [selected, setSelected] = useState<{
    date: string;
    meal: MealType;
  } | null>(null);
  const L = labels[language];
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const shift = (n: number) => {
    const x = addDays(start, n * 7);
    setStart(x);
    setAnchor(x);
  };
  return (
    <>
      <div className="week-toolbar">
        <button className="soft" onClick={() => shift(-1)}>
          ←
        </button>
        <button
          className="soft"
          onClick={() => {
            const x = mondayOf(localDate());
            setStart(x);
            setAnchor(x);
          }}
        >
          {L.today}
        </button>
        <strong>
          {start} — {addDays(start, 6)}
        </strong>
        <button className="soft" onClick={() => shift(1)}>
          →
        </button>
      </div>
      <div className="week-board">
        {days.map((date) => (
          <div
            className={date === localDate() ? "day today" : "day"}
            key={date}
          >
            <div className="day-head">
              <strong>
                {new Intl.DateTimeFormat(
                  language === "zh" ? "zh-CN" : "en-AU",
                  { weekday: "short" },
                ).format(new Date(date + "T12:00:00"))}
              </strong>
              <span>{date.slice(5)}</span>
            </div>
            {meals.map((meal) => {
              const p = data!.mealPlans.find(
                (x) => x.date === date && x.meal === meal,
              );
              return (
                <button
                  className="meal-card"
                  key={meal}
                  onClick={() => setSelected({ date, meal })}
                >
                  <small>
                    {L[meal]} · {p?.diners ?? 2}
                    {language === "zh" ? "人" : ""}
                  </small>
                  {p?.dishes.length ? (
                    p.dishes
                      .slice(0, 2)
                      .map((d) => (
                        <span key={d.recipeId}>
                          {data!.recipes.find((r) => r.id === d.recipeId)?.name}
                        </span>
                      ))
                  ) : (
                    <em>＋ {language === "zh" ? "添加菜单" : "Add menu"}</em>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {selected && (
        <MealDrawer
          date={selected.date}
          meal={selected.meal}
          close={() => setSelected(null)}
        />
      )}
    </>
  );
}

function MealDrawer({
  date,
  meal,
  close,
}: {
  date: string;
  meal: MealType;
  close: () => void;
}) {
  const { data, setData, language, currentRoleId } = useApp();
  const L = labels[language];
  const plan = getOrCreatePlan(data!, date, meal);
  const [search, setSearch] = useState("");
  const choices = data!.recipes.filter(
    (r) =>
      r.name.includes(search) ||
      (r.nameEn ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const copyTomorrow = () => {
    const target = getOrCreatePlan(data!, addDays(date, 1), meal);
    setData(
      updatePlan(data!, {
        ...target,
        diners: plan.diners,
        dishes: plan.dishes.map((d) => ({
          ...d,
          orderedBy: [...d.orderedBy],
          votes: [...d.votes],
          completed: false,
          completedAt: undefined,
        })),
      }),
    );
    alert(
      language === "zh"
        ? "已复制到明天同一餐次"
        : "Copied to the same meal tomorrow",
    );
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside className="drawer">
        <div className="section-head">
          <div>
            <p className="eyebrow">{date}</p>
            <h2>{L[meal]}</h2>
          </div>
          <button className="icon" onClick={close}>
            <X />
          </button>
        </div>
        <div className="drawer-controls">
          <label>
            {L.diners}
            <input
              type="number"
              min="1"
              value={plan.diners}
              onChange={(e) =>
                setData(
                  updatePlan(data!, {
                    ...plan,
                    diners: Math.max(1, +e.target.value),
                  }),
                )
              }
            />
          </label>
          {plan.dishes.length > 0 && (
            <button className="soft" onClick={copyTomorrow}>
              {language === "zh" ? "复制到明天" : "Copy to tomorrow"}
            </button>
          )}
        </div>
        <h3>{L.candidates}</h3>
        {plan.dishes.map((d) => (
          <DishRow
            key={d.recipeId}
            plan={plan}
            dish={d}
            recipe={data!.recipes.find((r) => r.id === d.recipeId)!}
          />
        ))}
        <div className="search">
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L.search}
          />
        </div>
        <div className="pick-grid">
          {choices.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                setData(orderDish(data!, date, meal, r.id, currentRoleId))
              }
            >
              <RecipeImage recipe={r} />
              <span>{language === "en" && r.nameEn ? r.nameEn : r.name}</span>
              <Plus />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function RecipesPage() {
  const { data, setData, language, currentRoleId } = useApp();
  const [cat, setCat] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Recipe | null | undefined>(undefined);
  const [managingCategories, setManagingCategories] = useState(false);
  const L = labels[language];
  const shown = data!.recipes.filter(
    (r) =>
      (cat === "all" || r.category === cat) &&
      `${r.name} ${r.nameEn ?? ""} ${r.ingredients.map((i) => i.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            aria-label="recipe search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L.search}
          />
        </div>
        <button onClick={() => setEditing(null)}>
          <Plus />
          {language === "zh" ? "新建菜谱" : "New recipe"}
        </button>
        <button className="soft" onClick={() => setManagingCategories(true)}>
          <Settings />
          {language === "zh" ? "管理分类" : "Manage categories"}
        </button>
      </div>
      <div className="filter-row">
        <button
          className={cat === "all" ? "active" : ""}
          onClick={() => setCat("all")}
        >
          {L.all}
        </button>
        {data!.categories.map((category) => (
          <button
            className={cat === category.id ? "active" : ""}
            key={category.id}
            onClick={() => setCat(category.id)}
          >
            {language === "en" && category.nameEn
              ? category.nameEn
              : category.name}
          </button>
        ))}
      </div>
      <div className="recipe-grid">
        {shown.map((r) => (
          <article className="recipe-card" key={r.id}>
            <RecipeImage recipe={r} />
            <div>
              <span className="category">
                {(() => {
                  const category = data!.categories.find(
                    (item) => item.id === r.category,
                  );
                  return language === "en" && category?.nameEn
                    ? category.nameEn
                    : (category?.name ?? r.category);
                })()}
              </span>
              <h3>{language === "en" && r.nameEn ? r.nameEn : r.name}</h3>
              <p>
                {language === "en" && r.descriptionEn
                  ? r.descriptionEn
                  : r.description}
              </p>
              <div className="meta">
                <span>
                  <Users />
                  {r.servings}
                </span>
                <span>
                  {r.ingredients.length}{" "}
                  {language === "zh" ? "种食材" : "ingredients"}
                </span>
              </div>
              <div className="card-actions">
                <button
                  onClick={() =>
                    setData(
                      orderDish(
                        data!,
                        localDate(),
                        "dinner",
                        r.id,
                        currentRoleId,
                      ),
                    )
                  }
                >
                  <Plus />
                  {language === "zh" ? "今晚想吃" : "Pick for tonight"}
                </button>
                <button className="soft" onClick={() => setEditing(r)}>
                  {language === "zh" ? "查看 / 编辑" : "View / Edit"}
                </button>
                {!r.builtIn && (
                  <button
                    className="danger icon"
                    onClick={() =>
                      confirm(
                        language === "zh" ? "确定删除？" : "Delete recipe?",
                      ) && setData(deleteRecipe(data!, r.id))
                    }
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {editing !== undefined && (
        <RecipeModal recipe={editing} close={() => setEditing(undefined)} />
      )}
      {managingCategories && (
        <CategoryManager close={() => setManagingCategories(false)} />
      )}
    </>
  );
}

function RecipeModal({
  recipe,
  close,
}: {
  recipe: Recipe | null;
  close: () => void;
}) {
  const { data, setData, language } = useApp();
  const L = labels[language];
  const [name, setName] = useState(recipe?.name ?? "");
  const [category, setCategory] = useState<Category>(
    recipe?.category ?? data!.categories[0]?.id ?? "meat",
  );
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [image, setImage] = useState(recipe?.image);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients ?? [{ name: "", quantity: 1, unit: "g" }],
  );
  const [steps, setSteps] = useState<string[]>(recipe?.steps ?? [""]);
  const readImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const submit = () => {
    try {
      setData(
        saveRecipe(data!, {
          id: recipe?.id,
          name,
          category,
          description,
          servings,
          image,
          ingredients: ingredients.filter(
            (i) => i.name.trim() && i.quantity > 0,
          ),
          steps: steps.filter(Boolean),
          builtIn: recipe?.builtIn,
          nameEn: recipe?.nameEn,
          descriptionEn: recipe?.descriptionEn,
          stepsEn: recipe?.stepsEn,
        }),
      );
      close();
    } catch {
      alert(
        language === "zh"
          ? "请填写菜名、份数和至少一种食材"
          : "Add a name, servings and at least one ingredient",
      );
    }
  };
  return (
    <div className="overlay">
      <div className="modal wide">
        <div className="section-head">
          <h2>
            {recipe
              ? language === "zh"
                ? "菜谱详情"
                : "Recipe details"
              : language === "zh"
                ? "新建菜谱"
                : "New recipe"}
          </h2>
          <button className="icon" onClick={close}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label>
            {language === "zh" ? "菜名" : "Name"}
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            {language === "zh" ? "分类" : "Category"}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {data!.categories.map((item) => (
                <option value={item.id} key={item.id}>
                  {language === "en" && item.nameEn ? item.nameEn : item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            {language === "zh" ? "简介" : "Description"}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            {language === "zh" ? "基准份数" : "Base servings"}
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(+e.target.value)}
            />
          </label>
          <label className="upload">
            {language === "zh" ? "菜品图片（可选）" : "Image (optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => readImage(e.target.files?.[0])}
            />
            <span>
              <Upload />{" "}
              {image
                ? language === "zh"
                  ? "更换图片"
                  : "Replace image"
                : language === "zh"
                  ? "选择图片"
                  : "Choose image"}
            </span>
          </label>
        </div>
        <h3>{language === "zh" ? "食材" : "Ingredients"}</h3>
        {ingredients.map((item, i) => (
          <div className="ingredient-row" key={i}>
            <input
              placeholder={language === "zh" ? "食材名称" : "Ingredient"}
              value={item.name}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((x, n) =>
                    n === i ? { ...x, name: e.target.value } : x,
                  ),
                )
              }
            />
            <input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((x, n) =>
                    n === i ? { ...x, quantity: +e.target.value } : x,
                  ),
                )
              }
            />
            <select
              value={item.unit}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((x, n) =>
                    n === i ? { ...x, unit: e.target.value as Unit } : x,
                  ),
                )
              }
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button
              className="icon danger"
              onClick={() =>
                setIngredients(ingredients.filter((_, n) => n !== i))
              }
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <button
          className="soft"
          onClick={() =>
            setIngredients([
              ...ingredients,
              { name: "", quantity: 1, unit: "g" },
            ])
          }
        >
          <Plus />
          {L.add}
        </button>
        <h3>{language === "zh" ? "制作步骤" : "Steps"}</h3>
        {steps.map((s, i) => (
          <div className="step-row" key={i}>
            <b>{i + 1}</b>
            <textarea
              value={s}
              onChange={(e) =>
                setSteps(steps.map((x, n) => (n === i ? e.target.value : x)))
              }
            />
            <button
              className="icon danger"
              onClick={() => setSteps(steps.filter((_, n) => n !== i))}
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <button className="soft" onClick={() => setSteps([...steps, ""])}>
          <Plus />
          {L.add}
        </button>
        <div className="modal-actions">
          <button className="soft" onClick={close}>
            {L.cancel}
          </button>
          <button onClick={submit}>{L.save}</button>
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ close }: { close: () => void }) {
  const { data, setData, language } = useApp();
  const [name, setName] = useState("");
  const create = () => {
    try {
      setData(addCategory(data!, name));
      setName("");
    } catch (error) {
      alert(
        language === "zh"
          ? "分类名称不能为空或重复"
          : "Category name cannot be blank or duplicated",
      );
    }
  };
  return (
    <div className="overlay">
      <div className="modal category-modal">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {language === "zh" ? "菜品分类" : "Recipe categories"}
            </p>
            <h2>{language === "zh" ? "管理分类" : "Manage categories"}</h2>
          </div>
          <button className="icon" onClick={close}>
            <X />
          </button>
        </div>
        <div className="stock-add">
          <input
            aria-label="new category"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={language === "zh" ? "新分类名称" : "New category"}
          />
          <button onClick={create}>
            <Plus /> {language === "zh" ? "添加" : "Add"}
          </button>
        </div>
        <div className="category-editor">
          {data!.categories.map((category) => (
            <div key={category.id}>
              <input
                aria-label={`${category.name} category name`}
                value={category.name}
                onChange={(event) =>
                  setData(
                    updateCategory(data!, {
                      ...category,
                      name: event.target.value,
                    }),
                  )
                }
              />
              <button
                className="icon danger"
                disabled={data!.categories.length === 1}
                aria-label={`delete ${category.name}`}
                onClick={() => {
                  if (
                    confirm(
                      language === "zh"
                        ? "删除后，该分类的菜品将移动到第一个分类。继续吗？"
                        : "Recipes will move to the first category. Continue?",
                    )
                  )
                    setData(deleteCategory(data!, category.id));
                }}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FridgePage() {
  const { data, setData, language } = useApp();
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<Unit>("g");
  const recs = recommend(data!.recipes, data!.stock, 2);
  const ready = recs.filter((r) => !r.missing.length),
    almost = recs.filter((r) => r.missing.length > 0);
  const submit = () => {
    if (name.trim() && qty > 0) {
      setData(addStock(data!, { name, quantity: qty, unit }));
      setName("");
      setQty(1);
    }
  };
  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {language === "zh" ? "现有食材" : "Available ingredients"}
            </p>
            <h2>{language === "zh" ? "我的冰箱" : "My fridge"}</h2>
          </div>
        </div>
        <div className="stock-add">
          <input
            placeholder={language === "zh" ? "食材名称" : "Ingredient"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <button onClick={submit}>
            <Plus />
            {t(language, "add")}
          </button>
        </div>
        <div className="stock-list">
          {data!.stock.map((s) => (
            <div key={s.id}>
              <PackageCheck />
              <strong>{s.name}</strong>
              <input
                aria-label={`${s.name} quantity`}
                type="number"
                min="0"
                value={s.quantity}
                onChange={(e) =>
                  setData({
                    ...data!,
                    stock: data!.stock.map((x) =>
                      x.id === s.id ? { ...x, quantity: +e.target.value } : x,
                    ),
                  })
                }
              />
              <span>{s.unit}</span>
              <button
                className="icon danger"
                onClick={() =>
                  setData({
                    ...data!,
                    stock: data!.stock.filter((x) => x.id !== s.id),
                  })
                }
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <Recommendation title={t(language, "ready")} items={ready} />
        <Recommendation title={t(language, "almost")} items={almost} />
      </div>
    </>
  );
}
function Recommendation({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof recommend>;
}) {
  const { language } = useApp();
  return (
    <section className="panel">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="count">{items.length}</span>
      </div>
      {items.length ? (
        items.map((x) => (
          <div className="recommend" key={x.recipe.id}>
            <MiniRecipe recipe={x.recipe} />
            {x.missing.length > 0 && (
              <small>
                {t(language, "missing")}：
                {x.missing
                  .map((i) => `${i.name} ${i.quantity}${i.unit}`)
                  .join("、")}
              </small>
            )}
          </div>
        ))
      ) : (
        <Empty text={t(language, "noData")} />
      )}
    </section>
  );
}

function ShoppingPage() {
  const { data, setData, language } = useApp();
  const [from, setFrom] = useState(localDate()),
    [to, setTo] = useState(localDate());
  const [current, setCurrent] = useState<string | undefined>(
    data!.shoppingLists.at(-1)?.id,
  );
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState<Unit>("piece");
  const list = data!.shoppingLists.find((l) => l.id === current);
  const create = () => {
    const next = generateShoppingList(
      data!,
      from,
      to,
      language === "zh" ? `${from} 至 ${to} 采购` : `Shopping ${from} to ${to}`,
    );
    setData(next);
    setCurrent(next.shoppingLists.at(-1)!.id);
  };
  const updateList = (next: ShoppingList) =>
    setData({
      ...data!,
      shoppingLists: data!.shoppingLists.map((l) =>
        l.id === next.id ? next : l,
      ),
    });
  const addManual = () => {
    if (!list || !manualName.trim() || manualQty <= 0) return;
    updateList({
      ...list,
      items: [
        ...list.items,
        {
          id: `manual-${crypto.randomUUID()}`,
          name: manualName.trim(),
          unit: manualUnit,
          required: manualQty,
          inStock: 0,
          quantity: manualQty,
          source: "manual",
          purchased: false,
          stocked: false,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setManualName("");
    setManualQty(1);
  };
  return (
    <>
      <div className="toolbar shopping-toolbar">
        <select
          value={current ?? ""}
          onChange={(e) => setCurrent(e.target.value)}
        >
          <option value="">
            {language === "zh" ? "选择已有清单" : "Choose a list"}
          </option>
          {data!.shoppingLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <label>
          {language === "zh" ? "开始" : "From"}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          {language === "zh" ? "结束" : "To"}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button onClick={create}>
          <ShoppingBasket />
          {t(language, "generate")}
        </button>
      </div>
      {list ? (
        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">
                {list.from} — {list.to}
              </p>
              <h2>{list.name}</h2>
            </div>
            <button onClick={() => setData(stockPurchased(data!, list.id))}>
              <PackageCheck />
              {t(language, "putStock")}
            </button>
          </div>
          <div className="stock-add">
            <input
              placeholder={
                language === "zh" ? "手动添加食材" : "Add item manually"
              }
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
            <input
              type="number"
              min="0"
              value={manualQty}
              onChange={(e) => setManualQty(+e.target.value)}
            />
            <select
              value={manualUnit}
              onChange={(e) => setManualUnit(e.target.value as Unit)}
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button onClick={addManual}>
              <Plus />
              {t(language, "add")}
            </button>
          </div>
          <div className="shopping-list">
            {list.items.map((item) => (
              <label className={item.purchased ? "checked" : ""} key={item.id}>
                <input
                  type="checkbox"
                  checked={item.purchased}
                  disabled={item.stocked}
                  onChange={() =>
                    updateList({
                      ...list,
                      items: list.items.map((i) =>
                        i.id === item.id
                          ? { ...i, purchased: !i.purchased }
                          : i,
                      ),
                    })
                  }
                />
                <div className="grow">
                  <strong>{item.name}</strong>
                  <small>
                    {item.source === "manual"
                      ? language === "zh"
                        ? "手动添加"
                        : "Manual"
                      : language === "zh"
                        ? `总需 ${item.required}${item.unit} · 已有 ${item.inStock}${item.unit}`
                        : `Need ${item.required}${item.unit} · Have ${item.inStock}${item.unit}`}
                  </small>
                </div>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) =>
                    updateList({
                      ...list,
                      items: list.items.map((i) =>
                        i.id === item.id
                          ? { ...i, quantity: +e.target.value }
                          : i,
                      ),
                    })
                  }
                />
                <span>{item.unit}</span>
                {item.stocked && (
                  <em>{language === "zh" ? "已入库" : "Stocked"}</em>
                )}
                <button
                  className="icon danger"
                  onClick={(e) => {
                    e.preventDefault();
                    updateList({
                      ...list,
                      items: list.items.filter((i) => i.id !== item.id),
                    });
                  }}
                >
                  <Trash2 />
                </button>
              </label>
            ))}
          </div>
        </section>
      ) : (
        <Empty
          text={
            language === "zh"
              ? "选择日期范围，生成第一张购物清单。"
              : "Choose dates to generate your first list."
          }
        />
      )}
    </>
  );
}

function HistoryPage() {
  const { data, setData, language, currentRoleId } = useApp();
  const arrange = (name: string) => {
    const recipe = data!.recipes.find((r) => r.name === name);
    if (recipe)
      setData(
        orderDish(data!, localDate(), "dinner", recipe.id, currentRoleId),
      );
  };
  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t(language, "history")}</h2>
        <span className="count">{data!.history.length}</span>
      </div>
      {data!.history.length ? (
        [...data!.history]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((h) => (
            <article className="history-item" key={h.id}>
              <div className="history-date">
                <strong>{h.date.slice(8)}</strong>
                <span>{h.date.slice(0, 7)}</span>
              </div>
              <div className="grow">
                <h3>
                  {t(language, h.meal)} · {h.diners}
                  {language === "zh" ? "人" : ""}
                </h3>
                {h.dishes.map((d) => (
                  <div className="history-dish" key={d.name}>
                    <p>
                      ✓ {d.name} ·{" "}
                      {language === "zh" ? "点菜：" : "Picked by: "}
                      {d.orderedBy.join("、")}
                    </p>
                    <button className="soft" onClick={() => arrange(d.name)}>
                      {language === "zh" ? "今晚再做" : "Cook again tonight"}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))
      ) : (
        <Empty text={t(language, "noData")} />
      )}
    </section>
  );
}

function SettingsPage() {
  const {
    data,
    setData,
    language,
    setLanguage,
    currentRoleId,
    setCurrentRoleId,
  } = useApp();
  const [name, setName] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const download = () => {
    const blob = new Blob([exportData(data!)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-menu-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const restore = async (f?: File) => {
    if (!f) return;
    try {
      const next = importData(await f.text());
      if (
        confirm(
          language === "zh"
            ? "完整恢复将替换当前数据，是否继续？"
            : "Restore will replace current data. Continue?",
        )
      ) {
        setData(next);
        setCurrentRoleId(next.roles[0]?.id ?? "");
      }
    } catch {
      alert(
        language === "zh"
          ? "备份文件无效，当前数据未改变。"
          : "Invalid backup. Current data was not changed.",
      );
    }
  };
  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="section-head">
          <h2>{t(language, "roles")}</h2>
          <Users />
        </div>
        <div className="stock-add">
          <input
            placeholder={language === "zh" ? "角色名称" : "Role name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={() => {
              if (name.trim()) {
                setData(addRole(data!, name));
                setName("");
              }
            }}
          >
            <Plus />
            {t(language, "add")}
          </button>
        </div>
        <div className="role-list">
          {data!.roles.map((r) => (
            <div key={r.id}>
              <input
                type="color"
                value={r.color}
                onChange={(e) =>
                  setData(updateRole(data!, { ...r, color: e.target.value }))
                }
              />
              <input
                value={r.name}
                onChange={(e) =>
                  setData(updateRole(data!, { ...r, name: e.target.value }))
                }
              />
              <button
                className="icon danger"
                disabled={data!.roles.length === 1}
                onClick={() => {
                  const next = deleteRole(data!, r.id);
                  setData(next);
                  if (currentRoleId === r.id)
                    setCurrentRoleId(next.roles[0].id);
                }}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>{language === "zh" ? "语言" : "Language"}</h2>
          <Languages />
        </div>
        <div className="language-options">
          <button
            className={language === "zh" ? "active" : ""}
            onClick={() => setLanguage("zh")}
          >
            简体中文
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
        </div>
      </section>
      <section className="panel full">
        <div className="section-head">
          <div>
            <h2>{language === "zh" ? "数据安全" : "Data safety"}</h2>
            <p>
              {language === "zh"
                ? "备份包含角色、菜谱图片、菜单、库存和历史。"
                : "Backup includes roles, recipe images, menus, stock and history."}
            </p>
          </div>
        </div>
        <div className="backup-actions">
          <button onClick={download}>
            <Download />
            {t(language, "export")}
          </button>
          <button className="soft" onClick={() => file.current?.click()}>
            <Upload />
            {t(language, "import")}
          </button>
          <input
            ref={file}
            hidden
            type="file"
            accept="application/json"
            onChange={(e) => restore(e.target.files?.[0])}
          />
        </div>
      </section>
    </div>
  );
}

function RecipeImage({ recipe }: { recipe: Recipe }) {
  return recipe.image ? (
    <img className="recipe-image" src={recipe.image} alt="" />
  ) : (
    <div className={`recipe-image placeholder ${recipe.category}`}>
      {recipe.category === "diet" || recipe.category === "vegetable"
        ? "🥗"
        : recipe.category === "meat"
          ? "🍳"
          : recipe.category === "soup"
            ? "🍲"
            : recipe.category === "dessert"
              ? "🍰"
              : "🥢"}
    </div>
  );
}
function MiniRecipe({ recipe }: { recipe: Recipe }) {
  const { language } = useApp();
  return (
    <div className="mini-recipe">
      <RecipeImage recipe={recipe} />
      <div>
        <strong>
          {language === "en" && recipe.nameEn ? recipe.nameEn : recipe.name}
        </strong>
        <small>
          {recipe.ingredients.length}{" "}
          {language === "zh" ? "种食材" : "ingredients"} · {recipe.servings}
          {language === "zh" ? "人份" : " servings"}
        </small>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span>🍽️</span>
      <p>{text}</p>
    </div>
  );
}
