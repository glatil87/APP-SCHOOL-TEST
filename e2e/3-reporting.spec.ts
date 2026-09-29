import { expect, test, type Page } from "@playwright/test";
import { PNG, newApprovedParent } from "./helpers";

test.describe.configure({ mode: "serial" });

let lucy: Page;
let omar: Page;

test("set up two parents", async ({ browser }) => {
  test.setTimeout(120_000);
  lucy = await newApprovedParent(browser, { first: "Lucy", child: "Ben", email: "lucy@example.com", password: "lucy-password" });
  omar = await newApprovedParent(browser, { first: "Omar", child: "Ava", email: "omar@example.com", password: "omar-password" });
});

test("the form explains what's missing", async () => {
  await lucy.getByRole("link", { name: /Report a missing item/ }).click();
  await lucy.waitForLoadState("networkidle");
  await lucy.getByRole("button", { name: "Report missing item" }).click();
  await expect(lucy.getByText("Please check the highlighted fields.")).toBeVisible();
  await expect(lucy.getByText("Please say what the item is")).toBeVisible();
  await expect(lucy.getByText("Please choose a type of item.")).toBeVisible();
  await expect(lucy.getByText("Please choose the main colour.")).toBeVisible();
  await expect(lucy.getByText("Please say where it was last seen.")).toBeVisible();
});

test("future dates are refused", async () => {
  await lucy.getByLabel("Item", { exact: true }).fill("Hat");
  await lucy.getByText("Clothing", { exact: true }).click();
  await lucy.getByText("Red", { exact: true }).click();
  await lucy.getByLabel("Place", { exact: true }).fill("Field");
  await lucy.getByLabel("Date (roughly)").fill("2099-01-01");
  await lucy.getByRole("button", { name: "Report missing item" }).click();
  await expect(lucy.getByText("That date is in the future.")).toBeVisible();
  // What was typed is kept.
  await expect(lucy.getByLabel("Item", { exact: true })).toHaveValue("Hat");
});

test("a parent reports a missing item with a photo", async () => {
  await lucy.goto("/report/missing");
  await lucy.waitForLoadState("networkidle");
  await expect(lucy.getByText("Please make sure no children appear in the photo.")).toBeVisible();

  await lucy.getByLabel("Item", { exact: true }).fill("Water bottle");
  await lucy.getByText("Water bottles", { exact: true }).click();
  await lucy.getByText("Blue", { exact: true }).click();
  await lucy.getByLabel("Brand").fill("Chilly's");
  await lucy.getByLabel("Anything that stands out").fill("Dinosaur sticker on the side");
  await lucy.getByLabel("Place", { exact: true }).fill("Playground");
  await lucy.getByLabel("Add a photo of the item").setInputFiles({ name: "bottle.png", mimeType: "image/png", buffer: PNG });
  await expect(lucy.getByAltText("Photo of the item")).toBeVisible();
  await lucy.getByRole("button", { name: "Report missing item" }).click();

  await lucy.waitForURL(/\/reports\/.+\?new=1/);
  await expect(lucy.getByText("Report added")).toBeVisible();
  await expect(lucy.getByRole("heading", { name: "Water bottle" })).toBeVisible();
  await expect(lucy.getByText("Dinosaur sticker on the side")).toBeVisible();
  await expect(lucy.getByAltText("Photo of the Water bottle")).toBeVisible();

  await lucy.goto("/");
  await expect(lucy.getByRole("link", { name: /Water bottle/ })).toBeVisible();
});

test("other parents see it in the Missing list and can search", async () => {
  await omar.goto("/missing");
  await omar.waitForLoadState("networkidle");
  const card = omar.getByRole("link", { name: /Water bottle/ });
  await expect(card).toBeVisible();
  await expect(card).not.toContainText("Yours");

  await omar.getByPlaceholder(/Search/).fill("dinosaur");
  await expect(card).toHaveCount(0); // search looks at name, colour, place and type
  await omar.getByPlaceholder(/Search/).fill("bottle");
  await expect(card).toBeVisible();
  await omar.getByPlaceholder(/Search/).fill("zzz");
  await expect(omar.getByText("No items match your search")).toBeVisible();
  await omar.getByPlaceholder(/Search/).fill("");

  await card.click();
  await expect(omar.getByRole("heading", { name: "Water bottle" })).toBeVisible();
  await expect(omar.getByText("Your report")).toHaveCount(0);
});

test("a parent reports a found item and says where it is now", async () => {
  await omar.goto("/report/found");
  await omar.waitForLoadState("networkidle");
  await omar.getByLabel("Item", { exact: true }).fill("Blue bottle");
  await omar.getByText("Water bottles", { exact: true }).click();
  await omar.getByText("Blue", { exact: true }).click();
  await omar.getByLabel("Place found").fill("Top playground");
  await omar.getByText("Somewhere else", { exact: true }).click();
  await omar.getByRole("button", { name: "Report found item" }).click();
  await expect(omar.getByText("Please say where the item is now.")).toBeVisible();

  await omar.getByText("Somewhere else", { exact: true }).click();
  await omar.getByLabel("Where is it now?").last().fill("With Mrs Smith in Year 2");
  await omar.getByRole("button", { name: "Report found item" }).click();
  await omar.waitForURL(/\/reports\//);
  await expect(omar.getByText("With Mrs Smith in Year 2")).toBeVisible();

  await lucy.goto("/found");
  await expect(lucy.getByRole("link", { name: /Blue bottle/ })).toBeVisible();
});
