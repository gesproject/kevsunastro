"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mockReleases, mockLinks } from "@/data/mock";
import { waitForHeroReady } from "@/lib/heroReady";
import { useFetchWithFallback } from "@/lib/useFetchWithFallback";
import type { Release } from "@/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SOCIALS = [
  { label: "Spotify", href: mockLinks.find(l => l.platform === "spotify")?.url ?? "#" },
  { label: "SoundCloud", href: mockLinks.find(l => l.platform === "soundcloud")?.url ?? "#" },
  { label: "Instagram", href: mockLinks.find(l => l.platform === "instagram")?.url ?? "#" },
  { label: "Resident Advisor", href: "#" },
  { label: "Bandcamp", href: "#" },
];

const SOUNDCLOUD_WAVEFORM = [60, 45, 80, 35, 90, 55, 70, 40, 85, 50, 75, 30, 65, 80, 45, 90, 38, 72, 55, 62, 78, 48, 85, 60, 95, 42, 68, 75, 50, 88, 35, 65, 82, 45, 70, 55, 90, 62, 75, 40, 85, 50, 78, 35, 68, 80, 55, 88, 42, 65];

function getSpotifyEmbedUrl(url?: string) {
  if (!url || url.includes("placeholder")) return null;

  try {
    const parsed = new URL(url);
    const [type, id] = parsed.pathname.split("/").filter(Boolean);

    if (parsed.hostname !== "open.spotify.com" || !type || !id) {
      return null;
    }

    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return null;
  }
}

