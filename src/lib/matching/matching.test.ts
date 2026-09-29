import { describe, expect, it } from "vitest";
import { findMatches, pairKey, scoreMatch, type MatchableReport } from "./index";
import { normaliseSize, words } from "./normalise";

function report(overrides: Partial<MatchableReport> & Pick<MatchableReport, "id" | "kind">): MatchableReport {
  return {
    itemName: "Water bottle",
    category: "Water bottles",
    colour: "Blue",
    brand: null,
    size: null,
    details: "",
    location: "Playground",
    date: "2026-09-14",
    status: "open",
    ...overrides,
  };
}

const lostBottle = report({
  id: "m1",
  kind: "missing",
  itemName: "Blue water bottle",
  brand: "Chilly's",
  details: "Dinosaur sticker on the side, lid is a bit scratched",
  location: "Top playground",
  date: "2026-09-14",
});

describe("scoreMatch", () => {
  it("ranks a near-identical found item as a strong suggestion with reasons", () => {
    const found = report({
      id: "f1",
      kind: "found",
      itemName: "Water bottle",
      colour: "Blue",
      brand: "Chillys",
      details: "Has a green dinosaur sticker",
      location: "Top playground",
      date: "2026-09-15",
    });
    const result = scoreMatch(lostBottle, found);
    expect(result.band).toBe("strong");
    expect(result.bandLabel).toBe("Several details match");
    expect(result.reasons).toContain("Same brand (Chillys)");
    expect(result.reasons.some((r) => r.includes("“dinosaur”"))).toBe(true);
    expect(result.reasons.length).toBeLessThanOrEqual(4);
    expect(result.differences).toEqual([]);
  });

  it("never suggests items from different categories", () => {
    const found = report({ id: "f2", kind: "found", category: "Lunch boxes", itemName: "Blue lunch box" });
    const result = scoreMatch(lostBottle, found);
    expect(result.score).toBe(0);
    expect(result.band).toBeNull();
  });

  it("suggests a jumper filed as Clothing for one filed as Uniform", () => {
    const lost = report({ id: "m9", kind: "missing", category: "Clothing", itemName: "Green jumper", colour: "Green", location: null, date: null });
    const found = report({ id: "f9", kind: "found", category: "Uniform", itemName: "Jumper green", colour: "Green" });
    const result = scoreMatch(lost, found);
    expect(result.band).toBe("possible");
    expect(result.reasons).toContain("Similar types (Clothing and Uniform)");
    expect(result.reasons).toContain("Both green");
  });

  it("compares “Other” with any type, but less strongly", () => {
    const lost = report({ id: "m10", kind: "missing", category: "Other", itemName: "Blue bottle" });
    const found = report({ id: "f10", kind: "found", itemName: "Blue bottle" });
    expect(scoreMatch(lost, found).score).toBeLessThan(scoreMatch({ ...lost, category: "Water bottles" }, found).score);
    expect(scoreMatch(lost, found).band).not.toBeNull();
  });

  it("treats related colours as partly matching", () => {
    const navy = report({ id: "f3", kind: "found", colour: "Navy" });
    const red = report({ id: "f4", kind: "found", colour: "Red" });
    expect(scoreMatch(lostBottle, navy).reasons).toContain("Similar colours (blue and navy)");
    expect(scoreMatch(lostBottle, navy).score).toBeGreaterThan(scoreMatch(lostBottle, red).score);
    expect(scoreMatch(lostBottle, red).differences).toContain("Different colours (blue and red)");
  });

  it("lowers the score when both brands are given and differ", () => {
    const sameBrand = report({ id: "f5", kind: "found", brand: "Chilly's" });
    const noBrand = report({ id: "f6", kind: "found", brand: null });
    const otherBrand = report({ id: "f7", kind: "found", brand: "Contigo" });
    const s = (r: MatchableReport) => scoreMatch(lostBottle, r).score;
    expect(s(sameBrand)).toBeGreaterThan(s(noBrand));
    expect(s(noBrand)).toBeGreaterThan(s(otherBrand));
    expect(scoreMatch(lostBottle, otherBrand).differences).toContain("Different brands (Chilly's and Contigo)");
  });

  it("matches sizes written in different ways and penalises different sizes", () => {
    const lostJumper = report({ id: "m2", kind: "missing", category: "Uniform", itemName: "School jumper", colour: "Navy", size: "Age 7-8" });
    const sameSize = report({ id: "f8", kind: "found", category: "Uniform", itemName: "Navy sweater", colour: "Navy", size: "7 - 8 yrs" });
    const otherSize = report({ id: "f9", kind: "found", category: "Uniform", itemName: "Navy sweater", colour: "Navy", size: "Age 11-12" });
    expect(scoreMatch(lostJumper, sameSize).reasons).toContain("Same size (7 - 8 yrs)");
    expect(scoreMatch(lostJumper, sameSize).score).toBeGreaterThan(scoreMatch(lostJumper, otherSize).score);
  });

  it("understands common synonyms (jumper / sweater)", () => {
    const lost = report({ id: "m3", kind: "missing", category: "Uniform", itemName: "Jumper", colour: "Red" });
    const found = report({ id: "f10", kind: "found", category: "Uniform", itemName: "Sweater", colour: "Red" });
    expect(scoreMatch(lost, found).reasons).toContain("Both mention “jumper”");
  });

  it("penalises items found well before they went missing", () => {
    const early = report({ id: "f11", kind: "found", date: "2026-09-01" });
    const after = report({ id: "f12", kind: "found", date: "2026-09-16" });
    expect(scoreMatch(lostBottle, early).differences).toContain("Found 13 days before it went missing");
    expect(scoreMatch(lostBottle, early).score).toBeLessThan(scoreMatch(lostBottle, after).score);
    expect(scoreMatch(lostBottle, after).reasons).toContain("Found 2 days after it went missing");
  });

  it("allows a small grace period for misremembered dates", () => {
    const dayBefore = report({ id: "f13", kind: "found", date: "2026-09-13" });
    expect(scoreMatch(lostBottle, dayBefore).differences).toEqual([]);
  });

  it("only calls a match strong when distinctive details are shared", () => {
    const plain = report({ id: "f16", kind: "found", itemName: "Blue bottle", location: "Top playground", date: "2026-09-15" });
    const result = scoreMatch(lostBottle, plain);
    expect(result.band).toBe("possible");
    expect(result.bandLabel).toBe("Worth a look");
  });

  it("keeps weak same-category pairs below the suggestion threshold", () => {
    const found = report({
      id: "f14",
      kind: "found",
      itemName: "Bottle",
      colour: "Pink",
      brand: "Contigo",
      details: "Unicorn pattern",
      location: "Hall",
      date: "2026-09-02",
    });
    expect(scoreMatch(lostBottle, found).band).toBeNull();
  });

  it("scores the same pair the same way whichever parent is looking", () => {
    const found = report({ id: "f15", kind: "found", details: "dinosaur" });
    const fromMissing = findMatches(lostBottle, [found])[0];
    const fromFound = findMatches(found, [lostBottle])[0];
    expect(fromMissing.score).toBe(fromFound.score);
  });
});

