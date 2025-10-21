# E2E Test Fixtures

This directory can hold test fixtures, utilities, and shared setup for Playwright tests.

## Example Usage

```typescript
// tests/e2e/fixtures/test-data.ts
export const sampleProduct = {
  name: 'Test Product',
  slug: 'test-product',
  price: 999,
};

export const sampleVendor = {
  name: 'Test Vendor',
  slug: 'test-vendor',
};
```

## Authentication Helpers

If implementing auth flows, create helper functions here:

```typescript
// tests/e2e/fixtures/auth.ts
import { Page } from '@playwright/test';

export async function loginAsVendor(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}
```
