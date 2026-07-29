import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGameForDate } from "../actions";
import {
  isValidDateString,
  loadGridForDate,
  parseDateString,
  shiftDateString,
  todayDateString,
} from "../grid-file";
import { MiningBoard } from "../mining-board";
import { DateNav } from "@/components/date-nav";

export default async function MinerDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  await verifySession();
  const { date } = await params;
  if (!isValidDateString(date)) notFound();
  const parsedDate = parseDateString(date);

  const savedGame = await loadGameForDate(parsedDate);
  const grid = savedGame?.grid ?? (await loadGridForDate(date));
  if (!grid) notFound();

  const today = await todayDateString();
  const nextDateString = shiftDateString(date, 1);
  const [hasPrevious, hasNext] = await Promise.all([
    loadGridForDate(shiftDateString(date, -1)).then((g) => g !== null),
    nextDateString <= today
      ? loadGridForDate(nextDateString).then((g) => g !== null)
      : Promise.resolve(false),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <MiningBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        date={parsedDate}
      />
      <DateNav
        basePath="/miner"
        currentDateString={date}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </main>
  );
}
