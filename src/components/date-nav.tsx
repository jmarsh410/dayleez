import Link from "next/link";
import { shiftDateString } from "@/app/miner/grid-file";

export function DateNav({
  basePath,
  currentDateString,
  hasPrevious,
  hasNext,
}: {
  basePath: string;
  currentDateString: string;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  if (!hasPrevious && !hasNext) return null;

  const prevDateString = shiftDateString(currentDateString, -1);
  const nextDateString = shiftDateString(currentDateString, 1);

  return (
    <div className="flex items-center gap-4 text-sm">
      {hasPrevious && (
        <Link
          href={`${basePath}/${prevDateString}`}
          className="rounded border border-foreground/20 px-3 py-1"
        >
          ← Previous
        </Link>
      )}
      {hasNext && (
        <Link
          href={`${basePath}/${nextDateString}`}
          className="rounded border border-foreground/20 px-3 py-1"
        >
          Next →
        </Link>
      )}
    </div>
  );
}
