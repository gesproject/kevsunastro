import { expect, test } from "@playwright/test";

test("Keystatic admin is worker-backed and isolated from public routes", async ({ page, request }) => {
  const admin = await page.goto("/keystatic/", { waitUntil: "domcontentloaded" });

  expect(admin?.status()).toBe(200);
  await expect(page.locator('a[href^="/api/keystatic/github/login"]')).toHaveCount(1);

  const login = await request.get("/api/keystatic/github/login", { maxRedirects: 0 });
  expect(login.status()).toBe(307);
  const redirect = new URL(login.headers().location);
  expect(`${redirect.origin}${redirect.pathname}`).toBe("https://github.com/login/oauth/authorize");
  expect(new URL(redirect.searchParams.get("redirect_uri")).pathname).toBe("/api/keystatic/github/oauth/callback");

  const [home, link] = await Promise.all([request.get("/"), request.get("/link/")]);
  expect(await home.text()).not.toMatch(/keystatic/i);
  expect(await link.text()).not.toMatch(/keystatic/i);
});
