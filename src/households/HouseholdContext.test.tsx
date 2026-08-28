import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { listHouseholds } = vi.hoisted(() => ({ listHouseholds: vi.fn() }));
vi.mock("../lib/households", () => ({ listHouseholds, createHousehold: vi.fn(), joinHousehold: vi.fn(), createInvite: vi.fn() }));
import { HouseholdGate } from "./HouseholdContext";
describe("household gate", () => { beforeEach(() => localStorage.clear()); it("asks a new user to create or join a household", async () => { listHouseholds.mockResolvedValueOnce([]); render(<HouseholdGate><div>shared data</div></HouseholdGate>); expect(await screen.findByRole("heading", { name: "创建家庭" })).toBeInTheDocument(); expect(screen.queryByText("shared data")).not.toBeInTheDocument(); }); it("opens shared content for a household member", async () => { listHouseholds.mockResolvedValueOnce([{ id: "h1", name: "家", role: "member" }]); render(<HouseholdGate><div>shared data</div></HouseholdGate>); expect(await screen.findByText("shared data")).toBeInTheDocument(); }); });
