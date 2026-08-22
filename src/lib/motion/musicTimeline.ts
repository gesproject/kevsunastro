import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMotionLifecycle } from "./lifecycle";

const DESKTOP_QUERY = "(min-width: 768px)";
const MOBILE_QUERY = "(max-width: 767px)";

let active = false;

/**
 * Music's original desktop composition held the section in place while its
 * two columns arrived in sequence. Mobile never pinned; it revealed the same
 * content as it entered the viewport. The Astro markup stays visible by
 * default so no-JS and reduced-motion paths remain ordinary readable content.
 */
export function initMusicTimeline(): void {
  if (active || !initMotionLifecycle()) return;

  const section = document.querySelector<HTMLElement>("#music");
  if (!section) return;

  active = true;
  const stack = section.querySelector<HTMLElement>(".music__stack");
  const platforms = section.querySelector<HTMLElement>(".music__platforms");
  const heading = section.querySelector<HTMLElement>(".music__heading");
  const releases = Array.from(section.querySelectorAll<HTMLElement>(".release"));

  const context = gsap.context(() => {
    const media = gsap.matchMedia();

    media.add(DESKTOP_QUERY, () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=120%",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      if (stack) timeline.fromTo(stack, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "power3.out", duration: 0.5 }, 0.2);
      if (platforms) timeline.fromTo(platforms, { autoAlpha: 0 }, { autoAlpha: 1, ease: "power2.out", duration: 0.3 }, 0.5);
      if (heading) timeline.fromTo(heading, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "power3.out", duration: 0.3 }, 0.5);
      releases.forEach((release, index) =>
        timeline.fromTo(release, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.2 }, 0.68 + index * 0.04),
      );
    });

    media.add(MOBILE_QUERY, () => {
      [stack, heading].filter((element): element is HTMLElement => Boolean(element)).forEach((element, index) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: index * 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 92%", toggleActions: "play none none none" },
          },
        );
      });
      releases.forEach((release, index) => {
        gsap.fromTo(
          release,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            delay: index * 0.04,
            ease: "power2.out",
            scrollTrigger: { trigger: release, start: "top 95%", toggleActions: "play none none none" },
          },
        );
      });
    });

    ScrollTrigger.refresh();
  }, section);

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
  if (event.persisted) initMusicTimeline();
});
