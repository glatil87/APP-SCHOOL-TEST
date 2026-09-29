import { expect, test, type Page } from "@playwright/test";
import { newApprovedParent, signIn } from "./helpers";

// Uses the reports made in 3-reporting.spec.ts:
//   Lucy — missing "Water bottle" (blue, Chilly's, dinosaur sticker, Playground)
//   Omar — found "Blue bottle" (blue, Top playground, with Mrs Smith)
test.describe.configure({ mode: "serial" });

let lucy: Page;
let omar: Page;
let nina: Page;
let lucyReportUrl = "";

test("sign in the parents", async ({ browser }) => {
  test.setTimeout(120_000);
  lucy = await browser.newPage();
  await signIn(lucy, "lucy@example.com", "lucy-password");
  omar = await browser.newPage();
  await signIn(omar, "omar@example.com", "omar-password");
  nina = await newApprovedParent(browser, { first: "Nina", child: "Leo", email: "nina@example.com", password: "nina-password" });
});

test("a parent sees a possible match on Home and on their report", async () => {
  await lucy.goto("/");
  const card = lucy.getByRole("link", { name: /Water bottle/ });
  await expect(card).toContainText("1 possible match");
  await card.click();
  await lucy.waitForLoadState("networkidle");
  lucyReportUrl = new URL(lucy.url()).pathname;

  const suggestion = lucy.getByRole("link", { name: /Blue bottle/ });
  await expect(suggestion).toContainText("Worth a look");
  await expect(suggestion).toContainText("Both blue");
  await expect(lucy.getByText(/suggestions only/)).toBeVisible();
});

test("the compare screen explains why, and never claims certainty", async () => {
  await lucy.getByRole("link", { name: /Blue bottle/ }).click();
  await expect(lucy.getByRole("heading", { name: "Could this be the same item?" })).toBeVisible();
  await expect(lucy.getByText("Only the two parents can tell for sure.", { exact: false })).toBeVisible();
  await expect(lucy.getByText("With Mrs Smith in Year 2")).toBeVisible();
  await expect(lucy.getByRole("button", { name: "This looks like a match" })).toBeVisible();
  await expect(lucy.getByText(/certain|definitely/i)).toHaveCount(0);
});

test("other parents can look but not decide", async () => {
  await nina.goto(new URL(lucy.url()).pathname);
  await expect(nina.getByText("Only the two parents who made these reports can confirm")).toBeVisible();
  await expect(nina.getByRole("button", { name: "This looks like a match" })).toHaveCount(0);
});

test("'Not a match' hides the suggestion for everyone, and can be undone", async () => {
  const compareUrl = new URL(lucy.url()).pathname;
  await omar.goto(compareUrl);
  await omar.getByRole("button", { name: "Not a match" }).click();
  await omar.waitForURL(/dismissed=1/);
  await expect(omar.getByText("that suggestion won’t be shown again")).toBeVisible();

  await lucy.goto(lucyReportUrl);
  await expect(lucy.getByText("No possible matches yet")).toBeVisible();

  await lucy.goto(compareUrl);
  await expect(lucy.getByText(/marked “Not a match”/)).toBeVisible();
  await lucy.getByRole("button", { name: /Undo/ }).click();
  await expect(lucy.getByRole("button", { name: "This looks like a match" })).toBeVisible();
});

test("confirming asks first, then shares contact details and removes both items from the lists", async () => {
  await lucy.getByRole("button", { name: "This looks like a match" }).click();
  await expect(lucy.getByText("Confirm this match?")).toBeVisible();
  await lucy.getByRole("button", { name: "Yes, confirm" }).click();

  await lucy.waitForURL(/\/matches\/.+\?new=1/);
  await expect(lucy.getByRole("heading", { name: "Match confirmed" })).toBeVisible();
  await expect(lucy.getByRole("link", { name: /omar@example.com/ })).toBeVisible();
  await expect(lucy.getByText("With Mrs Smith in Year 2").first()).toBeVisible();

  await nina.goto("/missing");
  await expect(nina.getByRole("link", { name: /Water bottle/ })).toHaveCount(0);
  await nina.goto("/found");
  await expect(nina.getByRole("link", { name: /Blue bottle/ })).toHaveCount(0);

  await omar.goto("/");
  const omarCard = omar.getByRole("link", { name: /Blue bottle/ });
  await expect(omarCard).toContainText("See contact details");
  await omarCard.click();
  await omar.getByRole("link", { name: /See contact details/ }).click();
  await expect(omar.getByRole("link", { name: /lucy@example.com/ })).toBeVisible();
});

test("other parents can't open the match page", async () => {
  await nina.goto(new URL(lucy.url()).pathname);
  await expect(nina.getByText("We couldn’t find that page")).toBeVisible();
});

test("a match can be undone, which puts both items back", async () => {
  await omar.getByRole("button", { name: "Not a match after all" }).click();
  await omar.getByRole("button", { name: "Yes, undo the match" }).click();
  await omar.waitForURL(/reopened=1/);
  await nina.goto("/missing");
  await expect(nina.getByRole("link", { name: /Water bottle/ })).toBeVisible();
});

test("marking returned closes both reports", async () => {
  // The undone pair is no longer suggested; bring it back and confirm again.
  await lucy.goto(lucyReportUrl);
  await expect(lucy.getByText("No possible matches yet")).toBeVisible();
  await omar.goto("/");
  const omarHref = await omar.getByRole("link", { name: /Blue bottle/ }).getAttribute("href");
  const missingId = lucyReportUrl.split("/").pop()!;
  const foundId = omarHref!.split("/").pop()!;
  await lucy.goto(`/compare/${missingId}/${foundId}`);
  await lucy.getByRole("button", { name: /Undo/ }).click();
  await lucy.getByRole("button", { name: "This looks like a match" }).click();
  await lucy.getByRole("button", { name: "Yes, confirm" }).click();
  await lucy.waitForURL(/\/matches\//);

  await lucy.getByRole("button", { name: "Mark as returned" }).click();
  await lucy.getByRole("button", { name: "Yes, it’s returned" }).click();
  await expect(lucy.getByRole("heading", { name: /Returned/ })).toBeVisible();

  await lucy.goto("/");
  await expect(lucy.getByRole("link", { name: /Water bottle/ })).toHaveCount(0);
  await omar.goto("/");
  await expect(omar.getByRole("link", { name: /Blue bottle/ })).toHaveCount(0);
});
