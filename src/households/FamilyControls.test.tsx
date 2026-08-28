import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const { listHouseholds } = vi.hoisted(() => ({ listHouseholds: vi.fn() }));
vi.mock("../lib/households", () => ({ listHouseholds, createHousehold: vi.fn(), joinHousehold: vi.fn(), createInvite: vi.fn() }));
import { HouseholdGate } from "./HouseholdContext";

it("shows family switching and invitations to an owner", async () => {
  listHouseholds.mockResolvedValueOnce([{ id: "h1", name: "我们的家", role: "owner" }]);
  render(<HouseholdGate><div>shared app</div></HouseholdGate>);
  expect(await screen.findByRole("combobox", { name: "当前家庭" })).toHaveValue("h1");
  expect(screen.getByRole("button", { name: "邀请成员" })).toBeInTheDocument();
});
