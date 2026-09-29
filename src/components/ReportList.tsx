"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORIES,
  KIND_COPY,
  STATUSES,
  type ReportKind,
  type ReportSummary,
} from "@/lib/items";
import { EmptyState } from "./EmptyState";
import { ReportCard } from "./ReportCard";

export function ReportList({
  kind,
  reports,
  notice,
}: {
  kind: ReportKind;
  reports: ReportSummary[];
  notice?: string;
}) {
  const copy = KIND_COPY[kind];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Open");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (!category || r.category === category) &&
        (!status || r.status === status) &&
        (!q ||
          [r.itemName, r.colour, r.location, r.category]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [reports, query, category, status]);

  const filtering = query.trim() !== "" || category !== "" || status !== "Open";

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">
          {copy.title}
        </h1>
        <Link
          href={`/report/${kind}`}
          className="rounded-full bg-accent px-4 py-2 text-[15px] font-semibold text-white active:bg-accent-press"
        >
          Report
        </Link>
      </header>

      {notice && (
        <p role="status" className="rounded-2xl bg-found-soft px-4 py-3 text-[15px] font-medium text-found">
          {notice}
        </p>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Search {copy.title.toLowerCase()}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. blue water bottle"
            className="w-full rounded-xl bg-fill px-4 py-2.5 text-[17px] placeholder:text-text-2 focus:outline-2 focus:outline-accent"
          />
        </label>
        <div className="flex gap-2">
          <Select label="Category" value={category} onChange={setCategory}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={setStatus}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "Older" ? "Older (2+ months)" : s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        filtering && reports.length > 0 ? (
          <EmptyState
            glyph="search"
            tone="gray"
            title="No items match your search"
            body="Try different words or clear the filters."
          />
        ) : (
          <EmptyState
            glyph={kind === "missing" ? "search" : "tray"}
            tone={kind === "missing" ? "orange" : "green"}
            title={copy.emptyTitle}
            body={copy.emptyBody}
          />
        )
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id}>
              <ReportCard report={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl bg-card py-2.5 pr-9 pl-4 text-[15px] font-medium shadow-[inset_0_0_0_1px_var(--line)] focus:outline-2 focus:outline-accent"
      >
        {children}
      </select>
      <svg width="12" height="8" viewBox="0 0 12 8" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-2" aria-hidden="true">
        <path d="m1 1.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
