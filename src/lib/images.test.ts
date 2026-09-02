import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, MAX_SOURCE_IMAGE_BYTES, calculateCropPlacement, validateImage, validateSourceImage } from "./images";

describe("image upload safety", () => {
  it("accepts supported family photos", () => {
    expect(() => validateImage(new File(["ok"], "meal.webp", { type: "image/webp" }))).not.toThrow();
  });

  it("accepts iPhone HEIC and HEIF photos as conversion sources", () => {
    expect(() => validateSourceImage(new File(["heic"], "meal.HEIC", { type: "image/heic" }))).not.toThrow();
    expect(() => validateSourceImage(new File(["heif"], "meal.heif", { type: "" }))).not.toThrow();
  });

  it("calculates centered, dragged, and zoomed crop placement", () => {
    expect(
      calculateCropPlacement(2000, 1000, 1000, 700, {
        positionX: 50,
        positionY: 50,
        zoom: 1,
      }),
    ).toEqual({ x: -200, y: 0, width: 1400, height: 700 });

    expect(
      calculateCropPlacement(2000, 1000, 1000, 700, {
        positionX: 0,
        positionY: 100,
        zoom: 2,
      }),
    ).toEqual({ x: 0, y: -700, width: 2800, height: 1400 });
  });
  it("rejects executable and oversized uploads", () => {
    expect(() => validateImage(new File(["x"], "bad.svg", { type: "image/svg+xml" }))).toThrow("JPG");
    const large = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.jpg", { type: "image/jpeg" });
    expect(() => validateImage(large)).toThrow("5MB");
    const hugeSource = new File([new Uint8Array(MAX_SOURCE_IMAGE_BYTES + 1)], "huge.heic", { type: "image/heic" });
    expect(() => validateSourceImage(hugeSource)).toThrow("20MB");
  });
});