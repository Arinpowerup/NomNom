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
  it("adds a recipe to tonight from the recipe catalogue", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    await userEvent.click(screen.getByRole("button", { name: "点菜" }));
    const picks = await screen.findAllByRole("button", { name: /今晚想吃/ });
    await userEvent.click(picks[0]);
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
    await userEvent.click(screen.getByRole("button", { name: "点菜" }));
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
  it("uses the five requested primary modules and keeps planning under Order", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("今晚想吃点什么？");
    for (const name of ["首页", "点菜", "食记", "冰箱", "我"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
    expect(screen.queryByRole("button", { name: "历史记录" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "点菜" }));
    expect(
      await screen.findByRole("button", { name: /一周安排/ }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /购物清单/ })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "我" }));
    expect(await screen.findByText("新手教程")).toBeVisible();
  });
});
