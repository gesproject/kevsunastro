import { getCollection } from "astro:content";

function sortByPriority<T extends { id: string; data: { priority: number } }>(entries: T[]) {
  return [...entries].sort(
    (left, right) => left.data.priority - right.data.priority || left.id.localeCompare(right.id),
  );
}

/**
 * Build-time only accessors for the future public routes. The stable secondary
 * ID sort prevents an editor from changing visible order accidentally when two
 * records share a priority.
 */
export async function getShows() {
  return sortByPriority(await getCollection("shows"));
}

export async function getReleases() {
  return sortByPriority(await getCollection("releases"));
}

export async function getLinkActions() {
  return sortByPriority(await getCollection("links"));
}

/** The subset of link actions Music and Footer both render as a plain platform row. */
export async function getPlatformLinks() {
  const links = await getLinkActions();
  return links.filter(
    (link) => link.data.kind === "listen" || link.data.kind === "buy" || link.data.kind === "social",
  );
}

export async function getSite() {
  const entries = await getCollection("site");

  if (entries.length !== 1) {
    throw new Error(`Expected exactly one site singleton, found ${entries.length}.`);
  }

  return entries[0];
}
