export {
  type Cell,
  type CellState,
  type Grid,
  type GameStatus,
  createGrid,
  cloneGrid,
  placeMines,
  revealFlood,
  revealAllMines,
  flagRemainingMines,
  checkWin,
  countFlags,
} from "../miner/game-logic";

export const GRID_SIZE = 5;
export const MINE_COUNT = 4;

// Adjacent-mine counts replace numbers with shapes. MINE_COUNT is capped so
// that no cell can ever have more than 4 adjacent mines, keeping every
// possible count (1-4) mappable to one of these shapes.
export const SHAPES = ["circle", "diamond", "triangle", "square"] as const;
export type Shape = (typeof SHAPES)[number];

// Maps an adjacent-mine count (1-4) to the shape used to depict it. Generated
// once per grid so the same number always renders as the same shape within a
// given game.
export type ShapeMap = Record<number, Shape>;

export function generateShapeMap(): ShapeMap {
  const shuffled = [...SHAPES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const map: ShapeMap = {};
  shuffled.forEach((shape, index) => {
    map[index + 1] = shape;
  });
  return map;
}
