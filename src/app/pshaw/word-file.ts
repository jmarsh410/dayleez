import { readFile } from "node:fs/promises";
import path from "node:path";
import { isValidWord } from "./game-logic";

import { findClosestPastDateString, isValidDateString } from "../miner/grid-file";

const WORDS_DIR = path.join(process.cwd(), "src/app/pshaw/words");

export interface PshawWordData {
  word: string;
}

export async function findClosestPastWordDate(target: string): Promise<string | null> {
  return findClosestPastDateString(WORDS_DIR, target);
}

export async function loadWordForDate(date: string): Promise<PshawWordData | null> {
  if (!isValidDateString(date)) return null;

  const filePath = path.join(WORDS_DIR, `${date}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as PshawWordData;
    if (!isValidWord(data.word)) return null;
    return data;
  } catch {
    return null;
  }
}
