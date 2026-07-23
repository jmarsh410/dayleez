import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGameForDate } from "./actions";
import {
  findClosestPastGridDate,
  loadGridForDate,
  parseDateString,
  shiftDateString,
  todayDateString,
} from "./grid-file";
import { MiningBoard } from "./mining-board";
import { DateNav } from "@/components/date-nav";

export default async function MinerPage() {
  await verifySession();
  const dateString = await findClosestPastGridDate(await todayDateString());
  if (!dateString) notFound();

  const savedGame = await loadGameForDate(parseDateString(dateString));
  const grid = savedGame?.grid ?? (await loadGridForDate(dateString));

  if (!grid) notFound();

  const hasPrevious = (await loadGridForDate(shiftDateString(dateString, -1))) !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <DateNav
        basePath="/miner"
        currentDateString={dateString}
        hasPrevious={hasPrevious}
        hasNext={false}
      />
      <MiningBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        date={parseDateString(dateString)}
      />
    </main>
  );
}
