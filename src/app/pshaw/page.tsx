import { notFound } from "next/navigation";
import { getOptionalSession } from "@/lib/dal";
import { loadGameForDate } from "./actions";
import { findClosestPastWordDate, loadWordForDate } from "./word-file";
import {
  parseDateString,
  shiftDateString,
  todayDateString,
} from "../miner/grid-file";
import { PshawBoard } from "./pshaw-board";
import { DateNav } from "@/components/date-nav";

export default async function PshawPage() {
  const session = await getOptionalSession();
  const dateString = await findClosestPastWordDate(await todayDateString());
  if (!dateString) notFound();

  const savedGame = await loadGameForDate(parseDateString(dateString));
  const wordData = await loadWordForDate(dateString);
  if (!wordData) notFound();

  const hasPrevious =
    (await loadWordForDate(shiftDateString(dateString, -1))) !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <PshawBoard
        answer={wordData.word}
        initialGuesses={savedGame?.guesses}
        initialStatus={savedGame?.status}
        date={parseDateString(dateString)}
        dateString={dateString}
        isLoggedIn={!!session}
      />
      <DateNav
        basePath="/pshaw"
        currentDateString={dateString}
        hasPrevious={hasPrevious}
        hasNext={false}
      />
    </main>
  );
}
