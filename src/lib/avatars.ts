import type { Glyph, Tone } from "@/components/glass";

/** Built-in profile pictures: a glass circle with a symbol. */
export const AVATARS = {
  star: { glyph: "star", tone: "blue", label: "Star" },
  heart: { glyph: "heart", tone: "pink", label: "Heart" },
  leaf: { glyph: "leaf", tone: "green", label: "Leaf" },
  sun: { glyph: "sun", tone: "yellow", label: "Sun" },
  moon: { glyph: "moon", tone: "indigo", label: "Moon" },
  bolt: { glyph: "bolt", tone: "orange", label: "Lightning" },
  sparkles: { glyph: "sparkles", tone: "purple", label: "Sparkles" },
  flower: { glyph: "flower", tone: "red", label: "Flower" },
  cloud: { glyph: "cloud", tone: "sky", label: "Cloud" },
  drop: { glyph: "drop", tone: "teal", label: "Drop" },
  music: { glyph: "music", tone: "mint", label: "Music" },
  planet: { glyph: "planet", tone: "gray", label: "Planet" },
} as const satisfies Record<string, { glyph: Glyph; tone: Tone; label: string }>;

export type AvatarId = keyof typeof AVATARS;

export const DEFAULT_AVATAR: AvatarId = "star";

/** Earlier animal-emoji choices, mapped to the new set. */
const LEGACY: Record<string, AvatarId> = {
  fox: "bolt",
  panda: "planet",
  owl: "moon",
  koala: "cloud",
  lion: "sun",
  frog: "leaf",
  penguin: "star",
  unicorn: "sparkles",
  octopus: "flower",
  bee: "music",
  turtle: "drop",
  rabbit: "heart",
};

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && value in AVATARS;
}

export function avatarFor(id: string | null | undefined) {
  const key = isAvatarId(id) ? id : (id && LEGACY[id]) || DEFAULT_AVATAR;
  return AVATARS[key];
}
