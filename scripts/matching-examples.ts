/**
 * Prints example suggestions in plain English, to sanity-check the matching
 * rules after changing weights: `npx tsx scripts/matching-examples.ts`.
 */
import { findMatches, type MatchableReport } from "../src/lib/matching";

const base = { brand: null, size: null, details: "", status: "open" } as const;

const missing: MatchableReport[] = [
  { ...base, id: "M1", kind: "missing", itemName: "Water bottle", category: "Water bottles", colour: "Blue", brand: "Chilly's", details: "Dinosaur sticker on the side, scratched lid", location: "Top playground", date: "2026-09-14" },
  { ...base, id: "M2", kind: "missing", itemName: "School jumper", category: "Uniform", colour: "Navy", size: "Age 7-8", details: "Name label says Mia R", location: "PE hall", date: "2026-09-10" },
  { ...base, id: "M3", kind: "missing", itemName: "Trainers", category: "Shoes", colour: "White", brand: "Nike", size: "13", details: "Velcro straps, pink laces", location: "Field", date: "2026-09-12" },
];

const found: MatchableReport[] = [
  { ...base, id: "F1", kind: "found", itemName: "Chillys bottle", category: "Water bottles", colour: "Blue", brand: "Chillys", details: "Has a dinosaur sticker", location: "Playground", date: "2026-09-15" },
  { ...base, id: "F2", kind: "found", itemName: "Bottle", category: "Water bottles", colour: "Navy", location: "Top playground", date: "2026-09-16" },
  { ...base, id: "F3", kind: "found", itemName: "Bottle", category: "Water bottles", colour: "Pink", brand: "Contigo", details: "Unicorns", location: "Hall", date: "2026-09-01" },
  { ...base, id: "F4", kind: "found", itemName: "Navy sweater", category: "Uniform", colour: "Navy", size: "7-8 yrs", details: "Label: Mia R", location: "Hall", date: "2026-09-11" },
  { ...base, id: "F5", kind: "found", itemName: "Jumper", category: "Uniform", colour: "Navy", size: "Age 11-12", location: "Library", date: "2026-09-11" },
  { ...base, id: "F6", kind: "found", itemName: "Trainer", category: "Shoes", colour: "White", size: "Size 13", details: "Pink laces", location: "Field", date: "2026-09-12" },
];

for (const m of missing) {
  console.log(`\nMissing: ${m.colour} ${m.itemName.toLowerCase()}`);
  const suggestions = findMatches(m, found);
  if (suggestions.length === 0) console.log("  No possible matches yet.");
  for (const s of suggestions) {
    console.log(`  • ${s.report.itemName} (${s.bandLabel}, score ${s.score})`);
    for (const r of s.reasons) console.log(`      ✓ ${r}`);
    for (const d of s.differences) console.log(`      ≠ ${d}`);
  }
}
