"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·";

function scrambleText(el: HTMLElement, finalText: string, duration = 500) {
  let frame = 0;
  const totalFrames = Math.round(duration / 30);
  const id = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const revealCount = Math.floor(progress * finalText.length);
    el.textContent =
      finalText.slice(0, revealCount) +
      finalText
        .slice(revealCount)
        .split("")
        .map((c) => (c === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)]))
        .join("");
    if (frame >= totalFrames) {
      clearInterval(id);
      el.textContent = finalText;
    }
  }, 30);
  return () => clearInterval(id);
}

export interface ShowRow {
  id: string;
  date: string;
  venue: string;
  city: string;
  isSoldOut?: boolean;
  isFree?: boolean;
  ticketUrl?: string;
}

const DARK  = "var(--color-solbo-dark)";
const LIGHT = "#e8e0d4";

const ShowsListItem = React.forwardRef<
  HTMLLIElement,
  {
    show: ShowRow;
    index: number;
    isActive: boolean;
    light?: boolean;
    hideCity?: boolean;
    onMouseEnter: (i: number) => void;
    onMouseLeave: () => void;
  }
>(({ show, index, isActive, light, hideCity, onMouseEnter, onMouseLeave }, ref) => {
  const color = light ? LIGHT : DARK;
  const dateRef = useRef<HTMLSpanElement>(null);
  const venueRef = useRef<HTMLSpanElement>(null);
  const cityRef = useRef<HTMLSpanElement>(null);
  const cancelRefs = useRef<(() => void)[]>([]);

  useEffect(() => {
    cancelRefs.current.forEach((c) => c());
    cancelRefs.current = [];
    if (isActive) {
      ([
        [dateRef, show.date],
        [venueRef, show.venue],
        [cityRef, show.city],
      ] as [React.RefObject<HTMLSpanElement | null>, string][]).forEach(([r, text]) => {
        if (r.current) cancelRefs.current.push(scrambleText(r.current, text));
      });
    } else {
      if (dateRef.current) dateRef.current.textContent = show.date;
      if (venueRef.current) venueRef.current.textContent = show.venue;
      if (cityRef.current) cityRef.current.textContent = show.city;
    }
  }, [isActive, show]);

  const borderAlpha = light
    ? (isActive ? "0.3" : "0.18")
    : (isActive ? "0.22" : "0.12");
  const borderBase = light ? "232,224,212" : "10,10,10";

  const badgeStyle = {
    fontFamily: "'Courier New', monospace",
    fontSize: "0.58rem",
    letterSpacing: "0.28em",
    color,
    opacity: 0.35,
    textTransform: "uppercase" as const,
    border: `1px solid rgba(${borderBase},0.18)`,
    padding: "2px 8px",
    whiteSpace: "nowrap" as const,
  };

  const ticket = show.isSoldOut ? (
    <span style={badgeStyle}>Sold Out</span>
  ) : show.isFree ? (
    <span style={badgeStyle}>Free</span>
  ) : show.ticketUrl ? (
    <a
      href={show.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="transition-all duration-300 hover:!bg-gray-700/80 hover:!text-white hover:!opacity-100 hover:!border-transparent"
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.28em",
        color,
        opacity: isActive ? 0.9 : 0.5,
        textTransform: "uppercase",
        border: `1px solid rgba(${borderBase},${borderAlpha})`,
        padding: "2px 8px",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >Tickets</a>
  ) : null;

  return (
    <li
      ref={ref}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
      style={{
        display: "grid",
        gridTemplateColumns: hideCity ? "100px auto 1fr" : "120px 200px 140px 1fr",
        gap: "1.25rem",
        alignItems: "center",
        padding: light ? "1.1rem 0" : "0.9rem 0",
        borderBottom: `1px solid rgba(${borderBase},0.1)`,
        cursor: "default",
        willChange: "opacity",
        background: "transparent",
        transition: "background 0.2s",
        marginLeft: "-0.75rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.5rem",
      }}
    >
      <span ref={dateRef} style={{
        fontFamily: "'Courier New', monospace",
        fontSize: light ? "0.72rem" : "0.62rem",
        letterSpacing: "0.06em",
        color,
        opacity: isActive ? 0.65 : 0.35,
        transition: "opacity 0.2s",
      }}>{show.date}</span>

      <span ref={venueRef} style={{
        fontFamily: "'Courier New', monospace",
        fontSize: light ? "0.92rem" : "0.78rem",
        letterSpacing: "0.1em",
        color,
        opacity: isActive ? 1 : 0.85,
        textTransform: "uppercase",
        transition: "opacity 0.2s",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>{show.venue}</span>

      {!hideCity && (
        <span ref={cityRef} style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "0.56rem",
          letterSpacing: "0.14em",
          color,
          opacity: isActive ? 0.5 : 0.22,
          textTransform: "uppercase",
          textAlign: "left",
          transition: "opacity 0.2s",
        }}>{show.city}</span>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {ticket}
      </div>
    </li>
  );
});
ShowsListItem.displayName = "ShowsListItem";

export function ShowsList({ shows, light, hideCity }: ShowsListProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTlRef = useRef<gsap.core.Timeline | null>(null);

  const stopIdle = useCallback(() => {
    if (idleTlRef.current) { idleTlRef.current.kill(); idleTlRef.current = null; }
    itemRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1 }));
  }, []);

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        tl.to(el, { opacity: 0.06, duration: 0.08, ease: "power2.inOut" }, i * 0.04);
        tl.to(el, { opacity: 1,    duration: 0.08, ease: "power2.inOut" }, shows.length * 0.04 * 0.5 + i * 0.04);
      });
      idleTlRef.current = tl;
    }, 3500);
  }, [shows.length]);

  useEffect(() => {
    startIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleTlRef.current) idleTlRef.current.kill();
    };
  }, [startIdleTimer]);

  const handleEnter = useCallback((i: number) => {
    stopIdle();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setActiveIndex(i);
  }, [stopIdle]);

  const handleLeave = useCallback(() => setActiveIndex(-1), []);
  const handleContainerLeave = useCallback(() => {
    setActiveIndex(-1);
    startIdleTimer();
  }, [startIdleTimer]);

  return (
    <div onMouseLeave={handleContainerLeave}>
      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: hideCity ? "100px auto 1fr" : "120px 200px 140px 1fr",
        gap: "1.25rem",
        paddingBottom: "0.55rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.5rem",
        borderBottom: `1px solid rgba(${light ? "232,224,212" : "10,10,10"},0.12)`,
      }}>
        {(hideCity ? ["Date", "Venue", ""] : ["Date", "Venue", "City", ""]).map((label) => (
          <span key={label} style={{
            fontFamily: "'Courier New', monospace",
            fontSize: light ? "0.58rem" : "0.5rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: light ? LIGHT : DARK,
            opacity: 0.3,
            textAlign: "left",
          }}>{label}</span>
        ))}
      </div>

      <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {shows.map((show, i) => (
          <ShowsListItem
            key={show.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            show={show}
            index={i}
            isActive={activeIndex === i}
            light={light}
            hideCity={hideCity}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
        ))}
      </ul>
    </div>
  );
}

interface ShowsListProps {
  shows: ShowRow[];
  light?: boolean;
  hideCity?: boolean;
}
