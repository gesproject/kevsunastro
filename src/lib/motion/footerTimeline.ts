import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMotionLifecycle } from "./lifecycle";

const DESKTOP_QUERY = "(min-width: 768px)";
const MOBILE_QUERY = "(max-width: 767px)";

let active = false;

/** Ports Footer's legacy entrance choreography without pre-empting Task 4.4's waves. */
export function initFooterTimeline(): void {
  if (active || !initMotionLifecycle()) return;

  const footer = document.querySelector<HTMLElement>("#footer");
  const booking = footer?.querySelector<HTMLElement>(".footer__booking");
  const content = footer?.querySelector<HTMLElement>(".footer__content");
  const links = footer ? Array.from(footer.querySelectorAll<HTMLElement>(".footer__links a, .footer__links span")) : [];
  if (!footer || !booking || !content) return;

  active = true;
  const context = gsap.context(() => {
    const media = gsap.matchMedia();

    media.add(DESKTOP_QUERY, () => {
      gsap.set(booking, { opacity: 0, y: 12 });
      gsap.set(links, { opacity: 0, y: 8 });
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: footer, start: "top 85%", toggleActions: "play none none none" },
      });
      timeline.to(booking, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
      timeline.to(links, { opacity: 1, y: 0, stagger: 0.05, duration: 0.45, ease: "power2.out" }, 0.2);
    });

    media.add(MOBILE_QUERY, () => {
      gsap.fromTo(
        content,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: footer, start: "top 80%", end: "bottom bottom", scrub: 0.8 },
        },
      );
    });

    ScrollTrigger.refresh();
  }, footer);

  window.addEventListener(
    "pagehide",
    () => {
      context.revert();
      active = false;
    },
    { once: true },
  );
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) initFooterTimeline();
});
