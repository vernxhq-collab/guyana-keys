export async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Use a JPEG or PNG photo.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("That photo could not be prepared.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82));
  if (!blob) throw new Error("That photo could not be prepared.");
  return blob;
}
