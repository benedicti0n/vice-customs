interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function HudPanel({ className = "", children }: Props) {
  return (
    <div className={`hud-clip border border-white/10 bg-[#0c0e15]/80 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}