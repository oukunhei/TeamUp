import fs from "fs/promises";
import path from "path";
import { env } from "./env";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const ensureDir = async (dir: string) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
};

export const uploadFile = async (key: string, buffer: Buffer, _contentType: string) => {
  const filePath = path.join(UPLOAD_DIR, key);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buffer);
  return key;
};

export const getFilePath = (key: string) => {
  return path.join(UPLOAD_DIR, key);
};

export const getFileBuffer = async (key: string) => {
  const filePath = path.join(UPLOAD_DIR, key);
  return fs.readFile(filePath);
};

export const deleteFile = async (key: string) => {
  try {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
};

export const fileExists = async (key: string) => {
  try {
    await fs.access(path.join(UPLOAD_DIR, key));
    return true;
  } catch {
    return false;
  }
};

export const generateStorageKey = (ideaId: string, documentId: string, version: number, ext: string) => {
  return `ideas/${ideaId}/documents/${documentId}/v${version}${ext}`;
};

export const BUCKET = env.STORAGE_BUCKET;
