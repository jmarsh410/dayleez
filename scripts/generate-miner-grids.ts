// Generates Miner grid JSON files (src/app/miner/grids/<date>.json).
//
// Usage:
//   npx tsx scripts/generate-miner-grids.ts
//     Regenerates today, the 10 previous days, and the 10 following days.
//
//   npx tsx scripts/generate-miner-grids.ts 2026-08-01 2026-08-02
//     Regenerates only the given dates.
//
//   npx tsx scripts/generate-miner-grids.ts --range 2026-08-01 2026-08-14
//     Regenerates every date in the inclusive range.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createGrid, GRID_SIZE, MINE_COUNT } from "../src/app/miner/game-logic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateString(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function defaultDates(): string[] {
  const today = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  ));
  const dates: string[] = [];
  for (let offset = -10; offset <= 10; offset++) {
    dates.push(toDateString(addDays(today, offset)));
  }
  return dates;
}

function rangeDates(start: string, end: string): string[] {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  const dates: string[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    dates.push(toDateString(d));
  }
  return dates;
}

function resolveDates(argv: string[]): string[] {
  if (argv[0] === "--range") {
    const [, start, end] = argv;
    if (!start || !end || !DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
      throw new Error("Usage: --range <YYYY-MM-DD start> <YYYY-MM-DD end>");
    }
    return rangeDates(start, end);
  }

  if (argv.length > 0) {
    for (const arg of argv) {
      if (!DATE_PATTERN.test(arg)) {
        throw new Error(`Invalid date argument: ${arg} (expected YYYY-MM-DD)`);
      }
    }
    return argv;
  }

  return defaultDates();
}

async function main() {
  const dates = resolveDates(process.argv.slice(2));
  const outDir = path.join(process.cwd(), "src/app/miner/grids");

  for (const date of dates) {
    const grid = createGrid(GRID_SIZE, MINE_COUNT);
    const filePath = path.join(outDir, `${date}.json`);
    await writeFile(filePath, JSON.stringify(grid, null, 2) + "\n", "utf-8");
    console.log(`wrote ${filePath}`);
  }
}

main();
