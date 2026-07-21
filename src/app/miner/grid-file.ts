import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Grid } from "./game-logic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateString(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function loadGridForDate(date: string): Promise<Grid | null> {
  if (!DATE_PATTERN.test(date)) return null;

  const filePath = path.join(process.cwd(), "src/app/miner/grids", `${date}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Grid;
  } catch {
    return null;
  }
}
