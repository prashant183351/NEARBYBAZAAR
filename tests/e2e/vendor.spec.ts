/**
 * E2E Smoke Tests for Vendor PWA
 * Feature #157: Playwright Smoke Tests
 * 
 * Tests basic navigation and vendor-specific flows:
 * - Home/dashboard page loads
 * - Navigation to plan/product management pages (if exists)
 * - Basic UI elements visible
 */

import { test, expect } from '@playwright/test';

test.describe('Vendor PWA - Basic Navigation', () => {
  test('should load vendor home/dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check that the vendor app loads
    await expect(page).toHaveTitle(/Vendor|Dashboard|NearbyBazaar/i);
    
    // Verify main content
    const mainContent = page.locator('main, #__next, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to plan page', async ({ page }) => {
    await page.goto('/plan');
    
    // Should show plan selection or current plan info
    const planContent = page.locator('text=/plan|subscription|upgrade/i, [data-testid="plan"]').first();
    await expect(planContent).toBeVisible();
  });

  test('should have navbar with key links', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements (adjust selectors based on your navbar)
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Common vendor links (adjust as needed)
    const hasProducts = await page.locator('text=/products|inventory/i').isVisible().catch(() => false);
    const hasDashboard = await page.locator('text=/dashboard|home/i').isVisible().catch(() => false);
    
    // At least some navigation should be present
    expect(hasProducts || hasDashboard).toBeTruthy();
  });
});

test.describe('Vendor PWA - SEO & Metadata', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
  });

  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });
});
