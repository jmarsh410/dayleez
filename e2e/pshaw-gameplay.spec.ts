import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MAX_GUESSES, ONOMATOPOEIA_WORDS, WORD_LENGTH } from "../src/app/pshaw/game-logic";

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-pshaw-gameplay-${tag}-${id}@example.com`,
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

// A fixed, known-good word date, spoofed as "today" via the x-mock-today
// header (see todayDateString in src/app/miner/grid-file.ts) so this test
// doesn't depend on the real wall clock or on today's word file existing.
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

test.describe("pshaw gameplay", () => {
  test("submitting the correct word wins the game", async ({ page }) => {
    const user = uniqueUser("win");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    await typeWord(page, answer);

    for (let c = 0; c < WORD_LENGTH; c++) {
      await expect(page.getByTestId(`tile-0-${c}`)).toHaveAttribute(
        "aria-label",
        `${answer[c]} - correct`,
      );
    }
    await expect(page.getByText("You win.")).toBeVisible();
  });

  test("running out of guesses loses the game and reveals the answer", async ({ page }) => {
    const user = uniqueUser("lose");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    const answer = answerForDate(MOCK_TODAY);
    const wrongWords = ONOMATOPOEIA_WORDS.filter((w) => w !== answer).slice(0, MAX_GUESSES);
    expect(wrongWords).toHaveLength(MAX_GUESSES);

    for (const word of wrongWords) {
      await typeWord(page, word);
    }

    await expect(page.getByText(`Out of guesses. The word was ${answer}.`)).toBeVisible();

    // The keyboard is disabled once the game is over.
    await expect(page.getByRole("button", { name: "Enter" })).toBeDisabled();
  });

  test("an invalid word is rejected without consuming a guess row", async ({ page }) => {
    const user = uniqueUser("invalid");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    // "ZZZZZ" isn't in ONOMATOPOEIA_WORDS.
    await typeWord(page, "ZZZZZ");

    await expect(page.getByText("Not a valid onomatopoeia.")).toBeVisible();
    // The row wasn't committed, so row 0 still shows the raw typed letters,
    // uncolored (no evaluated state suffix on the aria-label).
    await expect(page.getByTestId("tile-0-0")).toHaveAttribute("aria-label", "Z");
    await expect(page.getByText("Guess 1 of 6")).toHaveCount(0);
  });

  test("tile and keyboard colors reflect correct/present/absent letters", async ({ page }) => {
    const user = uniqueUser("colors");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    // MOCK_TODAY's answer is ACHOO. CHOMP shares C/H/O with it, each in the
    // wrong slot, giving a deterministic mix of "present" and "absent" with
    // no "correct" letters at all.
    expect(answerForDate(MOCK_TODAY)).toBe("ACHOO");
    await typeWord(page, "CHOMP");

    const expected = ["present", "present", "present", "absent", "absent"];
    for (let c = 0; c < WORD_LENGTH; c++) {
      await expect(page.getByTestId(`tile-0-${c}`)).toHaveAttribute(
        "aria-label",
        `${"CHOMP"[c]} - ${expected[c]}`,
      );
    }

    await expect(page.getByTestId("key-C")).toHaveAttribute("data-state", "present");
    await expect(page.getByTestId("key-H")).toHaveAttribute("data-state", "present");
    await expect(page.getByTestId("key-O")).toHaveAttribute("data-state", "present");
    await expect(page.getByTestId("key-M")).toHaveAttribute("data-state", "absent");
    await expect(page.getByTestId("key-P")).toHaveAttribute("data-state", "absent");
  });
});
