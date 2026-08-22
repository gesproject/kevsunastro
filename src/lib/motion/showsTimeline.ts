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

function setupRowAtmosphere(panel: HTMLElement): () => void {
  const rows = Array.from(panel.querySelectorAll<HTMLElement>(".shows__list .shows__row"));
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
  const onPanelLeave = () => {
    restore();
    scheduleIdle();
  };

  const removers = rows.map((row) => {
    const onEnter = () => {
      window.clearTimeout(idleTimer);
      restore();
      cancellations = Array.from(row.querySelectorAll<HTMLElement>(".shows__date-label, .shows__venue, .shows__city")).map(scrambleText);
    };
    row.addEventListener("mouseenter", onEnter);
    return () => row.removeEventListener("mouseenter", onEnter);
  });
  panel.addEventListener("mouseleave", onPanelLeave);
  scheduleIdle();

  return () => {
    window.clearTimeout(idleTimer);
    restore();
    removers.forEach((remove) => remove());
    panel.removeEventListener("mouseleave", onPanelLeave);
  };
}

/** Ports Shows' legacy section choreography without changing its static floor. */
export function initShowsTimeline(): void {
  if (active || !initMotionLifecycle()) return;

  const section = document.querySelector<HTMLElement>("#shows");
  const header = section?.querySelector<HTMLElement>(".shows__header h2");
  const panel = section?.querySelector<HTMLElement>(".shows__panel");
  const photoOuter = section?.querySelector<HTMLElement>(".shows__photo-outer");
  const photoPanel = section?.querySelector<HTMLElement>(".shows__photo-panel");
  if (!section || !header || !panel) return;

  active = true;
  const stopRowAtmosphere = setupRowAtmosphere(panel);
  const context = gsap.context(() => {
    const media = gsap.matchMedia();

    media.add(DESKTOP_QUERY, () => {
      if (photoOuter) {
        gsap.fromTo(
          photoOuter,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.5 },
          },
        );
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=250%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
      timeline.fromTo(
        header,
        { autoAlpha: 0, clipPath: "inset(0 0 100% 0)", yPercent: 12 },
        { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", yPercent: 0, duration: 0.7, ease: "expo.out" },
        0.15,
      );
      timeline.fromTo(panel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.32);

      if (!photoPanel) return;
      const rotateX = gsap.quickTo(photoPanel, "rotationX", { duration: 0.6, ease: "power2.out" });
      const rotateY = gsap.quickTo(photoPanel, "rotationY", { duration: 0.6, ease: "power2.out" });
      const scale = gsap.quickTo(photoPanel, "scale", { duration: 0.4, ease: "power2.out" });
      let rect: DOMRect | undefined;
      const onMove = (event: MouseEvent) => {
        if (!rect) return;
        rotateY(((event.clientX - rect.left) / rect.width) * 24 - 12);
        rotateX(-(((event.clientY - rect.top) / rect.height) * 16 - 8));
      };
      const onEnter = () => {
        rect = photoPanel.getBoundingClientRect();
        scale(1.02);
      };
      const onLeave = () => {
        rect = undefined;
        rotateX(0);
        rotateY(0);
        scale(1);
      };
      photoPanel.addEventListener("mousemove", onMove);
      photoPanel.addEventListener("mouseenter", onEnter);
      photoPanel.addEventListener("mouseleave", onLeave);
      return () => {
        photoPanel.removeEventListener("mousemove", onMove);
        photoPanel.removeEventListener("mouseenter", onEnter);
        photoPanel.removeEventListener("mouseleave", onLeave);
      };
    });

    media.add(MOBILE_QUERY, () => {
      gsap.fromTo(
        header,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: header, start: "top 90%", end: "top 60%", scrub: 0.8 },
        },
      );
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: panel, start: "top 92%", toggleActions: "play none none none" },
        },
      );
      if (section.querySelector(".shows__list .shows__row")) {
        gsap.fromTo(
          section,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
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
