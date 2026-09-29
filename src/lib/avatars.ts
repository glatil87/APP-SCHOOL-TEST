export const AVATARS = {
  fox: "🦊",
  panda: "🐼",
  owl: "🦉",
  koala: "🐨",
  lion: "🦁",
  frog: "🐸",
  penguin: "🐧",
  unicorn: "🦄",
  octopus: "🐙",
  bee: "🐝",
  turtle: "🐢",
  rabbit: "🐰",
} as const;

export type AvatarId = keyof typeof AVATARS;

export const DEFAULT_AVATAR: AvatarId = "fox";

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && value in AVATARS;
}

export function avatarEmoji(id: string | null | undefined): string {
  return isAvatarId(id) ? AVATARS[id] : "🙂";
}
