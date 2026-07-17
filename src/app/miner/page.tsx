import { verifySession } from "@/lib/dal";
import { loadTodaysGame } from "./actions";
import { MiningBoard } from "./mining-board";

export default async function MinerPage() {
  await verifySession();
  const savedGame = await loadTodaysGame();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <MiningBoard
        initialGrid={savedGame?.grid}
        initialStatus={savedGame?.status}
      />
    </main>
  );
}
