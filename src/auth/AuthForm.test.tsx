import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({ supabase: { auth } }));
import { AuthForm } from "./AuthForm";

describe("multi-method authentication", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({ error: null });
  });

  it("offers email and phone login tabs", () => {
    render(<AuthForm />);
    expect(screen.getByRole("tab", { name: "邮箱登录" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "手机号登录" })).toBeInTheDocument();
  });

  it("sends and verifies an Australian SMS code", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    await user.click(screen.getByRole("tab", { name: "手机号登录" }));
    expect(screen.getByLabelText("国家或地区区号")).toHaveValue("+61");
    await user.type(screen.getByLabelText("手机号"), "0412 345 678");
    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: "+61412345678", options: { shouldCreateUser: false } });
    await user.type(screen.getByLabelText("短信验证码"), "123456");
    await user.click(screen.getByRole("button", { name: "验证并登录" }));
    expect(auth.verifyOtp).toHaveBeenCalledWith({ phone: "+61412345678", token: "123456", type: "sms" });
  });

  it("validates a mainland China number before sending", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    await user.click(screen.getByRole("tab", { name: "手机号登录" }));
    await user.selectOptions(screen.getByLabelText("国家或地区区号"), "+86");
    await user.type(screen.getByLabelText("手机号"), "12345");
    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    expect(await screen.findByRole("status")).toHaveTextContent("中国大陆手机号");
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("shows a configured test OTP without sending a real SMS", async () => {
    vi.stubEnv("VITE_PHONE_AUTH_MODE", "mock");
    vi.stubEnv("VITE_PHONE_MOCK_OTP", "246810");
    const user = userEvent.setup();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    render(<AuthForm />);
    await user.click(screen.getByRole("tab", { name: "手机号登录" }));
    await user.type(screen.getByLabelText("手机号"), "0412 345 678");
    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    expect(screen.getByRole("note")).toHaveTextContent("246810");
    expect(screen.getByRole("status")).toHaveTextContent("不会发送真实短信");
    expect(info).toHaveBeenCalledWith("[NomNom Mock SMS] +61412345678: 246810");
    info.mockRestore();
  });
});
