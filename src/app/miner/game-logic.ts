export const GRID_SIZE = 10;
export const MINE_COUNT = 15;

export type CellState = "hidden" | "revealed" | "flagged";

export interface Cell {
  isMine: boolean;
  adjacent: number;
  state: CellState;
}

export type Grid = Cell[][];

export type GameStatus = "idle" | "playing" | "won" | "lost";

export function createGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      isMine: false,
      adjacent: 0,
      state: "hidden" as CellState,
    })),
  );
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

// Mines are placed on first click so the opening move (and its neighbors)
// are never a mine.
export function placeMines(
  grid: Grid,
  size: number,
  mineCount: number,
  safeRow: number,
  safeCol: number,
) {
  const isSafe = (r: number, c: number) =>
    Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;

  const positions: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isSafe(r, c)) positions.push([r, c]);
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [r, c] of positions.slice(0, mineCount)) {
    grid[r][c].isMine = true;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc].isMine) {
            count++;
          }
        }
      }
      grid[r][c].adjacent = count;
    }
  }
}

export function revealFlood(grid: Grid, size: number, startRow: number, startCol: number) {
  const stack: [number, number][] = [[startRow, startCol]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cell = grid[r][c];
    if (cell.state !== "hidden") continue;

    cell.state = "revealed";

    if (cell.adjacent === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < size &&
            nc >= 0 &&
            nc < size &&
            grid[nr][nc].state === "hidden"
          ) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }
}

export function revealAllMines(grid: Grid) {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isMine && cell.state === "hidden") cell.state = "revealed";
    }
  }
}

export function flagRemainingMines(grid: Grid) {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isMine && cell.state === "hidden") cell.state = "flagged";
    }
  }
}

export function checkWin(grid: Grid, size: number, mineCount: number): boolean {
  let revealedCount = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.state === "revealed") revealedCount++;
    }
  }
  return revealedCount === size * size - mineCount;
}

export function countFlags(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.state === "flagged") count++;
    }
  }
  return count;
}
