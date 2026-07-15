"use client";

import { useMemo, useState } from "react";
import {
  GRID_SIZE,
  MINE_COUNT,
  checkWin,
  cloneGrid,
  countFlags,
  createGrid,
  flagRemainingMines,
  placeMines,
  revealAllMines,
  revealFlood,
  type GameStatus,
  type Grid,
} from "./game-logic";

function MineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
      <g stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="1" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="23" y2="12" />
        <line x1="4.5" y1="4.5" x2="7" y2="7" />
        <line x1="17" y1="17" x2="19.5" y2="19.5" />
        <line x1="4.5" y1="19.5" x2="7" y2="17" />
        <line x1="17" y1="7" x2="19.5" y2="4.5" />
      </g>
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="3" x2="6" y2="21" strokeLinecap="round" />
      <path d="M6 4h13l-4.5 4.5L19 13H6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MiningBoard() {
  const [grid, setGrid] = useState<Grid>(() => createGrid(GRID_SIZE));
  const [status, setStatus] = useState<GameStatus>("idle");
  const [flagMode, setFlagMode] = useState(false);

  const flagsUsed = useMemo(() => countFlags(grid), [grid]);
  const minesRemaining = MINE_COUNT - flagsUsed;

  function reset() {
    setGrid(createGrid(GRID_SIZE));
    setStatus("idle");
  }

  function toggleFlag(r: number, c: number) {
    const cell = grid[r][c];
    if (cell.state === "revealed") return;

    const next = cloneGrid(grid);
    next[r][c].state = cell.state === "flagged" ? "hidden" : "flagged";
    setGrid(next);
  }

  function revealCell(r: number, c: number) {
    const cell = grid[r][c];
    if (cell.state !== "hidden") return;

    const next = cloneGrid(grid);
    let nextStatus: GameStatus = status;

    if (status === "idle") {
      placeMines(next, GRID_SIZE, MINE_COUNT, r, c);
      nextStatus = "playing";
    }

    const clicked = next[r][c];
    if (clicked.isMine) {
      clicked.state = "revealed";
      revealAllMines(next);
      nextStatus = "lost";
    } else {
      revealFlood(next, GRID_SIZE, r, c);
      if (checkWin(next, GRID_SIZE, MINE_COUNT)) {
        flagRemainingMines(next);
        nextStatus = "won";
      }
    }

    setGrid(next);
    setStatus(nextStatus);
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
        ? "You hit a mine."
        : `Mines remaining: ${minesRemaining}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl font-semibold">Miner</h1>

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
        <button
          type="button"
          onClick={reset}
          className="rounded border border-foreground/20 px-3 py-1"
        >
          Reset
        </button>
      </div>

      <div
        className="grid gap-px bg-foreground/20 border border-foreground/20"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const revealed = cell.state === "revealed";
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                disabled={revealed && !cell.isMine && cell.adjacent === 0}
                aria-label={
                  cell.state === "flagged"
                    ? "Flagged cell"
                    : revealed
                      ? cell.isMine
                        ? "Mine"
                        : cell.adjacent > 0
                          ? `${cell.adjacent} adjacent mines`
                          : "Empty cell"
                      : "Hidden cell"
                }
                className={`flex h-8 w-8 items-center justify-center text-sm font-medium ${
                  revealed ? "bg-background" : "bg-background hover:bg-foreground/10"
                }`}
              >
                {cell.state === "flagged" && <FlagIcon />}
                {revealed && cell.isMine && <MineIcon />}
                {revealed && !cell.isMine && cell.adjacent > 0 && cell.adjacent}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
