import { expect, test, type Page } from "@playwright/test";

// Runs after 1-joining.spec.ts and uses the coordinator created there.
test.describe.configure({ mode: "serial" });

const coordinator = { email: "coordinator@example.com", password: "coordinator-pass" };
const parent = { email: "priya@example.com", password: "priya-password" };

// A tiny 8×8 red PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGP47+CAFTEMLQkAmbNfwaFk8aAAAAAASUVORK5CYII=",
  "base64",
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
  await page.waitForLoadState("networkidle");
}

test("set up an approved parent", async ({ browser }) => {
  const coord = await browser.newPage();
  await signIn(coord, coordinator.email, coordinator.password);
  await coord.goto("/admin");
  await coord.waitForLoadState("networkidle");
  await coord.getByRole("button", { name: "Create invite link" }).click();
  const url = (await coord.locator("p.font-mono").textContent())!.trim();

  const page = await browser.newPage();
  await page.goto(new URL(url).pathname);
  await page.getByLabel("Your first name").fill("Priya");
  await page.getByLabel("Your child’s first name").fill("Leo");
  await page.getByLabel("Email").fill(parent.email);
  await page.getByLabel("Choose a password").fill(parent.password);
  await page.getByRole("button", { name: "Ask to join" }).click();
  await page.waitForURL(/waiting/);

  await coord.reload();
  await coord.waitForLoadState("networkidle");
  await coord.getByRole("listitem").filter({ hasText: "Priya (Leo’s parent)" }).getByRole("button", { name: "Approve" }).click();
  await expect(coord.getByText("Nobody waiting")).toBeVisible();
});

test("a parent opens their account from the home screen and edits details", async ({ page }) => {
  await signIn(page, parent.email, parent.password);
  await page.getByRole("link", { name: "Your account" }).click();
  await expect(page.getByRole("heading", { name: "Priya (Leo’s parent)" })).toBeVisible();

  await page.getByLabel("Your child’s first name").fill("");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Please enter your child’s first name.")).toBeVisible();

  await page.getByLabel("Your child’s first name").fill("Leon");
  await page.getByLabel("Phone number").fill("07700 900456");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Saved ✓")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Priya (Leon’s parent)" })).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Phone number")).toHaveValue("07700 900456");
});

test("a parent can pick a symbol, upload a photo and remove it", async ({ page }) => {
  await signIn(page, parent.email, parent.password);
  await page.goto("/account");
  await page.waitForLoadState("networkidle");

  await page.locator("label", { has: page.getByLabel("Lion") }).click();
  await page.getByRole("button", { name: "Save picture" }).click();
  await expect(page.getByText("Saved ✓")).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Upload a photo").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Photo updated ✓")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("header img")).toHaveCount(1);

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Photo removed ✓")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("header img")).toHaveCount(0);
});

test("changing email and password needs the current password", async ({ page }) => {
  await signIn(page, parent.email, parent.password);
  await page.goto("/account");
  await page.waitForLoadState("networkidle");

  const emailForm = page.locator("form", { has: page.getByRole("button", { name: "Change email" }) });
  await emailForm.getByLabel("Email").fill("priya.new@example.com");
  await emailForm.getByLabel("Current password").fill("wrong-password");
  await emailForm.getByRole("button", { name: "Change email" }).click();
  await expect(emailForm.getByText("That password isn’t right.")).toBeVisible();

  await emailForm.getByLabel("Current password").fill(parent.password);
  await emailForm.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByText(/Email changed ✓/)).toBeVisible();
  await page.waitForLoadState("networkidle");

  const passwordForm = page.locator("form", { has: page.getByRole("button", { name: "Change password" }) });
  await passwordForm.getByLabel("Current password").fill(parent.password);
  await passwordForm.getByLabel("New password").fill("priya-new-password");
  await passwordForm.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed ✓")).toBeVisible();
  await page.waitForLoadState("networkidle");

  parent.email = "priya.new@example.com";
  parent.password = "priya-new-password";
  const fresh = await page.context().browser()!.newPage();
  await signIn(fresh, parent.email, parent.password);
  await expect(fresh.getByRole("heading", { name: "Hello, Priya" })).toBeVisible();
});

test("a parent can delete their account", async ({ page }) => {
  await signIn(page, parent.email, parent.password);
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Delete my account…" }).click();
  const form = page.locator("form", { has: page.getByRole("button", { name: "Delete permanently" }) });
  await form.getByLabel("Current password").fill(parent.password);
  await form.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("Your account has been deleted.")).toBeVisible();

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(parent.email);
  await page.getByLabel("Password").fill(parent.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don’t match.")).toBeVisible();
});

test("the only coordinator can't delete their account", async ({ page }) => {
  await signIn(page, coordinator.email, coordinator.password);
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Delete my account…" }).click();
  const form = page.locator("form", { has: page.getByRole("button", { name: "Delete permanently" }) });
  await form.getByLabel("Current password").fill(coordinator.password);
  await form.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText(/You’re the only coordinator/)).toBeVisible();
});
