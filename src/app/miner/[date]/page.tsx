import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { loadGridForDate, parseDateString } from "../grid-file";
import { MiningBoard } from "../mining-board";

export default async function MinerDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  await verifySession();
  const { date } = await params;

  const grid = await loadGridForDate(date);
  if (!grid) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <MiningBoard initialGrid={grid} date={parseDateString(date)} />
    </main>
  );
}
