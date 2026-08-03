import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client as PgClient } from "pg";

const db = new PgClient({ connectionString: process.env.DATABASE_URL });
const dbReady = db.connect();

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-pshaw-date-${tag}-${id}@example.com`,
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
     FROM "PshawGame" g
     JOIN "User" u ON u.id = g."userId"
     WHERE u.email = $1`,
    [email],
  );
  return rows.map((r) => r.date.toISOString().slice(0, 10));
}

// Pshaw's word files start at today and run forward (unlike digout/miner,
// which have history behind today), so these fixed in-range dates stand in
// for "today" and "some other day" instead of real calendar history.
const MOCK_TODAY = "2026-08-03";
const OTHER_DATE = "2026-08-10";

function answerForDate(date: string): string {
  const filePath = path.join(process.cwd(), "src/app/pshaw/words", `${date}.json`);
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as { word: string };
  return data.word;
}

async function typeWord(page: Page, word: string) {
  for (const letter of word) {
    await page.getByRole("button", { name: letter, exact: true }).click();
  }
  await page.getByRole("button", { name: "Enter" }).click();
}

test.describe("pshaw save date parameter", () => {
  test("/pshaw saves the game under today's date", async ({ page }) => {
    const user = uniqueUser("today");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");
    await typeWord(page, answerForDate(MOCK_TODAY));
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual([MOCK_TODAY]);
  });

  test("/pshaw/[date] saves the game under that route's date, not today", async ({ page }) => {
    const user = uniqueUser("other");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.goto(`/pshaw/${OTHER_DATE}`);
    await typeWord(page, answerForDate(OTHER_DATE));
    await page.waitForTimeout(500);

    const dates = await gameDatesFor(user.email);
    expect(dates).toEqual([OTHER_DATE]);
  });

  test("/pshaw/[date] board state survives a page reload", async ({ page }) => {
    const user = uniqueUser("reload");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.goto(`/pshaw/${OTHER_DATE}`);
    const answer = answerForDate(OTHER_DATE);
    await typeWord(page, answer);
    await expect(page.getByText("You win.")).toBeVisible();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByText("You win.")).toBeVisible();
  });

  test("a logged-out visit to /pshaw/[date] redirects to sign up", async ({ page }) => {
    await page.goto(`/pshaw/${OTHER_DATE}`);
    await expect(page).toHaveURL("/register?reason=previous-day");
  });

  test.afterAll(async () => {
    await db.end();
  });
});
