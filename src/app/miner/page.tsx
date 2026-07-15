import { verifySession } from "@/lib/dal";
import { MiningBoard } from "./mining-board";

export default async function MinerPage() {
  await verifySession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <MiningBoard />
    </main>
  );
}
