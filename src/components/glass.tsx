/**
 * "Liquid glass" icons: a colour gradient tile with glossy highlights and a
 * crisp white symbol, in the spirit of Apple's app icons. Pure SVG + CSS, so
 * they look the same on every phone (unlike emoji).
 */

const G = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const GLYPHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  tray: (
    <>
      <path d="M3.5 13.5 6 5.5h12l2.5 8V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" />
      <path d="M3.5 13.5h5l1 2h5l1-2h5" />
    </>
  ),
  backpack: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0v8.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z" />
      <path d="M9.5 4.9V4.5a2.5 2.5 0 0 1 5 0v.4" />
      <path d="M9 14.5h6v3H9z" />
    </>
  ),
  personAdd: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5" />
      <path d="M19 7.5v5M16.5 10h5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M15.8 14.6c2.3-.2 4.1 1.2 4.7 3.9" />
    </>
  ),
  school: (
    <>
      <path d="M3 20.5h18" />
      <path d="M5 20.5V10l7-5 7 5v10.5" />
      <path d="M10 20.5v-4h4v4" />
      <circle cx="12" cy="11" r="1.6" />
    </>
  ),
  hourglass: (
    <>
      <path d="M7 3.5h10M7 20.5h10" />
      <path d="M8 3.5c0 4 4 5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5-4 8.5s4 4.5 4 8.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="10" rx="2.2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12.2 2.8 2.8L16 9.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-2 4-4 2 2-4z" />
    </>
  ),
  sparkles: (
    <>
      <path d="m11 3.5 1.8 5.2 5.2 1.8-5.2 1.8L11 17.5l-1.8-5.2L4 10.5l5.2-1.8z" />
      <path d="M18.5 15.5v5M16 18h5" />
    </>
  ),
  star: <path d="m12 3.8 2.5 5.2 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8z" />,
  heart: <path d="M12 19.5s-7.5-4.4-7.5-9.7A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5c0 5.3-7.5 9.7-7.5 9.7z" />,
  leaf: (
    <>
      <path d="M5 19c0-8 5-13.5 14-14 0 9-5.5 14-14 14z" />
      <path d="m5 19 7-7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  bolt: <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z" />,
  flower: (
    <>
      <circle cx="12" cy="12" r="2.3" />
      <circle cx="12" cy="6.6" r="3" />
      <circle cx="17.4" cy="12" r="3" />
      <circle cx="12" cy="17.4" r="3" />
      <circle cx="6.6" cy="12" r="3" />
    </>
  ),
  cloud: <path d="M7 18.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 18.5z" />,
  drop: <path d="M12 3.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z" />,
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  planet: (
    <>
      <circle cx="12" cy="12" r="5" />
      <ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-24 12 12)" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2" />
      <path d="M9.3 9.6h.01M14.7 9.6h.01" strokeWidth="2.6" />
    </>
  ),
} as const;

export type Glyph = keyof typeof GLYPHS;

/** Top (light) and bottom (deep) colours of each tint. */
export const TONES = {
  blue: ["#6FD0FF", "#0A6CFF"],
  sky: ["#A8DEFF", "#3A95FF"],
  indigo: ["#9C9CFF", "#4A45E0"],
  purple: ["#DA9BFF", "#8B3DF5"],
  pink: ["#FF9CC2", "#F0246B"],
  red: ["#FF9A88", "#F2362B"],
  orange: ["#FFC05C", "#FF6A00"],
  yellow: ["#FFE680", "#F5A800"],
  green: ["#8BEA9C", "#1FAF48"],
  mint: ["#95F3CF", "#00AE84"],
  teal: ["#7FE6E4", "#0E9EB2"],
  gray: ["#D4D4DA", "#86868E"],
} as const;

export type Tone = keyof typeof TONES;

export function GlassIcon({
  glyph,
  tone = "blue",
  size = 56,
  shape = "squircle",
  className = "",
}: {
  glyph: Glyph;
  tone?: Tone;
  size?: number;
  shape?: "squircle" | "circle";
  className?: string;
}) {
  const [top, deep] = TONES[tone];
  return (
    <span
      aria-hidden="true"
      className={`glass ${className}`}
      style={
        {
          width: size,
          height: size,
          borderRadius: shape === "circle" ? "50%" : size * 0.28,
          "--g1": top,
          "--g2": deep,
        } as React.CSSProperties
      }
    >
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} className="glass-glyph" {...G}>
        {GLYPHS[glyph]}
      </svg>
    </span>
  );
}
