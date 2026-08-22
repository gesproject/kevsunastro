import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/.+/);
});

test("/link route loads", async ({ page }) => {
  const response = await page.goto("/link");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/.+/);
});
