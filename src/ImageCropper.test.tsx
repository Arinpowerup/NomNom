import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageCropper } from "./ImageCropper";
import { cropImage } from "./lib/images";

vi.mock("./lib/images", () => ({
  cropImage: vi.fn(async (file: File) =>
    new File([file], "cropped.jpg", { type: "image/jpeg" }),
  ),
}));

beforeEach(() => {
  vi.mocked(cropImage).mockClear();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:food-log-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("ImageCropper", () => {
  it("lets the user drag, zoom, and confirm a cropped photo", async () => {
    const onConfirm = vi.fn();
    render(
      <ImageCropper
        file={new File(["photo"], "meal.heic", { type: "image/heic" })}
        language="zh"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const viewport = screen.getByLabelText("照片裁剪区域");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 280,
      x: 0,
      y: 0,
      top: 0,
      right: 400,
      bottom: 280,
      left: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 200, clientY: 140 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 240, clientY: 112 });
    fireEvent.change(screen.getByLabelText("照片缩放"), { target: { value: "1.5" } });
    await userEvent.click(screen.getByRole("button", { name: "使用照片" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(cropImage).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ positionX: 40, positionY: 60, zoom: 1.5 }),
    );
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      name: "cropped.jpg",
      type: "image/jpeg",
    });
  });
});