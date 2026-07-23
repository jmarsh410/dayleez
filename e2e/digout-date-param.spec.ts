import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { Client as PgClient } from "pg";

const db = new PgClient({ connectionString: process.env.DATABASE_URL });
const dbReady = db.connect();

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-digout-date-${id}@example.com`,
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

async function gameDatesFor(email: string): Promise<string[]> {
  await dbReady;
  const { rows } = await db.query<{ date: Date }>(
    `SELECT g.date
     FROM "DigoutGame" g
     JOIN "User" u ON u.id = g."userId"
     WHERE u.email = $1`,
    [email],
  );
  return rows.map((r) => r.date.toISOString().slice(0, 10));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function pastDateString(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

test.describe("digout save date parameter", () => {
  test("/digout saves the game under today's date", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.goto("/digout");
    await page.locator('[data-safe-cell="true"]').click();
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual([todayDateString()]);
  });

  test("/digout/[date] saves the game under that route's date, not today", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const date = pastDateString(7);
    await page.goto(`/digout/${date}`);
    await page.locator('[data-safe-cell="true"]').click();
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual([date]);
  });

  test("/digout/[date] board state survives a page reload", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    const date = pastDateString(7);
    await page.goto(`/digout/${date}`);
    const hiddenCells = page.getByRole("button", { name: "Hidden cell" });
    const flaggedCells = page.getByRole("button", { name: "Flagged cell" });
    await expect(hiddenCells).toHaveCount(25);

    // The highlighted safe cell must be the opening move; it starts the game.
    await page.locator('[data-safe-cell="true"]').click();
    const hiddenAfterReveal = await hiddenCells.count();
    expect(hiddenAfterReveal).toBeLessThan(25);

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

  test.afterAll(async () => {
    await db.end();
  });
});
