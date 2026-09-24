export default function Scanlines({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`scanlines pointer-events-none absolute inset-0 z-50 mix-blend-overlay ${className}`}
    />
  );
}