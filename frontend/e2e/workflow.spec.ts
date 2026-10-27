import { test, expect } from '@playwright/test';

test.describe('BioGraph AI End-to-End Discovery Workflow', () => {
  test('First-time visitor experience: tour, prediction, explain attribution, batch CSV export', async ({ page }) => {
    // 1. Visit root with clean storage
    await page.goto('/');

    // 2. Welcome Modal check
    const welcomeTitle = page.locator('text=Welcome to BioGraph AI');
    await expect(welcomeTitle).toBeVisible({ timeout: 15000 });

    // Click "Start Guided Tour"
    const startTourBtn = page.getByRole('button', { name: /start guided tour/i });
    await expect(startTourBtn).toBeVisible();
    await startTourBtn.click();

    // Tour overlay should start; close by pressing Escape
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 3. Verify Predict page content & consensus predictions
    // Predictions run automatically on mount for default Aspirin preset
    await expect(page.locator('text=Predict molecular properties').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Ensemble Consensus Inference').first()).toBeVisible();
    await expect(page.locator('text=Model consensus breakdown').first()).toBeVisible();

    // 4. Navigate to Pharmacophore Attribution (GNNExplainer)
    await page.goto('/explain');
    await expect(page.locator('text=GNNExplainer').first()).toBeVisible({ timeout: 10000 });

    // Click "Run GNNExplainer"
    const runExplainerBtn = page.getByRole('button', { name: /Run GNNExplainer/i });
    await expect(runExplainerBtn).toBeVisible();
    await runExplainerBtn.click();

    // Verify explanation results (SVG highlight and Atom Importance table)
    await expect(page.locator('text=Salient Sub-Graph Highlight')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Atom-Level Attribution Weights')).toBeVisible();

    // 5. Navigate to High-Throughput Batch Screening
    await page.goto('/batch');
    await expect(page.locator('text=High-Throughput Batch Screening')).toBeVisible({ timeout: 10000 });

    // Click "Run Batch Screen"
    const runBatchBtn = page.getByRole('button', { name: /Run Batch Screen/i });
    await expect(runBatchBtn).toBeVisible();
    await runBatchBtn.click();

    // Wait for results table to populate
    await expect(page.locator('text=Showing').first()).toBeVisible({ timeout: 30000 });

    // Click "Export CSV" and verify download
    const exportCsvBtn = page.getByRole('button', { name: /Export CSV/i });
    await expect(exportCsvBtn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      exportCsvBtn.click(),
    ]);

    expect(download.suggestedFilename()).toContain('.csv');
  });
});
