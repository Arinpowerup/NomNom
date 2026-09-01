import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppProvider } from "./context/AppContext";

const mocks = vi.hoisted(() => ({
  createInvite: vi.fn(),
  joinWithCode: vi.fn(),
  renameCurrentHousehold: vi.fn(),
  leaveCurrentHousehold: vi.fn(),
  selectHousehold: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./households/HouseholdContext", () => ({
  useOptionalHousehold: () => ({
    household: { id: "h1", name: "lalaland", role: "owner" },
    households: [{ id: "h1", name: "lalaland", role: "owner" }],
    members: [
      { userId: "u1", displayName: "Arin", email: "arin@example.com", role: "owner", joinedAt: "2026-01-01" },
      { userId: "u2", displayName: "Mia", email: "mia@example.com", role: "member", joinedAt: "2026-01-02" },
    ],
    selectHousehold: mocks.selectHousehold,
    createInvite: mocks.createInvite,
    joinWithCode: mocks.joinWithCode,
    renameCurrentHousehold: mocks.renameCurrentHousehold,
    leaveCurrentHousehold: mocks.leaveCurrentHousehold,
  }),
}));
vi.mock("./auth/AuthContext", () => ({
  useOptionalAuth: () => ({ user: { email: "member@example.com" }, signOut: mocks.signOut }),
}));
import { AccountHouseholdPanel } from "./App";

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createInvite.mockResolvedValue("FAMILY7");
  mocks.joinWithCode.mockResolvedValue(undefined);
  mocks.renameCurrentHousehold.mockResolvedValue(undefined);
  mocks.leaveCurrentHousehold.mockResolvedValue(undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
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

it("lets the household owner rename the current household", async () => {
  render(<AppProvider><AccountHouseholdPanel /></AppProvider>);
  const input = screen.getByRole("textbox", { name: "家庭名称" });
  await userEvent.clear(input);
  await userEvent.type(input, "快乐厨房");
  await userEvent.click(screen.getByRole("button", { name: "保存名称" }));
  await waitFor(() => expect(mocks.renameCurrentHousehold).toHaveBeenCalledWith("快乐厨房"));
  expect(await screen.findByRole("status")).toHaveTextContent("家庭名称已更新");
});
it("shows household members with their account and role", () => {
  render(<AppProvider><AccountHouseholdPanel /></AppProvider>);
  const members = screen.getByLabelText("家庭成员");
  expect(members).toHaveTextContent("Arin");
  expect(members).toHaveTextContent("arin@example.com");
  expect(members).toHaveTextContent("创建者");
  expect(members).toHaveTextContent("Mia");
  expect(members).toHaveTextContent("成员");
});
it("leaves the current household after confirmation", async () => {
  render(<AppProvider><AccountHouseholdPanel /></AppProvider>);
  await userEvent.click(screen.getByRole("button", { name: "退出当前家庭" }));
  expect(window.confirm).toHaveBeenCalledWith("确定退出当前家庭吗？");
  await waitFor(() => expect(mocks.leaveCurrentHousehold).toHaveBeenCalledOnce());
});