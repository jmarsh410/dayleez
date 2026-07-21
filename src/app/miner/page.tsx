import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadTodaysGame } from "./actions";
import { loadGridForDate, parseDateString, todayDateString } from "./grid-file";
import { MiningBoard } from "./mining-board";

export default async function MinerPage() {
  await verifySession();
  const dateString = todayDateString();
  const savedGame = await loadTodaysGame();
  const grid = savedGame?.grid ?? (await loadGridForDate(dateString));

  if (!grid) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <MiningBoard
        initialGrid={grid}
        initialStatus={savedGame?.status}
        date={parseDateString(dateString)}
      />
    </main>
  );
}
