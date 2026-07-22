import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Grid, ShapeMap } from "./game-logic";

import { isValidDateString } from "../miner/grid-file";

export interface DigoutBoardData {
  grid: Grid;
  shapeMap: ShapeMap;
}

export async function loadBoardForDate(date: string): Promise<DigoutBoardData | null> {
  if (!isValidDateString(date)) return null;

  const filePath = path.join(process.cwd(), "src/app/digout/grids", `${date}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as DigoutBoardData;
  } catch {
    return null;
  }
}
