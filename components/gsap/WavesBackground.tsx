"use client"

import { useEffect, useRef } from "react"
import { createNoise2D } from "simplex-noise"

interface Point {
  x: number
  y: number
  wave: { x: number; y: number }
  cursor: { x: number; y: number; vx: number; vy: number }
}

interface WavesProps {
  className?: string
  strokeColor?: string
  backgroundColor?: string
  pointerSize?: number
}

export function Waves({
  className = "",
  strokeColor = "rgba(200, 203, 200, 0.12)",
  backgroundColor = "transparent",
  pointerSize = 0.6,
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const mouseRef = useRef({ x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false })
  const pathsRef = useRef<SVGPathElement[]>([])
  const linesRef = useRef<Point[][]>([])
  const noiseRef = useRef<((x: number, y: number) => number) | null>(null)
  const rafRef = useRef<number | null>(null)
  const boundingRef = useRef<DOMRect | null>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    const svgEl = svgRef.current
    if (!containerEl || !svgEl) return
    const container = containerEl
    const svg = svgEl

    function setSize() {
      boundingRef.current = container.getBoundingClientRect()
      const { width, height } = boundingRef.current
      svg.style.width = `${width}px`
      svg.style.height = `${height}px`
    }

    function setLines() {
      if (!boundingRef.current) return
      const { width, height } = boundingRef.current
      linesRef.current = []
      pathsRef.current.forEach((p) => p.remove())
      pathsRef.current = []

      const xGap = 10
      const yGap = 10
      const oWidth = width + 200
      const oHeight = height + 30
      const totalLines = Math.ceil(oWidth / xGap)
      const totalPoints = Math.ceil(oHeight / yGap)
      const xStart = (width - xGap * totalLines) / 2
      const yStart = (height - yGap * totalPoints) / 2

      for (let i = 0; i < totalLines; i++) {
        const points: Point[] = []
        for (let j = 0; j < totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          })
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttribute("fill", "none")
        path.setAttribute("stroke", strokeColor)
        path.setAttribute("stroke-width", "1")
        svg.appendChild(path)
        pathsRef.current.push(path)
        linesRef.current.push(points)
      }
    }

    function movePoints(time: number) {
      const mouse = mouseRef.current
      linesRef.current.forEach((points) => {
        points.forEach((p) => {
          const noise = noiseRef.current ? noiseRef.current(p.x * 0.002 + time * 0.00015, p.y * 0.002) : 0
          p.wave.x = Math.cos(noise * Math.PI * 2) * 12
          p.wave.y = Math.sin(noise * Math.PI * 2) * 12

          const dx = mouse.sx - p.x
          const dy = mouse.sy - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influence = Math.max(0, 1 - dist / (300 * pointerSize))
          const force = influence * influence * mouse.vs * 0.3

          p.cursor.vx += (dx / (dist || 1)) * force
          p.cursor.vy += (dy / (dist || 1)) * force
          p.cursor.vx *= 0.92
          p.cursor.vy *= 0.92
          p.cursor.x += p.cursor.vx
          p.cursor.y += p.cursor.vy
          p.cursor.x *= 0.97
          p.cursor.y *= 0.97
        })
      })
    }

    function buildPath(points: Point[]) {
      const d: string[] = []
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const x = p.x + p.wave.x + p.cursor.x
        const y = p.y + p.wave.y + p.cursor.y
        if (i === 0) {
          d.push(`M ${x} ${y}`)
        } else {
          const prev = points[i - 1]
          const px = prev.x + prev.wave.x + prev.cursor.x
          const py = prev.y + prev.wave.y + prev.cursor.y
          d.push(`Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`)
        }
      }
      return d.join(" ")
    }

    function tick(time: number) {
      const mouse = mouseRef.current
      if (mouse.set) {
        mouse.sx += (mouse.x - mouse.sx) * 0.03
        mouse.sy += (mouse.y - mouse.sy) * 0.03
        mouse.v = Math.sqrt((mouse.sx - mouse.lx) ** 2 + (mouse.sy - mouse.ly) ** 2)
        mouse.vs += (mouse.v - mouse.vs) * 0.1
        mouse.lx = mouse.sx
        mouse.ly = mouse.sy
      }

      movePoints(time)
      linesRef.current.forEach((points, i) => {
        pathsRef.current[i]?.setAttribute("d", buildPath(points))
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    function setMousePosition(clientX: number, clientY: number) {
      const bounding = container.getBoundingClientRect()
      const mouse = mouseRef.current
      mouse.x = clientX - bounding.left
      mouse.y = clientY - bounding.top
      if (!mouse.set) {
        mouse.sx = mouse.x
        mouse.sy = mouse.y
        mouse.lx = mouse.x
        mouse.ly = mouse.y
        mouse.set = true
      }
    }

    function onMouseMove(e: MouseEvent) {
      setMousePosition(e.clientX, e.clientY)
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      setMousePosition(touch.clientX, touch.clientY)
    }

    function onResize() {
      setSize()
      setLines()
    }

    noiseRef.current = createNoise2D()
    setSize()
    setLines()

    window.addEventListener("resize", onResize)
    window.addEventListener("mousemove", onMouseMove)
    container.addEventListener("touchmove", onTouchMove, { passive: false })

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("mousemove", onMouseMove)
      container.removeEventListener("touchmove", onTouchMove)
      pathsRef.current.forEach((p) => p.remove())
      pathsRef.current = []
      linesRef.current = []
    }
  }, [pointerSize, strokeColor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}
    >
      <svg
        ref={svgRef}
        style={{ display: "block" }}
      />
    </div>
  )
}

export default Waves
