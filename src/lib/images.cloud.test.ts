import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  upload: vi.fn(),
  createSignedUrl: vi.fn(),
  from: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabase: {
    storage: {
      from: storage.from,
    },
  },
}));

import { storeImage } from "./images";

describe("cloud image upload", () => {
  beforeEach(() => {
    storage.upload.mockReset().mockResolvedValue({ data: {}, error: null });
    storage.createSignedUrl.mockReset().mockResolvedValue({
      data: { signedUrl: "https://example.test/meal.jpg" },
      error: null,
    });
    storage.from.mockReset().mockReturnValue({
      upload: storage.upload,
      createSignedUrl: storage.createSignedUrl,
    });
  });

  it("uploads a prepared crop as binary instead of multipart FormData", async () => {
    const result = await storeImage(
      "11111111-1111-4111-8111-111111111111",
      new File([new Uint8Array([255, 216, 255, 217])], "meal-cropped.jpg", {
        type: "image/jpeg",
      }),
      "history",
      { prepared: true },
    );

    expect(result).toBe("https://example.test/meal.jpg");
    expect(storage.from).toHaveBeenCalledWith("family-images");
    expect(storage.upload).toHaveBeenCalledTimes(1);
    const [, body, options] = storage.upload.mock.calls[0];
    expect(body).toBeInstanceOf(ArrayBuffer);
    expect(body).not.toBeInstanceOf(FormData);
    expect(options).toEqual({ contentType: "image/jpeg", upsert: false });
  });

  it("returns a useful upload-stage error", async () => {
    storage.upload.mockResolvedValue({
      data: null,
      error: { message: "INVALID_IMAGE" },
    });

    await expect(
      storeImage(
        "11111111-1111-4111-8111-111111111111",
        new File(["jpeg"], "meal.jpg", { type: "image/jpeg" }),
        "history",
        { prepared: true },
      ),
    ).rejects.toThrow("照片上传失败：INVALID_IMAGE");
  });
});