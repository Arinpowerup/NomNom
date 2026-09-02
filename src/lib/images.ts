import { supabase } from "./supabase";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MOBILE_SOURCE_TYPES = new Set([...ALLOWED, "image/heic", "image/heif"]);

export function validateImage(file: File) {
  if (!ALLOWED.has(file.type)) throw new Error("仅支持 JPG、PNG 或 WebP 图片");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("图片不能超过 5MB");
}

export function validateSourceImage(file: File) {
  const type = file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isHeicByName = extension === "heic" || extension === "heif";
  if (!MOBILE_SOURCE_TYPES.has(type) && !isHeicByName) {
    throw new Error("仅支持 JPG、PNG、WebP、HEIC 或 HEIF 图片");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error("原始图片不能超过 20MB");
}

const dataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file);
});

const loadBrowserImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("手机无法读取这张照片，请尝试选择原图或截图后上传")); };
  image.src = url;
});

export async function normalizeImageForUpload(file: File, maxDimension = 2048) {
  validateSourceImage(file);
  const image = await loadBrowserImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法处理图片");
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("图片转换失败")), "image/jpeg", 0.88));
  const normalized = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
  validateImage(normalized);
  return normalized;
}


export type CropSettings = { positionX: number; positionY: number; zoom: number };

export function calculateCropPlacement(sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number, settings: CropSettings) {
  const zoom = Math.max(1, Math.min(3, settings.zoom));
  const scale = Math.max(outputWidth / sourceWidth, outputHeight / sourceHeight) * zoom;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const positionX = Math.max(0, Math.min(100, settings.positionX)) / 100;
  const positionY = Math.max(0, Math.min(100, settings.positionY)) / 100;
  const overflowX = width - outputWidth;
  const overflowY = height - outputHeight;
  return {
    x: overflowX === 0 || positionX === 0 ? 0 : -overflowX * positionX,
    y: overflowY === 0 || positionY === 0 ? 0 : -overflowY * positionY,
    width,
    height,
  };
}

export async function cropImage(file: File, settings: CropSettings, outputWidth = 1200, outputHeight = 840) {
  validateSourceImage(file);
  const image = await loadBrowserImage(file);
  const placement = calculateCropPlacement(image.naturalWidth, image.naturalHeight, outputWidth, outputHeight, settings);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法处理图片");
  context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("图片裁剪失败")), "image/jpeg", 0.9));
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "food-log"}-cropped.jpg`, { type: "image/jpeg" });
}
export async function storeImage(householdId: string | undefined, file: File, kind: "recipes" | "history" | "avatars") {
  if (!householdId || !supabase) {
    validateSourceImage(file);
    return dataUrl(file);
  }
  const uploadFile = await normalizeImageForUpload(file);
  const path = `${householdId}/${kind}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("family-images").upload(path, uploadFile, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage.from("family-images").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError) throw signError;
  return data.signedUrl;
}