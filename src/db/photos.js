// Багажны зургийг хөтчийн IndexedDB-д хадгална (localStorage-ийн хэмжээ хүрэлцэхгүй тул).
// Уурхайн database-тай холбохдоо энэ файлыг файл хадгалах сервис рүү (S3, Supabase Storage гэх мэт) солино.

const DB_NAME = "minetool-photos";
const STORE = "photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  const database = await open();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
};

// Том зургийг 960px хүртэл жижигрүүлж JPEG болгоно.
async function compress(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Зургийг боловсруулж чадсангүй"))), "image/jpeg", 0.82)
  );
}

const urlCache = new Map(); // toolId:rev -> object URL

export async function savePhoto(toolId, file) {
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Зураг 5 МБ-аас их байна");
  const blob = await compress(file);
  await run("readwrite", (s) => s.put(blob, toolId));
}

export async function deletePhoto(toolId) {
  await run("readwrite", (s) => s.delete(toolId));
  for (const k of [...urlCache.keys()]) if (k.startsWith(toolId + ":")) urlCache.delete(k);
}

export async function getPhotoUrl(toolId, rev = 0) {
  const key = `${toolId}:${rev}`;
  if (urlCache.has(key)) return urlCache.get(key);
  const blob = await run("readonly", (s) => s.get(toolId));
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}
