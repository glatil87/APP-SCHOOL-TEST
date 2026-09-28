import { expect, test } from "@playwright/test";

test("home shows the two report actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Report a missing item/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Report a found item/ })).toBeVisible();
  await expect(page.getByText("You haven’t reported anything yet")).toBeVisible();
});

test("report actions open the matching form page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Report a found item/ }).click();
  await expect(page).toHaveURL(/\/report\/found$/);
  await expect(page.getByRole("heading", { name: "Report a found item" })).toBeVisible();
});

test("tab bar switches between Missing and Found lists", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Missing" }).click();
  await expect(page.getByRole("heading", { name: "Missing items" })).toBeVisible();
  await expect(page.getByText("No missing items right now")).toBeVisible();
  await nav.getByRole("link", { name: "Found" }).click();
  await expect(page.getByRole("heading", { name: "Found items" })).toBeVisible();
});

test("unknown pages show a friendly message", async ({ page }) => {
  await page.goto("/report/banana");
  await expect(page.getByText("We couldn’t find that page")).toBeVisible();
});
