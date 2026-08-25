import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function alphaRange(fileName: string) {
  const png = readFileSync(resolve("public/nav", fileName));
  expect(png.subarray(0, 8)).toEqual(signature);
  expect(png.toString("ascii", 12, 16)).toBe("IHDR");

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(png[24]).toBe(8);
  expect(png[25]).toBe(6);

  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT")
      chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(chunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let source = 0;
  let min = 255;
  let max = 0;
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = raw[source++];
    for (let x = 0; x < stride; x += 1) {
      const encoded = raw[source++];
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const up = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : paeth(left, up, upperLeft);
      current[x] = (encoded + predictor) & 255;
    }
    for (let x = 3; x < stride; x += bytesPerPixel) {
      min = Math.min(min, current[x]);
      max = Math.max(max, current[x]);
    }
    current.copy(previous);
  }

  return { min, max };
}

describe("Snoopy home illustration", () => {
  it("is an RGBA PNG with genuine transparency", () => {
    const alpha = alphaRange("../illustrations/snoopy-cooking-pot.png");
    expect(alpha.min).toBeLessThan(255);
    expect(alpha.max).toBe(255);
  });
});
describe("Snoopy empty-state illustration", () => {
  it("is an RGBA PNG with genuine transparency", () => {
    const alpha = alphaRange("../illustrations/snoopy-empty-plate.png");
    expect(alpha.min).toBeLessThan(255);
    expect(alpha.max).toBe(255);
  });
});
describe("Snoopy navigation PNG assets", () => {
  it.each(["snoopy-menu.png", "snoopy-fridge.png"])(
    "%s is an RGBA PNG with genuinely transparent and opaque pixels",
    (fileName) => {
      const alpha = alphaRange(fileName);
      expect(alpha.min).toBeLessThan(255);
      expect(alpha.max).toBe(255);
    },
  );
});
