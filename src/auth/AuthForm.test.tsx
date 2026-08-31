import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ signUp: vi.fn(), signInWithPassword: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: { auth } }));
import { AuthForm } from "./AuthForm";

describe("email authentication", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    auth.signUp.mockResolvedValue({ data: { session: {} }, error: null });
  });

  it("centers the NomNom brand without the Family label or phone login", () => {
    render(<AuthForm />);
    const brand = screen.getByText("NomNom").closest(".auth-brand");
    expect(brand).toBeInTheDocument();
    expect(brand?.tagName).toBe("DIV");
    expect(screen.getByRole("img", { name: "NomNom logo" }))
      .toHaveAttribute("src", "/brand/nomnom-mark.png");
    expect(screen.queryByText(/family/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "手机号登录" })).not.toBeInTheDocument();
  });

  it("signs in with email and password", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    await user.type(screen.getByLabelText("邮箱"), " user@example.com ");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: "登录" }));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "password123" });
  });
});
