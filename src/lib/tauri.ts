import { invoke } from "@tauri-apps/api/core";
import type { CardMeta } from "../types/card";

export async function scanDirectory(path: string, depth: number): Promise<void> {
  return invoke("scan_directory", { path, depth });
}

export async function readFile(path: string): Promise<string> {
  return invoke("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<CardMeta> {
  return invoke("write_file", { path, content });
}

export async function createFile(directory: string, filename: string): Promise<CardMeta> {
  return invoke("create_file", { directory, filename });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke("delete_file", { path });
}
