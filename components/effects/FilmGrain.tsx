export default function FilmGrain({ className = "", opacity = 0.05 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={`film-grain pointer-events-none absolute inset-0 z-40 ${className}`}
      style={{ opacity }}
    />
  );
}