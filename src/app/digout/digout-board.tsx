"use client";

import { useEffect, useMemo, useState } from "react";
import { loadGuestState, saveGuestState } from "@/lib/guest-storage";
import {
  GRID_SIZE,
  MAX_MINE_HITS,
  MINE_COUNT,
  checkWin,
  cloneGrid,
  countFlags,
  flagRemainingMines,
  revealAllMines,
  revealFlood,
  type GameStatus,
  type Grid,
  type Shape,
  type ShapeMap,
} from "./game-logic";
import { saveGameForDate } from "./actions";
import { FlagIcon, MineIcon } from "../miner/mining-board";

function CircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <polygon points="12,2 22,12 12,22 2,12" />
    </svg>
  );
}

function TriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <polygon points="12,2 22,21 2,21" />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" />
    </svg>
  );
}

function RedXIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${filled ? "text-red-600" : "text-foreground/20"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

const SHAPE_ICONS: Record<Shape, () => React.JSX.Element> = {
  circle: CircleIcon,
  diamond: DiamondIcon,
  triangle: TriangleIcon,
  square: SquareIcon,
};

export function DigoutBoard({
  initialGrid,
  initialStatus,
  shapeMap,
  date,
  dateString,
  isLoggedIn,
}: {
  initialGrid: Grid;
  initialStatus?: GameStatus;
  shapeMap: ShapeMap;
  date: Date;
  dateString: string;
  isLoggedIn: boolean;
}) {
  const [grid, setGrid] = useState<Grid>(initialGrid);
  const [status, setStatus] = useState<GameStatus>(initialStatus ?? "idle");
  const [flagMode, setFlagMode] = useState(false);

  // localStorage isn't available during SSR, so guest progress can only be
  // restored after mount, not via a lazy useState initializer.
  useEffect(() => {
    if (isLoggedIn) return;
    const saved = loadGuestState<{ grid: Grid; status: GameStatus }>(
      "digout",
      dateString,
    );
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGrid(saved.grid);
      setStatus(saved.status);
    }
  }, [isLoggedIn, dateString]);

  const flagsUsed = useMemo(() => countFlags(grid), [grid]);
  const minesRemaining = MINE_COUNT - flagsUsed;
  const mineHits = useMemo(
    () => grid.flat().filter((cell) => cell.state === "exploded").length,
    [grid],
  );

  function persist(nextGrid: Grid, nextStatus: GameStatus) {
    if (isLoggedIn) {
      saveGameForDate(nextGrid, nextStatus, date).catch((err) => {
        console.error("Failed to save Digout game state", err);
      });
    } else {
      saveGuestState("digout", dateString, { grid: nextGrid, status: nextStatus });
    }
  }

  function toggleFlag(r: number, c: number) {
    const cell = grid[r][c];
    if (cell.state === "revealed" || cell.state === "exploded") return;

    const next = cloneGrid(grid);
    next[r][c].state = cell.state === "flagged" ? "hidden" : "flagged";
    setGrid(next);
    persist(next, status);
  }

  function revealCell(r: number, c: number) {
    const cell = grid[r][c];
    if (cell.state !== "hidden") return;
    if (status === "idle" && !cell.isSafe) return;

    const next = cloneGrid(grid);
    let nextStatus: GameStatus = status;

    if (status === "idle") {
      nextStatus = "playing";
    }

    const clicked = next[r][c];
    if (clicked.isMine) {
      clicked.state = "exploded";
      const hits = next.flat().filter((cell) => cell.state === "exploded").length;
      if (hits >= MAX_MINE_HITS) {
        revealAllMines(next);
        nextStatus = "lost";
      }
    } else {
      revealFlood(next, GRID_SIZE, r, c);
      if (checkWin(next, GRID_SIZE, MINE_COUNT)) {
        flagRemainingMines(next);
        nextStatus = "won";
      }
    }

    setGrid(next);
    setStatus(nextStatus);
    persist(next, nextStatus);
  }

  function handleCellClick(r: number, c: number) {
    if (status === "won" || status === "lost") return;
    if (flagMode) {
      toggleFlag(r, c);
      return;
    }
    revealCell(r, c);
  }

  function handleContextMenu(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (status === "won" || status === "lost") return;
    toggleFlag(r, c);
  }

  const statusText =
    status === "won"
      ? "You win."
      : status === "lost"
        ? `You hit ${MAX_MINE_HITS} mines. Game over.`
        : status === "idle"
          ? "Click the highlighted cell to begin."
          : `Mines remaining: ${minesRemaining}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl font-semibold">Digout</h1>

      <div className="flex items-center gap-1" aria-live="polite">
        <span className="sr-only">
          Mine hits: {mineHits} of {MAX_MINE_HITS}
        </span>
        {Array.from({ length: MAX_MINE_HITS }, (_, i) => (
          <RedXIcon key={i} filled={i < mineHits} />
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span aria-live="polite">{statusText}</span>
        <button
          type="button"
          onClick={() => setFlagMode((v) => !v)}
          aria-pressed={flagMode}
          className="rounded border border-foreground/20 px-3 py-1 disabled:opacity-50"
          disabled={status === "won" || status === "lost"}
        >
          {flagMode ? "Flagging" : "Revealing"}
        </button>
      </div>

      <div
        className="grid gap-px bg-foreground/20 border border-foreground/20"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const revealed = cell.state === "revealed";
            const exploded = cell.state === "exploded";
            const isSafeStart = status === "idle" && cell.isSafe;
            const shape = cell.adjacent > 0 ? shapeMap[cell.adjacent] : undefined;
            const ShapeIcon = shape ? SHAPE_ICONS[shape] : undefined;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                data-testid={`cell-${r}-${c}`}
                data-safe-cell={isSafeStart ? "true" : undefined}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                disabled={exploded || (revealed && !cell.isMine && cell.adjacent === 0)}
                aria-label={
                  cell.state === "flagged"
                    ? "Flagged cell"
                    : exploded
                      ? "Mine (hit)"
                      : revealed
                        ? cell.isMine
                          ? "Mine"
                          : shape
                            ? `${shape} shape`
                            : "Empty cell"
                        : "Hidden cell"
                }
                className={`flex h-8 w-8 items-center justify-center text-sm font-medium ${
                  revealed || exploded
                    ? "bg-background"
                    : "bg-background hover:bg-foreground/10"
                } ${isSafeStart ? "ring-2 ring-inset ring-yellow-400" : ""}`}
              >
                {cell.state === "flagged" && <FlagIcon />}
                {exploded && <span className="text-red-600"><MineIcon /></span>}
                {revealed && cell.isMine && <MineIcon />}
                {revealed && !cell.isMine && ShapeIcon && <ShapeIcon />}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
