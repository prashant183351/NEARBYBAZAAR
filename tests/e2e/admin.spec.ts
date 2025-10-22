/**
 * E2E Smoke Tests for Admin PWA
 * Feature #157: Playwright Smoke Tests
 *
 * Tests basic navigation and admin-specific flows:
 * - Dashboard loads
 * - Navigation to users/orders/reports pages (if exists)
 * - Basic UI elements visible
 */

import { test, expect } from '@playwright/test';

test.describe('Admin PWA - Basic Navigation', () => {
  test('should load admin dashboard', async ({ page }) => {
    await page.goto('/');

    // Check that the admin app loads
    await expect(page).toHaveTitle(/Admin|Dashboard|NearbyBazaar/i);

    // Verify main content
    const mainContent = page.locator('main, #__next, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to users page', async ({ page }) => {
    await page.goto('/users');

    // Should show users list or management UI
    const usersContent = page.locator('text=/users|manage/i, [data-testid="users"]').first();
    await expect(usersContent).toBeVisible();
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/orders');

    // Should show orders list or management UI
    const ordersContent = page
      .locator('text=/orders|transactions/i, [data-testid="orders"]')
      .first();
    await expect(ordersContent).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"], aside').first();
    await expect(nav).toBeVisible();

    // Common admin links
    const hasUsers = await page
      .locator('text=/users/i')
      .isVisible()
      .catch(() => false);
    const hasOrders = await page
      .locator('text=/orders/i')
      .isVisible()
      .catch(() => false);
    const hasReports = await page
      .locator('text=/reports/i')
      .isVisible()
      .catch(() => false);

    // At least some navigation should be present
    expect(hasUsers || hasOrders || hasReports).toBeTruthy();
  });
});

test.describe('Admin PWA - SEO & Metadata', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
  });
});
