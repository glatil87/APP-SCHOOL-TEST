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

export const STATUSES = ["Open", "Matched", "Older"] as const;

export type Status = (typeof STATUSES)[number];

/** Shape used by the lists. Real data arrives with the database bite. */
export type ReportSummary = {
  id: string;
  kind: ReportKind;
  itemName: string;
  category: Category;
  colour: string;
  location: string;
  date: string;
  status: Status;
};

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
