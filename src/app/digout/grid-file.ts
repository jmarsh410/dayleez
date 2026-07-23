import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Grid, ShapeMap } from "./game-logic";

import { findClosestPastDateString, isValidDateString } from "../miner/grid-file";

const GRIDS_DIR = path.join(process.cwd(), "src/app/digout/grids");

export interface DigoutBoardData {
  grid: Grid;
  shapeMap: ShapeMap;
}

export async function findClosestPastBoardDate(target: string): Promise<string | null> {
  return findClosestPastDateString(GRIDS_DIR, target);
}

export async function loadBoardForDate(date: string): Promise<DigoutBoardData | null> {
  if (!isValidDateString(date)) return null;

  const filePath = path.join(GRIDS_DIR, `${date}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as DigoutBoardData;
  } catch {
    return null;
  }
}
