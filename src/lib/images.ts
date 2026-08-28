import { supabase } from "./supabase";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImage(file: File) {
  if (!ALLOWED.has(file.type)) throw new Error("仅支持 JPG、PNG 或 WebP 图片");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("图片不能超过 5MB");
}

const dataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file);
});

export async function storeImage(householdId: string | undefined, file: File, kind: "recipes" | "history" | "avatars") {
  validateImage(file);
  if (!householdId || !supabase) return dataUrl(file);
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${householdId}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("family-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage.from("family-images").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError) throw signError;
  return data.signedUrl;
}
