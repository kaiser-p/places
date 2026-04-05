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

  test('should verify the highlighting filter contains visited country codes (A3)', async ({ page }) => {
    const filter = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return null;
      return map.getFilter('visited-countries-highlight');
    });

    // Filter is ['in', ['get', 'ISO_A3'], ['literal', ['FRA', 'JPN', 'USA', 'DEU', 'GBR', 'ITA']]]
    const countryCodes = (filter as any)[2][1];
    expect(countryCodes).toContain('DEU');
    expect(countryCodes).toContain('FRA');
    expect(countryCodes).toContain('USA');
    expect(countryCodes).toContain('JPN');
  });

  test('should render city and landmark markers', async ({ page }) => {
    const cityMarkers = page.locator('.city-marker');
    const landmarkMarkers = page.locator('.landmark-marker');
    await expect(cityMarkers).toHaveCount(6);
    await expect(landmarkMarkers).toHaveCount(6);
  });

  test('should show popups on marker click', async ({ page }) => {
    const firstCity = page.locator('.city-marker').first();
    await firstCity.click();
    await expect(page.getByText('Paris')).toBeVisible();
  });
});
