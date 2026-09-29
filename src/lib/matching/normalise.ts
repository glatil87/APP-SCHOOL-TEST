import type { Colour } from "@/lib/items";

const STOP_WORDS = new Set(
  (
    "a an and the of with in on at to for from by it its is was has have " +
    "my our his her their child son daughter kid kids one some very " +
    "item thing lost found missing near left school " +
    // Colours are scored separately, so don't count them twice.
    "black white grey gray silver navy blue green red maroon " +
    "pink purple yellow gold orange brown beige multi coloured colored"
  ).split(" "),
);

/** Words parents use interchangeably, mapped to one canonical word. */
const SYNONYMS: Record<string, string> = {
  sweater: "jumper",
  pullover: "jumper",
  sweatshirt: "jumper",
  hoodie: "jumper",
  jacket: "coat",
  anorak: "coat",
  raincoat: "coat",
  flask: "bottle",
  sneaker: "trainer",
  plimsoll: "trainer",
  pump: "trainer",
  rucksack: "bag",
  backpack: "bag",
  schoolbag: "bag",
  lunchbox: "lunch",
  cap: "hat",
  beanie: "hat",
  specs: "glasses",
  spectacles: "glasses",
  mitten: "glove",
  pe: "sport",
  sports: "sport",
};

export function words(text: string | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const raw of (text ?? "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP_WORDS.has(raw)) continue;
    const singular =
      raw.length > 3 && raw.endsWith("s") && !raw.endsWith("ss")
        ? raw.slice(0, -1)
        : raw;
    out.add(SYNONYMS[singular] ?? SYNONYMS[raw] ?? singular);
  }
  return out;
}

export function shared(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((w) => b.has(w));
}

/** Lower-case letters and digits only, so "Kids' Nike" ~ "kids nike". */
export function compact(text: string | null | undefined): string {
  return (text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SIZE_WORDS: Record<string, string> = {
  xs: "xs", extrasmall: "xs",
  s: "s", small: "s",
  m: "m", medium: "m", med: "m",
  l: "l", large: "l",
  xl: "xl", extralarge: "xl",
};

/** "Age 7-8", "7 - 8 yrs", "7-8y" → "7-8"; "Medium" → "m". */
export function normaliseSize(size: string | null | undefined): string {
  const text = (size ?? "").toLowerCase().trim();
  if (!text) return "";
  const range = text.match(/(\d+)\s*(?:-|–|to|\/)\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]}`;
  const word = SIZE_WORDS[compact(text)];
  if (word) return word;
  const num = text.match(/\d+(?:\.\d+)?/);
  return num ? num[0] : compact(text);
}

const COLOUR_FAMILY: Partial<Record<Colour, string>> = {
  Navy: "blue",
  Blue: "blue",
  "Light blue": "blue",
  Green: "green",
  "Dark green": "green",
  Red: "red",
  Maroon: "red",
  Pink: "red",
  Purple: "red",
  Yellow: "yellow",
  Gold: "yellow",
  Orange: "yellow",
  Grey: "grey",
  Silver: "grey",
  Brown: "brown",
  Beige: "brown",
};

export type ColourRelation = "same" | "related" | "different";

export function compareColours(a: string, b: string): ColourRelation {
  if (a === b && a !== "Other") return "same";
  if (a === "Multi-coloured" || b === "Multi-coloured") return "related";
  const fa = COLOUR_FAMILY[a as Colour];
  if (fa && fa === COLOUR_FAMILY[b as Colour]) return "related";
  return "different";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `from` to `to` (dates as YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** Categories parents use interchangeably for the same item. */
const CATEGORY_GROUPS: string[][] = [["Clothing", "Uniform", "Sports kit"]];

export type CategoryRelation = "same" | "related" | "different";

export function compareCategories(a: string, b: string): CategoryRelation {
  if (a === b) return "same";
  if (a === "Other" || b === "Other") return "related";
  return CATEGORY_GROUPS.some((g) => g.includes(a) && g.includes(b)) ? "related" : "different";
}
