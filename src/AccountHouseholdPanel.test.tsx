import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AppProvider } from "./context/AppContext";

const mocks = vi.hoisted(() => ({
  createInvite: vi.fn(),
  joinWithCode: vi.fn(),
  selectHousehold: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./households/HouseholdContext", () => ({
  useOptionalHousehold: () => ({
    household: { id: "h1", name: "lalaland", role: "owner" },
    households: [{ id: "h1", name: "lalaland", role: "owner" }],
    selectHousehold: mocks.selectHousehold,
    createInvite: mocks.createInvite,
    joinWithCode: mocks.joinWithCode,
  }),
}));
vi.mock("./auth/AuthContext", () => ({
  useOptionalAuth: () => ({ user: { email: "member@example.com" }, signOut: mocks.signOut }),
}));
import { AccountHouseholdPanel } from "./App";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createInvite.mockResolvedValue("FAMILY7");
  mocks.joinWithCode.mockResolvedValue(undefined);
});

it("places household invitation, joining, and sign out controls in the profile panel", async () => {
  render(<AppProvider><AccountHouseholdPanel /></AppProvider>);
  expect(screen.getByRole("heading", { name: "账户与家庭" })).toBeVisible();
  expect(screen.getByText("member@example.com")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "生成成员邀请码" }));
  expect(await screen.findByLabelText("成员邀请码")).toHaveTextContent("FAMILY7");
  await userEvent.type(screen.getByLabelText("输入家庭邀请码"), "abc123");
  await userEvent.click(screen.getByRole("button", { name: "加入家庭" }));
  await waitFor(() => expect(mocks.joinWithCode).toHaveBeenCalledWith("ABC123"));
  await userEvent.click(screen.getByRole("button", { name: "退出登录" }));
  expect(mocks.signOut).toHaveBeenCalledOnce();
});
