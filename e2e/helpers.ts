import { expect, type Browser, type Page } from "@playwright/test";

export const coordinator = { email: "coordinator@example.com", password: "coordinator-pass" };

/** A tiny 8×8 red PNG. */
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGP47+CAFTEMLQkAmbNfwaFk8aAAAAAASUVORK5CYII=",
  "base64",
);

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
  await page.waitForLoadState("networkidle");
}

/** Invites, signs up and approves a new parent; returns a signed-in page for them. */
export async function newApprovedParent(
  browser: Browser,
  who: { first: string; child: string; email: string; password: string },
): Promise<Page> {
  const coord = await browser.newPage();
  await signIn(coord, coordinator.email, coordinator.password);
  await coord.goto("/admin");
  await coord.waitForLoadState("networkidle");
  await coord.getByRole("button", { name: "Create invite link" }).click();
  const url = (await coord.locator("p.font-mono").textContent())!.trim();

  const page = await browser.newPage();
  await page.goto(new URL(url).pathname);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Your first name").fill(who.first);
  await page.getByLabel("Your child’s first name").fill(who.child);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Choose a password").fill(who.password);
  await page.getByRole("button", { name: "Ask to join" }).click();
  await page.waitForURL(/waiting/);

  await coord.reload();
  await coord.waitForLoadState("networkidle");
  await coord
    .getByRole("listitem")
    .filter({ hasText: `${who.first} (${who.child}’s parent)` })
    .getByRole("button", { name: "Approve" })
    .click();
  await expect(coord.getByText("Nobody waiting")).toBeVisible();
  await coord.close();

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  return page;
}
