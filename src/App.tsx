import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  updateHistoryPhoto,
  updatePlan,
  updateRole,
} from "./lib/appActions";
import { missingForRecipe } from "./lib/calculations";
import { displayUnit } from "./lib/units";
import { storeImage } from "./lib/images";
import { useOptionalHousehold } from "./households/HouseholdContext";
import { useOptionalAuth } from "./auth/AuthContext";
import { labels, t } from "./i18n";
import {
  BRAND_ORANGE,
  LIQUID_GLASS_ANIMATION_PALETTE,
  LIQUID_GLASS_PARAMETERS,
  LIQUID_GLASS_SURFACES,
  WARM_ILLUSTRATION_PALETTE,
} from "./theme";
import type {
  Category,
  AppTheme,
  Ingredient,
  MealPlan,
  MealType,
  Recipe,
  ShoppingList,
  Unit,
} from "./types";

type Page = "home" | "order" | "foodlog" | "fridge" | "me";
type NavEffect = "hearts";
const nav: { key: Page; src: string; effect: NavEffect }[] = [
  { key: "home", src: "/nav/snoopy-home.png", effect: "hearts" },
  { key: "order", src: "/nav/snoopy-menu.png", effect: "hearts" },
  { key: "foodlog", src: "/nav/snoopy-foodlog.png", effect: "hearts" },
  { key: "fridge", src: "/nav/snoopy-fridge.png", effect: "hearts" },
  { key: "me", src: "/nav/snoopy-me.png", effect: "hearts" },
];
const DEFAULT_ENABLED_MEALS: MealType[] = ["lunch", "dinner"];
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
const fridgeUnits: Unit[] = ["piece", "g", "kg"];
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
  const [menuIconAnimation, setMenuIconAnimation] = useState(0);
  useEffect(() => {
    document.title = ctx.data?.preferences.appName?.trim() || "NomNom";
  }, [ctx.data?.preferences.appName]);
  if (!ctx.data)
    return (
      <div className="loading">
        <ChefHat /> 正在准备厨房…
      </div>
    );
  const L = labels[ctx.language];
  const currentRole = ctx.data.roles.find(
    (role) => role.id === ctx.currentRoleId,
  );
  const shellStyle = {
    "--orange": BRAND_ORANGE,
    "--app-font-scale": ctx.data.preferences.fontScale ?? 1,
    ...(ctx.data.preferences.theme === "warm"
      ? {
          "--warm-peach": WARM_ILLUSTRATION_PALETTE.peach,
          "--warm-apricot": WARM_ILLUSTRATION_PALETTE.apricot,
          "--warm-sage": WARM_ILLUSTRATION_PALETTE.sage,
          "--warm-cream": WARM_ILLUSTRATION_PALETTE.cream,
          "--warm-ink": WARM_ILLUSTRATION_PALETTE.ink,
        }
      : {}),
    ...(ctx.data.preferences.theme === "glass"
      ? {
          "--ambient-one": LIQUID_GLASS_ANIMATION_PALETTE.ambientOne,
          "--ambient-two": LIQUID_GLASS_ANIMATION_PALETTE.ambientTwo,
          "--ambient-three": LIQUID_GLASS_ANIMATION_PALETTE.ambientThree,
          "--illustration-spark": LIQUID_GLASS_ANIMATION_PALETTE.sparkle,
          "--glass-refraction": LIQUID_GLASS_PARAMETERS.refraction,
          "--glass-depth": LIQUID_GLASS_PARAMETERS.depth,
          "--glass-dispersion": LIQUID_GLASS_PARAMETERS.dispersion,
          "--glass-frost": LIQUID_GLASS_PARAMETERS.frost,
          "--glass-light": LIQUID_GLASS_PARAMETERS.light,
          "--glass-sky": LIQUID_GLASS_SURFACES.sky,
          "--glass-water": LIQUID_GLASS_SURFACES.water,
          "--glass-panel": LIQUID_GLASS_SURFACES.panel,
          "--glass-panel-strong": LIQUID_GLASS_SURFACES.panelStrong,
          "--glass-edge": LIQUID_GLASS_SURFACES.edge,
          "--glass-item": LIQUID_GLASS_SURFACES.item,
          "--glass-ink": LIQUID_GLASS_SURFACES.ink,
        }
      : {}),
  } as CSSProperties;
  return (
    <div
      className={`app-shell theme-${ctx.data.preferences.theme}`}
      style={shellStyle}
    >
      <div className="ambient-shapes" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <main>
        <header>
          <div className="top-brand">
            <span className="brand-mark">
              <img src="/brand/nomnom-mark.png" alt="NomNom logo" />
            </span>
            <div>
              <strong>
                {ctx.data.preferences.appName?.trim() || "NomNom"}
              </strong>
              <small>{L[page]}</small>
            </div>
          </div>
          <div className="desktop-title">
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
            <div className="role-switcher">
              {currentRole?.avatar ? (
                <img src={currentRole.avatar} alt="current user avatar" />
              ) : (
                <span style={{ background: BRAND_ORANGE }}>
                  {currentRole?.name.slice(0, 1)}
                </span>
              )}
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
            </div>
          </div>
        </header>
        <div className="content page-enter" key={page}>
          {page === "home" && <HomeModule />}
          {page === "order" && <OrderPage initialCategory="all" />}
          {page === "foodlog" && <HistoryPage />}
          {page === "fridge" && <FridgePage />}
          {page === "me" && <MePage />}
        </div>
      </main>
      <nav className="bottom-nav" aria-label="主要功能">
        {nav.map(({ key, src, effect }) => (
          <button
            key={key}
            className={[
              page === key ? "active" : "",
              key === "order" && menuIconAnimation > 0
                ? "menu-icon-popping"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={page === key ? "page" : undefined}
            onClick={() => {
              setPage(key);
              if (key === "order") setMenuIconAnimation((value) => value + 1);
            }}
          >
            {ctx.data!.preferences.theme === "warm" && (
              <NavThemeIcon page={key} style="hybrid" />
            )}
            {ctx.data!.preferences.theme === "glass" && (
              <NavThemeIcon page={key} style="glass" />
            )}
            {ctx.data!.preferences.theme === "snoopy" && (
              <span className="nav-character-wrap" aria-hidden="true">
                <span
                  className={`nav-effect nav-effect-${effect}`}
                  data-nav-effect={effect}
                />
                <img
                  key={key === "order" ? menuIconAnimation : key}
                  className="nav-character"
                  data-nav-character={key}
                  src={src}
                  alt=""
                />
              </span>
            )}
            <span>{L[key]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavThemeIcon({
  page,
  style,
}: {
  page: Page;
  style: "hybrid" | "glass";
}) {
  const icon =
    page === "home" ? (
      <Home />
    ) : page === "order" ? (
      <Menu />
    ) : page === "foodlog" ? (
      <History />
    ) : page === "fridge" ? (
      <Refrigerator />
    ) : (
      <Users />
    );
  return (
    <span
      className={`nav-theme-icon nav-theme-icon-${style}`}
      data-nav-icon-style={style}
      aria-hidden="true"
    >
      <span className="nav-theme-icon-fill" />
      {icon}
    </span>
  );
}
function HomeModule() {
  const { language } = useApp();
  const [section, setSection] = useState<"today" | "week">("today");
  return (
    <>
      <div className="module-tabs home-tabs" data-bubble-tabs="home">
        <button
          className={section === "today" ? "active" : ""}
          onClick={() => setSection("today")}
        >
          <Home /> {language === "zh" ? "今日安排" : "Today"}
        </button>
        <button
          className={section === "week" ? "active" : ""}
          onClick={() => setSection("week")}
        >
          <CalendarDays /> {language === "zh" ? "一周安排" : "Weekly plan"}
        </button>
      </div>
      {section === "today" ? <HomePage /> : <WeekPage />}
    </>
  );
}

function HomePage() {
  const { data, setData, language, currentRoleId } = useApp();
  const enabledMeals = data!.preferences.enabledMeals ?? DEFAULT_ENABLED_MEALS;
  const [meal, setMeal] = useState<MealType>(() => {
    const preferred = new Date().getHours() < 16 ? "lunch" : "dinner";
    return enabledMeals.includes(preferred)
      ? preferred
      : (enabledMeals[0] ?? "lunch");
  });
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
        <div className="hero-art">
          <KitchenMascot />
        </div>
      </section>
      <div className="meal-tabs">
        {enabledMeals.map((m) => (
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
  const finish = () => setData(completeDish(data!, plan.id, recipe.id));
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
  const enabledMeals = data!.preferences.enabledMeals ?? DEFAULT_ENABLED_MEALS;
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
      <div
        className="week-board"
        data-enabled-meals={enabledMeals.join(",")}
        style={{ "--enabled-meal-count": enabledMeals.length } as CSSProperties}
      >
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
            {enabledMeals.map((meal) => {
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

function OrderPage({ initialCategory }: { initialCategory: Category | "all" }) {
  const { language } = useApp();
  const [section, setSection] = useState<"recipes" | "shopping">("recipes");
  return (
    <>
      <div className="module-tabs" data-bubble-tabs="order">
        <button
          className={section === "recipes" ? "active" : ""}
          onClick={() => setSection("recipes")}
        >
          <ChefHat /> {language === "zh" ? "点菜" : "Choose dishes"}
        </button>
        <button
          className={section === "shopping" ? "active" : ""}
          onClick={() => setSection("shopping")}
        >
          <ShoppingBasket /> {language === "zh" ? "购物清单" : "Shopping"}
        </button>
      </div>
      {section === "recipes" && (
        <RecipesPage initialCategory={initialCategory} />
      )}
      {section === "shopping" && <ShoppingPage />}
    </>
  );
}

function RecipesPage({
  initialCategory = "all",
}: {
  initialCategory?: Category | "all";
}) {
  const { data, setData, language, currentRoleId } = useApp();
  const household = useOptionalHousehold();
  const [cat, setCat] = useState<Category | "all">(initialCategory);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Recipe | null | undefined>(undefined);
  const [managingCategories, setManagingCategories] = useState(false);
  const [pickedRecipeId, setPickedRecipeId] = useState<string>();
  const L = labels[language];
  const shown = data!.recipes.filter(
    (r) =>
      (cat === "all" || r.category === cat) &&
      `${r.name} ${r.nameEn ?? ""} ${r.ingredients.map((i) => i.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const uploadPhoto = async (recipe: Recipe, selected?: File) => {
    if (!selected) return;
    try { const image = await storeImage(household?.household.id, selected, "recipes"); setData({ ...data!, recipes: data!.recipes.map((item) => item.id === recipe.id ? { ...item, image, updatedAt: new Date().toISOString() } : item) }); }
    catch (error) { alert(error instanceof Error ? error.message : "图片上传失败"); }
  };
  return (
    <>
      <div className="toolbar recipe-toolbar">
        <div className="search recipe-search">
          {data!.preferences.theme === "snoopy" && (
            <div
              className="recipe-search-art"
              role="img"
              aria-label="Three Snoopy characters resting on the recipe search border"
            >
              <img
                src="/illustrations/snoopy-search-trio.png"
                alt=""
                aria-hidden="true"
              />
            </div>
          )}
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
            <div className="recipe-visual">
              <RecipeImage recipe={r} />
              <label className="recipe-photo-upload">
                <Upload />
                {language === "zh"
                  ? r.image
                    ? "更换照片"
                    : "上传照片"
                  : r.image
                    ? "Replace photo"
                    : "Upload photo"}
                <input
                  aria-label={`upload photo for ${r.name}`}
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadPhoto(r, event.target.files?.[0])}
                />
              </label>
            </div>
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
              <div className={`card-actions ${r.builtIn ? "two-actions" : ""}`}>
                <button
                  className={`pick-action ${pickedRecipeId === r.id ? "just-picked" : ""}`}
                  aria-live="polite"
                  onClick={() => {
                    setData(
                      orderDish(
                        data!,
                        localDate(),
                        "dinner",
                        r.id,
                        currentRoleId,
                      ),
                    );
                    setPickedRecipeId(r.id);
                    window.setTimeout(
                      () =>
                        setPickedRecipeId((current) =>
                          current === r.id ? undefined : current,
                        ),
                      700,
                    );
                  }}
                >
                  {pickedRecipeId === r.id ? (
                    <>
                      <span className="action-check">✓</span>
                      {language === "zh" ? "已加入" : "Added"}
                    </>
                  ) : (
                    <>
                      <Plus />
                      {language === "zh" ? "今晚想吃" : "Pick tonight"}
                    </>
                  )}
                </button>
                <button className="soft" onClick={() => setEditing(r)}>
                  {language === "zh" ? "查看/编辑" : "View/Edit"}
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
  const household = useOptionalHousehold();
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
  const readImage = async (file?: File) => {
    if (!file) return;
    try { setImage(await storeImage(household?.household.id, file, "recipes")); }
    catch (error) { alert(error instanceof Error ? error.message : "图片上传失败"); }
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
                <option value={u} key={u}>
                  {displayUnit(u, language, item.name)}
                </option>
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
            aria-label="fridge unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            {fridgeUnits.map((u) => (
              <option value={u} key={u}>
                {displayUnit(u, language, name)}
              </option>
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
              <span>{displayUnit(s.unit, language, s.name)}</span>
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
                  .map(
                    (i) =>
                      language === "zh"
                        ? `${i.name} ${i.quantity}${displayUnit(i.unit, language, i.name)}（已有 ${i.inStock} / 需要 ${i.required}）`
                        : `${i.name} ${i.quantity}${displayUnit(i.unit, language, i.name)} (have ${i.inStock} / need ${i.required})`,
                  )
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
                <option value={u} key={u}>
                  {displayUnit(u, language, manualName)}
                </option>
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
                        ? `总需 ${item.required}${displayUnit(item.unit, language, item.name)} · 已有 ${item.inStock}${displayUnit(item.unit, language, item.name)}`
                        : `Need ${item.required}${displayUnit(item.unit, language, item.name)} · Have ${item.inStock}${displayUnit(item.unit, language, item.name)}`}
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
                <span>{displayUnit(item.unit, language, item.name)}</span>
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
  const household = useOptionalHousehold();
  const arrange = (name: string) => {
    const recipe = data!.recipes.find((r) => r.name === name);
    if (recipe)
      setData(
        orderDish(data!, localDate(), "dinner", recipe.id, currentRoleId),
      );
  };
  const uploadPhoto = async (historyId: string, selected?: File) => {
    if (!selected) return;
    try { setData(updateHistoryPhoto(data!, historyId, await storeImage(household?.household.id, selected, "history"))); }
    catch (error) { alert(error instanceof Error ? error.message : "图片上传失败"); }
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
              <div
                className={
                  h.image ? "history-photo has-photo" : "history-photo"
                }
              >
                {h.image && (
                  <img
                    src={h.image}
                    alt={
                      h.date +
                      " " +
                      t(language, h.meal) +
                      (language === "zh" ? " 食记照片" : " food log photo")
                    }
                  />
                )}
                <label>
                  <Upload />
                  {language === "zh"
                    ? h.image
                      ? "更换照片"
                      : "上传照片"
                    : h.image
                      ? "Replace photo"
                      : "Upload photo"}
                  <input
                    aria-label={
                      "upload history photo for " + h.date + " " + h.meal
                    }
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      uploadPhoto(h.id, event.target.files?.[0])
                    }
                  />
                </label>
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
  const household = useOptionalHousehold();
  const [name, setName] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const download = () => {
    const blob = new Blob([exportData(data!)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomnom-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
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
  const readAvatar = async (roleId: string, selected?: File) => {
    if (!selected) return;
    try { const image = await storeImage(household?.household.id, selected, "avatars"); const role = data!.roles.find((item) => item.id === roleId); if (role) setData(updateRole(data!, { ...role, avatar: image })); }
    catch (error) { alert(error instanceof Error ? error.message : "图片上传失败"); }
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
            <div className="role-editor" key={r.id}>
              <label
                className="avatar-upload"
                title={language === "zh" ? "上传头像" : "Upload avatar"}
              >
                {r.avatar ? (
                  <img src={r.avatar} alt={`${r.name} avatar`} />
                ) : (
                  <span style={{ background: BRAND_ORANGE }}>
                    {r.name.slice(0, 1)}
                  </span>
                )}
                <input
                  aria-label={`upload avatar for ${r.name}`}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    readAvatar(r.id, event.target.files?.[0])
                  }
                />
              </label>
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

export function AccountHouseholdPanel() {
  const { language } = useApp();
  const household = useOptionalHousehold();
  const auth = useOptionalAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!household && !auth) return null;
  const createFamilyInvite = async () => {
    if (!household) return;
    setBusy(true);
    setMessage("");
    try {
      const code = await household.createInvite();
      setInviteCode(code);
      await navigator.clipboard?.writeText(code);
      setMessage(language === "zh" ? "邀请码已复制，有效期 7 天。" : "Invite copied. It is valid for 7 days.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : language === "zh" ? "邀请码生成失败" : "Could not create invite");
    } finally { setBusy(false); }
  };
  const joinFamily = async () => {
    if (!household || !joinCode.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await household.joinWithCode(joinCode);
      setJoinCode("");
      setMessage(language === "zh" ? "已成功加入家庭。" : "You joined the household.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : language === "zh" ? "加入家庭失败" : "Could not join household");
    } finally { setBusy(false); }
  };
  return <section className="panel account-household-panel">
    <div className="section-head">
      <div>
        <p className="eyebrow">{language === "zh" ? "登录与共享" : "Account & sharing"}</p>
        <h2>{language === "zh" ? "账户与家庭" : "Account and household"}</h2>
      </div>
      <Users />
    </div>
    {auth?.user.email && <p className="account-email">{auth.user.email}</p>}
    {household && <div className="account-household-grid">
      <label>
        <span>{language === "zh" ? "当前家庭" : "Current household"}</span>
        <select aria-label={language === "zh" ? "当前家庭" : "Current household"} value={household.household.id} onChange={(event) => household.selectHousehold(event.target.value)}>
          {household.households.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {household.household.role === "owner" && <div className="invite-family-block">
        <button className="soft" disabled={busy} onClick={() => void createFamilyInvite()}>{language === "zh" ? "生成成员邀请码" : "Create member invite"}</button>
        {inviteCode && <output aria-label={language === "zh" ? "成员邀请码" : "Member invite code"}>{inviteCode}</output>}
      </div>}
      <div className="join-household-form">
        <label>
          <span>{language === "zh" ? "加入另一个家庭" : "Join another household"}</span>
          <input aria-label={language === "zh" ? "输入家庭邀请码" : "Enter household invite"} value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder={language === "zh" ? "输入邀请码" : "Invite code"} />
        </label>
        <button disabled={busy || !joinCode.trim()} onClick={() => void joinFamily()}>{language === "zh" ? "加入家庭" : "Join household"}</button>
      </div>
    </div>}
    {message && <p className="account-notice" role="status">{message}</p>}
    {auth && <button className="danger account-signout-button" onClick={() => void auth.signOut()}>{language === "zh" ? "退出登录" : "Sign out"}</button>}
  </section>;
}

function MePage() {
  const { data, setData, language } = useApp();
  const appName = data!.preferences.appName ?? "NomNom";
  return (
    <>
      <section className="panel welcome-panel">
        <div>
          <p className="eyebrow">
            {language === "zh" ? "欢迎回来" : "Welcome back"}
          </p>
          <h2>{appName.trim() || "NomNom"}</h2>
          <label className="app-name-field">
            <span>
              {language === "zh" ? "给这个 App 起个名字" : "Name this app"}
            </span>
            <input
              aria-label={language === "zh" ? "App 名称" : "App name"}
              value={appName}
              placeholder="NomNom"
              onChange={(event) =>
                setData({
                  ...data!,
                  preferences: {
                    ...data!.preferences,
                    appName: event.target.value,
                  },
                })
              }
            />
          </label>
        </div>
        <span className="welcome-illustration">
          <ProfileIllustration />
        </span>
      </section>
      <AccountHouseholdPanel />
      <AppearancePanel />
      <FontSizePanel />
      <SettingsPage />
      <section className="panel tutorial-panel">
        <div className="section-head">
          <h2>{language === "zh" ? "新手教程" : "Quick start"}</h2>
          <span className="count">3</span>
        </div>
        <ol>
          <li>
            {language === "zh"
              ? "切换成员后去“点菜”选择想吃的菜。"
              : "Switch members, then choose dishes in Order."}
          </li>
          <li>
            {language === "zh"
              ? "确认人数和菜单，生成对应的购物清单。"
              : "Confirm diners and menu, then generate a shopping list."}
          </li>
          <li>
            {language === "zh"
              ? "买完放入冰箱，做完菜后标记完成自动扣库。"
              : "Stock purchases and complete dishes to deduct ingredients."}
          </li>
        </ol>
      </section>
    </>
  );
}

function FontSizePanel() {
  const { data, setData, language } = useApp();
  const options = [
    { value: 0.9, zh: "小", en: "Small" },
    { value: 1, zh: "标准", en: "Standard" },
    { value: 1.1, zh: "大", en: "Large" },
    { value: 1.2, zh: "特大", en: "Extra large" },
  ];
  const current = data!.preferences.fontScale ?? 1;
  return (
    <section className="panel font-size-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            {language === "zh" ? "阅读设置" : "READING"}
          </p>
          <h2>{language === "zh" ? "字体大小" : "Text size"}</h2>
        </div>
        <span className="font-size-preview" aria-hidden="true">
          Aa
        </span>
      </div>
      <div
        className="font-size-options"
        role="group"
        aria-label={language === "zh" ? "字体大小" : "Text size"}
      >
        {options.map((option) => (
          <button
            key={option.value}
            className={current === option.value ? "active" : ""}
            aria-label={`${language === "zh" ? "字体大小" : "Text size"}：${language === "zh" ? option.zh : option.en}`}
            onClick={() =>
              setData({
                ...data!,
                preferences: { ...data!.preferences, fontScale: option.value },
              })
            }
          >
            {language === "zh" ? option.zh : option.en}
          </button>
        ))}
      </div>
    </section>
  );
}
function AppearancePanel() {
  const { data, setData, language } = useApp();
  const themes: Array<{
    id: AppTheme;
    icon: string;
    zh: string;
    en: string;
  }> = [
    {
      id: "snoopy",
      icon: "◉",
      zh: "默认",
      en: "Default Snoopy",
    },
    {
      id: "warm",
      icon: "☀️",
      zh: "暖色插画",
      en: "Warm illustration",
    },
    {
      id: "glass",
      icon: "◌",
      zh: "毛玻璃",
      en: "Blue Liquid Glass",
    },
  ];
  const chooseTheme = (theme: AppTheme) =>
    setData({ ...data!, preferences: { ...data!.preferences, theme } });
  return (
    <section className="panel appearance-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            {language === "zh" ? "个性设置" : "PERSONALISE"}
          </p>
          <h2>{language === "zh" ? "界面风格" : "Interface style"}</h2>
        </div>
      </div>
      <div className="theme-grid">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={data!.preferences.theme === theme.id ? "active" : ""}
            onClick={() => chooseTheme(theme.id)}
          >
            <span>{theme.icon}</span>
            <strong>{language === "zh" ? theme.zh : theme.en}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (recipe.image)
    return (
      <img className="recipe-image" src={recipe.image} alt={recipe.name} />
    );
  const kind =
    recipe.category === "meat"
      ? "meat"
      : recipe.category === "soup"
        ? "soup"
        : recipe.category === "dessert"
          ? "dessert"
          : recipe.category === "diet" || recipe.category === "vegetable"
            ? "vegetable"
            : "cold";
  return (
    <div className={`recipe-image placeholder illustration-${kind}`}>
      <svg
        viewBox="0 0 160 120"
        role="img"
        aria-label="dish illustration"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="illustration-sun" cx="132" cy="22" r="10" />
        <path className="illustration-table" d="M0 92h160v28H0z" />
        {kind === "soup" ? (
          <>
            <path className="illustration-main" d="M35 48h90l-9 49H44z" />
            <path className="illustration-rim" d="M29 45h102v10H29z" />
            <path
              className="illustration-steam"
              d="M62 37c-8-8 9-11 1-21M82 37c-8-8 9-11 1-21M102 37c-8-8 9-11 1-21"
            />
          </>
        ) : kind === "dessert" ? (
          <>
            <path
              className="illustration-plate"
              d="M27 96h106c-9 9-26 13-53 13S36 105 27 96z"
            />
            <path className="illustration-main" d="M48 44h65v50H48z" />
            <path className="illustration-layer" d="M48 61h65v10H48z" />
            <circle className="illustration-accent" cx="80" cy="38" r="10" />
          </>
        ) : kind === "meat" ? (
          <>
            <ellipse
              className="illustration-plate"
              cx="80"
              cy="83"
              rx="58"
              ry="29"
            />
            <path
              className="illustration-main"
              d="M48 62c15-21 58-18 68 3 9 20-20 32-43 29-25-3-37-16-25-32z"
            />
            <path
              className="illustration-detail"
              d="M64 69c13-8 27-6 38 3M61 80c14 8 29 8 42 0"
            />
          </>
        ) : (
          <>
            <path
              className="illustration-bowl"
              d="M27 69h106c-7 29-25 40-53 40S34 98 27 69z"
            />
            <path className="illustration-rim" d="M23 64h114v10H23z" />
            <path
              className="illustration-leaf leaf-one"
              d="M79 66C49 59 43 36 48 23c22 3 36 17 31 43z"
            />
            <path
              className="illustration-leaf leaf-two"
              d="M83 65c3-29 24-40 39-38 1 21-12 37-39 38z"
            />
            <circle className="illustration-accent" cx="94" cy="60" r="9" />
          </>
        )}
      </svg>
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
function KitchenMascot() {
  const { data } = useApp();
  if (data?.preferences.theme !== "snoopy") return null;
  return (
    <div
      className="kitchen-mascot"
      role="img"
      aria-label="Snoopy cooking with two family chefs"
    >
      <img
        className="kitchen-mascot-image"
        src="/illustrations/snoopy-chef-trio.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}
function ProfileIllustration() {
  const { data } = useApp();
  if (data?.preferences.theme !== "snoopy") return null;
  return (
    <svg
      className="profile-illustration"
      viewBox="0 0 150 120"
      role="img"
      aria-label="Snoopy chef profile illustration"
    >
      <circle className="profile-bg" cx="75" cy="62" r="55" />
      <image
        className="profile-snoopy"
        href="/illustrations/snoopy-profile-pan.png"
        x="8"
        y="3"
        width="134"
        height="114"
        preserveAspectRatio="xMidYMid meet"
      />
      <path
        className="profile-steam profile-steam-one"
        d="M24 64c-7-7 5-11-1-19"
      />
      <path
        className="profile-steam profile-steam-two"
        d="M36 61c-6-7 5-11 0-19"
      />
      <path
        className="profile-steam profile-steam-three"
        d="M48 64c-7-7 5-11-1-19"
      />
    </svg>
  );
}
function EmptyIllustration() {
  const { data } = useApp();
  if (data?.preferences.theme !== "snoopy") return null;
  return (
    <div
      className="empty-illustration"
      role="img"
      aria-label="Snoopy wondering beside an empty plate"
    >
      <img
        className="empty-snoopy-image"
        src="/illustrations/snoopy-empty-plate.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <EmptyIllustration />
      <p>{text}</p>
    </div>
  );
}
