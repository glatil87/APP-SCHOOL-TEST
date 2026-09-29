export type ReportKind = "missing" | "found";

export const CATEGORIES = [
  "Clothing",
  "Uniform",
  "Shoes",
  "Bags",
  "Water bottles",
  "Lunch boxes",
  "Sports kit",
  "Books & stationery",
  "Electronics",
  "Glasses",
  "Toys",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const COLOURS = [
  "Black",
  "White",
  "Grey",
  "Silver",
  "Navy",
  "Blue",
  "Light blue",
  "Green",
  "Dark green",
  "Red",
  "Maroon",
  "Pink",
  "Purple",
  "Yellow",
  "Gold",
  "Orange",
  "Brown",
  "Beige",
  "Multi-coloured",
  "Other",
] as const;

export type Colour = (typeof COLOURS)[number];

/** Swatch shown next to each colour. */
export const COLOUR_SWATCH: Record<Colour, string> = {
  Black: "#1d1d1f",
  White: "#ffffff",
  Grey: "#8e8e93",
  Silver: "linear-gradient(135deg,#f2f2f5,#a8a8b0)",
  Navy: "#1c2f6b",
  Blue: "#0a6cff",
  "Light blue": "#8fd0ff",
  Green: "#34c759",
  "Dark green": "#1e6b3a",
  Red: "#ff3b30",
  Maroon: "#7a1f2b",
  Pink: "#ff7eb6",
  Purple: "#9b4dff",
  Yellow: "#ffd60a",
  Gold: "linear-gradient(135deg,#ffe58a,#c9962b)",
  Orange: "#ff9500",
  Brown: "#8c5a33",
  Beige: "#e8d6b5",
  "Multi-coloured": "conic-gradient(#ff3b30,#ffd60a,#34c759,#0a6cff,#9b4dff,#ff3b30)",
  Other: "repeating-linear-gradient(45deg,#d1d1d6 0 3px,#f2f2f5 3px 6px)",
};

/** Suggestions for "where"; parents can type anything. */
export const PLACES = [
  "Playground",
  "Classroom",
  "Hall",
  "Lunch hall",
  "Field",
  "Library",
  "School gate",
  "Cloakroom",
  "Changing rooms",
  "After-school club",
  "Breakfast club",
  "School trip",
] as const;

/** Found items: where the item is now. */
export const WHERE_NOW = [
  "I have it at home",
  "Handed in to the school office",
  "In the lost property box",
] as const;

/** List filters. Matched and returned items leave the lists. */
export const STATUSES = ["Open", "Older"] as const;

export type Status = (typeof STATUSES)[number] | "Matched" | "Returned" | "Withdrawn";

/** Shape used by the lists. */
export type ReportSummary = {
  id: string;
  kind: ReportKind;
  itemName: string;
  category: string;
  colour: string;
  location: string | null;
  date: string | null;
  status: Status;
  photoUrl: string | null;
  mine: boolean;
  /** Possible matches (only worked out for the viewer's own reports). */
  matchCount?: number;
};

/** Open reports older than this move to "Older". */
export const OLDER_AFTER_DAYS = 60;

export const KIND_COPY = {
  missing: {
    title: "Missing items",
    action: "Report a missing item",
    blurb: "Something your child has lost",
    emptyTitle: "No missing items right now",
    emptyBody: "When a parent reports something lost, it will appear here.",
  },
  found: {
    title: "Found items",
    action: "Report a found item",
    blurb: "Something you’ve found that isn’t yours",
    emptyTitle: "No found items right now",
    emptyBody: "When a parent reports something found, it will appear here.",
  },
} satisfies Record<ReportKind, Record<string, string>>;
