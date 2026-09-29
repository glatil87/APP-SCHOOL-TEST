import { useId } from "react";

export const SLOGAN = "Finding your other sock has never been so easy.";

/** The Thingr mark: a warm flame with a white sock inside. */
export function ThingrMark({ size = 64, className = "" }: { size?: number; className?: string }) {
  const id = `thingr-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      role="img"
      aria-label="Thingr"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9A3C" />
          <stop offset="1" stopColor="#F0266B" />
        </linearGradient>
      </defs>
      <path
        d="M52 4 C66 22 92 46 92 78 A42 42 0 0 1 8 78 C8 60 16 47 27 38 C27 50 31 56 37 59 C35 36 42 18 52 4 Z"
        fill={`url(#${id})`}
      />
      <g transform="translate(36 34) rotate(14)">
        <path
          d="M12 0 H32 V34 C32 42 28 46 22 50 L10 57 C3 61 -4 56 -2 48 C-1 44 2 41 6 39 L12 35 Z"
          fill="#fff"
          stroke="#fff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="11" y="6" width="22" height="3.2" rx="1" fill={`url(#${id})`} />
        <rect x="11" y="12" width="22" height="3.2" rx="1" fill={`url(#${id})`} />
        <ellipse cx="25" cy="41" rx="4.2" ry="5.2" fill="#F0266B" transform="rotate(30 25 41)" />
        <ellipse cx="4" cy="50" rx="4.6" ry="4" fill="#F0266B" />
      </g>
    </svg>
  );
}

/** "THINGR" in a heavy rounded face, with a pink R. */
export function ThingrWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-rounded font-black tracking-tight ${className}`}>
      THING<span className="text-[#F0266B]">R</span>
    </span>
  );
}
