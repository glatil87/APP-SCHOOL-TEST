import type { Glyph, Tone } from "@/components/glass";

/** Built-in profile pictures: a glass circle with an animal face. */
export const AVATARS = {
  fox: { glyph: "fox", tone: "orange", label: "Fox" },
  cat: { glyph: "cat", tone: "purple", label: "Cat" },
  dog: { glyph: "dog", tone: "sky", label: "Dog" },
  bear: { glyph: "bear", tone: "brown", label: "Bear" },
  rabbit: { glyph: "rabbit", tone: "pink", label: "Rabbit" },
  panda: { glyph: "panda", tone: "gray", label: "Panda" },
  owl: { glyph: "owl", tone: "indigo", label: "Owl" },
  penguin: { glyph: "penguin", tone: "blue", label: "Penguin" },
  frog: { glyph: "frog", tone: "green", label: "Frog" },
  koala: { glyph: "koala", tone: "teal", label: "Koala" },
  mouse: { glyph: "mouse", tone: "mint", label: "Mouse" },
  lion: { glyph: "lion", tone: "yellow", label: "Lion" },
} as const satisfies Record<string, { glyph: Glyph; tone: Tone; label: string }>;

export type AvatarId = keyof typeof AVATARS;

export const DEFAULT_AVATAR: AvatarId = "fox";

/** Earlier choices (emoji animals, then glass symbols), mapped to the current set. */
const LEGACY: Record<string, AvatarId> = {
  unicorn: "rabbit",
  octopus: "frog",
  bee: "lion",
  turtle: "koala",
  star: "penguin",
  heart: "rabbit",
  leaf: "frog",
  sun: "lion",
  moon: "owl",
  bolt: "fox",
  sparkles: "cat",
  flower: "mouse",
  cloud: "dog",
  drop: "koala",
  music: "mouse",
  planet: "panda",
};

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && value in AVATARS;
}

export function avatarFor(id: string | null | undefined) {
  const key = isAvatarId(id) ? id : (id && LEGACY[id]) || DEFAULT_AVATAR;
  return AVATARS[key];
}
