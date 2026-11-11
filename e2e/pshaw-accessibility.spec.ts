import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-pshaw-a11y-${tag}-${id}@example.com`,
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

// Same fixed word-date and answer as e2e/pshaw-gameplay.spec.ts, spoofed as
// "today" via x-mock-today so this test doesn't depend on the real clock.
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

test.describe("pshaw accessibility", () => {
  // MOCK_TODAY's answer is ACHOO. CHOMP shares C/H/O with it, each in the
  // wrong slot, giving a deterministic present/present/present/absent/absent
  // mix with no "correct" letters — same fixture as the color test in
  // pshaw-gameplay.spec.ts, reused here for the state-dependent assertions.
  async function submitChompGuess(page: Page) {
    const user = uniqueUser("chomp");
    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");

    expect(answerForDate(MOCK_TODAY)).toBe("ACHOO");
    await typeWord(page, "CHOMP");
  }

  test("keyboard keys expose their state to assistive tech without changing their name", async ({
    page,
  }) => {
    await submitChompGuess(page);

    // State is exposed via aria-describedby (a linked, visually-hidden
    // span), not aria-label — aria-label would replace the key's accessible
    // name ("C") instead of adding to it, breaking name-based lookups.
    await expect(page.getByTestId("key-C")).toHaveAttribute(
      "aria-describedby",
      "key-state-C",
    );
    await expect(page.locator("#key-state-C")).toHaveText("present");
    await expect(page.locator("#key-state-M")).toHaveText("absent");

    // The key's accessible NAME is still just the letter, so it remains
    // click-able by exact name across repeated guesses (see
    // e2e/pshaw-gameplay.spec.ts's typeWord helper).
    await expect(page.getByRole("button", { name: "C", exact: true })).toHaveAttribute(
      "aria-describedby",
      "key-state-C",
    );

    // An untouched key has no description at all.
    await expect(page.getByTestId("key-Z")).not.toHaveAttribute("aria-describedby");
  });

  test("state glyphs render in addition to color on tiles and keys", async ({ page }) => {
    await submitChompGuess(page);

    // C/H/O are "present" tiles -> the "●" glyph; M/P are "absent" -> no glyph.
    await expect(page.getByTestId("tile-0-0")).toContainText("●");
    await expect(page.getByTestId("tile-0-1")).toContainText("●");
    await expect(page.getByTestId("tile-0-2")).toContainText("●");
    await expect(page.getByTestId("tile-0-3")).toHaveText("M");
    await expect(page.getByTestId("tile-0-4")).toHaveText("P");

    await expect(page.getByTestId("key-C")).toContainText("●");
    await expect(page.getByTestId("key-M")).toHaveText("M");
  });

  test("each guess row is grouped for screen readers", async ({ page }) => {
    await submitChompGuess(page);

    const row = page.getByRole("group", { name: "Guess 1 of 6" });
    await expect(row).toBeVisible();
    await expect(row.getByTestId(/^tile-0-/)).toHaveCount(5);
  });

  test("the fixed color pairings replace the old failing ones", async ({ page }) => {
    await submitChompGuess(page);

    // Regression guard for the contrast fix: "present" tiles must use dark
    // text on yellow, not the old white-on-yellow (~1.9:1 contrast).
    await expect(page.getByTestId("tile-0-0")).toHaveClass(/text-neutral-900/);
    await expect(page.getByTestId("tile-0-0")).not.toHaveClass(/\btext-white\b/);
  });

  test("the on-screen keyboard doesn't force horizontal scrolling at 320px width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.setExtraHTTPHeaders({ "x-mock-today": MOCK_TODAY });
    await page.goto("/pshaw");
    await expect(page.getByRole("button", { name: "Enter" })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});
