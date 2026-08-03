import { notFound } from "next/navigation";
import { verifySessionOrRedirectToSignUp } from "@/lib/dal";
import { loadGameForDate } from "../actions";
import { loadWordForDate } from "../word-file";
import {
  isValidDateString,
  parseDateString,
  shiftDateString,
  todayDateString,
} from "../../miner/grid-file";
import { PshawBoard } from "../pshaw-board";
import { DateNav } from "@/components/date-nav";

export default async function PshawDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  await verifySessionOrRedirectToSignUp();
  const { date } = await params;
  if (!isValidDateString(date)) notFound();
  const parsedDate = parseDateString(date);

  const savedGame = await loadGameForDate(parsedDate);
  const wordData = await loadWordForDate(date);
  if (!wordData) notFound();

  const today = await todayDateString();
  const nextDateString = shiftDateString(date, 1);
  const [hasPrevious, hasNext] = await Promise.all([
    loadWordForDate(shiftDateString(date, -1)).then((w) => w !== null),
    nextDateString <= today
      ? loadWordForDate(nextDateString).then((w) => w !== null)
      : Promise.resolve(false),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <PshawBoard
        answer={wordData.word}
        initialGuesses={savedGame?.guesses}
        initialStatus={savedGame?.status}
        date={parsedDate}
        dateString={date}
        isLoggedIn={true}
      />
      <DateNav
        basePath="/pshaw"
        currentDateString={date}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </main>
  );
}
