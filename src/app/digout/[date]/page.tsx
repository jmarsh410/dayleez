import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGameForDate } from "../actions";
import { loadBoardForDate } from "../grid-file";
import { isValidDateString, parseDateString } from "../../miner/grid-file";
import { DigoutBoard } from "../digout-board";

export default async function DigoutDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  await verifySession();
  const { date } = await params;
  if (!isValidDateString(date)) notFound();
  const parsedDate = parseDateString(date);

  const savedGame = await loadGameForDate(parsedDate);
  const board = await loadBoardForDate(date);
  const grid = savedGame?.grid ?? board?.grid;
  if (!grid || !board) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <DigoutBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        shapeMap={board.shapeMap}
        date={parsedDate}
      />
    </main>
  );
}
