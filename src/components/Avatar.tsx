import { avatarEmoji } from "@/lib/avatars";

export function Avatar({ avatar, size = 40 }: { avatar: string | null | undefined; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-fill"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {avatarEmoji(avatar)}
    </span>
  );
}
