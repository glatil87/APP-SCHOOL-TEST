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
  // Animal faces for profile pictures.
  fox: (
    <>
      <path d="M4 4.5 8.5 8h7L20 4.5l-1.2 8.3L12 20l-6.8-7.2z" />
      <path d="M8.2 13.2 12 17l3.8-3.8" />
      <path d="M9.3 11.3h.01M14.7 11.3h.01" strokeWidth="2.6" />
      <path d="M11.3 16.2h1.4l-.7.9z" fill="currentColor" />
    </>
  ),
  cat: (
    <>
      <path d="M5 11V4.3L9.2 7h5.6L19 4.3V11a7 7 0 0 1-14 0z" />
      <path d="M9.4 11.6h.01M14.6 11.6h.01" strokeWidth="2.6" />
      <path d="M11.2 14.2h1.6l-.8.9z" fill="currentColor" />
      <path d="M2.5 13.2l3.5.6M2.8 16.2l3.4-.8M21.5 13.2l-3.5.6M21.2 16.2l-3.4-.8" strokeWidth="1.4" />
    </>
  ),
  dog: (
    <>
      <path d="M8 6.8c1.1-.8 2.5-1.3 4-1.3s2.9.5 4 1.3" />
      <path d="M8 6.8C5.5 5 3.2 6.5 3.4 10c.2 2.8 1.8 4.4 3.3 4.2" />
      <path d="M16 6.8c2.5-1.8 4.8-.3 4.6 3.2-.2 2.8-1.8 4.4-3.3 4.2" />
      <path d="M6.7 9.5v4.5a5.3 5.3 0 0 0 10.6 0V9.5" />
      <path d="M9.8 11.5h.01M14.2 11.5h.01" strokeWidth="2.6" />
      <path d="M10.8 14.4h2.4l-1.2 1.3z" fill="currentColor" />
    </>
  ),
  bear: (
    <>
      <path d="M6.4 9.6a2.7 2.7 0 1 1 3.4-3.6M14.2 6a2.7 2.7 0 1 1 3.4 3.6" />
      <circle cx="12" cy="13" r="6.8" />
      <ellipse cx="12" cy="15.6" rx="2.7" ry="2.1" />
      <path d="M9.4 11.4h.01M14.6 11.4h.01" strokeWidth="2.6" />
      <path d="M11.2 14.8h1.6l-.8.8z" fill="currentColor" />
    </>
  ),
  rabbit: (
    <>
      <path d="M10 9C8.8 5.5 8.8 2.5 10 2.5s2 3.3 1.8 6.3M14 9c1.2-3.5 1.2-6.5 0-6.5s-2 3.3-1.8 6.3" />
      <circle cx="12" cy="14.5" r="6" />
      <path d="M9.8 13.8h.01M14.2 13.8h.01" strokeWidth="2.6" />
      <path d="M11.3 16h1.4l-.7.8z" fill="currentColor" />
      <path d="M12 16.8v.9" strokeWidth="1.4" />
    </>
  ),
  panda: (
    <>
      <path d="M6.2 9.4a2.6 2.6 0 1 1 3.5-3.5M14.3 5.9a2.6 2.6 0 1 1 3.5 3.5" fill="currentColor" />
      <circle cx="12" cy="13" r="6.8" />
      <ellipse cx="9.2" cy="12.2" rx="1.7" ry="2.2" transform="rotate(25 9.2 12.2)" fill="currentColor" />
      <ellipse cx="14.8" cy="12.2" rx="1.7" ry="2.2" transform="rotate(-25 14.8 12.2)" fill="currentColor" />
      <path d="M11.2 15.4h1.6l-.8.8z" fill="currentColor" />
    </>
  ),
  owl: (
    <>
      <path d="M6 7.5 5.5 3.8 9 6c1-.4 2-.5 3-.5s2 .1 3 .5l3.5-2.2L18 7.5V14a6 6 0 0 1-12 0z" />
      <circle cx="9.3" cy="10.6" r="2.3" />
      <circle cx="14.7" cy="10.6" r="2.3" />
      <path d="M9.3 10.6h.01M14.7 10.6h.01" strokeWidth="2.4" />
      <path d="M11.2 13.4h1.6L12 15z" fill="currentColor" />
    </>
  ),
  penguin: (
    <>
      <path d="M12 3c-3.4 0-5.5 3-5.5 7v4.8c0 3.6 2.5 6.2 5.5 6.2s5.5-2.6 5.5-6.2V10c0-4-2.1-7-5.5-7z" />
      <path d="M12 9.3c-1.9 0-3 2.1-3 4.8S10.1 19 12 19s3-2.2 3-4.9-1.1-4.8-3-4.8z" />
      <path d="M10.3 7h.01M13.7 7h.01" strokeWidth="2.4" />
      <path d="M11.2 8.3h1.6l-.8 1z" fill="currentColor" />
      <path d="M6.6 11.5 4 15.2M17.4 11.5l2.6 3.7M9.3 21.2H7.8M14.7 21.2h1.5" />
    </>
  ),
  frog: (
    <>
      <path d="M5.8 9.2a2.6 2.6 0 1 1 4.6-1.6M13.6 7.6a2.6 2.6 0 1 1 4.6 1.6" />
      <path d="M4 13.5c0-3.3 3.6-5.3 8-5.3s8 2 8 5.3-3.6 5.8-8 5.8-8-2.5-8-5.8z" />
      <path d="M8.2 7.5h.01M15.8 7.5h.01" strokeWidth="2.4" />
      <path d="M8.8 14.3c1.9 1.4 4.5 1.4 6.4 0" />
    </>
  ),
  koala: (
    <>
      <path d="M7.2 8.3a3.3 3.3 0 1 0-1.8 5.9M16.8 8.3a3.3 3.3 0 1 1 1.8 5.9" />
      <circle cx="12" cy="12.8" r="6.2" />
      <ellipse cx="12" cy="14" rx="1.7" ry="2.3" fill="currentColor" />
      <path d="M9.3 11.3h.01M14.7 11.3h.01" strokeWidth="2.6" />
    </>
  ),
  mouse: (
    <>
      <circle cx="6.3" cy="7.3" r="3.3" />
      <circle cx="17.7" cy="7.3" r="3.3" />
      <path d="M8.3 9.9A6 6 0 0 1 15.7 9.9 6 6 0 0 1 18 14.5c0 3-2.7 5.5-6 5.5s-6-2.5-6-5.5c0-1.8.9-3.5 2.3-4.6z" />
      <path d="M9.8 13.6h.01M14.2 13.6h.01" strokeWidth="2.6" />
      <path d="M11.3 16h1.4l-.7.8z" fill="currentColor" />
    </>
  ),
  lion: (
    <>
      <path d="M12 2.8l1.9 1.6 2.4-.5.9 2.3 2.3.9-.5 2.4 1.6 1.9-1.6 1.9.5 2.4-2.3.9-.9 2.3-2.4-.5L12 21.2l-1.9-1.6-2.4.5-.9-2.3-2.3-.9.5-2.4L3.4 12.6 5 10.7l-.5-2.4 2.3-.9.9-2.3 2.4.5z" />
      <circle cx="12" cy="12.2" r="4.9" />
      <path d="M10.2 11.3h.01M13.8 11.3h.01" strokeWidth="2.4" />
      <path d="M11.3 13.4h1.4l-.7.8z" fill="currentColor" />
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
  brown: ["#DDB088", "#8C5A33"],
} as const;

export type Tone = keyof typeof TONES;

export function GlassIcon({
  glyph,
  tone = "blue",
  size = 56,
  shape = "squircle",
  glyphScale = 0.56,
  className = "",
}: {
  glyph: Glyph;
  tone?: Tone;
  size?: number;
  shape?: "squircle" | "circle";
  /** Symbol size relative to the tile. */
  glyphScale?: number;
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
      <svg viewBox="0 0 24 24" width={size * glyphScale} height={size * glyphScale} className="glass-glyph" {...G}>
        {GLYPHS[glyph]}
      </svg>
    </span>
  );
}
