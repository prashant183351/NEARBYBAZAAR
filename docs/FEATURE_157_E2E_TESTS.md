# Feature #157: Playwright E2E Smoke Tests

**Status:** ✅ Implemented (October 20, 2025)

## Overview

Playwright end-to-end smoke tests for the NearbyBazaar PWAs (web, vendor, admin). Tests verify critical user flows and catch integration issues before production.

## Implementation

### Configuration

**File:** `playwright.config.ts`

- **Projects:** Separate test projects for web, vendor, and admin PWAs
- **Browser:** Chromium (headless by default)
- **Ports:**
  - Web: `http://localhost:3001`
  - Vendor: `http://localhost:3002`
  - Admin: `http://localhost:3003`
- **CI Settings:**
  - Retries: 2 in CI, 0 locally
  - Workers: 1 in CI (serial), parallel locally
  - Reporter: GitHub Actions format in CI, HTML locally

### Test Suites

**Location:** `tests/e2e/`

1. **web.spec.ts** - Customer PWA
   - Home page loads
   - Search functionality
   - Product/service/store page routes
   - Cart navigation
   - SEO meta tags and PWA manifest

2. **vendor.spec.ts** - Vendor PWA
   - Dashboard loads
   - Plan page navigation
   - Navbar presence
   - SEO meta tags and PWA manifest

3. **admin.spec.ts** - Admin PWA
   - Dashboard loads
   - Users/orders page navigation
   - Navigation menu presence
   - SEO meta tags

### Test Utilities

**Location:** `tests/e2e/fixtures/`

- Placeholder for shared test data
- Authentication helpers (for future implementation)
- Reusable page object models

### Scripts

**Root package.json:**

```bash
# Run E2E tests (requires servers running)
pnpm test:e2e

# Interactive UI mode
pnpm test:e2e:ui

# Headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug
```

**Pre-test Check:** `scripts/check-servers.js`

- Verifies dev servers are running before tests
- Provides helpful error messages if servers aren't up
- Exits with code 1 if any server is unreachable

## Usage

### Local Development

1. **Start dev servers:**

   ```bash
   pnpm dev
   ```

2. **Run E2E tests:**

   ```bash
   pnpm test:e2e
   ```

3. **Debug a specific test:**
   ```bash
   pnpm test:e2e:debug tests/e2e/web.spec.ts
   ```

### CI/CD Integration

**GitHub Actions workflow** (to be added):

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Start dev servers
  run: pnpm dev &

- name: Wait for servers
  run: npx wait-on http://localhost:3001 http://localhost:3002 http://localhost:3003

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Guidelines

### Writing Tests

1. **Use descriptive names:**

   ```typescript
   test('should display product details when navigating to product page', async ({ page }) => {
     // ...
   });
   ```

2. **Keep tests independent:**
   - Each test should work in isolation
   - Don't rely on state from previous tests
   - Use `beforeEach` for common setup

3. **Use reliable selectors:**
   - Prefer `data-testid` attributes
   - Avoid fragile CSS selectors
   - Use text content as fallback

4. **Handle async properly:**
   - Always `await` page interactions
   - Use `page.waitForLoadState()` when needed
   - Set reasonable timeouts

5. **Test user flows, not implementation:**
   - Focus on what users see and do
   - Don't test internal state
   - Verify visible outcomes

### Best Practices

- **Arrange-Act-Assert pattern:**

  ```typescript
  test('example', async ({ page }) => {
    // Arrange
    await page.goto('/products');

    // Act
    await page.click('[data-testid="filter-electronics"]');

    // Assert
    await expect(page.locator('.product-card')).toHaveCount(5);
  });
  ```

- **Group related tests:**

  ```typescript
  test.describe('Product Search', () => {
    test('filters by category', async ({ page }) => {
      /* ... */
    });
    test('sorts by price', async ({ page }) => {
      /* ... */
    });
  });
  ```

- **Use page object pattern for complex flows:**
  ```typescript
  // tests/e2e/fixtures/pages/product.page.ts
  export class ProductPage {
    constructor(private page: Page) {}

    async addToCart() {
      await this.page.click('[data-testid="add-to-cart"]');
    }

    async getPrice() {
      return this.page.locator('[data-testid="price"]').textContent();
    }
  }
  ```

## Coverage

### Current Test Coverage

- ✅ Home page loads (all PWAs)
- ✅ Basic navigation (all PWAs)
- ✅ Route handling (product, service, store, cart)
- ✅ SEO meta tags validation
- ✅ PWA manifest presence
- ⏳ Authentication flows (to be added)
- ⏳ Form submissions (to be added)
- ⏳ Purchase flows (to be added)

### Planned Additions

1. **Authentication:**
   - Login/logout flows
   - Session persistence
   - Role-based access

2. **E-commerce flows:**
   - Add to cart → Checkout → Order
   - Vendor product upload
   - Admin order management

3. **Mobile viewports:**
   - Test PWA behavior on mobile devices
   - Touch interactions
   - Responsive layouts

## Performance

- **Test duration:** ~30 seconds for all suites (with servers running)
- **Parallelization:** 3 projects run in parallel locally
- **CI optimization:** Serial execution to reduce resource usage
- **Retries:** Automatic retry on flaky tests in CI

## Troubleshooting

### Tests timeout

**Issue:** Tests hang or timeout waiting for page load.

**Solution:**

- Verify dev servers are running and accessible
- Check network tab in headed mode
- Increase timeout in `playwright.config.ts`
- Use `--timeout=60000` flag for individual runs

### Flaky tests

**Issue:** Tests pass/fail inconsistently.

**Solution:**

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use more specific selectors
- Enable retries in config
- Run with `--repeat-each=10` to identify flakes

### Browser not found

**Issue:** `browserType.launch: Executable doesn't exist`

**Solution:**

```bash
npx playwright install chromium
```

### Selectors not found

**Issue:** `Error: locator.click: Target closed`

**Solution:**

- Use `page.waitForSelector('[data-testid="button"]')` before clicking
- Check if element is in viewport: `await element.scrollIntoViewIfNeeded()`
- Verify selector matches actual DOM

## Dependencies

- `@playwright/test`: ^1.56.1
- Chromium browser (auto-downloaded)

## Documentation

- [Playwright Official Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

## Related Features

- Feature #156: Jest Setup (unit/integration tests)
- Feature #301: CI/CD Pipeline (automated test runs)
- Feature #312: E2E Security Testing (extended)

## Notes

- Tests assume dev servers are pre-started (manual or via CI)
- Commented out `webServer` config in `playwright.config.ts` for faster local runs
- Can uncomment for automated server startup if preferred
- Screenshots and traces captured on failure (check `test-results/` and `playwright-report/`)
