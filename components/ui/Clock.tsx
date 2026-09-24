"use client";

import { useEffect, useState } from "react";

export default function Clock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(new Date()), 120);
    const iv = window.setInterval(() => setNow(new Date()), 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(iv);
    };
  }, []);

  if (!now) return <span className={className}>--:--</span>;
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "AM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return (
    <span className={className}>
      {String(hh).padStart(2, "0")}:{mm} {ampm}
    </span>
  );
}