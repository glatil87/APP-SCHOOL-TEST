/**
 * Every number that decides how possible matches are scored lives here, so
 * the rules can be tuned after parents have tried the app. Scores are points
 * out of 100; they are a ranking aid, never a probability.
 */
export const WEIGHTS = {
  /** Same category. Different categories are never suggested. */
  category: 20,

  /** Shared words in item name + details, scaled by how many overlap. */
  text: 30,

  colourSame: 15,
  /** e.g. navy vs blue, or anything vs multi-coloured. */
  colourRelated: 7,

  /** Only counts when both parents gave a brand. */
  brandSame: 15,
  brandDifferent: -10,

  /** Only counts when both parents gave a size. */
  sizeSame: 10,
  sizeDifferent: -10,

  locationSame: 10,
  /** Locations share a word, e.g. "top playground" and "playground". */
  locationOverlap: 5,

  /** Found on/after the day it went missing and within `dateWindowDays`. */
  dateClose: 5,
  /** Found clearly before it went missing: unlikely to be the same item. */
  dateFoundBeforeLost: -15,
} as const;

export const RULES = {
  /** Allow for parents misremembering the exact day. */
  dateGraceDays: 2,
  dateWindowDays: 30,
  /** Shared words needed before item name/details get full credit. */
  textFullCreditWords: 3,
  /** Suggestions below this score are not shown. */
  minScore: 35,
  /** Score at which the stronger wording is used. */
  strongScore: 65,
  maxSuggestions: 5,
  maxReasons: 4,
} as const;

/** Parent-facing wording. Deliberately never implies certainty. */
export const BAND_LABELS = {
  strong: "Several details match",
  possible: "Worth a look",
} as const;
