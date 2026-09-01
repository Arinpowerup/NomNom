import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

const { listHouseholds, listHouseholdMembers, joinHousehold } = vi.hoisted(() => ({ listHouseholds: vi.fn(), listHouseholdMembers: vi.fn(), joinHousehold: vi.fn() }));
vi.mock("../lib/households", () => ({ listHouseholds, listHouseholdMembers, createHousehold: vi.fn(), joinHousehold, createInvite: vi.fn(), renameHousehold: vi.fn(), leaveHousehold: vi.fn() }));
import { HouseholdGate, useHousehold } from "./HouseholdContext";

function Probe() {
  const family = useHousehold();
  return <div>
    <span>{family.household.name}</span>
    <button onClick={() => void family.joinWithCode("ABC123")}>join probe</button>
  </div>;
}

it("keeps household actions in context without rendering floating controls", async () => {
  listHouseholdMembers.mockResolvedValue([]);
  listHouseholds
    .mockResolvedValueOnce([{ id: "h1", name: "我们的家", role: "owner" }])
    .mockResolvedValueOnce([
      { id: "h1", name: "我们的家", role: "owner" },
      { id: "h2", name: "新家庭", role: "member" },
    ]);
  joinHousehold.mockResolvedValueOnce("h2");
  const { container } = render(<HouseholdGate><Probe /></HouseholdGate>);
  expect(await screen.findByText("我们的家")).toBeInTheDocument();
  expect(container.querySelector(".family-controls")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "join probe" }));
  await waitFor(() => expect(screen.getByText("新家庭")).toBeInTheDocument());
  expect(joinHousehold).toHaveBeenCalledWith("ABC123");
});
