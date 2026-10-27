import { test, expect } from '@playwright/test';

test.describe('Modern Native Chemical Sketcher Canvas', () => {
  test('Opens modern sketcher, tests clear button, applies ring templates, draws, and transfers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Dismiss welcome modal if open
    const skipBtn = page.getByRole('button', { name: /skip introduction/i });
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }

    // Open sketcher modal
    const sketcherBtn = page.locator('#sketcher-button');
    await expect(sketcherBtn).toBeVisible({ timeout: 10000 });
    await sketcherBtn.click();

    // Verify modal is displayed and modern native canvas is active
    await expect(page.locator('text=Modern 2D Chemical Canvas Studio')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Native Vector Canvas')).toBeVisible();

    // 1. Verify CLEAR CANVAS works 100%
    const clearBtn = page.getByRole('button', { name: /Clear Canvas/i }).first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(400);

    // After clearing, blank canvas overlay should be visible
    await expect(page.locator('text=Blank Blueprint Canvas')).toBeVisible();

    // 2. Add Benzene ring template
    const benzeneBtn = page.getByRole('button', { name: 'Benzene' });
    await expect(benzeneBtn).toBeVisible();
    await benzeneBtn.click();
    await page.waitForTimeout(400);

    // 3. Verify real-time chemical formula & SMILES
    await expect(page.locator('text=c1ccccc1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=C6H6')).toBeVisible({ timeout: 5000 });

    // 4. Test Clear Canvas again to ensure full repeatability
    await clearBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Blank Blueprint Canvas')).toBeVisible();

    // 5. Add Pyridine template and transfer
    const pyridineBtn = page.getByRole('button', { name: 'Pyridine' });
    await expect(pyridineBtn).toBeVisible();
    await pyridineBtn.click();
    await page.waitForTimeout(400);

    // Click "Transfer to Studio"
    const transferBtn = page.getByRole('button', { name: /Transfer to Studio/i });
    await expect(transferBtn).toBeVisible();
    await transferBtn.click();

    // Verify transferred to main studio SMILES input
    await page.waitForTimeout(500);
    const smilesInput = page.locator('#smiles-input-container input');
    const val = await smilesInput.inputValue();
    expect(val).toContain('c1ccncc1');
  });
});
