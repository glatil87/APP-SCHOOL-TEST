import { GlassIcon, type Glyph, type Tone } from "./glass";

export function EmptyState({
  title,
  body,
  glyph = "tray",
  tone = "gray",
}: {
  title: string;
  body: string;
  glyph?: Glyph;
  tone?: Tone;
}) {
  return (
    <div className="rounded-3xl bg-card px-6 py-10 text-center">
      <GlassIcon glyph={glyph} tone={tone} size={56} />
      <p className="mt-4 text-[17px] font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[15px] text-text-2">{body}</p>
    </div>
  );
}
