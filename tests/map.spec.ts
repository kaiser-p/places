import { test, expect } from '@playwright/test';

test.describe('Places Map Mockup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
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
    await expect(page.getByText('Paris')).toBeVisible();
  });

  test('should toggle homogenous mode and merge geometries', async ({ page }) => {
    // Check initial state
    const initialFeatureCount = await page.evaluate(() => {
      const map = (window as any).map;
      const source = map.getSource('visited-countries-geo');
      // Use serialize() to get the current data in MapLibre
      const data = source.serialize().data;
      return data.features.length;
    });
    // Several countries visited
    expect(initialFeatureCount).toBeGreaterThan(1);

    // Click the toggle (using the label or div)
    await page.click('text=Homogenous mode');

    // Wait a brief moment for the useEffect/setData to process
    await page.waitForTimeout(500);

    // Check homogenous state
    const homogenousFeatureCount = await page.evaluate(() => {
      const map = (window as any).map;
      const source = map.getSource('visited-countries-geo');
      const data = source.serialize().data;
      return data.features.length;
    });
    // In homogenous mode, all countries (even disconnected ones) should be in 1 MultiPolygon feature
    expect(homogenousFeatureCount).toBe(1);
  });
});
