"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mockLinks, mockContent } from "@/data/mock";
import dynamic from "next/dynamic";

const Waves = dynamic(
  () => import("@/components/gsap/WavesBackground").then(m => ({ default: m.Waves })),
  { ssr: false }
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ─── DESKTOP ──────────────────────────────────────────────────────
      mm.add("(min-width: 769px)", () => {
        // Set initial hidden state immediately so there's no flash before timeline fires
        if (bookingRef.current) gsap.set(bookingRef.current, { opacity: 0, y: 12 });
        const links = linksRef.current?.querySelectorAll("a, span");
        if (links) gsap.set(links, { opacity: 0, y: 8 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        if (bookingRef.current) {
          tl.to(bookingRef.current,
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
            0
          );
        }
        if (links) {
          tl.to(links,
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.45, ease: "power2.out" },
            0.2
          );
        }
      });

      // ─── MOBILE ───────────────────────────────────────────────────────
      // Single held beat: content rises and resolves as Footer enters — end credits
      mm.add("(max-width: 768px)", () => {
        const content = contentRef.current;
        if (!content) return;

        gsap.set(content, { opacity: 0, y: 16 });
        gsap.to(content, {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 80%",
            end: "top 30%",
            scrub: 0.8,
          },
        });
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="footer"
      className="safe-bottom relative overflow-hidden"
      style={{
        backgroundColor: "transparent",
        minHeight: "44vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Interactive wave — full footer coverage, pointer-events on */}
      <div className="absolute inset-0 z-0">
        <Waves
          strokeColor="rgba(200,203,200,0.11)"
          backgroundColor="transparent"
          pointerSize={0.8}
        />
      </div>

      {/* SÖLBO watermark — desktop: horizontal bottom-left cropped */}
      <div
        className="hidden md:block absolute bottom-0 left-0 z-0 pointer-events-none select-none overflow-hidden"
        style={{ width: "100%", lineHeight: 1 }}
      >
        <div style={{
          fontSize: "clamp(5rem, 25vw, 20rem)",
          lineHeight: 0.90,
          marginLeft: "-6vw",
          overflow: "hidden",
          maxHeight: "0.70em",
        }}>
          <span style={{
            display: "block",
            fontWeight: 900,
            letterSpacing: "-0.07em",
            color: "#dee0deff",
            opacity: 0.5,
            whiteSpace: "nowrap",
          }}>
            SÖLBO
          </span>
        </div>
      </div>

      {/* SÖLBO watermark — mobile only: vertical left edge, S at top */}
      <div
        className="md:hidden absolute left-0 top-0 bottom-0 z-0 pointer-events-none select-none"
        style={{
          writingMode: "vertical-lr",
          fontSize: "clamp(7.6rem, 15vw, 12rem)",
          marginLeft: "-5vw",
          lineHeight: 1,
          overflow: "hidden",
          width: "1em",
        }}
      >
        <span style={{
          fontWeight: 900,
          letterSpacing: "-0.05em",
          color: "#dee0deff",
          opacity: 0.5,
          whiteSpace: "nowrap",
        }}>
          SÖLBO
        </span>
      </div>

      {/* Content — z-10 so it sits above waves */}
      <div
        ref={contentRef}
        className="relative z-10 w-full"
        style={{
          padding: "clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 5vw, 5rem) clamp(1.75rem, 3vw, 3rem)",
        }}
      >
        {/* Booking — top-right, compact */}
        <div
          ref={bookingRef}
          className="flex justify-end mb-15 md:mb-55"
        >
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.58rem", letterSpacing: "0.4em",
              textTransform: "uppercase", color: "#e8e0d4",
              opacity: 0.3, marginBottom: "0.4rem",
            }}>
              Booking / Inquiries
            </p>
            <a
              href={`mailto:${mockContent.bookingEmail}`}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "clamp(0.88rem, 2vw, 1.5rem)",
                fontWeight: 300, letterSpacing: "0.04em",
                color: "#e8e0d4", textDecoration: "none",
                opacity: 0.65, transition: "opacity 0.3s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.65")}
            >
              {mockContent.bookingEmail}
            </a>
          </div>
        </div>

        {/* Links + copyright */}
        <div
          ref={linksRef}
          className="flex flex-col items-end md:flex-row md:items-center md:justify-start"
          style={{ gap: "1rem 1.25rem" }}
        >
          {mockLinks.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.65rem", letterSpacing: "0.28em",
                textTransform: "uppercase", color: "#e8e0d4",
                opacity: 0.38, textDecoration: "none",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.38")}
            >
              {link.label}
            </a>
          ))}

          <span style={{ flex: 1 }} />

          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.55rem", letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#e8e0d4", opacity: 0.14,
          }}>
            &copy; {new Date().getFullYear()} Sölbo
          </span>
        </div>
      </div>
    </footer>
  );
}
