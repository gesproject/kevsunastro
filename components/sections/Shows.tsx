"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mockShows } from "@/data/mock";
import { waitForHeroReady } from "@/lib/heroReady";
import { useFetchWithFallback } from "@/lib/useFetchWithFallback";
import { ShowsList } from "@/components/ui/shows-list";
import type { ShowRow } from "@/components/ui/shows-list";
import type { Show } from "@/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Shows() {
  const sectionRef    = useRef<HTMLElement>(null);
  const headerRef     = useRef<HTMLDivElement>(null);
  const photoPanelRef = useRef<HTMLDivElement>(null);
  const photoOuterRef = useRef<HTMLDivElement>(null);
  const colLabelsRef  = useRef<HTMLDivElement>(null);
  const shows = useFetchWithFallback<Show[]>("/api/shows", mockShows);

  const showRows: ShowRow[] = shows.map((s) => ({
    id: s.id,
    date: `${s.date.slice(8, 10)} · ${s.date.slice(5, 7)} · ${s.date.slice(0, 4)}`,
    venue: s.venue,
    city: s.city,
    isSoldOut: s.isSoldOut,
    isFree: s.isFree,
    ticketUrl: s.ticketUrl,
  }));

  useEffect(() => {
    const section    = sectionRef.current;
    const header     = headerRef.current;
    const photoPanel = photoPanelRef.current;
    const photoOuter = photoOuterRef.current;

    if (!section || !header) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    waitForHeroReady().then(() => {
      if (cancelled || !sectionRef.current) return;

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        // ─── DESKTOP ────────────────────────────────────────────────────
        mm.add("(min-width: 769px)", () => {
          /* Photo outer parallax */
          if (photoOuter) {
            gsap.fromTo(photoOuter,
              { y: "-8%" },
              {
                y: "8%", ease: "none",
                scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.5 },
              }
            );
          }

          /* Pinned scroll timeline */
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=250%",
              scrub: 1.0,
              pin: true,
              anticipatePin: 1,
            },
          });

          /* Header wipe */
          const h2 = header.querySelector("h2");
          if (h2) {
            gsap.set(h2, { clipPath: "inset(0 0 100% 0)", y: "12%", opacity: 0 });
            tl.to(h2, { clipPath: "inset(0 0 0% 0)", y: "0%", opacity: 1, duration: 0.7, ease: "expo.out" }, 0.15);
          }

          /* Column labels + list entrance */
          const colLabels = colLabelsRef.current;
          if (colLabels) {
            gsap.set(colLabels, { y: 8, opacity: 0 });
            tl.to(colLabels, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.32);
          }

          /* 3D tilt on photo panel */
          if (photoPanel) {
            const rotXTo  = gsap.quickTo(photoPanel, "rotateX", { duration: 0.6, ease: "power2.out" });
            const rotYTo  = gsap.quickTo(photoPanel, "rotateY", { duration: 0.6, ease: "power2.out" });
            const scaleTo = gsap.quickTo(photoPanel, "scale",   { duration: 0.4, ease: "power2.out" });
            let panelRect: DOMRect | null = null;

            const onMove  = (e: MouseEvent) => {
              if (!panelRect) return;
              rotYTo((e.clientX - panelRect.left) / panelRect.width  * 24 - 12);
              rotXTo(-((e.clientY - panelRect.top)  / panelRect.height * 16 - 8));
            };
            const onEnter = () => { panelRect = photoPanel.getBoundingClientRect(); scaleTo(1.02); };
            const onLeave = () => { panelRect = null; rotXTo(0); rotYTo(0); scaleTo(1); };

            photoPanel.addEventListener("mousemove",  onMove);
            photoPanel.addEventListener("mouseenter", onEnter);
            photoPanel.addEventListener("mouseleave", onLeave);

            return () => {
              photoPanel.removeEventListener("mousemove",  onMove);
              photoPanel.removeEventListener("mouseenter", onEnter);
              photoPanel.removeEventListener("mouseleave", onLeave);
            };
          }
        });

        // ─── MOBILE ─────────────────────────────────────────────────────
        mm.add("(max-width: 768px)", () => {
          /* h2 scrub-based opacity/y rise — part of the seam, not a pop-in */
          const h2 = header.querySelector("h2");
          if (h2) {
            gsap.fromTo(h2,
              { opacity: 0, y: 24 },
              {
                opacity: 1, y: 0,
                ease: "none",
                scrollTrigger: { trigger: header, start: "top 90%", end: "top 60%", scrub: 0.8 },
              }
            );
          }

          /* Column labels fade-in */
          const colLabels = colLabelsRef.current;
          if (colLabels) {
            gsap.fromTo(colLabels,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
                scrollTrigger: { trigger: colLabels, start: "top 92%", toggleActions: "play none none none" } }
            );
          }

          /* Shows exit — scrubbed opacity fade as section scrolls out, dissolve into Footer */
          gsap.fromTo(section,
            { opacity: 1 },
            {
              opacity: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "bottom 70%",
                end: "bottom 10%",
                scrub: 0.8,
              },
            }
          );
        });
      }, section);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="shows"
      className="relative overflow-clip md:overflow-visible"
      style={{ backgroundColor: "transparent" }}
    >

      {/* Mobile seam gradient — Music darkness fades into Shows video */}
      <div
        className="md:hidden absolute inset-x-0 top-0 h-[25vh] pointer-events-none z-[1]"
        style={{ background: "linear-gradient(to bottom, #0e0e0c 0%, transparent 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-14 lg:px-20 pt-10 pb-10 md:pt-16 md:pb-48">
        <div
          className="flex flex-col md:grid"
          style={{ gridTemplateColumns: "50% 50%", gap: "0" }}
        >

          {/* LEFT — show list */}
          <div className="w-full md:min-h-[70vh] md:flex md:flex-col md:justify-center" style={{ position: "relative", zIndex: 1 }}>

            {/* Section header */}
            <div ref={headerRef} className="mb-8 md:mb-10">
              <h2
                className="font-semibold tracking-tighter leading-[0.85] will-change-transform text-[#e8e0d4]"
                style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
              >
                Find me live.
              </h2>
            </div>

            {/* Show list — shared for both breakpoints, light on mobile via prop */}
            <div
              ref={colLabelsRef}
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
                backdropFilter: "blur(48px)",
                WebkitBackdropFilter: "blur(48px)",
                borderRadius: "8px",
                padding: "1rem 1.25rem 1.25rem",
                border: "1px solid rgba(255,255,255,0.04)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 40px 100px -10px rgba(0,0,0,0.8), 0 10px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              className="hidden md:block"
            >
              <ShowsList shows={showRows} light />
            </div>

            {/* Mobile list — same component, light color mode */}
            <div className="block md:hidden">
              <ShowsList shows={showRows} light hideCity />
            </div>
          </div>

          {/* RIGHT — photo panel (desktop only) */}
          <div
            ref={photoOuterRef}
            style={{
              position: "sticky",
              top: "9rem",
              alignSelf: "start",
              height: "70vh",
              zIndex: 0,
              display: "none",
              marginLeft: "2rem",
              borderRadius: "3px",
              overflow: "hidden",
              boxShadow: "0 30px 100px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
            className="md:!block"
          >
            <div
              ref={photoPanelRef}
              className="absolute inset-0"
              style={{ perspective: "800px", transformStyle: "preserve-3d", willChange: "transform" }}
            >
              <img src="/images/Horizontal1.webp" alt="Live performance"
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                style={{ opacity: 1 }}
              />
              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.95) 100%), radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.5) 120%)",
                zIndex: 2,
              }} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
