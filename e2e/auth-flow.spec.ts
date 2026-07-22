import { test, expect, type Page } from "@playwright/test";

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: "Test User",
    email: `e2e-${id}@example.com`,
    password: "InitialPass123!",
    newPassword: "UpdatedPass456!",
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

async function loginViaUi(
  page: Page,
  user: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

async function logoutViaUi(page: Page) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Log out" })
    .click();
}

test.describe("auth flow", () => {
  test("user can sign up, log in, change password, and log out", async ({
    page,
  }) => {
    const user = uniqueUser();

    await test.step("sign up", async () => {
      await registerViaUi(page, user);
      await expect(page).toHaveURL("/dashboard");
      await expect(page.getByText(`Signed in as ${user.name}`)).toBeVisible();
    });

    await test.step("log out after sign up", async () => {
      await logoutViaUi(page);
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    });

    await test.step("log in", async () => {
      await loginViaUi(page, user);
      await expect(page).toHaveURL("/dashboard");
      await expect(page.getByText(`Signed in as ${user.name}`)).toBeVisible();
    });

    await test.step("change password", async () => {
      await page.getByRole("link", { name: "Change password" }).click();
      await expect(page).toHaveURL("/change-password");

      await page.getByLabel("Current password").fill(user.password);
      await page.getByLabel("New password", { exact: true }).fill(user.newPassword);
      await page.getByLabel("Confirm new password").fill(user.newPassword);
      await page.getByRole("button", { name: "Update password" }).click();

      await expect(page.getByText("Password updated.")).toBeVisible();
    });

    await test.step("log out after password change", async () => {
      await logoutViaUi(page);
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    });

    await test.step("old password no longer works", async () => {
      await loginViaUi(page, { email: user.email, password: user.password });
      await expect(
        page.getByText("Invalid email or password."),
      ).toBeVisible();
      await expect(page).toHaveURL("/login");
    });

    await test.step("new password logs in successfully", async () => {
      await loginViaUi(page, {
        email: user.email,
        password: user.newPassword,
      });
      await expect(page).toHaveURL("/dashboard");
      await expect(page.getByText(`Signed in as ${user.name}`)).toBeVisible();
    });
  });

  test("sign up rejects a duplicate email", async ({ page }) => {
    const user = uniqueUser();

    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");
    await logoutViaUi(page);

    await registerViaUi(page, user);
    await expect(
      page.getByText("An account with that email already exists."),
    ).toBeVisible();
    await expect(page).toHaveURL("/register");
  });

  test("login rejects an incorrect password", async ({ page }) => {
    const user = uniqueUser();

    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");
    await logoutViaUi(page);

    await loginViaUi(page, { email: user.email, password: "wrong-password" });
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("change password rejects an incorrect current password", async ({
    page,
  }) => {
    const user = uniqueUser();

    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.getByRole("link", { name: "Change password" }).click();
    await page.getByLabel("Current password").fill("wrong-current-password");
    await page.getByLabel("New password", { exact: true }).fill(user.newPassword);
    await page.getByLabel("Confirm new password").fill(user.newPassword);
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(
      page.getByText("Current password is incorrect."),
    ).toBeVisible();
  });

  test("logged in user can access and play the miner mining game", async ({
    page,
  }) => {
    const user = uniqueUser();

    await registerViaUi(page, user);
    await expect(page).toHaveURL("/dashboard");

    await page.getByRole("link", { name: "Miner" }).click();
    await expect(page).toHaveURL("/miner");
    await expect(page.getByRole("heading", { name: "Miner" })).toBeVisible();

    const hiddenCells = page.getByRole("button", { name: "Hidden cell" });
    await expect(hiddenCells).toHaveCount(100);

    await hiddenCells.first().click();
    await expect(hiddenCells).not.toHaveCount(100);

    await page.getByRole("button", { name: "Revealing" }).click();
    await expect(
      page.getByRole("button", { name: "Flagging" }),
    ).toBeVisible();

    await hiddenCells.first().click();
    await expect(
      page.getByRole("button", { name: "Flagged cell" }),
    ).toHaveCount(1);
  });

  test("protected routes redirect anonymous users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    await page.goto("/change-password");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    await page.goto("/miner");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });
});