function getSoundCloudEmbedUrl(url?: string) {
  if (!url || url.includes("placeholder")) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("soundcloud.com")) return null;

    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(parsed.toString())}&auto_play=false`;
  } catch {
    return null;
  }
}

function SpotifyMockPlayer() {
  return (
    <div
      className="flex flex-col justify-between p-3.5 md:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden"
      style={{
        height: "clamp(152px, 20vw, 352px)",
        width: "100%",
        backgroundColor: "#121212",
      }}
    >
      {/* Top Section: Artwork + Track Info + Spotify Brand */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-28 md:h-28 lg:w-36 lg:h-36 flex-shrink-0 bg-neutral-800 overflow-hidden shadow-lg">
            <img
              src="/images/mecca-solbo.png"
              alt="Mecca by Sölbo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="text-white font-bold text-sm md:text-base lg:text-lg truncate tracking-tight">
              Mecca
            </div>
            <div className="text-neutral-400 text-xs md:text-sm truncate mt-0.5">
              Sölbo
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-[#1DB954] fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.72 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className="text-[11px] md:text-xs font-semibold tracking-wider text-[#1DB954] uppercase">
            Spotify
          </span>
        </div>
      </div>

      {/* Bottom Section: Scrubber + Play Button */}
      <div className="flex items-center gap-3 w-full mt-auto pt-2">
        <div
          aria-hidden="true"
          className="w-9 h-9 md:w-11 md:h-11 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0 text-black shadow-md"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[10px] md:text-xs text-neutral-400 font-mono flex-shrink-0">0:42</span>
          <div className="flex-1 h-1 bg-white/20 relative">
            <div className="absolute left-0 top-0 h-full w-[35%] bg-white" />
          </div>
          <span className="text-[10px] md:text-xs text-neutral-400 font-mono flex-shrink-0">3:18</span>
        </div>
      </div>
    </div>
  );
}

function SoundCloudMockPlayer() {
  return (
    <div
      className="flex flex-row items-center gap-3 md:gap-5 p-3.5 md:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden"
      style={{
        height: "166px",
        width: "100%",
        backgroundColor: "#121212",
      }}
    >
      {/* Artwork */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 bg-neutral-800 overflow-hidden shadow-md">
        <img
          src="/images/mecca-solbo.png"
          alt="Mecca by Sölbo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Column: Title/Artist/Play/Logo + Waveform */}
      <div className="flex-1 flex flex-col justify-between h-full min-w-0 py-0.5">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="w-8 h-8 md:w-10 md:h-10 bg-[#ff5500] rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="text-white font-semibold text-sm md:text-base truncate leading-tight">
                Mecca
              </div>
              <div className="text-neutral-400 text-xs truncate mt-0.5">
                Sölbo
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#ff5500] fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
            <span className="text-[11px] md:text-xs font-semibold tracking-wider text-[#ff5500] uppercase">
              SoundCloud
            </span>
          </div>
        </div>

        {/* Bottom Area: Waveform + Time Scrubber */}
        <div className="flex flex-col gap-1 w-full mt-auto pt-2">
          <div className="w-full flex items-end justify-between h-10 md:h-12 gap-[1px] md:gap-[2px]">
            {SOUNDCLOUD_WAVEFORM.map((h, i) => {
              const isPlayed = i < 18;
              return (
                <div
                  key={i}
                  className="flex-1 transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: isPlayed ? "#ff5500" : "rgba(255, 255, 255, 0.25)",
                    opacity: isPlayed ? 0.9 : 0.6 + (i % 3) * 0.1,
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] md:text-xs text-neutral-400 font-mono">
            <span>1:15</span>
            <span>3:42</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Music() {
  const sectionRef = useRef<HTMLElement>(null);
  const embedsRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const releases = useFetchWithFallback<Release[]>("/api/releases", mockReleases);
  const spotifyRelease = releases.find((release) => getSpotifyEmbedUrl(release.spotifyUrl));
  const soundCloudRelease = releases.find((release) => getSoundCloudEmbedUrl(release.soundcloudUrl));
  const spotifyEmbedUrl = getSpotifyEmbedUrl(spotifyRelease?.spotifyUrl);
  const soundCloudEmbedUrl = getSoundCloudEmbedUrl(soundCloudRelease?.soundcloudUrl);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    waitForHeroReady().then(() => {
      if (cancelled || !sectionRef.current) return;

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add("(min-width: 769px)", () => {
          const embeds = embedsRef.current;
          const socials = socialsRef.current;
          const header = headerRef.current;
          const rows = rowsRef.current.filter(Boolean) as HTMLDivElement[];

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section, start: "top top", end: "+=120%",
              scrub: 0.8, pin: true, anticipatePin: 1,
            },
          });
          if (embeds) tl.fromTo(embeds, { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: "power3.out", duration: 0.5 }, 0.2);
          if (socials) tl.fromTo(socials, { opacity: 0 }, { opacity: 1, ease: "power2.out", duration: 0.3 }, 0.5);
          if (header) tl.fromTo(header, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: "power3.out", duration: 0.3 }, 0.5);
          rows.forEach((row, i) =>
            tl.fromTo(row, { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.2 }, 0.68 + i * 0.04)
          );
        });

        mm.add("(max-width: 768px)", () => {
          // Seam 1 — color-grade dissolve at the Hero→Music boundary.
          // Music begins as #c8cbc8 (Hero's grey) so that when Hero's canvas melts
          // out it exposes the same hue underneath — no flash. The section then
          // grades to #0e0e0c (its natural dark) over the entry overlap zone,
          // completing before the first content element fades in.
          const section = sectionRef.current;
          if (section) {
            gsap.fromTo(
              section,
              { backgroundColor: "#c8cbc8" },
              {
                backgroundColor: "#0e0e0c",
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 100%",
                  end: "top 40%",
                  scrub: 0.8,
                },
              }
            );
          }

          [embedsRef.current, headerRef.current].filter(Boolean).forEach((el, i) => {
            gsap.fromTo(el,
              { opacity: 0, y: 20 },
              {
                opacity: 1, y: 0, duration: 0.7, delay: i * 0.08, ease: "power2.out",
                scrollTrigger: { trigger: el!, start: "top 92%", toggleActions: "play none none none" }
              }
            );
          });
          rowsRef.current.filter(Boolean).forEach((row, i) => {
            gsap.fromTo(row,
              { opacity: 0, y: 16 },
              {
                opacity: 1, y: 0, duration: 0.5, delay: i * 0.04, ease: "power2.out",
                scrollTrigger: { trigger: row!, start: "top 95%", toggleActions: "play none none none" }
              }
            );
          });
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
      id="music"
      className="relative"
      style={{ backgroundColor: "#c8cbc8" }}
    >
      {/* Mobile full-bleed background image */}
      <div
        className="music-mobile-bg absolute inset-0 z-[1] pointer-events-none md:hidden will-change-transform"
        style={{
          backgroundImage: "url('/images/Horizontal1.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, #0e0e0c 0%, rgba(10,10,10,0.4) 40%, #0e0e0c 100%)",
        }} />
      </div>

      {/* Desktop seamless gradient transition to Shows section */}
      <div
        className="hidden md:block absolute inset-x-0 bottom-0 pointer-events-none z-[0]"
        style={{
          height: "35vh",
          background: "linear-gradient(to bottom, transparent 0%, rgba(14, 14, 12, 0.04) 15%, rgba(14, 14, 12, 0.2) 35%, rgba(14, 14, 12, 0.6) 65%, #0e0e0c 100%)",
        }}
      />

      {/* ─── CONTENT ─── */}
      <div className="relative z-10 w-full px-5 md:px-16 lg:px-24 pt-10 md:pt-10 pb-32 md:pb-[22vh] md:min-h-screen flex flex-col">

        {/* 2-Column Grid on desktop: Music players left, Releases right */}
        <div className="flex-1 flex flex-col flex-col-reverse md:grid md:grid-cols-2 md:gap-10 lg:gap-16 md:items-start">

          {/* ── EMBEDS CARD (Left Column on Desktop) ── */}
          <div
            ref={embedsRef}
            className="p-3 mb-0 md:mb-0 bg-white/5 md:bg-gradient-to-br md:from-[rgba(255,255,255,0.08)] md:to-[rgba(0,0,0,0.2)] shadow-2xl md:shadow-[0_32px_80px_-10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl md:backdrop-blur-[48px]"
            style={{
              opacity: 0,
            }}
          >
            {/* Stacked players: Spotify on top, SoundCloud below, socials at bottom */}
            <div className="flex flex-col gap-3 md:gap-4">

              {/* Spotify */}
              <div className="w-full">
                {spotifyEmbedUrl ? (
                  <iframe
                    title={`${spotifyRelease?.title ?? "Spotify"} on Spotify`}
                    src={spotifyEmbedUrl}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="block w-full border-0"
                    style={{ height: "clamp(152px, 20vw, 352px)", backgroundColor: "#121212" }}
                  />
                ) : (
                  <SpotifyMockPlayer />
                )}
              </div>

              {/* SoundCloud + socials below */}
              <div className="w-full flex flex-col min-w-0">
                {soundCloudEmbedUrl ? (
                  <iframe
                    title={`${soundCloudRelease?.title ?? "SoundCloud"} on SoundCloud`}
                    src={soundCloudEmbedUrl}
                    loading="lazy"
                    allow="autoplay"
                    className="block w-full border-0"
                    style={{ height: "166px", backgroundColor: "#121212" }}
                  />
                ) : (
                  <SoundCloudMockPlayer />
                )}

                {/* Socials — desktop only */}
                <div
                  ref={socialsRef}
                  className="hidden md:flex flex-wrap gap-x-4 gap-y-2 md:gap-x-5 pt-3 px-1 mt-1"
                  style={{ opacity: 0 }}
                >
                  {SOCIALS.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="text-[var(--color-solbo-light)] md:text-[var(--color-solbo-dark)]"
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "0.82rem", letterSpacing: "0.22em",
                        opacity: 0.4,
                        textTransform: "uppercase", textDecoration: "none",
                        transition: "opacity 0.3s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.32")}
                    >{s.label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RELEASES ── */}
          <div className="pb-[45vh] md:pb-0">
            <div ref={headerRef} className="mb-3 md:mb-5" style={{ opacity: 0 }}>
              <h2 className="text-[var(--color-solbo-light)] md:text-[var(--color-solbo-dark)]" style={{
                fontWeight: 300,
                fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
                letterSpacing: "-0.01em",
              }}>
                Releases
              </h2>
            </div>

            {/* 3-col grid on both mobile and desktop (since desktop is half screen width) */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {releases.slice(0, 12).map((release, i) => (
                <div
                  key={release.id}
                  ref={el => { rowsRef.current[i] = el; }}
                  className={i >= 9 ? "hidden md:block" : "block"}
                  style={{ opacity: 0 }}
                >
                  {/* Square artwork */}
                  <div className="bg-white/5 md:bg-gradient-to-br md:from-[rgba(255,255,255,0.12)] md:to-[rgba(255,255,255,0.02)] border border-transparent md:border-white/20 md:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15),inset_0_2px_6px_rgba(255,255,255,0.3)] md:backdrop-blur-2xl max-md:rounded-[4px] md:rounded-2xl" style={{
                    width: "100%", aspectRatio: "1 / 1",
                    overflow: "hidden",
                    marginBottom: "0.5rem",
                    transition: "opacity 0.3s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    {release.artworkUrl
                      ? <img src={release.artworkUrl} alt={release.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)" }} />}
                  </div>
                  {/* Title */}
                  <div className="text-[var(--color-solbo-light)] md:text-[var(--color-solbo-dark)]" style={{
                    fontSize: "clamp(0.6rem, 2.5vw, 1rem)", fontWeight: 500,
                    opacity: 0.8,
                    marginBottom: "2px", letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{release.title}</div>
                  {/* Meta */}
                  <div className="text-[var(--color-solbo-light)] md:text-[var(--color-solbo-dark)]" style={{
                    fontFamily: "'Courier New', monospace", fontSize: "clamp(0.45rem, 2vw, 0.72rem)",
                    letterSpacing: "0.2em",
                    opacity: 0.6, textTransform: "uppercase",
                  }}>
                    {release.releaseDate.substring(0, 4)}
                    <span style={{ opacity: 0.6 }}> · {release.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
