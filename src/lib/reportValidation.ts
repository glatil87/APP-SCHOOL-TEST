import { CATEGORIES, COLOURS, type ReportKind } from "./items";

export type NewReport = {
  kind: ReportKind;
  itemName: string;
  category: string;
  colour: string;
  brand: string | null;
  size: string | null;
  details: string;
  location: string;
  eventDate: string;
  currentLocation: string | null;
};

export type ParsedReport =
  | { ok: true; data: NewReport; values: Record<string, string> }
  | { ok: false; fieldErrors: Record<string, string>; values: Record<string, string> };

const FIELDS = ["item_name", "category", "colour", "brand", "size", "details", "location", "event_date", "current_location"];

/** Today's date (YYYY-MM-DD) in the school's time zone. */
export function todayInSchool(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
}

export function parseReport(form: FormData, kind: ReportKind, today = todayInSchool()): ParsedReport {
  const v: Record<string, string> = {};
  for (const f of FIELDS) {
    const raw = form.get(f);
    v[f] = typeof raw === "string" ? raw.trim() : "";
  }
  const e: Record<string, string> = {};
  const what = kind === "missing" ? "lost" : "found";

  if (!v.item_name) e.item_name = "Please say what the item is, e.g. “School jumper”.";
  else if (v.item_name.length > 80) e.item_name = "Please keep this under 80 characters.";

  if (!(CATEGORIES as readonly string[]).includes(v.category)) e.category = "Please choose a type of item.";
  if (!(COLOURS as readonly string[]).includes(v.colour)) e.colour = "Please choose the main colour.";

  if (v.brand.length > 60) e.brand = "Please keep this under 60 characters.";
  if (v.size.length > 30) e.size = "Please keep this under 30 characters.";
  if (v.details.length > 1000) e.details = "Please keep this under 1,000 characters.";

  if (!v.location) e.location = `Please say where it was ${kind === "missing" ? "last seen" : "found"}.`;
  else if (v.location.length > 120) e.location = "Please keep this under 120 characters.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.event_date) || Number.isNaN(Date.parse(v.event_date))) {
    e.event_date = `Please choose the day it was ${what}.`;
  } else if (v.event_date > today) {
    e.event_date = "That date is in the future. Please choose today or earlier.";
  } else if (Date.parse(today) - Date.parse(v.event_date) > 366 * 24 * 3600 * 1000) {
    e.event_date = "That’s more than a year ago. Please check the date.";
  }

  if (kind === "found") {
    if (!v.current_location) e.current_location = "Please say where the item is now.";
    else if (v.current_location.length > 120) e.current_location = "Please keep this under 120 characters.";
  }

  if (Object.keys(e).length) return { ok: false, fieldErrors: e, values: v };
  return {
    ok: true,
    values: v,
    data: {
      kind,
      itemName: v.item_name,
      category: v.category,
      colour: v.colour,
      brand: v.brand || null,
      size: v.size || null,
      details: v.details,
      location: v.location,
      eventDate: v.event_date,
      currentLocation: kind === "found" ? v.current_location : null,
    },
  };
}
