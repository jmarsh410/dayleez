import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { SHAPES, type Grid, type Shape, type ShapeMap } from "../src/app/digout/game-logic";

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-digout-guesses-${id}@example.com`,
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

// A fixed, known-good grid date, spoofed as "today" via the x-mock-today
// header (see todayDateString in src/app/miner/grid-file.ts), matching the
// convention already used in e2e/digout-date-param.spec.ts. Reading the same
// static grid file the app reads lets the test compute the exact set of
// shapes on the board without depending on live game/DB state.
const MOCK_TODAY = "2026-07-20";

async function expectedShapesForMockToday(): Promise<Shape[]> {
  const filePath = path.join(
    process.cwd(),
    "src/app/digout/grids",
    `${MOCK_TODAY}.json`,
  );
  const raw = await readFile(filePath, "utf-8");
  const { grid, shapeMap } = JSON.parse(raw) as { grid: Grid; shapeMap: ShapeMap };

  const present = new Set<Shape>();
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && cell.adjacent > 0) present.add(shapeMap[cell.adjacent]);
    }
  }
  return SHAPES.filter((s) => present.has(s));
}

function guessInput(page: Page, shape: Shape) {
  return page.getByRole("spinbutton", { name: `Your guess for the ${shape} shape` });
}

test.describe("digout shape guess legend", () => {
  test("lists exactly the shapes present on the board, with empty inputs", async ({
    page,
  }) => {
    const expectedShapes = await expectedShapesForMockToday();
    expect(expectedShapes.length).toBeGreaterThan(0);

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/digout");

    for (const shape of expectedShapes) {
      await expect(guessInput(page, shape)).toBeVisible();
      // Never pre-filled with the real answer — only what the player types.
      await expect(guessInput(page, shape)).toHaveValue("");
    }

    // No extra shapes beyond the ones actually on the board.
    await expect(
      page.getByRole("spinbutton", { name: /^Your guess for the /}),
    ).toHaveCount(expectedShapes.length);
  });

  test("a typed guess survives a reload for a logged-in user", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const expectedShapes = await expectedShapesForMockToday();
    const shape = expectedShapes[0];

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/digout");

    const input = guessInput(page, shape);
    await input.fill("3");
    await input.blur();
    // Give the fire-and-forget save a moment to reach the server before reload.
    await page.waitForTimeout(500);
    await page.reload();

    await expect(guessInput(page, shape)).toHaveValue("3");
  });

  test("a typed guess survives a reload for a guest", async ({ page }) => {
    const expectedShapes = await expectedShapesForMockToday();
    const shape = expectedShapes[0];

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/digout");

    const input = guessInput(page, shape);
    await input.fill("2");
    await input.blur();
    await page.waitForTimeout(200);
    await page.reload();

    await expect(guessInput(page, shape)).toHaveValue("2");
  });
});
