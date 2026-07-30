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
    email: `e2e-digout-${id}@example.com`,
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

async function openGamesMenu(page: Page) {
  await page.getByRole("button", { name: "Games" }).hover();
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

test.describe("digout game persistence", () => {
  test("board state (reveals and flags) survives a page reload", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await openGamesMenu(page);
    await page.getByRole("link", { name: "Digout" }).click();
    await expect(page).toHaveURL("/digout");

    const hiddenCells = page.getByRole("button", { name: "Hidden cell" });
    const flaggedCells = page.getByRole("button", { name: "Flagged cell" });
    await expect(hiddenCells).toHaveCount(GRID_SIZE * GRID_SIZE);

    // The highlighted safe cell must be the opening move; it starts the game.
    await page.locator('[data-safe-cell="true"]').click();
    const hiddenAfterReveal = await hiddenCells.count();
    expect(hiddenAfterReveal).toBeLessThan(GRID_SIZE * GRID_SIZE);

    // Flag a still-hidden cell.
    await page.getByRole("button", { name: "Revealing" }).click();
    await hiddenCells.first().click();
    await expect(flaggedCells).toHaveCount(1);

    const hiddenBeforeReload = await hiddenCells.count();

    // Give the fire-and-forget save a moment to reach the server before reload.
    await page.waitForTimeout(500);
    await page.reload();

    // The saved grid (reveals + the flag) should come back exactly as left.
    await expect(flaggedCells).toHaveCount(1);
    await expect(hiddenCells).toHaveCount(hiddenBeforeReload);
    await expect(page.getByRole("button", { name: "Revealing" })).toBeVisible();
  });

  test("a lost game is restored as lost after reload", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await openGamesMenu(page);
    await page.getByRole("link", { name: "Digout" }).click();
    await expect(page).toHaveURL("/digout");

    // The safe cell must be clicked first to start the game.
    await page.locator('[data-safe-cell="true"]').click();
    // Give the fire-and-forget save a moment to land before we read it back.
    await page.waitForTimeout(500);

    // Look up the real mine layout so the player can lose deterministically
    // by clicking exactly MAX_MINE_HITS mines, instead of hunting blindly.
    const mines = await mineCoordsFor(user.email);
    expect(mines.length).toBeGreaterThanOrEqual(MAX_MINE_HITS);

    for (const [r, c] of mines.slice(0, MAX_MINE_HITS)) {
      await page.getByTestId(`cell-${r}-${c}`).click();
    }

    const lostText = `You hit ${MAX_MINE_HITS} mines. Game over.`;
    await expect(page.getByText(lostText)).toBeVisible();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByText(lostText)).toBeVisible();
  });

  test("a won game is restored as won after reload", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await openGamesMenu(page);
    await page.getByRole("link", { name: "Digout" }).click();
    await expect(page).toHaveURL("/digout");

    // The highlighted safe cell is the required opening move; cell
    // coordinates are stable via data-testid, so we can look up the mine
    // layout afterwards and win legitimately through the UI instead of guessing.
    await page.locator('[data-safe-cell="true"]').click();
    // Give the fire-and-forget save a moment to land before we read it back.
    await page.waitForTimeout(500);

    await dbReady;
    // Each test uses a fresh user, so there's exactly one saved game for them
    // regardless of how the DATE column round-trips through timezones.
    const { rows } = await db.query<{ grid: { isMine: boolean }[][] }>(
      `SELECT g.grid
       FROM "DigoutGame" g
       JOIN "User" u ON u.id = g."userId"
       WHERE u.email = $1`,
      [user.email],
    );
    expect(rows).toHaveLength(1);
    const grid = rows[0].grid;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c].isMine) continue;
        const cell = page.getByTestId(`cell-${r}-${c}`);
        if ((await cell.getAttribute("aria-label")) === "Hidden cell") {
          await cell.click();
        }
      }
    }

    await expect(page.getByText("You win.")).toBeVisible();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByText("You win.")).toBeVisible();
  });

  test.afterAll(async () => {
    await db.end();
  });
});
