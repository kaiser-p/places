import { test, expect, Page } from '@playwright/test';

async function waitForMapReady(page: Page) {
  await page.evaluate(async () => {
    const map = (window as any).map;
    if (!map) return;
    if (map.isStyleLoaded()) return;
    return new Promise(resolve => {
      map.once('idle', resolve);
    });
  });
}

test.describe('Places Map Mockup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForMapReady(page);
  });

  test('should display the map and the highlighting layer', async ({ page }) => {
    await expect(page.locator('.map-container')).toBeVisible();
    
    const layerExists = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return false;
      return !!map.getLayer('visited-countries-highlight');
    });
    
    expect(layerExists).toBe(true);
  });

  test('should render city and landmark markers', async ({ page }) => {
    const cityMarkers = page.locator('.city-marker');
    const landmarkMarkers = page.locator('.landmark-marker');
    // We updated to 8 cities recently
    await expect(cityMarkers).toHaveCount(8);
    await expect(landmarkMarkers).toHaveCount(6);
  });

  test('should show popups on marker click', async ({ page }) => {
    const firstCity = page.locator('.city-marker').first();
    await firstCity.click();
    // Be specific to the popup to avoid finding the sidebar entry
    await expect(page.locator('.maplibregl-popup-content').getByText('Paris')).toBeVisible();
  });

  test('should toggle homogenous mode and merge geometries', async ({ page }) => {
    // Check initial state
    const initialFeatureCount = await page.evaluate(() => {
      const map = (window as any).map;
      const source = map.getSource('visited-countries-geo');
      if (!source) return 0;
      // Use serialize() to get the current data in MapLibre
      const data = (source as any).serialize().data;
      return data.features.length;
    });
    // Several countries visited
    expect(initialFeatureCount).toBeGreaterThan(1);

    // Open user menu to access settings
    await page.locator('button').filter({ has: page.locator('svg.lucide-user') }).click();

    // Click the toggle button
    await page.getByText('Homogenous mode').click();

    // Wait for the source to update
    await page.waitForTimeout(1500);

    // Check homogenous state
    const homogenousFeatureCount = await page.evaluate(() => {
      const map = (window as any).map;
      const source = map.getSource('visited-countries-geo');
      if (!source) return 0;
      const data = (source as any).serialize().data;
      return data.features.length;
    });
    // In homogenous mode, all countries (even disconnected ones) should be in 1 MultiPolygon feature
    expect(homogenousFeatureCount).toBe(1);
  });
});