describe("findMatches", () => {
  const candidates: MatchableReport[] = [
    report({ id: "a", kind: "found", itemName: "Blue bottle", brand: "Chillys", details: "dinosaur sticker", location: "Top playground", date: "2026-09-15" }),
    report({ id: "b", kind: "found", itemName: "Blue bottle", date: "2026-09-15" }),
    report({ id: "c", kind: "found", itemName: "Bottle", colour: "Pink", brand: "Contigo", location: "Hall", date: "2026-09-02" }),
    report({ id: "d", kind: "found", status: "returned", brand: "Chillys", details: "dinosaur sticker" }),
    report({ id: "e", kind: "missing", details: "dinosaur sticker" }),
  ];

  it("returns open, opposite-kind suggestions above the threshold, best first", () => {
    const ids = findMatches(lostBottle, candidates).map((s) => s.report.id);
    expect(ids).toEqual(["a", "b"]);
  });

  it("skips pairs a parent has dismissed", () => {
    const dismissed = new Set([pairKey("m1", "a")]);
    expect(findMatches(lostBottle, candidates, { dismissed }).map((s) => s.report.id)).toEqual(["b"]);
  });

  it("suggests nothing for reports that are no longer open", () => {
    expect(findMatches({ ...lostBottle, status: "matched" }, candidates)).toEqual([]);
  });

  it("limits the number of suggestions", () => {
    const many = Array.from({ length: 10 }, (_, i) => report({ id: `x${i}`, kind: "found" }));
    expect(findMatches(lostBottle, many)).toHaveLength(5);
  });
});

describe("normalise", () => {
  it("drops filler words and folds plurals and synonyms", () => {
    expect([...words("My son's trainers, lost near the hall")]).toEqual(["trainer", "hall"]);
  });

  it("normalises sizes", () => {
    expect(normaliseSize("Age 7-8")).toBe("7-8");
    expect(normaliseSize("7 to 8 years")).toBe("7-8");
    expect(normaliseSize("Medium")).toBe("m");
    expect(normaliseSize("Size 13")).toBe("13");
    expect(normaliseSize("")).toBe("");
  });
});
