import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// "I found this" / "This is mine" straight from an item's page.
test.describe.configure({ mode: "serial" });

let lucy: Page;
let omar: Page;

async function report(page: Page, kind: "missing" | "found", item: string, category: string, colour: string) {
  await page.goto(`/report/${kind}`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Item", { exact: true }).fill(item);
  await page.getByText(category, { exact: true }).click();
  await page.getByText(colour, { exact: true }).click();
  if (kind === "found") await page.getByText("In the lost property box", { exact: true }).click();
  await page.getByRole("button", { name: kind === "missing" ? "Report missing item" : "Report found item" }).click();
  await page.waitForURL(/\/reports\/.+\?new=1/);
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

async function axeProblems(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} — ${n.failureSummary}`));
}

test("sign in", async ({ browser }) => {
  test.setTimeout(90_000);
  const newPage = async () => (await browser.newContext(test.info().project.use)).newPage();
  lucy = await newPage();
  await signIn(lucy, "lucy@example.com", "lucy-password");
  omar = await newPage();
  await signIn(omar, "omar@example.com", "omar-password");
});

test("you can't claim your own report", async () => {
  await report(lucy, "missing", "Black cartuchera", "Books & stationery", "Black");
  await expect(lucy.getByRole("button", { name: "I found this" })).toHaveCount(0);
});

test("'I found this' on a missing item confirms a match", async () => {
  await omar.goto("/missing");
  await omar.getByRole("link", { name: /Black cartuchera/ }).click();
  await omar.waitForLoadState("networkidle");
  await omar.getByRole("button", { name: "I found this" }).click();
  const yes = omar.getByRole("button", { name: "Yes, I found it" });
  await expect(yes).toBeDisabled();
  await omar.getByText("Handed in to the school office", { exact: true }).click();

  expect(await axeProblems(omar)).toEqual([]);

  await yes.click();
  await omar.waitForURL(/\/matches\/.+\?new=1/);
  await expect(omar.getByRole("link", { name: /lucy@example.com/ })).toBeVisible();
  await expect(omar.getByText("Handed in to the school office").first()).toBeVisible();
  expect(await axeProblems(omar)).toEqual([]);

  // Lucy sees it on Home, and the item has left the Missing list.
  await lucy.goto("/");
  await expect(lucy.getByRole("link", { name: /Black cartuchera/ })).toContainText("See contact details");
  await omar.goto("/missing");
  await expect(omar.getByRole("link", { name: /Black cartuchera/ })).toHaveCount(0);
});

test("the finder gets a handover note, not a report of their own", async () => {
  for (const path of ["/found", "/missing"]) {
    await omar.goto(path);
    await expect(omar.getByRole("link", { name: /cartuchera/ })).toHaveCount(0);
  }
  await omar.goto("/");
  await expect(omar.getByRole("heading", { name: "Handovers to arrange" })).toBeVisible();
  await expect(omar.getByRole("link", { name: /You found the Black cartuchera/ })).toBeVisible();
  await expect(omar.getByRole("region", { name: "Your reports" }).getByText("Black cartuchera")).toHaveCount(0);

  // Once it's handed back, the note goes too.
  await lucy.goto("/");
  await lucy.getByRole("link", { name: /Black cartuchera/ }).click();
  await lucy.getByRole("link", { name: /See contact details/ }).click();
  await lucy.getByRole("button", { name: "Mark as returned" }).click();
  await lucy.getByRole("button", { name: "Yes, it’s returned" }).click();
  await expect(lucy.getByRole("heading", { name: /Returned/ })).toBeVisible();
  await omar.goto("/");
  await expect(omar.getByRole("link", { name: /Black cartuchera/ })).toHaveCount(0);
});

test("'This is mine' on a found item confirms a match", async () => {
  const url = await report(omar, "found", "Red cap", "Clothing", "Red");
  await lucy.goto(url);
  await lucy.waitForLoadState("networkidle");
  await lucy.getByRole("button", { name: "This is mine" }).click();
  await lucy.getByRole("button", { name: "Yes, it’s mine" }).click();
  await lucy.waitForURL(/\/matches\/.+\?new=1/);
  await expect(lucy.getByRole("link", { name: /omar@example.com/ })).toBeVisible();

  // Already matched: no claim button any more.
  await lucy.goto(url);
  await expect(lucy.getByRole("button", { name: "This is mine" })).toHaveCount(0);
});

test("undoing it puts only the real item back on the list", async () => {
  await lucy.goto("/");
  await lucy.getByRole("link", { name: /The Red cap is yours/ }).click();
  await lucy.getByRole("button", { name: "Not a match after all" }).click();
  await lucy.getByRole("button", { name: "Yes, undo the match" }).click();
  await lucy.waitForURL(/reopened=1/);
  await expect(lucy.getByRole("heading", { name: "Red cap" })).toBeVisible();

  await lucy.goto("/found");
  await expect(lucy.getByRole("link", { name: /Red cap/ })).toHaveCount(1);
  await lucy.goto("/missing");
  await expect(lucy.getByRole("link", { name: /Red cap/ })).toHaveCount(0);
  await lucy.goto("/");
  await expect(lucy.getByText(/Red cap/)).toHaveCount(0);
});
