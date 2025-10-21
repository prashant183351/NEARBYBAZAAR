# Playwright E2E Testing - Quick Reference

## Quick Start

```bash
# 1. Start dev servers
pnpm dev

# 2. Run E2E tests (in another terminal)
pnpm test:e2e
```

## Common Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Interactive UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser window)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug tests/e2e/web.spec.ts

# Run specific project only
npx playwright test --project=web-chromium
npx playwright test --project=vendor-chromium
npx playwright test --project=admin-chromium

# Run specific test file
npx playwright test tests/e2e/web.spec.ts

# Show test report
npx playwright show-report
```

## Test Structure

```
tests/e2e/
├── web.spec.ts      # Customer PWA tests
├── vendor.spec.ts   # Vendor PWA tests
├── admin.spec.ts    # Admin PWA tests
└── fixtures/        # Shared utilities
    └── README.md
```

## Writing Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('should load home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NearbyBazaar/i);
});
```

### With Navigation

```typescript
test('should navigate to products', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/products"]');
  await expect(page).toHaveURL(/.*products/);
});
```

### Form Interaction

```typescript
test('should submit search form', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="search"]', 'electronics');
  await page.click('button[type="submit"]');
  await expect(page.locator('.results')).toBeVisible();
});
```

### Best Practices

1. **Use data-testid for stable selectors:**
   ```typescript
   await page.click('[data-testid="add-to-cart"]');
   ```

2. **Wait for navigation:**
   ```typescript
   await page.click('a[href="/cart"]');
   await page.waitForLoadState('networkidle');
   ```

3. **Check visibility before interaction:**
   ```typescript
   await expect(page.locator('[data-testid="button"]')).toBeVisible();
   await page.click('[data-testid="button"]');
   ```

4. **Group related tests:**
   ```typescript
   test.describe('Product Search', () => {
     test('filters by category', async ({ page }) => { /* ... */ });
     test('sorts by price', async ({ page }) => { /* ... */ });
   });
   ```

## Configuration

**File:** `playwright.config.ts`

- **Timeout:** 30 seconds per test
- **Retries:** 2 in CI, 0 locally
- **Workers:** Parallel locally, serial in CI
- **Browser:** Chromium headless
- **Base URLs:**
  - Web: http://localhost:3001
  - Vendor: http://localhost:3002
  - Admin: http://localhost:3003

## Troubleshooting

### Tests fail with "connection refused"

**Solution:** Start dev servers first with `pnpm dev`

### Browser not found

**Solution:** Install browsers: `npx playwright install chromium`

### Flaky tests

**Solutions:**
- Add explicit waits: `await page.waitForSelector('[data-testid="element"]')`
- Use `waitForLoadState('networkidle')` after navigation
- Increase timeout for slow operations: `test.setTimeout(60000)`

### Debugging

```bash
# Run with browser visible
pnpm test:e2e:headed

# Use debug mode (step through)
pnpm test:e2e:debug

# Enable trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI Integration

**GitHub Actions example:**

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Start servers
  run: pnpm dev &

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## VS Code Extension

Install the [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:
- Run tests from editor
- Debug with breakpoints
- View test results inline
- Generate tests with Codegen

## Resources

- [Playwright Docs](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- Feature Docs: `docs/FEATURE_157_E2E_TESTS.md`
