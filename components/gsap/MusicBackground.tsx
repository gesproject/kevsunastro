"use client"

import { MeshGradient } from "@paper-design/shaders-react"

export default function MusicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0px, black 40vh)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 40vh)",
      }}
    >
      <MeshGradient
        className="w-full h-full absolute inset-0"
        colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
        speed={0.5}
      />
      <div className="absolute inset-0" style={{ background: "rgba(10,10,12,0.72)" }} />
    </div>
  )
}
