/**
 * Task 6.3 — CMS no-index. The Keystatic admin route ships from the package
 * entrypoint, so instead of forking its page component we stamp every admin
 * request with X-Robots-Tag. Public routes pass through untouched.
 */
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const path = context.url.pathname;
  if (path.startsWith("/keystatic") || path.startsWith("/api/keystatic")) {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
});
