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
    expect(screen.getAllByText("首页").length).toBeGreaterThan(0);
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
    expect(screen.getByText("幸福厨房", { selector: ".top-brand strong" })).toBeVisible();
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
    expect(container.querySelector(".bottom-nav")).toBeInTheDocument();
    expect(container.querySelector(".sidebar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "历史记录" })).toBeNull();
    const weeklyPlan = screen.getByRole("button", { name: /一周安排/ });
    expect(weeklyPlan).toBeVisible();
    await userEvent.click(weeklyPlan);
    await waitFor(() =>
      expect(container.querySelector(".week-board")).toBeVisible(),
    );
    await userEvent.click(screen.getByRole("button", { name: "菜单" }));
    expect(screen.queryByRole("button", { name: /一周安排/ })).toBeNull();
    expect(screen.getByRole("button", { name: /购物清单/ })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(await screen.findByText("新手教程")).toBeVisible();
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
    const liquidGlass = await screen.findByRole("button", {
      name: /蓝白 Liquid Glass/,
    });
    expect(liquidGlass).toHaveTextContent("蓝色、白色与透明流光");
    await userEvent.click(liquidGlass);
    expect(container.querySelector(".app-shell")).toHaveClass("theme-glass");
    expect(liquidGlass).toHaveClass("active");
    const shell = container.querySelector<HTMLElement>(".app-shell")!;
    expect(shell.style.getPropertyValue("--ambient-one")).toBe(
      "rgba(78, 167, 245, 0.42)",
    );
    expect(shell.style.getPropertyValue("--ambient-two")).toBe(
      "rgba(203, 235, 255, 0.72)",
    );
    expect(shell.style.getPropertyValue("--illustration-spark")).toBe(
      "#bfe8ff",
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
        name: "NomNom cooking illustration",
      }),
    ).toBeVisible();
    expect(container.querySelectorAll(".ambient-shapes span")).toHaveLength(3);
    expect(container.querySelector(".content")).toHaveClass("page-enter");
    await userEvent.click(screen.getByRole("button", { name: "食记" }));
    expect(
      await screen.findByRole("img", { name: "empty plate illustration" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "食记" })).toHaveClass("active");
  });
});
