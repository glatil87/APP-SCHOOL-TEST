export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
      <div className="h-9 w-2/3 rounded-xl bg-fill" />
      <div className="h-24 rounded-3xl bg-fill" />
      <div className="h-24 rounded-3xl bg-fill" />
    </div>
  );
}
