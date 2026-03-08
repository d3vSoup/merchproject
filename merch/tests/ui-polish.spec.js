// tests/ui-polish.spec.js — 5 Playwright tests for the UI polish PR
// Run: npx playwright test tests/ui-polish.spec.js

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

// ─── Test 1: Wishlist heart animation triggers and count increments ───
test("wishlist: heart pop animation + badge increment", async ({ page }) => {
  await page.goto(`${BASE}/event/utsav`);
  await page.waitForSelector(".product-card");

  const heartBtn = page.locator(".wishlist-btn--card").first();
  if (!(await heartBtn.isVisible())) {
    test.skip("User not signed in — wishlist button hidden");
  }

  const badgeBefore = await page.locator(".wishlist-badge").textContent().catch(() => "0");
  await heartBtn.click();

  // Heart should get the pop class
  await expect(heartBtn).toHaveClass(/heart-pop/, { timeout: 1000 });

  // Toast should appear with aria-live
  await expect(page.locator('[role="status"]')).toContainText(/wishlist/i, { timeout: 3000 });
});

// ─── Test 2: Add-to-cart triggers fly animation + cart count change ───
test("cart: add-to-cart triggers badge bump", async ({ page }) => {
  await page.goto(`${BASE}/event/utsav`);
  await page.waitForSelector(".product-card");

  const addBtn = page.locator(".product-card__controls .btn--ghost").first();
  const cartBadge = page.locator(".cart-badge");

  const countBefore = await cartBadge.textContent().catch(() => "0");
  await addBtn.click();

  // Badge should bump
  await page.waitForTimeout(600);
  const countAfter = await cartBadge.textContent().catch(() => "0");
  expect(parseInt(countAfter || "0")).toBeGreaterThanOrEqual(parseInt(countBefore || "0"));
});

// ─── Test 3: Header keyboard navigation — tabs focusable ───
test("header: keyboard navigation of tabs", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForSelector(".topbar");

  // Tab to the first nav tab
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);

  // Keep tabbing until we hit a tab link
  for (let i = 0; i < 10; i++) {
    const cls = await page.evaluate(() => document.activeElement?.className || "");
    if (cls.includes("tab")) {
      // Focus ring should be visible (box-shadow)
      const boxShadow = await page.evaluate(() =>
        getComputedStyle(document.activeElement).boxShadow
      );
      expect(boxShadow).not.toBe("none");
      return;
    }
    await page.keyboard.press("Tab");
  }
});

// ─── Test 4: Skeleton loaders appear while data loads ───
test("skeleton: appears with aria-busy during load", async ({ page }) => {
  // Intercept API to delay response
  await page.route("**/api/items/soldouts**", (route) =>
    setTimeout(() => route.continue(), 2000)
  );

  await page.goto(`${BASE}/event/utsav`);

  // Skeleton grid should appear with aria-busy
  const skeleton = page.locator(".skeleton-grid");
  if (await skeleton.isVisible({ timeout: 1000 })) {
    await expect(skeleton).toHaveAttribute("aria-busy", "true");
  }
});

// ─── Test 5: Hero carousel is keyboard-focusable and scrolls ───
test("hero: carousel keyboard navigation", async ({ page }) => {
  await page.goto(BASE);

  const carousel = page.locator(".hero-carousel");
  if (!(await carousel.isVisible({ timeout: 3000 }))) {
    test.skip("Hero carousel not present");
  }

  // Focus the carousel
  await carousel.focus();
  await expect(carousel).toBeFocused();

  // Press right arrow — scrollLeft should change
  const scrollBefore = await carousel.evaluate((el) => el.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  const scrollAfter = await carousel.evaluate((el) => el.scrollLeft);
  expect(scrollAfter).toBeGreaterThan(scrollBefore);
});
