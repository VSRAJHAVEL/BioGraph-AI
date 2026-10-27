import { test, expect } from '@playwright/test';

test.describe('Chemical Sketcher Bond Drawing Capabilities', () => {
  test('draws bonds via drag-and-drop, two-click connection, and canvas drag', async ({ page }) => {
    await page.goto('/');

    // Dismiss welcome tour modal if visible
    const skipBtn = page.getByRole('button', { name: /skip introduction/i });
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }

    // Open sketcher modal
    const sketcherBtn = page.locator('#sketcher-button');
    await expect(sketcherBtn).toBeVisible({ timeout: 10000 });
    await sketcherBtn.click();

    // Verify modal is displayed
    await expect(page.locator('text=Modern 2D Chemical Canvas Studio')).toBeVisible({ timeout: 5000 });

    // 1. Clear canvas first
    const clearBtn = page.getByRole('button', { name: /Clear Canvas/i }).first();
    await clearBtn.click();
    await page.waitForTimeout(300);

    // 2. Add Benzene ring template
    const benzeneBtn = page.getByRole('button', { name: 'Benzene' });
    await benzeneBtn.click();
    await page.waitForTimeout(400);

    // Verify benzene formula C6H6
    await expect(page.locator('text=C6H6')).toBeVisible();

    // 3. Test Drag-to-Draw Bond: Drag from one atom outwards into empty space to create a methyl substituent (Toluene C7H8)
    const svgCanvas = page.locator('svg.cursor-crosshair');
    await expect(svgCanvas).toBeVisible();

    // Get first atom position (must select g.cursor-pointer circle to avoid pattern defs circle)
    const atomCircle = svgCanvas.locator('g.cursor-pointer circle').first();
    const box = await atomCircle.boundingBox();
    expect(box).toBeTruthy();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      const targetX = startX;
      const targetY = startY - 70; // 70px above into empty space

      // Mouse drag from atom into empty space
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(600);

      // Verify formula updated from C6H6 to C7H8 (Toluene with new bond!)
      await expect(page.locator('text=C7H8')).toBeVisible({ timeout: 5000 });
    }

    // 4. Test Two-Click Bond Mode: Click an atom to select, then click empty space to add second substituent (C8H10)
    const thirdAtom = svgCanvas.locator('g.cursor-pointer circle').nth(2);
    await thirdAtom.click();
    await page.waitForTimeout(300);

    // Verify selection pill or prompt is active
    await expect(page.locator('text=Drag or click target atom to connect bond')).toBeVisible();

    // Click canvas to drop connected atom
    await svgCanvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(600);

    // Verify formula updated to C8H10
    await expect(page.locator('text=C8H10')).toBeVisible({ timeout: 5000 });

    // 5. Test Direct Bond Click to cycle order (Single -> Double)
    const bondLine = svgCanvas.locator('line').first();
    await bondLine.click({ force: true });
    await page.waitForTimeout(400);

    // 6. Transfer to main studio
    const transferBtn = page.getByRole('button', { name: /Transfer to Studio/i });
    await transferBtn.click();
    await page.waitForTimeout(400);

    // Verify transferred to studio
    const smilesInput = page.locator('#smiles-input-container input');
    const val = await smilesInput.inputValue();
    expect(val.length).toBeGreaterThan(0);
  });
});
