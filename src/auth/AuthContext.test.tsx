import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: false, supabase: null }));
import { AuthGate } from "./AuthContext";
describe("Supabase auth gate", () => { it("shows actionable setup when Supabase is not configured", () => { render(<AuthGate><div>private app</div></AuthGate>); expect(screen.getByRole("alert")).toHaveTextContent("连接 Supabase"); expect(screen.getByText("VITE_SUPABASE_URL")).toBeInTheDocument(); expect(screen.queryByText("private app")).not.toBeInTheDocument(); }); });
