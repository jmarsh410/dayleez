import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client as PgClient } from "pg";
import { MAX_GUESSES, ONOMATOPOEIA_WORDS } from "../src/app/pshaw/game-logic";

const db = new PgClient({ connectionString: process.env.DATABASE_URL });
const dbReady = db.connect();

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-pshaw-persist-${tag}-${id}@example.com`,
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

const MOCK_TODAY = "2026-08-03";

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

async function gameFor(email: string): Promise<{ guesses: string[]; status: string } | null> {
  await dbReady;
  const { rows } = await db.query<{ guesses: string[]; status: string }>(
    `SELECT g.guesses, g.status
     FROM "PshawGame" g
     JOIN "User" u ON u.id = g."userId"
     WHERE u.email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

test.describe("pshaw game persistence", () => {
  test("an in-progress guest game survives a page reload via localStorage", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    const wrongGuess = ONOMATOPOEIA_WORDS.find((w) => w !== answer)!;
    await typeWord(page, wrongGuess);

    await expect(page.getByTestId("tile-0-0")).toHaveAttribute(
      "aria-label",
      new RegExp(`^${wrongGuess[0]} - `),
    );

    await page.reload();

    await expect(page.getByTestId("tile-0-0")).toHaveAttribute(
      "aria-label",
      new RegExp(`^${wrongGuess[0]} - `),
    );
    await expect(page.getByText("Guess 2 of 6")).toBeVisible();
  });

  test("an in-progress logged-in game survives a page reload via the DB", async ({ page }) => {
    const user = uniqueUser("in-progress");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    const wrongGuess = ONOMATOPOEIA_WORDS.find((w) => w !== answer)!;
    await typeWord(page, wrongGuess);

    await page.waitForTimeout(500);
    const saved = await gameFor(user.email);
    expect(saved).toEqual({ guesses: [wrongGuess], status: "playing" });

    await page.reload();
    await expect(page.getByTestId("tile-0-0")).toHaveAttribute(
      "aria-label",
      new RegExp(`^${wrongGuess[0]} - `),
    );
  });

  test("a won game is restored as won after reload", async ({ page }) => {
    const user = uniqueUser("won");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    await typeWord(page, answer);
    await expect(page.getByText("You win.")).toBeVisible();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByText("You win.")).toBeVisible();
    await expect(page.getByTestId("tile-0-0")).toHaveAttribute(
      "aria-label",
      `${answer[0]} - correct`,
    );
  });

  test("a lost game is restored as lost after reload", async ({ page }) => {
    const user = uniqueUser("lost");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    const wrongWords = ONOMATOPOEIA_WORDS.filter((w) => w !== answer).slice(0, MAX_GUESSES);
    for (const word of wrongWords) {
      await typeWord(page, word);
    }

    const lostText = `Out of guesses. The word was ${answer}.`;
    await expect(page.getByText(lostText)).toBeVisible();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByText(lostText)).toBeVisible();
  });

  test.afterAll(async () => {
    await db.end();
  });
});
