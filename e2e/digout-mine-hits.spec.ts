import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { Client as PgClient } from "pg";
import { GRID_SIZE, MAX_MINE_HITS } from "../src/app/digout/game-logic";

const db = new PgClient({ connectionString: process.env.DATABASE_URL });
const dbReady = db.connect();

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-digout-hits-${id}@example.com`,
    password: "InitialPass123!",
  };
}

async function registerViaUi(
  page: Page,
  user: { name: string; email: string; password: string },
) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign up" }).click();
}

async function mineCoordsFor(email: string): Promise<[number, number][]> {
  await dbReady;
  const { rows } = await db.query<{ grid: { isMine: boolean }[][] }>(
    `SELECT g.grid
     FROM "DigoutGame" g
     JOIN "User" u ON u.id = g."userId"
     WHERE u.email = $1`,
    [email],
  );
  expect(rows).toHaveLength(1);
  const grid = rows[0].grid;
  const coords: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].isMine) coords.push([r, c]);
    }
  }
  return coords;
}

async function startGameAndGetMines(
  page: Page,
  email: string,
): Promise<[number, number][]> {
  await page.goto("/digout");
  await page.locator('[data-safe-cell="true"]').click();
  // Give the fire-and-forget save a moment to land before we read it back.
  await page.waitForTimeout(500);

  const mines = await mineCoordsFor(email);
  expect(mines.length).toBeGreaterThanOrEqual(MAX_MINE_HITS);
  return mines;
}

test.describe("digout mine-hit tolerance", () => {
  test("hitting a mine shows a red X and lets play continue", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const mines = await startGameAndGetMines(page, user.email);
    const [r, c] = mines[0];

    await page.getByTestId(`cell-${r}-${c}`).click();

    // The hit mine is called out above the board, and play is not over.
    await expect(page.getByText(`Mine hits: 1 of ${MAX_MINE_HITS}`)).toBeVisible();
    await expect(page.getByTestId(`cell-${r}-${c}`)).toHaveAttribute(
      "aria-label",
      "Mine (hit)",
    );
    await expect(page.getByText(/^Mines remaining: /)).toBeVisible();
    await expect(page.getByText(`You hit ${MAX_MINE_HITS} mines. Game over.`)).toHaveCount(
      0,
    );
  });

  test("the game only ends after the third mine hit", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const mines = await startGameAndGetMines(page, user.email);

    // Hit every mine except the last one: still playing after each.
    for (let i = 0; i < MAX_MINE_HITS - 1; i++) {
      const [r, c] = mines[i];
      await page.getByTestId(`cell-${r}-${c}`).click();
      await expect(
        page.getByText(`Mine hits: ${i + 1} of ${MAX_MINE_HITS}`),
      ).toBeVisible();
      await expect(page.getByText(/^Mines remaining: /)).toBeVisible();
    }

    // The board is still interactive: hidden cells remain clickable.
    const hiddenBefore = await page
      .getByRole("button", { name: "Hidden cell" })
      .count();
    expect(hiddenBefore).toBeGreaterThan(0);

    // The final mine hit ends the game.
    const [lastR, lastC] = mines[MAX_MINE_HITS - 1];
    await page.getByTestId(`cell-${lastR}-${lastC}`).click();

    await expect(
      page.getByText(`You hit ${MAX_MINE_HITS} mines. Game over.`),
    ).toBeVisible();
    await expect(
      page.getByText(`Mine hits: ${MAX_MINE_HITS} of ${MAX_MINE_HITS}`),
    ).toBeVisible();

    // Further clicks on the board are ignored once the game is lost.
    const hiddenCell = page.getByRole("button", { name: "Hidden cell" }).first();
    const countBefore = await page
      .getByRole("button", { name: "Hidden cell" })
      .count();
    if (countBefore > 0) {
      await hiddenCell.click();
      await expect(
        page.getByRole("button", { name: "Hidden cell" }),
      ).toHaveCount(countBefore);
    }
  });

  test("an exploded mine cannot be flagged", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const mines = await startGameAndGetMines(page, user.email);
    const [r, c] = mines[0];

    await page.getByTestId(`cell-${r}-${c}`).click();
    await expect(page.getByTestId(`cell-${r}-${c}`)).toHaveAttribute(
      "aria-label",
      "Mine (hit)",
    );

    // An exploded cell is disabled, so neither reveal nor flag clicks reach
    // it — it can never be turned into a "Flagged cell".
    await expect(page.getByTestId(`cell-${r}-${c}`)).toBeDisabled();
    await page.getByRole("button", { name: "Revealing" }).click(); // switch to flag mode
    await expect(page.getByTestId(`cell-${r}-${c}`)).toBeDisabled();
    await expect(page.getByTestId(`cell-${r}-${c}`)).toHaveAttribute(
      "aria-label",
      "Mine (hit)",
    );
  });

  test("winning is still possible after hitting mines within the limit", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const mines = await startGameAndGetMines(page, user.email);

    // Hit two mines (below the fail threshold), then reveal every safe cell.
    for (const [r, c] of mines.slice(0, MAX_MINE_HITS - 1)) {
      await page.getByTestId(`cell-${r}-${c}`).click();
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const isMine = mines.some(([mr, mc]) => mr === r && mc === c);
        if (isMine) continue;
        const cell = page.getByTestId(`cell-${r}-${c}`);
        if ((await cell.getAttribute("aria-label")) === "Hidden cell") {
          await cell.click();
        }
      }
    }

    await expect(page.getByText("You win.")).toBeVisible();
  });

  test.afterAll(async () => {
    await db.end();
  });
});
