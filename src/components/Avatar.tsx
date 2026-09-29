import { avatarFor } from "@/lib/avatars";
import { GlassIcon } from "./glass";

export function Avatar({ avatar, size = 40 }: { avatar: string | null | undefined; size?: number }) {
  const { glyph, tone } = avatarFor(avatar);
  return <GlassIcon glyph={glyph} tone={tone} size={size} shape="circle" />;
}
