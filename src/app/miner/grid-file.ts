import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import type { Grid } from "./game-logic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GRIDS_DIR = path.join(process.cwd(), "src/app/miner/grids");

export function isValidDateString(date: string): boolean {
  return DATE_PATTERN.test(date);
}

// e2e tests spoof "today" via the x-mock-today header (see e2e/date-fallback.spec.ts)
// since Playwright's clock API can't reach the server process's Date().
export async function todayDateString(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    const mock = (await headers()).get("x-mock-today");
    if (mock && isValidDateString(mock)) return mock;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseDateString(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function shiftDateString(date: string, days: number): string {
  const d = parseDateString(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Grid filenames are YYYY-MM-DD.json, so lexicographic order matches
// chronological order. Finds the latest available date at or before `target`
// by listing the directory rather than probing one date at a time.
export async function findClosestPastDateString(
  gridsDir: string,
  target: string,
): Promise<string | null> {
  const files = await readdir(gridsDir);
  const dates = files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter((d) => isValidDateString(d) && d <= target)
    .sort();

  return dates.length > 0 ? dates[dates.length - 1] : null;
}

export async function findClosestPastGridDate(target: string): Promise<string | null> {
  return findClosestPastDateString(GRIDS_DIR, target);
}

export async function loadGridForDate(date: string): Promise<Grid | null> {
  if (!isValidDateString(date)) return null;

  const filePath = path.join(GRIDS_DIR, `${date}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Grid;
  } catch {
    return null;
  }
}
