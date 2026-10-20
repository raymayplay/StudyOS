export default function Loading() {
  return <div aria-label="Loading StudyOS" role="status" className="space-y-6 animate-pulse">
    <span className="sr-only">Loading page…</span>
    <div className="h-32 rounded-3xl bg-white/5" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-3xl bg-white/5" />)}</div>
    <div className="grid gap-6 xl:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-64 rounded-3xl bg-white/5" />)}</div>
  </div>;
}
