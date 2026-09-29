import { describe, expect, it } from "vitest";
import { parseReport, todayInSchool } from "./reportValidation";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const today = "2026-09-29";
const bottle = {
  item_name: " Water bottle ",
  category: "Water bottles",
  colour: "Blue",
  brand: "Chilly's",
  size: "",
  details: "Dinosaur sticker",
  location: "Playground",
  event_date: "2026-09-28",
};

describe("parseReport", () => {
  it("accepts a complete missing report and tidies it", () => {
    const r = parseReport(form(bottle), "missing", today);
    expect(r.ok).toBe(true);
    expect(r.ok && r.data).toEqual({
        kind: "missing",
        itemName: "Water bottle",
        category: "Water bottles",
        colour: "Blue",
        brand: "Chilly's",
        size: null,
        details: "Dinosaur sticker",
        location: "Playground",
        eventDate: "2026-09-28",
        currentLocation: null,
    });
  });

  it("lists every missing required field in plain words", () => {
    const r = parseReport(form({}), "missing", today);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.fieldErrors).sort()).toEqual(["category", "colour", "event_date", "item_name", "location"]);
    expect(r.fieldErrors.location).toBe("Please say where it was last seen.");
  });

  it("found reports also need to say where the item is now", () => {
    const r = parseReport(form(bottle), "found", today);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toEqual({ current_location: "Please say where the item is now." });
    const ok = parseReport(form({ ...bottle, current_location: "Handed in to the school office" }), "found", today);
    expect(ok.ok && ok.data.currentLocation).toBe("Handed in to the school office");
  });

  it("rejects future dates and dates over a year ago", () => {
    const future = parseReport(form({ ...bottle, event_date: "2026-09-30" }), "missing", today);
    expect(!future.ok && future.fieldErrors.event_date).toMatch(/in the future/);
    const old = parseReport(form({ ...bottle, event_date: "2025-01-01" }), "missing", today);
    expect(!old.ok && old.fieldErrors.event_date).toMatch(/more than a year/);
    expect(parseReport(form({ ...bottle, event_date: today }), "missing", today).ok).toBe(true);
  });

  it("only accepts the listed types and colours", () => {
    const r = parseReport(form({ ...bottle, category: "Spaceship", colour: "Plaid" }), "missing", today);
    expect(!r.ok && Object.keys(r.fieldErrors)).toEqual(["category", "colour"]);
  });

  it("keeps what was typed when there are errors", () => {
    const r = parseReport(form({ ...bottle, location: "" }), "missing", today);
    expect(!r.ok && r.values.details).toBe("Dinosaur sticker");
  });
});

describe("todayInSchool", () => {
  it("uses UK time, so late evening in winter is still today", () => {
    expect(todayInSchool(new Date("2026-12-01T23:30:00Z"))).toBe("2026-12-01");
    // Just after midnight in summer (BST) is already the next day in the UK.
    expect(todayInSchool(new Date("2026-06-01T23:30:00Z"))).toBe("2026-06-02");
  });
});
