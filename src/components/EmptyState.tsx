export function EmptyState({
  title,
  body,
  icon = "📭",
}: {
  title: string;
  body: string;
  icon?: string;
}) {
  return (
    <div className="rounded-3xl bg-card px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <p className="mt-3 text-[17px] font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[15px] text-text-2">{body}</p>
    </div>
  );
}
