import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGameForDate } from "../actions";
import { loadBoardForDate } from "../grid-file";
import {
  isValidDateString,
  parseDateString,
  shiftDateString,
  todayDateString,
} from "../../miner/grid-file";
import { DigoutBoard } from "../digout-board";
import { DateNav } from "@/components/date-nav";

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

  const today = await todayDateString();
  const nextDateString = shiftDateString(date, 1);
  const [hasPrevious, hasNext] = await Promise.all([
    loadBoardForDate(shiftDateString(date, -1)).then((b) => b !== null),
    nextDateString <= today
      ? loadBoardForDate(nextDateString).then((b) => b !== null)
      : Promise.resolve(false),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <DigoutBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        shapeMap={board.shapeMap}
        date={parsedDate}
      />
      <DateNav
        basePath="/digout"
        currentDateString={date}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </main>
  );
}
