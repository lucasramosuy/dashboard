import { join } from "path";

const DATA_DIR = process.env.DATA_DIR ?? "./data";

export async function readJson<T>(filename: string): Promise<T> {
  const path = join(DATA_DIR, filename);
  const file = Bun.file(path);
  
  if (await file.exists()) {
    return await file.json();
  }
  
  // If file doesn't exist, return an empty array as default
  // (In a more robust system, this might depend on the specific collection)
  return [] as unknown as T;
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  const path = join(DATA_DIR, filename);
  await Bun.write(path, JSON.stringify(data, null, 2));
}
