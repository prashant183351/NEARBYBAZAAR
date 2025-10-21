/**
 * E2E Smoke Tests for Web (Customer) PWA
 * Feature #157: Playwright Smoke Tests
 * 
 * Tests basic navigation and critical user flows:
 * - Home page loads
 * - Navigation to product/service/store pages
 * - Search functionality
 * - Cart basics (if implemented)
 */

import { test, expect } from '@playwright/test';

test.describe('Web PWA - Basic Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title or main heading exists
    await expect(page).toHaveTitle(/NearbyBazaar|Home/i);
    
    // Verify main content is visible (adjust selector based on your app)
    const mainContent = page.locator('main, #__next, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input or link
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
    }
    
    // Navigate directly if search is a route
    await page.goto('/search');
    await expect(page).toHaveURL(/.*search.*/);
    
    // Verify search UI elements
    const searchBar = page.locator('input[type="search"], [role="searchbox"]').first();
    await expect(searchBar).toBeVisible();
  });

  test('should handle product page route (stub)', async ({ page }) => {
    // Navigate to a sample product slug (adjust based on seeded data)
    // This will 404 if no products exist, so we just check it doesn't crash
    await page.goto('/p/sample-product');
    
    // Should either show product content or a not-found message
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // If 404, ensure error handling is graceful
    const notFound = page.locator('text=/not found|404/i');
    const productContent = page.locator('[data-testid="product-detail"], h1');
    
    // At least one should be visible
    const hasContent = await productContent.isVisible().catch(() => false);
    const has404 = await notFound.isVisible().catch(() => false);
    expect(hasContent || has404).toBeTruthy();
  });

  test('should handle store page route (stub)', async ({ page }) => {
    await page.goto('/store/sample-vendor');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for store content or 404
    const notFound = page.locator('text=/not found|404/i');
    const storeContent = page.locator('[data-testid="store-header"], h1');
    
    const hasContent = await storeContent.isVisible().catch(() => false);
    const has404 = await notFound.isVisible().catch(() => false);
    expect(hasContent || has404).toBeTruthy();
  });
});

test.describe('Web PWA - Cart Flow (if implemented)', () => {
  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/cart');
    
    // Should show empty cart or cart items
    const cartPage = page.locator('text=/cart|shopping/i, [data-testid="cart"]').first();
    await expect(cartPage).toBeVisible();
  });
});

test.describe('Web PWA - SEO & Metadata', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential meta tags
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
    
    // Check for Open Graph tags (basic)
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
  });

  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest link
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });
});
