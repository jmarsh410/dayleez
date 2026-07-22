import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadTodaysGame } from "./actions";
import { loadBoardForDate } from "./grid-file";
import { parseDateString, todayDateString } from "../miner/grid-file";
import { DigoutBoard } from "./digout-board";

export default async function DigoutPage() {
  await verifySession();
  const dateString = todayDateString();
  const savedGame = await loadTodaysGame();
  const board = await loadBoardForDate(dateString);
  const grid = savedGame?.grid ?? board?.grid;

  if (!grid || !board) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <DigoutBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        shapeMap={board.shapeMap}
        date={parseDateString(dateString)}
      />
    </main>
  );
}
