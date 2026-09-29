import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { coordinator, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

let lucy: Page;
let omar: Page;
let coord: Page;
let reportUrl = "";

async function report(page: Page, kind: "missing" | "found", item: string, category: string, colour: string, place: string) {
  await page.goto(`/report/${kind}`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Item", { exact: true }).fill(item);
  await page.getByText(category, { exact: true }).click();
  await page.getByText(colour, { exact: true }).click();
  if (place) await page.getByLabel(kind === "missing" ? "Place (optional)" : "Place found (optional)").fill(place);
  await page.getByRole("button", { name: kind === "missing" ? "Report missing item" : "Report found item" }).click();
  await page.waitForURL(/\/reports\/.+\?new=1/);
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

test("sign in", async ({ browser }) => {
  test.setTimeout(90_000);
  // Separate contexts (with the phone settings) so the accessibility checker can run.
  const newPage = async () => (await browser.newContext(test.info().project.use)).newPage();
  lucy = await newPage();
  await signIn(lucy, "lucy@example.com", "lucy-password");
  omar = await newPage();
  await signIn(omar, "omar@example.com", "omar-password");
  coord = await newPage();
  await signIn(coord, coordinator.email, coordinator.password);
});

test("a parent can edit their report", async () => {
  reportUrl = await report(lucy, "missing", "Lunch box", "Lunch boxes", "Green", "Lunch hall");
  await lucy.getByRole("link", { name: "Edit report" }).click();
  await lucy.waitForLoadState("networkidle");
  await expect(lucy.getByLabel("Item", { exact: true })).toHaveValue("Lunch box");
  await lucy.getByText("Red", { exact: true }).click();
  await lucy.getByLabel("Brand").fill("Sistema");
  await lucy.getByRole("button", { name: "Save changes" }).click();
  await lucy.waitForURL(/updated=1/);
  await expect(lucy.getByText("Changes saved ✓")).toBeVisible();
  await expect(lucy.getByText("Sistema")).toBeVisible();
  await expect(lucy.getByText("Red", { exact: true })).toBeVisible();
});

test("other parents can't edit or close someone else's report", async () => {
  await omar.goto(reportUrl);
  await expect(omar.getByRole("link", { name: "Edit report" })).toHaveCount(0);
  await omar.goto(`${reportUrl}/edit`);
  await expect(omar).toHaveURL(new RegExp(`${reportUrl}$`));
});

test("'It turned up' closes the report", async () => {
  await lucy.goto(reportUrl);
  await lucy.getByRole("button", { name: /It turned up/ }).click();
  await lucy.getByRole("button", { name: "Yes, close it" }).click();
  await lucy.waitForURL(/withdrawn=1/);
  await expect(lucy.getByText("Report closed ✓")).toBeVisible();
  await expect(lucy.getByRole("link", { name: /Lunch box/ })).toHaveCount(0);
  await omar.goto("/missing");
  await expect(omar.getByRole("link", { name: /Lunch box/ })).toHaveCount(0);
});

test("the coordinator can remove an unsuitable report", async () => {
  const url = await report(omar, "found", "Pencil case", "Books & stationery", "Black", "Library");
  await coord.goto(url);
  await coord.getByRole("button", { name: "Remove this report" }).click();
  await coord.getByRole("button", { name: "Yes, remove it" }).click();
  await coord.waitForURL(/removed=1/);
  await expect(coord.getByText("Report removed ✓")).toBeVisible();
  await expect(coord.getByRole("link", { name: /Pencil case/ })).toHaveCount(0);
});

test("parents don't see the remove button", async () => {
  const url = await report(omar, "found", "Scarf", "Clothing", "Pink", "Gate");
  await lucy.goto(url);
  await expect(lucy.getByRole("button", { name: "Remove this report" })).toHaveCount(0);
});

test("a green jumper filed under different types is still suggested, with no place or date", async () => {
  const lost = await report(lucy, "missing", "Green jumper", "Clothing", "Green", "");
  await report(omar, "found", "Jumper green", "Uniform", "Green", "");
  await lucy.goto(lost);
  const suggestion = lucy.getByRole("link", { name: /Jumper green/ });
  await expect(suggestion).toContainText("Worth a look");
  await expect(suggestion).toContainText("Similar types (Clothing and Uniform)");
});

test("main screens pass an accessibility check", async () => {
  test.setTimeout(120_000);
  const pages: [Page, string][] = [
    [lucy, "/"],
    [lucy, "/missing"],
    [lucy, "/found"],
    [lucy, "/report/missing"],
    [lucy, "/report/found"],
    [lucy, "/account"],
    [lucy, "/help"],
    [coord, "/admin"],
  ];
  const problems: string[] = [];
  for (const [page, path] of pages) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    for (const v of results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
      problems.push(`${path}: ${v.id} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(", ")}`);
    }
  }
  expect(problems).toEqual([]);
  const signedOut = await (await lucy.context().browser()!.newContext(test.info().project.use)).newPage();
  await signedOut.goto("/sign-in");
  const results = await new AxeBuilder({ page: signedOut }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});
