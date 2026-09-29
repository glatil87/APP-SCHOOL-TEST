import { avatarFor } from "@/lib/avatars";
import { GlassIcon } from "./glass";

/** A parent's picture: their uploaded photo if they have one, else their glass symbol. */
export function Avatar({
  avatar,
  photoUrl,
  size = 40,
}: {
  avatar: string | null | undefined;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <span
        aria-hidden="true"
        className="relative inline-block shrink-0 overflow-hidden rounded-full shadow-[0_6px_14px_-6px_rgb(0_0_0/0.35)]"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        <img src={photoUrl} alt="" className="size-full object-cover" />
        <span className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgb(255_255_255/0.6),inset_0_0_0_0.75px_rgb(255_255_255/0.35)]" />
      </span>
    );
  }
  const { glyph, tone } = avatarFor(avatar);
  return <GlassIcon glyph={glyph} tone={tone} size={size} shape="circle" glyphScale={0.72} />;
}
