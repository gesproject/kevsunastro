/**
 * Centralized SEO/OG URL builders and structured data for public routes.
 * Kept dependency-free so both prerendered pages can import it at build time.
 */

export function absoluteUrl(site: string | undefined, path: string): string | undefined {
  if (!site) return undefined;
  try {
    return new URL(path, site).toString();
  } catch {
    return undefined;
  }
}

/** MusicGroup structured data — only verifiable facts from site content. */
export function musicGroupJsonLd(input: {
  origin: string;
  artistName: string;
  description: string;
  location: string;
  profileImage?: string;
  socialLinks: { label: string; href: string }[];
}): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: input.artistName,
    description: input.description,
    image: input.profileImage ? new URL(input.profileImage, input.origin).toString() : undefined,
    url: input.origin + "/",
    genre: "Electronic",
    homeLocation: { "@type": "Place", name: input.location },
    sameAs: input.socialLinks.map((link) => link.href),
  };
  return JSON.stringify(data);
}
