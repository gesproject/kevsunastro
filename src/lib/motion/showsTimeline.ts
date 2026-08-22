import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMotionLifecycle } from "./lifecycle";

const DESKTOP_QUERY = "(min-width: 768px)";
const MOBILE_QUERY = "(max-width: 767px)";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·";

let active = false;

function scrambleText(element: HTMLElement): () => void {
  const finalText = element.dataset.showsText ?? element.textContent ?? "";
  element.dataset.showsText = finalText;
  let frame = 0;
  const timer = window.setInterval(() => {
    frame += 1;
    const revealed = Math.floor((frame / 17) * finalText.length);
    element.textContent =
      finalText.slice(0, revealed) +
      finalText
        .slice(revealed)
        .replace(/[^ ]/g, () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]);
    if (frame === 17) {
      window.clearInterval(timer);
      element.textContent = finalText;
    }
  }, 30);
  return () => {
    window.clearInterval(timer);
    element.textContent = finalText;
  };
}

function setupRowAtmosphere(list: HTMLElement): () => void {
  const rows = Array.from(list.querySelectorAll<HTMLElement>(".shows__row"));
  if (!rows.length) return () => {};

  let idleTimer: number | undefined;
  let idle: gsap.core.Timeline | undefined;
  let cancellations: Array<() => void> = [];

  const restore = () => {
    idle?.kill();
    idle = undefined;
    cancellations.forEach((cancel) => cancel());
    cancellations = [];
    rows.forEach((row) => gsap.set(row, { opacity: 1 }));
  };
  const startIdle = () => {
    idle = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    rows.forEach((row, index) => {
      idle!.to(row, { opacity: 0.06, duration: 0.08, ease: "power2.inOut" }, index * 0.04);
      idle!.to(row, { opacity: 1, duration: 0.08, ease: "power2.inOut" }, rows.length * 0.02 + index * 0.04);
    });
  };
  const scheduleIdle = () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(startIdle, 3500);
  };
  const onListLeave = () => {
    restore();
    scheduleIdle();
  };

  const removers = rows.map((row) => {
    const onEnter = () => {
      window.clearTimeout(idleTimer);
      restore();
      cancellations = Array.from(
        row.querySelectorAll<HTMLElement>(".shows__date-label, .shows__venue, .shows__city"),
      ).map(scrambleText);
    };
    row.addEventListener("mouseenter", onEnter);
    return () => row.removeEventListener("mouseenter", onEnter);
  });
  list.addEventListener("mouseleave", onListLeave);
  scheduleIdle();

  return () => {
    window.clearTimeout(idleTimer);
    restore();
    removers.forEach((remove) => remove());
    list.removeEventListener("mouseleave", onListLeave);
  };
}

/**
 * Shows' scroll choreography. Minimalist rework (2026-08-22): the sticky
 * photo panel and its 3D tilt are gone (retired with the board chrome —
 * its clip-under-gallery behaviour was the repo's longest-lived ponytail),
 * so the desktop pin shortens to the header + list reveal and photography
 * now drifts in a CSS marquee that needs no JS.
 */
export function initShowsTimeline(): void {
  if (active || !initMotionLifecycle()) return;

  const section = document.querySelector<HTMLElement>("#shows");
  const header = section?.querySelector<HTMLElement>(".shows__header h2");
  const list = section?.querySelector<HTMLElement>(".shows__list");
  if (!section || !header || !list) return;

  active = true;
  const stopRowAtmosphere = setupRowAtmosphere(list);
  const context = gsap.context(() => {
    const media = gsap.matchMedia();

    media.add(DESKTOP_QUERY, () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=160%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
      timeline.fromTo(
        header,
        { opacity: 0, clipPath: "inset(0 0 100% 0)", yPercent: 12 },
        { opacity: 1, clipPath: "inset(0 0 0% 0)", yPercent: 0, duration: 0.7, ease: "expo.out" },
        0.15,
      );
      timeline.fromTo(
        list,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" } },
        0.32,
      );
    });

    media.add(MOBILE_QUERY, () => {
      gsap.fromTo(
        header,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: header, start: "top 90%", end: "top 60%", scrub: 0.8 },
        },
      );
      gsap.fromTo(
        list,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: list, start: "top 92%", toggleActions: "play none none none" },
        },
      );
      if (section.querySelector(".shows__list .shows__row")) {
        gsap.fromTo(
          section,
          { opacity: 1 },
          {
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: section, start: "bottom 70%", end: "bottom 10%", scrub: 0.8 },
          },
        );
      }
    });

    ScrollTrigger.refresh();
  }, section);

  window.addEventListener(
    "pagehide",
    () => {
      stopRowAtmosphere();
      context.revert();
      active = false;
    },
    { once: true },
  );
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) initShowsTimeline();
});
