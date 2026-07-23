import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";

// Spoofs the server's notion of "today" via the x-mock-today header (see
// todayDateString in src/app/miner/grid-file.ts). Playwright's clock API only
// patches Date() inside the browser page, but todayDateString() runs on the
// Next.js server process, so a header override is used instead.
function hundredYearsFromToday(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 100);
  return d.toISOString().slice(0, 10);
}

const FAR_FUTURE_DATE = hundredYearsFromToday(); // past the last generated grid for both games

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-fallback-${tag}-${id}@example.com`,
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

test("miner falls back to the closest past date when today's grid is missing", async ({
  page,
}) => {
  const user = uniqueUser("miner");
  await registerViaUi(page, user);
  await expect(page).toHaveURL("/dashboard");

  await page.setExtraHTTPHeaders({ "x-mock-today": FAR_FUTURE_DATE });
  await page.goto("/miner");

  await expect(page.getByRole("heading", { name: "Miner" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← Previous" })).toHaveAttribute(
    "href",
    "/miner/2026-08-01",
  );
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);
});

test("digout falls back to the closest past date when today's grid is missing", async ({
  page,
}) => {
  const user = uniqueUser("digout");
  await registerViaUi(page, user);
  await expect(page).toHaveURL("/dashboard");

  await page.setExtraHTTPHeaders({ "x-mock-today": FAR_FUTURE_DATE });
  await page.goto("/digout");

  await expect(page.getByRole("heading", { name: "Digout" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← Previous" })).toHaveAttribute(
    "href",
    "/digout/2026-07-31",
  );
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);
});
