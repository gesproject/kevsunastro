import { z } from "astro/zod";

const nonEmptyText = z.string().trim().min(1);
const isoDate = z.iso.date();
/**
 * `z.url()` alone validates shape, not scheme: it accepts `javascript:` and
 * `data:` URLs, which reach an `href` and execute in-origin. Editors write
 * these values through the CMS, so the scheme allowlist belongs here — at the
 * single place every consumer parses through — rather than at each render site.
 */
const withScheme = (allowed: string[]) =>
  z.url().refine(
    (value) => {
      try {
        return allowed.includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: `Expected a URL using one of: ${allowed.join(" ")}` },
  );

const externalUrl = withScheme(["https:"]);
const publicAssetPath = z.string().regex(/^\/(?:images|artwork)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/, {
  message: "Expected an image or artwork path rooted at /images/ or /artwork/.",
});
// Booking is a mailto:; everything else is https. "/" is the internal site link.
const linkHref = z.union([withScheme(["https:", "mailto:"]), z.literal("/")]);

export const showSchema = z
  .object({
    date: isoDate,
    venue: nonEmptyText,
    city: nonEmptyText,
    country: z.string().regex(/^[A-Z]{2}$/, {
      message: "Use an uppercase ISO 3166-1 alpha-2 country code.",
    }),
    status: z.enum(["available", "sold-out", "free"]),
    ticketUrl: externalUrl.optional(),
    priority: z.number().int().min(0).max(999),
    featuredImage: publicAssetPath.optional(),
  })
  .superRefine((show, context) => {
    if (show.status === "available" && !show.ticketUrl) {
      context.addIssue({
        code: "custom",
        message: "Available shows require a ticketUrl.",
        path: ["ticketUrl"],
      });
    }
  });

export const releaseSchema = z.object({
  title: nonEmptyText,
  releaseDate: isoDate,
  type: z.enum(["single", "ep", "album"]),
  artwork: publicAssetPath.optional(),
  spotifyUrl: externalUrl.optional(),
  soundcloudUrl: externalUrl.optional(),
  bandcampUrl: externalUrl.optional(),
  youtubeUrl: externalUrl.optional(),
  priority: z.number().int().min(0).max(999),
});

const enabledLink = z.object({
  enabled: z.literal(true),
  href: linkHref,
});

const pendingLink = z.object({
  enabled: z.literal(false),
  href: z.undefined().optional(),
});

export const linkSchema = z
  .object({
    label: nonEmptyText,
    kind: z.enum(["listen", "buy", "shows", "booking", "social", "site"]),
    priority: z.number().int().min(0).max(999),
  })
  .and(z.union([enabledLink, pendingLink]));

export const siteSchema = z.object({
  artistName: nonEmptyText,
  description: nonEmptyText,
  location: nonEmptyText,
  bookingEmail: z.email(),
  profileImage: publicAssetPath.optional(),
});
