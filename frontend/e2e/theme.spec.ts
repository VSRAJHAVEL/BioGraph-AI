import { test, expect } from '@playwright/test';

test.describe('Apple Glassmorphism & Theme Switching', () => {
  test('toggles seamlessly between Apple Light Mode and Dark Mode', async ({ page }) => {
    await page.goto('/');

    // Dismiss welcome tour modal if visible
    const skipBtn = page.getByRole('button', { name: /skip introduction/i });
    if (await skipBtn.isVisible({ timeout: 3000 })) {
      await skipBtn.click();
      await page.waitForTimeout(300);
    }

    // 1. Initial State: Dark Mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // 2. Click Apple Segmented Theme Toggle in Navbar
    const themeToggle = page.locator('button[aria-label="Toggle Dark / Light Theme"]');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    // 3. Verify Light Mode is now active on <html>
    await expect(html).not.toHaveClass(/dark/);
    await page.waitForTimeout(400);

    // Verify background color in light mode has switched
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // #f5f6f8 is rgb(245, 246, 248)
    expect(bodyBg).toBe('rgb(245, 246, 248)');

    // Verify 2D molecule container adapts cleanly in light mode
    const molContainer = page.locator('.mol-container');
    await expect(molContainer).toBeVisible();

    // Verify prediction section is visible in light mode
    await expect(page.locator('text=Ensemble Consensus Inference')).toBeVisible({ timeout: 15000 });

    // 4. Click Toggle again to return to Dark Mode
    await themeToggle.click();
    await expect(html).toHaveClass(/dark/);
    await page.waitForTimeout(400);

    const darkBodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // #08090b is rgb(8, 9, 11)
    expect(darkBodyBg).toBe('rgb(8, 9, 11)');
  });
});
