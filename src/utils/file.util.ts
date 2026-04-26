import * as fs from 'fs';
export async function safeUnlink(path: string) {
  try {
    await fs.promises.unlink(path);
  } catch {}
}