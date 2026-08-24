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
    await userEvent.click(screen.getByRole("button", { name: "菜谱" }));
    const picks = await screen.findAllByRole("button", { name: /今晚想吃/ });
    await userEvent.click(picks[0]);
    await waitFor(async () =>
      expect((await loadData()).mealPlans[0]?.meal).toBe("dinner"),
    );
  });
});
