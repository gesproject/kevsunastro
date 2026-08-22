import { expect, test } from "@playwright/test";

test("the CMS demo catalog preserves the legacy layout without live destinations", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#shows .shows__row")).toHaveCount(5);
  await expect(page.locator("#shows .shows__badge").first()).toHaveText("Demo");
  await expect(page.locator("#shows .shows__badge")).toContainText(["Demo", "Demo", "Sold Out", "Sold Out", "Free"]);
  await expect(page.locator("#shows .shows__ticket")).toHaveCount(0);

  await expect(page.locator("#music .release")).toHaveCount(3);
  await expect(page.locator("#music .release__title")).toHaveText(["Mecca", "Threshold", "Periphery"]);
  await expect(page.locator("#music .release__frame img").first()).toHaveAttribute("src", "/images/mecca-solbo.png");
  await expect(page.locator("#music .music__embed")).toHaveCount(0);
  await expect(page.locator("#music .player")).toHaveCount(2);
  const [primaryTitle, primaryArtwork] = await Promise.all([
    page.locator("#music .release__title").first().textContent(),
    page.locator("#music .release__frame img").first().getAttribute("src"),
  ]);
  await expect(page.locator("#music .player__title").first()).toHaveText(primaryTitle ?? "");
  await expect(page.locator("#music .player__art").first()).toHaveAttribute("src", primaryArtwork ?? "");

  await page.goto("/link", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#release h3")).toHaveText("Mecca");
  await expect(page.locator("#shows .show-card__note")).toHaveText("Demo listing.");
  await expect(page.getByLabel("Instagram")).toHaveAttribute("href", "https://www.instagram.com/solbo__/");
  await expect(page.getByLabel("TikTok")).toHaveAttribute("href", "https://www.tiktok.com/@solbo__");
  await expect(page.getByLabel("Facebook")).toHaveAttribute("href", "https://www.facebook.com/solbo.music");
  await expect(page.locator(".footer__mail")).toHaveAttribute("href", "mailto:booking@solbo.studio");
  await expect(page.locator(".action-card--pending")).toHaveCount(2);

  await context.close();
});
