import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { Client as PgClient } from "pg";

const db = new PgClient({ connectionString: process.env.DATABASE_URL });
const dbReady = db.connect();

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-miner-date-${id}@example.com`,
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
     FROM "MinerGame" g
     JOIN "User" u ON u.id = g."userId"
     WHERE u.email = $1`,
    [email],
  );
  return rows.map((r) => r.date.toISOString().slice(0, 10));
}

test.describe("miner save date parameter", () => {
  test("/miner saves the game under today's date", async ({ page }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.goto("/miner");
    await page.locator('[data-safe-cell="true"]').click();
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual(["2026-07-21"]);
  });

  test("/miner/[date] saves the game under that route's date, not today", async ({
    page,
  }) => {
    const user = uniqueUser();
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.goto("/miner/2026-07-15");
    await page.locator('[data-safe-cell="true"]').click();
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual(["2026-07-15"]);
  });

  test.afterAll(async () => {
    await db.end();
  });
});
