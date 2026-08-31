import { describe, expect, it } from "vitest";
import { getPhoneMockConfig } from "./phoneMock";

describe("phone auth mock configuration", () => {
  it("only enables mock mode with an explicit valid six-digit OTP", () => {
    expect(getPhoneMockConfig({ VITE_PHONE_AUTH_MODE: "mock", VITE_PHONE_MOCK_OTP: "246810" })).toEqual({ otp: "246810" });
    expect(getPhoneMockConfig({ VITE_PHONE_AUTH_MODE: "mock", VITE_PHONE_MOCK_OTP: "123" })).toBeNull();
    expect(getPhoneMockConfig({ VITE_PHONE_MOCK_OTP: "246810" })).toBeNull();
  });
});
