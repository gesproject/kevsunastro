"use client";

import dynamic from "next/dynamic";

const MusicBackground = dynamic(
  () => import("@/components/gsap/MusicBackground"),
  { ssr: false }
);

export default function MusicFooterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ backgroundColor: "#0e0e0c" }}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MusicBackground />
      </div>
      {children}
    </div>
  );
}
