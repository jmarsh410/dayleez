import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGameForDate } from "./actions";
import { findClosestPastBoardDate, loadBoardForDate } from "./grid-file";
import { parseDateString, shiftDateString, todayDateString } from "../miner/grid-file";
import { DigoutBoard } from "./digout-board";
import { DateNav } from "@/components/date-nav";

export default async function DigoutPage() {
  await verifySession();
  const dateString = await findClosestPastBoardDate(await todayDateString());
  if (!dateString) notFound();

  const savedGame = await loadGameForDate(parseDateString(dateString));
  const board = await loadBoardForDate(dateString);
  const grid = savedGame?.grid ?? board?.grid;

  if (!grid || !board) notFound();

  const hasPrevious = (await loadBoardForDate(shiftDateString(dateString, -1))) !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <DateNav
        basePath="/digout"
        currentDateString={dateString}
        hasPrevious={hasPrevious}
        hasNext={false}
      />
      <DigoutBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        shapeMap={board.shapeMap}
        date={parseDateString(dateString)}
      />
    </main>
  );
}
