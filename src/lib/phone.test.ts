import { describe, expect, it } from "vitest";
import { formatPhone } from "./phone";

describe("international phone formatting", () => {
  it("formats Australian mobile numbers as E.164", () => {
    expect(formatPhone("+61", "0412 345 678")).toBe("+61412345678");
    expect(formatPhone("+61", "+61 412 345 678")).toBe("+61412345678");
  });
  it("formats mainland China mobile numbers as E.164", () => {
    expect(formatPhone("+86", "138 0013 8000")).toBe("+8613800138000");
  });
  it("rejects invalid numbers for each country", () => {
    expect(() => formatPhone("+61", "12345")).toThrow("澳洲手机号");
    expect(() => formatPhone("+86", "12800138000")).toThrow("中国大陆手机号");
  });
});
