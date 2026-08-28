import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

const { listHouseholds, createInvite } = vi.hoisted(() => ({ listHouseholds: vi.fn(), createInvite: vi.fn() }));
vi.mock("../lib/households", () => ({ listHouseholds, createHousehold: vi.fn(), joinHousehold: vi.fn(), createInvite }));
import { HouseholdGate } from "./HouseholdContext";

it("shows the Supabase error when invite generation fails", async () => {
  listHouseholds.mockResolvedValueOnce([{ id: "h1", name: "我们的家", role: "owner" }]);
  createInvite.mockRejectedValueOnce({ message: "Database function is unavailable" });
  const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);

  render(<HouseholdGate><div>shared app</div></HouseholdGate>);
  await userEvent.click(await screen.findByRole("button", { name: "邀请成员" }));

  expect(alert).toHaveBeenCalledWith("Database function is unavailable");
  alert.mockRestore();
});
