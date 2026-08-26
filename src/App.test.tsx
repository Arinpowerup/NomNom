import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProvider } from "./context/AppContext";
import App from "./App";
import { loadData, saveData } from "./lib/db";
import { initialData } from "./data/seed";

beforeEach(async () => {
  localStorage.clear();
  await saveData(structuredClone(initialData));
});
afterEach(cleanup);
describe("application shell", () => {
  it("renders the home dashboard from persisted seed data", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    expect(await screen.findByText("今晚想吃点什么？")).toBeInTheDocument();
    expect(screen.getByText("NomNom")).toBeVisible();
    expect(screen.queryByText("灶边")).not.toBeInTheDocument();
    expect(document.title).toBe("NomNom");
    expect(document.querySelector(".app-shell")).toHaveClass("theme-snoopy");
    expect(screen.getAllByText("首页").length).toBeGreaterThan(0);
    const homeArtwork = screen.getByRole("img", {
      name: "Snoopy cooking with two family chefs",
    });
    expect(homeArtwork.querySelector("img")).toHaveAttribute(
      "src",
      "/illustrations/snoopy-chef-trio.png",
    );
    expect(homeArtwork.querySelector(".cooking-steam")).toBeNull();
    const mealTabs = document.querySelector(".meal-tabs")!;
    expect(
      Array.from(mealTabs.querySelectorAll(":scope > button")).map((button) =>
        button.textContent?.replace(/\s+/g, " ").trim(),
      ),
    ).toEqual(["午餐0 道菜", "晚餐0 道菜"]);
    expect(screen.queryByRole("button", { name: /早餐/ })).toBeNull();
  });
  it("switches the system interface to English", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    const button = await screen.findByRole("button", { name: /简体中文/ });
    await userEvent.click(button);
    await waitFor(() =>
      expect(screen.getAllByText("Home").length).toBeGreaterThan(0),
    );
    expect(localStorage.getItem("language")).toBe("en");
  });
  it("lets the user name the app independently from member names", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(screen.getByRole("heading", { name: "NomNom" })).toBeVisible();
    const appName = screen.getByLabelText("App 名称");
    await userEvent.clear(appName);
    await userEvent.type(appName, "幸福厨房");
    await waitFor(async () =>
      expect((await loadData()).preferences.appName).toBe("幸福厨房"),
    );
    expect(
      screen.getByText("幸福厨房", { selector: ".top-brand strong" }),
    ).toBeVisible();
    expect((await loadData()).roles[0].name).toBe("我");
    expect(document.title).toBe("幸福厨房");
  });
  it("does not show the old management description in the profile hero", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(
      screen.queryByText("管理家庭成员、语言、数据备份和个性设置。"),
    ).not.toBeInTheDocument();
  });
  it("labels family role management as members", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(screen.getByRole("heading", { name: "成员" })).toBeVisible();
    expect(screen.queryByText("家庭角色")).not.toBeInTheDocument();
    expect(screen.getByText(/切换成员后去/)).toBeVisible();
  });
  it("removes the separate personal profile name card", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(screen.queryByText("个人资料")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "我的名字" })).toBeNull();
    expect(screen.queryByLabelText("我的名字")).toBeNull();
    const chefProfile = screen.getByRole("img", {
      name: "Snoopy chef profile illustration",
    });
    expect(chefProfile.querySelector(".profile-bg")).toBeInTheDocument();
    expect(chefProfile.querySelector("image")).toHaveAttribute(
      "href",
      "/illustrations/snoopy-profile-pan.png",
    );
    expect(chefProfile.querySelectorAll(".profile-steam")).toHaveLength(3);
    expect(screen.getByLabelText("App 名称")).toBeVisible();
  });
  it("adds a recipe to tonight from the recipe catalogue", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    const picks = await screen.findAllByRole("button", { name: /今晚想吃/ });
    await userEvent.click(picks[0]);
    expect(picks[0]).toHaveClass("just-picked");
    expect(picks[0]).toHaveTextContent("已加入");
    const actionRow = picks[0].closest(".card-actions");
    expect(actionRow).toHaveClass("two-actions");
    expect(actionRow?.children).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "查看/编辑" })[0],
    ).toBeVisible();
    await waitFor(async () =>
      expect((await loadData()).mealPlans[0]?.meal).toBe("dinner"),
    );
  });
  it("rests the approved Snoopy trio on the recipe search border", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    const artwork = await screen.findByRole("img", {
      name: "Three Snoopy characters resting on the recipe search border",
    });
    expect(artwork.parentElement).toHaveClass("recipe-search");
    expect(artwork.querySelector("img")).toHaveAttribute(
      "src",
      "/illustrations/snoopy-search-trio.png",
    );
    expect(screen.getByLabelText("recipe search")).toHaveAttribute(
      "placeholder",
      "搜索菜名或食材",
    );
  });
  it("shows and persists editable recipe categories", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    expect(await screen.findByRole("button", { name: "肉类" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /管理分类/ }));
    await userEvent.type(screen.getByLabelText("new category"), "主食");
    await userEvent.click(screen.getByRole("button", { name: "添加" }));
    await waitFor(async () =>
      expect(
        (await loadData()).categories.some((item) => item.name === "主食"),
      ).toBe(true),
    );
  });
  it("uses a bottom mobile navigation with the five requested modules", async () => {
    const { container } = render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    for (const name of ["首页", "菜单", "食记", "冰箱", "我"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
    const homeTabs = container.querySelector('[data-bubble-tabs="home"]')!;
    expect(homeTabs).toHaveClass("module-tabs");
    expect(homeTabs.querySelectorAll(":scope > button")).toHaveLength(2);
    expect(homeTabs.querySelectorAll(":scope > button > svg")).toHaveLength(2);
    const bottomNav = container.querySelector(".bottom-nav")!;
    expect(bottomNav).toBeInTheDocument();
    expect(
      Array.from(
        bottomNav.querySelectorAll<HTMLImageElement>("[data-nav-character]"),
      ).map((image) => image.getAttribute("src")),
    ).toEqual([
      "/nav/snoopy-home.png",
      "/nav/snoopy-menu.png",
      "/nav/snoopy-foodlog.png",
      "/nav/snoopy-fridge.png",
      "/nav/snoopy-me.png",
    ]);
    expect(
      Array.from(
        bottomNav.querySelectorAll<HTMLElement>("[data-nav-effect]"),
      ).map((effect) => effect.dataset.navEffect),
    ).toEqual(["hearts", "hearts", "hearts", "hearts", "hearts"]);
    expect(container.querySelector(".sidebar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "历史记录" })).toBeNull();
    const weeklyPlan = screen.getByRole("button", { name: /一周安排/ });
    expect(weeklyPlan).toBeVisible();
    await userEvent.click(weeklyPlan);
    await waitFor(() =>
      expect(container.querySelector(".week-board")).toBeVisible(),
    );
    const weekBoard = container.querySelector<HTMLElement>(".week-board")!;
    expect(weekBoard.dataset.enabledMeals).toBe("lunch,dinner");
    expect(weekBoard.style.getPropertyValue("--enabled-meal-count")).toBe("2");
    expect(weekBoard.querySelectorAll(".meal-card")).toHaveLength(14);
    expect(weekBoard).not.toHaveTextContent("早餐");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    expect(screen.queryByRole("button", { name: /一周安排/ })).toBeNull();
    expect(screen.getByRole("button", { name: /购物清单/ })).toBeVisible();
    const orderTabs = container.querySelector('[data-bubble-tabs="order"]')!;
    expect(orderTabs.querySelectorAll(":scope > button")).toHaveLength(2);
    expect(orderTabs.querySelectorAll(":scope > button > svg")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(await screen.findByText("新手教程")).toBeVisible();
  });
  it("pops the menu icon when the menu destination is clicked", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    const menuButton = screen.getByRole("button", { name: "菜单" });

    const firstIcon = menuButton.querySelector("[data-nav-character]");
    await userEvent.click(menuButton);

    expect(menuButton).toHaveClass("menu-icon-popping");
    const animatedIcon = menuButton.querySelector("[data-nav-character]");
    expect(animatedIcon).not.toBe(firstIcon);

    await userEvent.click(menuButton);
    expect(menuButton.querySelector("[data-nav-character]")).not.toBe(
      animatedIcon,
    );
  });
  it("applies the muted macaron palette to the warm illustration theme", async () => {
    const { container } = render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    const warmTheme = await screen.findByRole("button", { name: /暖色插画/ });
    expect(
      screen.queryByText("低饱和马卡龙色与圆润插画"),
    ).not.toBeInTheDocument();
    await userEvent.click(warmTheme);

    const shell = container.querySelector<HTMLElement>(".app-shell")!;
    expect(shell).toHaveClass("theme-warm");
    expect(shell.style.getPropertyValue("--warm-peach")).toBe("#e4a38c");
    expect(shell.style.getPropertyValue("--warm-apricot")).toBe("#edc394");
    expect(shell.style.getPropertyValue("--warm-sage")).toBe("#afbea8");
    expect(
      container.querySelectorAll('[data-nav-icon-style="hybrid"]'),
    ).toHaveLength(5);
  });
  it("switches and persists the glass theme", async () => {
    const { container } = render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(
      await screen.findByRole("heading", { name: "界面风格" }),
    ).toBeVisible();
    expect(screen.queryByText("App 皮肤")).not.toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll(".theme-grid button")).map(
        (button) => button.textContent,
      ),
    ).toEqual(["◉默认", "☀️暖色插画", "◌毛玻璃", "🖼️自定义图片"]);
    const snoopyTheme = screen.getByRole("button", { name: /默认$/ });
    expect(screen.queryByText("黑白橙简约手绘插画")).not.toBeInTheDocument();
    expect(snoopyTheme).toHaveClass("active");
    const liquidGlass = await screen.findByRole("button", {
      name: /毛玻璃$/,
    });
    expect(
      screen.queryByText("折射 31 · 深度 20 · 无色散磨砂"),
    ).not.toBeInTheDocument();
    await userEvent.click(liquidGlass);
    expect(container.querySelector(".app-shell")).toHaveClass("theme-glass");
    expect(
      screen.queryByRole("img", { name: "Snoopy chef profile illustration" }),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-nav-character]")).toHaveLength(0);
    expect(
      container.querySelectorAll("[data-nav-icon-style='glass']"),
    ).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    expect(
      screen.queryByRole("img", {
        name: "Three Snoopy characters resting on the recipe search border",
      }),
    ).not.toBeInTheDocument();
    expect(liquidGlass).toHaveClass("active");
    const shell = container.querySelector<HTMLElement>(".app-shell")!;
    expect(shell.style.getPropertyValue("--ambient-one")).toBe(
      "rgba(205, 224, 234, 0.72)",
    );
    expect(shell.style.getPropertyValue("--ambient-two")).toBe(
      "rgba(242, 247, 250, 0.82)",
    );
    expect(shell.style.getPropertyValue("--illustration-spark")).toBe(
      "#eaf9ff",
    );
    expect(shell.style.getPropertyValue("--glass-refraction")).toBe("31");
    expect(shell.style.getPropertyValue("--glass-depth")).toBe("20");
    expect(shell.style.getPropertyValue("--glass-dispersion")).toBe("0");
    expect(shell.style.getPropertyValue("--glass-frost")).toBe("100");
    expect(shell.style.getPropertyValue("--glass-light")).toBe("45");
    expect(shell.style.getPropertyValue("--glass-sky")).toBe("#dbe3e8");
    expect(shell.style.getPropertyValue("--glass-water")).toBe("#9fc9dc");
    expect(shell.style.getPropertyValue("--glass-panel")).toBe(
      "rgba(246, 250, 252, 0.48)",
    );
    expect(shell.style.getPropertyValue("--glass-edge")).toBe(
      "rgba(255, 255, 255, 0.52)",
    );
    expect(shell.style.getPropertyValue("--glass-ink")).toBe("#18384c");
    expect(shell.style.getPropertyValue("--glass-item")).toBe(
      "rgba(224, 240, 248, 0.58)",
    );
    await waitFor(async () =>
      expect((await loadData()).preferences.theme).toBe("glass"),
    );
  });
  it("stores device images for a custom background and user avatar", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(
      document.querySelector('.role-list input[type="color"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("upload avatar for 我")).toBeInTheDocument();
    const image = new File([new Uint8Array([137, 80, 78, 71])], "photo.png", {
      type: "image/png",
    });
    await userEvent.upload(
      screen.getByLabelText("custom background image"),
      image,
    );
    await waitFor(async () => {
      const saved = await loadData();
      expect(saved.preferences.theme).toBe("custom");
      expect(saved.preferences.customBackground).toMatch(/^data:image\/png/);
    });
    const shell = document.querySelector<HTMLElement>(".app-shell")!;
    expect(shell.style.getPropertyValue("--custom-background-width")).toBe(
      "60%",
    );
    expect(shell.style.getPropertyValue("--custom-primary")).toBe("#806151");
    expect(shell.style.getPropertyValue("--custom-selected")).toBe("#6f5143");
    expect(shell.style.getPropertyValue("--custom-accent")).toBe("#d99a62");
    expect(shell.style.getPropertyValue("--custom-soft")).toBe("#f3e9df");
    expect(shell.style.getPropertyValue("--custom-ink")).toBe("#3e332e");
    expect(shell.style.getPropertyValue("--custom-on-primary")).toBe("#fffaf6");
    expect(
      document.querySelectorAll('[data-nav-icon-style="hybrid"]'),
    ).toHaveLength(5);
    expect(
      screen.getByRole("img", { name: "当前自定义背景预览" }),
    ).toBeVisible();
    const backgroundInput = screen.getByLabelText(
      "custom background image",
    ) as HTMLInputElement;
    expect(backgroundInput.value).toBe("");
    expect(screen.getByRole("button", { name: /更换背景图片/ })).toBeVisible();
    const replacement = new File([new Uint8Array([255, 216, 255])], "new.jpg", {
      type: "image/jpeg",
    });
    await userEvent.upload(backgroundInput, replacement);
    await waitFor(async () =>
      expect((await loadData()).preferences.customBackground).toMatch(
        /^data:image\/jpeg/,
      ),
    );
    expect(backgroundInput.value).toBe("");
    await userEvent.upload(
      screen.getByLabelText("upload avatar for 我"),
      image,
    );
    await waitFor(async () =>
      expect((await loadData()).roles[0].avatar).toMatch(/^data:image\/png/),
    );
    expect(await screen.findByAltText("我 avatar")).toBeVisible();
  });
  it("renders code-drawn dish illustrations instead of emoji placeholders", async () => {
    const { container } = render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    expect(
      await screen.findAllByRole("img", { name: "dish illustration" }),
    ).toHaveLength(initialData.recipes.length);
    expect(container.querySelector(".illustration-meat svg")).toBeVisible();
    expect(container.querySelector(".illustration-soup svg")).toBeVisible();
    expect(container.querySelector(".app-shell")).toHaveStyle({
      "--orange": "rgb(240, 160, 40)",
    });
  });
  it("limits fridge entry units to pieces, grams and kilograms", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "冰箱" }));
    const unitSelect = screen.getByLabelText(
      "fridge unit",
    ) as HTMLSelectElement;
    expect([...unitSelect.options].map((option) => option.value)).toEqual([
      "piece",
      "g",
      "kg",
    ]);
    expect([...unitSelect.options].map((option) => option.text)).toEqual([
      "件",
      "克",
      "千克",
    ]);
    const ingredient = screen.getByPlaceholderText("食材名称");
    await userEvent.type(ingredient, "牛排");
    expect(unitSelect.options[0].text).toBe("块");
    await userEvent.clear(ingredient);
    await userEvent.type(ingredient, "小白菜");
    expect(unitSelect.options[0].text).toBe("把");
    await userEvent.clear(ingredient);
    await userEvent.type(ingredient, "鸡蛋");
    expect(unitSelect.options[0].text).toBe("个");
  });
  it("uploads, previews, and persists a photo for a food log entry", async () => {
    await saveData({
      ...structuredClone(initialData),
      history: [
        {
          id: "history-dinner",
          date: "2026-08-25",
          meal: "dinner",
          diners: 2,
          dishes: [
            {
              name: "番茄炒蛋",
              orderedBy: ["我"],
              votes: [],
              completed: true,
            },
          ],
        },
      ],
    });
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "食记" }));
    const photo = new File([new Uint8Array([137, 80, 78, 71])], "dinner.png", {
      type: "image/png",
    });
    await userEvent.upload(
      await screen.findByLabelText(
        "upload history photo for 2026-08-25 dinner",
      ),
      photo,
    );
    await waitFor(async () =>
      expect(
        (await loadData()).history[0].image?.startsWith("data:image/png"),
      ).toBe(true),
    );
    expect(
      await screen.findByAltText("2026-08-25 晚餐 食记照片"),
    ).toBeVisible();
    expect(screen.getByText("更换照片")).toBeVisible();
  });
  it("uploads and persists a dish photo directly from the menu card", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    const photo = new File([new Uint8Array([137, 80, 78, 71])], "dish.png", {
      type: "image/png",
    });
    await userEvent.upload(
      await screen.findByLabelText("upload photo for 柠香鸡胸沙拉"),
      photo,
    );
    await waitFor(async () =>
      expect((await loadData()).recipes[0].image).toMatch(/^data:image\/png/),
    );
    expect(await screen.findByAltText("柠香鸡胸沙拉")).toBeVisible();
    expect(screen.getByText("更换照片")).toBeVisible();
  });
  it("renders the new offline illustrations and animated page structure", async () => {
    const { container } = render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("img", {
        name: "Snoopy cooking with two family chefs",
      }),
    ).toBeVisible();
    expect(container.querySelectorAll(".ambient-shapes span")).toHaveLength(3);
    expect(container.querySelector(".content")).toHaveClass("page-enter");
    await userEvent.click(screen.getByRole("button", { name: "食记" }));
    expect(
      await screen.findByRole("img", {
        name: "Snoopy wondering beside an empty plate",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "食记" })).toHaveClass("active");
  });
});
