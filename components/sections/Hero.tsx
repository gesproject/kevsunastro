"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { mockContent, mockLinks } from "@/data/mock";
import { WaveLoader } from "@/components/ui/wave-loader";
import { resolveHeroReady } from "@/lib/heroReady";
import { ArrowRight, Globe2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

const FRAME_SET = {
  count: 193,
  path: (i: number) => `/frames-mobile/frame_${String(i + 1).padStart(4, "0")}.jpg`,
};

const SOCIAL_LINKS = mockLinks.filter(link =>
  ["instagram", "facebook", "tiktok", "soundcloud", "spotify"].includes(link.platform)
);

const SOCIAL_ICON_SRC: Record<string, string> = {
  facebook: "/images/facebook.svg",
  instagram: "/images/insta.svg",
  soundcloud: "/images/soundcloud.svg",
  spotify: "/images/spotify.svg",
  tiktok: "/images/tiktok.svg",
};

const MOBILE_SCROLL_END_MULTIPLIER = 1.6;
const MOBILE_WEBSITE_LOCK_PROGRESS = 0.68;
const MOBILE_FRAME_COMPLETE_PROGRESS = 0.64;
const MOBILE_ENTRY_MEDIA_QUERY = "(max-width: 767px)";
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const linkTreeRef = useRef<HTMLDivElement>(null);
  const scrollLineRef = useRef<HTMLDivElement>(null);
  const scrollLineInnerRef = useRef<HTMLDivElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const isEnteringRef = useRef(false);
  const [framesReady, setFramesReady] = useState(false);
  const [introUnlocked, setIntroUnlocked] = useState(false);

  const ctxCacheRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastFrameRef = useRef<number>(-1);
  const drawStateRef = useRef({ w: 0, h: 0, dW: 0, dH: 0, dX: 0, dY: 0 });

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[frameIndex];
    const ctx = ctxCacheRef.current;
    if (!canvas || !img || !ctx) return;
    if (frameIndex === lastFrameRef.current) return;
    lastFrameRef.current = frameIndex;

    const { dX, dY, dW, dH } = drawStateRef.current;
    ctx.drawImage(img, dX, dY, dW, dH);
  }, []);

  const handleEnterSite = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (isEnteringRef.current) return;

    const section = sectionRef.current;
    if (!section) return;

    isEnteringRef.current = true;
    setIntroUnlocked(true);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetY = section.offsetTop + window.innerHeight * MOBILE_SCROLL_END_MULTIPLIER * MOBILE_WEBSITE_LOCK_PROGRESS;

    if (reduceMotion) {
      drawFrame(FRAME_SET.count - 1);
      window.scrollTo({ top: targetY, behavior: "auto" });
      return;
    }

    if (introRef.current) {
      gsap.to(introRef.current, {
        opacity: 0,
        y: -24,
        duration: 0.45,
        ease: "power3.inOut",
        pointerEvents: "none",
      });
    }

    gsap.to(window, {
      scrollTo: targetY,
      duration: 2.25,
      ease: "expo.inOut",
      overwrite: "auto",
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [drawFrame]);

  useEffect(() => {
    if (introUnlocked) return;

    const mobileQuery = window.matchMedia(MOBILE_ENTRY_MEDIA_QUERY);
    let locked = false;

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventKeys = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        event.preventDefault();
      }
    };

    const removeLock = () => {
      if (!locked) return;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeys);
      locked = false;
    };

    const syncLock = () => {
      if (!mobileQuery.matches) {
        removeLock();
        return;
      }

      if (locked) return;
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeys);
      locked = true;
    };

    syncLock();
    mobileQuery.addEventListener("change", syncLock);

    return () => {
      mobileQuery.removeEventListener("change", syncLock);
      removeLock();
    };
  }, [introUnlocked]);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    const total = FRAME_SET.count;
    const images: HTMLImageElement[] = new Array(total);
    let loaded = 0;

    const handleLoad = (img: HTMLImageElement) => {
      const promise = img.decode ? img.decode() : Promise.resolve();
      promise.then(() => {
        loaded++;
        if (cancelled) return;
        if (loaded === total) {
          imagesRef.current = images;
          setFramesReady(true);
        }
      }).catch(() => {
        // Decode failed — count it anyway so loading isn't blocked
        loaded++;
        if (!cancelled && loaded === total) {
          imagesRef.current = images;
          setFramesReady(true);
        }
      });
    };

    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.onload = () => handleLoad(img);
      img.onerror = () => handleLoad(img);
      img.src = FRAME_SET.path(i);
      images[i] = img;
    }

    return () => { cancelled = true; };
  }, []);

  // Resize canvas to fit wrapper
  useEffect(() => {
    if (!framesReady) return;

    const onResize = () => {
      const canvas = canvasRef.current;
      const wrap = canvasWrapRef.current;
      const firstImg = imagesRef.current[0];
      if (!canvas || !wrap || !firstImg) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxCacheRef.current = ctx;
      }

      const imgR = firstImg.naturalWidth / firstImg.naturalHeight;
      const canR = w / h;
      const dW = imgR > canR ? h * imgR : w;
      const dH = imgR > canR ? h : w / imgR;

      drawStateRef.current = { w, h, dW, dH, dX: (w - dW) / 2, dY: (h - dH) / 2 };
      lastFrameRef.current = -1;
      drawFrame(0);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [framesReady, drawFrame]);

  // Scroll animations
  useEffect(() => {
    if (!framesReady) return;
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const desc = descRef.current;
    const linkTree = linkTreeRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Scroll indicator idle
      if (scrollLineRef.current && scrollLineInnerRef.current) {
        const stripTl = gsap.timeline({ repeat: -1 });
        stripTl
          .fromTo(scrollLineInnerRef.current, { scaleY: 0, transformOrigin: "top" }, { scaleY: 1, duration: 1.2, ease: "power2.inOut" })
          .set(scrollLineInnerRef.current, { transformOrigin: "bottom" })
          .to(scrollLineInnerRef.current, { scaleY: 0, duration: 1.2, ease: "power2.inOut" }, "+=0.1");
      }

      const mm = gsap.matchMedia();

      // --- DESKTOP ---
      mm.add(DESKTOP_MEDIA_QUERY, () => {
        const frameObj = { frame: 0 };
        const logoContent = [headline, desc].filter(Boolean);
        const scrollCue = scrollLineRef.current;

        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=130%",
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });

        // Frame scrub
        scrollTl.to(frameObj, {
          frame: FRAME_SET.count - 1, ease: "none", duration: 1,
          onUpdate: () => drawFrame(Math.round(frameObj.frame)),
        }, 0);

        gsap.set(logoContent, { opacity: 0, y: 28 });
        if (scrollCue) {
          gsap.set(scrollCue, { opacity: 0.82, y: 0 });
        }

        // Logo content enters while the scroll cue stays visible as a persistent hint.
        scrollTl.to(logoContent, {
          opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: "power2.out",
        }, 0.06);

        // Logo content exits first; the scroll cue persists until the hero itself leaves.
        scrollTl.to(logoContent, {
          y: -80, opacity: 0, duration: 0.16, ease: "power2.in",
        }, 0.72);

        if (scrollCue) {
          scrollTl.to(scrollCue, {
            y: -80, opacity: 0, duration: 0.12, ease: "power2.inOut",
          }, 0.88);
        }

        // Canvas snap-cut exit
        if (canvasWrapRef.current) {
          scrollTl.to(canvasWrapRef.current, {
            scale: 0.95, opacity: 0, duration: 0.1, ease: "power2.inOut",
          }, 0.88);
        }
      });

      // --- MOBILE ---
      mm.add(MOBILE_ENTRY_MEDIA_QUERY, () => {
        const frameObj = { frame: 0 };
        const allContent = [headline, desc, linkTree].filter(Boolean);
        const intro = introRef.current;

        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=160%",
            scrub: 0.8,
            pin: true,
            anticipatePin: 1,
          },
        });

        scrollTl.to(frameObj, {
          frame: FRAME_SET.count - 1, ease: "none", duration: MOBILE_FRAME_COMPLETE_PROGRESS,
          onUpdate: () => drawFrame(Math.round(frameObj.frame)),
        }, 0);

        if (intro) {
          scrollTl.to(intro, {
            opacity: 0,
            y: -28,
            pointerEvents: "none",
            duration: 0.16,
            ease: "power2.in",
          }, 0.04);
        }

        scrollTl.to(allContent, {
          opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "power2.out",
        }, 0.08);

        if (scrollLineRef.current) {
          scrollTl.to(scrollLineRef.current, { opacity: 0.8, duration: 0.15, ease: "power2.out" }, 0.05);
          scrollTl.to(scrollLineRef.current, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0.86);
        }

        scrollTl.to(allContent, { opacity: 0, duration: 0.18, ease: "power2.in" }, 0.86);

        // Cinematic canvas melt exit
        if (canvasWrapRef.current) {
          scrollTl.to(canvasWrapRef.current, {
            scale: 0.95,
            opacity: 0,
            duration: 0.1,
            ease: "power2.inOut",
          }, 0.94);
        }
      });
    }, section);

    ScrollTrigger.refresh();
    resolveHeroReady();

    return () => ctx.revert();
  }, [framesReady, drawFrame]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative h-screen w-full overflow-clip z-50 [--hero-canvas-mask:linear-gradient(to_right,transparent,black_15%)]"
      style={{
        backgroundColor: "#c8cbc8",
      } as React.CSSProperties}
    >
      {/* Canvas — full viewport on desktop (cinematic), right 38% on mobile with side fade */}
      <div
        ref={canvasWrapRef}
        className="absolute inset-y-0 right-0 w-full md:w-[38%] z-0"
        style={{
          WebkitMaskImage: "var(--hero-canvas-mask)",
          maskImage: "var(--hero-canvas-mask)",
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Loading indicator */}
      {!framesReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <WaveLoader bars={5} className="bg-[#0e0e0cb3]" />
        </div>
      )}

      {/* Film grain overlay */}
      <div className="film-grain absolute inset-0 z-10 overflow-hidden pointer-events-none" />

      {/* Vignette — bottom fade (stronger on mobile for text legibility) */}
      <div
        className="hidden md:block absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 40%, #c8cbc8)" }}
      />
      <div
        className="md:hidden absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 45%, #0e0e0cb3 85%, #0e0e0c 100%)" }}
      />

      {/* Mobile first scene — linktree-style landing on the same grey as the hero. */}
      <div
        ref={introRef}
        className="md:hidden absolute inset-0 z-40 flex h-[100svh] max-h-[100svh] flex-col items-center justify-between overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)] text-solbo-dark"
        style={{ backgroundColor: "#c8cbc8" }}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 pt-[clamp(0.25rem,4svh,2rem)] text-center">
          <img
            src={mockContent.profileImageUrl}
            alt="Sölbo profile portrait"
            className="h-[clamp(4.75rem,18svh,6rem)] w-[clamp(4.75rem,18svh,6rem)] rounded-full object-cover shadow-[0_18px_50px_rgba(30,30,30,0.16)] ring-1 ring-black/10"
          />

          <div className="space-y-2">
            <p className="text-[clamp(2rem,9vw,3.3rem)] font-black leading-none tracking-[-0.07em] text-[#f2f3f1] drop-shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              Sölbo
            </p>
          </div>

          <nav
            aria-label="Sölbo social links"
            className="flex w-full max-w-[19.5rem] items-center justify-between rounded-[1.25rem] bg-[#f3f3f0]/75 px-4 py-2.5 shadow-[0_18px_45px_rgba(30,30,30,0.12)] ring-1 ring-black/[0.08] backdrop-blur-xl"
          >
            {SOCIAL_LINKS.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="flex h-12 w-12 items-center justify-center transition-all duration-300 ease-out active:scale-90 active:opacity-75 hover:scale-105"
              >
                {SOCIAL_ICON_SRC[link.platform] ? (
                  <img src={SOCIAL_ICON_SRC[link.platform]} alt={link.label} className="h-8 w-8" aria-hidden="true" />
                ) : (
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[-0.04em]" aria-hidden="true">↗</span>
                )}
              </a>
            ))}
          </nav>

          <a
            href="https://open.spotify.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[clamp(0.25rem,2svh,1.25rem)] flex min-h-[4.25rem] w-full max-w-[19.5rem] items-center gap-4 rounded-[1.25rem] bg-[#f3f3f0]/75 px-4 py-3.5 text-left shadow-[0_18px_45px_rgba(30,30,30,0.12)] ring-1 ring-black/[0.08] backdrop-blur-xl transition-transform duration-300 ease-out active:scale-[0.98]"
          >
            <img
              src="/images/mecca-solbo.png"
              alt="Mecca artwork"
              className="h-12 w-12 flex-none rounded-[0.08rem] object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.86rem] font-semibold tracking-[-0.02em] text-solbo-dark/55">
                Stream mecca on Spotify
              </span>
              <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-solbo-dark/30">
                Song · Sölbo
              </span>
            </span>
            <ArrowRight className="h-4 w-4 flex-none text-solbo-dark/26" aria-hidden="true" />
          </a>
        </div>

        <a
          href="#hero"
          onClick={handleEnterSite}
          className="group mb-[clamp(0.75rem,4svh,2rem)] flex min-h-[4.25rem] w-full max-w-[19.5rem] shrink-0 items-center justify-between rounded-[1.25rem] bg-solbo-dark/80 px-6 py-4.5 text-[#e8e0d4] shadow-[0_18px_45px_rgba(30,30,30,0.22)] ring-1 ring-white/[0.08] backdrop-blur-xl transition-transform duration-300 ease-out active:scale-[0.98]"
        >
          <span className="flex items-center gap-3">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.32em]">See website</span>
          </span>
          <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-out group-active:translate-x-1" aria-hidden="true" />
        </a>
      </div>

      {/* Content — bottom-left hero lockup */}
      <div className="absolute inset-0 z-20 flex h-[100svh] md:h-screen w-full items-end px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:px-12 md:pb-8 lg:px-16 lg:pb-10 pointer-events-none">
        {/* TOP: Link Tree (Removed on desktop per design specification) */}
        <div ref={linkTreeRef} className="hidden" />

        {/* BOTTOM: Scroll cue + headline/social lockup */}
        <div className="flex w-full max-w-[min(100vw-2.5rem,48rem)] items-end gap-4 md:max-w-[52rem] md:gap-7">
          {/* Scroll indicator - persistent from load until the hero exits. */}
          <div
            ref={scrollLineRef}
            className="flex shrink-0 items-end gap-3 md:gap-4 pointer-events-none"
            style={{ opacity: 0.82 }}
          >
            <span
              className="text-[0.62rem] md:text-[0.6rem] uppercase tracking-[0.5em] text-[#e8e0d4]/75 md:text-solbo-dark/60 rotate-180 font-medium"
              style={{ writingMode: "vertical-lr" }}
            >
              Scroll
            </span>
            <div className="w-[2px] h-20 md:h-24 bg-[#e8e0d4]/30 md:bg-solbo-dark/20 overflow-hidden">
              <div ref={scrollLineInnerRef} className="w-full h-full bg-[#e8e0d4] md:bg-solbo-dark/80" />
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-start">
            <h1
              ref={headlineRef}
              className="font-bold tracking-tighter md:tracking-[-0.045em] leading-[0.92] md:leading-[0.9] mb-1 md:mb-2 pr-4 text-[#e8e0d4] md:text-solbo-dark text-[clamp(5rem,20vw,11rem)] md:text-[clamp(9rem,18vw,13.25rem)]"
              style={{ opacity: 0 }}
            >
              {mockContent.heroHeadline}
            </h1>

            <div
              ref={descRef}
              className="flex w-[19.5rem] max-w-[calc(100vw-6.5rem)] md:w-[26rem] items-center justify-between rounded-[1.25rem] md:rounded-[1.5rem] border border-[rgba(232,224,212,0.1)] md:border-black/10 bg-[rgba(14,14,12,0.4)] md:bg-black/5 px-4 py-2.5 md:px-6 md:py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.2)] md:shadow-[0_12px_35px_rgba(0,0,0,0.06)] backdrop-blur-xl pointer-events-auto"
              style={{ opacity: 0 }}
              aria-label="Sölbo social links"
            >
              {SOCIAL_LINKS.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="group flex h-11 w-11 md:h-12 md:w-12 items-center justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 active:scale-95 opacity-85 hover:opacity-100"
                >
                  {SOCIAL_ICON_SRC[link.platform] ? (
                    <img src={SOCIAL_ICON_SRC[link.platform]} alt={link.label} className="h-7 w-7 md:h-8 md:w-8 transition-transform duration-300" />
                  ) : (
                    <span className="text-sm font-semibold uppercase tracking-[-0.04em]">↗</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
