import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";

function uniqueUser(tag: string) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-datenav-${tag}-${id}@example.com`,
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

test("date nav sanity check on digout", async ({ page }) => {
  const user = uniqueUser("digout");
  await registerViaUi(page, user);
  await expect(page).toHaveURL("/dashboard");

  // Today's page: previous only, no next.
  await page.goto("/digout");
  await expect(page.getByRole("link", { name: "← Previous" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);

  // Follow previous to a past date: should have both previous and next.
  await page.getByRole("link", { name: "← Previous" }).click();
  await expect(page.getByRole("link", { name: "← Previous" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next →" })).toBeVisible();

  // Clicking next should return to today's page, which has no next link.
  await page.getByRole("link", { name: "Next →" }).click();
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);
});

test("date nav sanity check on miner", async ({ page }) => {
  const user = uniqueUser("miner");
  await registerViaUi(page, user);
  await expect(page).toHaveURL("/dashboard");

  // Today's page: previous only, no next.
  await page.goto("/miner");
  await expect(page.getByRole("link", { name: "← Previous" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);

  // Follow previous to a past date: should have both previous and next.
  await page.getByRole("link", { name: "← Previous" }).click();
  await expect(page.getByRole("link", { name: "← Previous" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next →" })).toBeVisible();

  // Clicking next should return to today's page, which has no next link.
  await page.getByRole("link", { name: "Next →" }).click();
  await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);
});
