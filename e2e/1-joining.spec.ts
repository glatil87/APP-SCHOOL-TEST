import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const coordinator = { email: "coordinator@example.com", password: "coordinator-pass" };
const parent = { email: "sam@example.com", password: "sam-password" };
let inviteUrl = "";

async function signIn(page: Page, email: string, password: string, { expectSuccess = true } = {}) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (expectSuccess) {
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
    await page.waitForLoadState("networkidle");
  }
}

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/missing");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmissing/);
  await expect(page.getByRole("heading", { name: "School Lost & Found" })).toBeVisible();
});

test("the first person sets up the school and becomes coordinator", async ({ page }) => {
  await page.goto("/setup");
  await page.getByRole("button", { name: "Set up the app" }).click();
  await expect(page.getByText("Please enter the school’s name.")).toBeVisible();

  await page.getByLabel("School name").fill("Oakfield Primary");
  await page.getByLabel("Your first name").fill("Alex");
  await page.getByLabel("Your child’s first name").fill("Jo");
  await page.locator("label", { has: page.getByLabel("Owl") }).click();
  await expect(page.getByLabel("Owl")).toBeChecked();
  await page.getByLabel("Email").fill(coordinator.email);
  await page.getByLabel("Choose a password").fill(coordinator.password);
  await page.getByRole("button", { name: "Set up the app" }).click();

  await expect(page).toHaveURL(/\/admin\?welcome=1/);
  await expect(page.getByText("All set up!")).toBeVisible();
  await expect(page.getByText("Oakfield Primary")).toBeVisible();
});

test("setup closes once a coordinator exists", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByText("The app is already set up")).toBeVisible();
});

test("the coordinator creates an invite link", async ({ page }) => {
  await signIn(page, coordinator.email, coordinator.password);
  await expect(page.getByRole("heading", { name: "Hello, Alex" })).toBeVisible();
  await page.getByRole("link", { name: /Members & invite links/ }).click();
  await page.getByLabel(/Label/).fill("Year 3 WhatsApp");
  await page.getByRole("button", { name: "Create invite link" }).click();
  const link = page.locator("p.font-mono");
  await expect(link).toContainText("/join/");
  inviteUrl = (await link.textContent())!.trim();
  await expect(page.getByText("Year 3 WhatsApp", { exact: true })).toBeVisible();
});

test("a wrong invite link shows a friendly message", async ({ page }) => {
  await page.goto("/join/0123456789abcdef");
  await expect(page.getByText("This invite link isn’t valid")).toBeVisible();
});

test("a parent joins with the link and waits for approval", async ({ page }) => {
  await page.goto(new URL(inviteUrl).pathname);
  await expect(page.getByRole("heading", { name: "Join Oakfield Primary" })).toBeVisible();

  await page.getByRole("button", { name: "Ask to join" }).click();
  await expect(page.getByText("Please enter your first name.")).toBeVisible();
  await expect(page.getByText("Please choose a password with at least 8 characters.")).toBeVisible();

  await page.getByLabel("Your first name").fill("Sam");
  await page.getByLabel("Your child’s first name").fill("Mia");
  await page.getByLabel("Phone number").fill("07700 900123");
  await page.getByLabel("Email").fill(parent.email);
  await page.getByLabel("Choose a password").fill(parent.password);
  await page.getByRole("button", { name: "Ask to join" }).click();

  await expect(page).toHaveURL(/\/waiting/);
  await expect(page.getByRole("heading", { name: "Thanks, Sam!" })).toBeVisible();

  // Not approved yet: the app itself stays closed.
  await page.goto("/missing");
  await expect(page).toHaveURL(/\/waiting/);
});

test("the coordinator approves the parent, who can then use the app", async ({ browser }) => {
  const coord = await browser.newPage();
  await signIn(coord, coordinator.email, coordinator.password);
  await coord.goto("/admin");
  await coord.waitForLoadState("networkidle");
  const row = coord.getByRole("listitem").filter({ hasText: "Sam (Mia’s parent)" });
  await expect(row).toContainText(parent.email);
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(coord.getByText("Nobody waiting")).toBeVisible();

  const page = await browser.newPage();
  await signIn(page, parent.email, parent.password);
  await expect(page.getByRole("heading", { name: "Hello, Sam" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Members & invite links/ })).toHaveCount(0);
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/$/);
});

test("a wrong password shows a clear message", async ({ page }) => {
  await signIn(page, parent.email, "not-the-password", { expectSuccess: false });
  await expect(page.getByText("That email and password don’t match.")).toBeVisible();
});

test("the coordinator can give a parent a temporary password", async ({ browser }) => {
  const coord = await browser.newPage();
  await signIn(coord, coordinator.email, coordinator.password);
  await coord.goto("/admin");
  await coord.waitForLoadState("networkidle");
  coord.on("dialog", (d) => d.accept());
  const row = coord.getByRole("listitem").filter({ hasText: "Sam (Mia’s parent)" });
  await row.getByRole("button", { name: "Reset password" }).click();
  const tempPassword = row.locator("strong.font-mono");
  await expect(tempPassword).toBeVisible();
  const temp = (await tempPassword.textContent())!.trim();
  expect(temp).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);

  const page = await browser.newPage();
  await signIn(page, parent.email, temp);
  await expect(page.getByRole("heading", { name: "Hello, Sam" })).toBeVisible();
});

test("signing out closes the app again", async ({ page }) => {
  await signIn(page, coordinator.email, coordinator.password);
  await page.getByRole("link", { name: "Your account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
});
