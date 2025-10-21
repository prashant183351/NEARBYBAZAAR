# NearbyBazaar Test Suite

This directory contains all automated tests for the NearbyBazaar platform.

## Test Structure

```
tests/
└── e2e/                    # End-to-end tests (Playwright)
    ├── web.spec.ts         # Customer PWA tests
    ├── vendor.spec.ts      # Vendor PWA tests
    ├── admin.spec.ts       # Admin PWA tests
    └── fixtures/           # Shared test utilities
```

## Test Types

### Unit & Integration Tests (Jest)

Located within each package:
- `apps/api/tests/` - API unit and integration tests
- `packages/lib/__tests__/` - Library utility tests
- `apps/web/tests/` - Web component tests (future)

**Run:**
```bash
pnpm test                    # All unit tests
pnpm --filter @nearbybazaar/api test    # API tests only
pnpm --filter @nearbybazaar/lib test    # Lib tests only
```

### End-to-End Tests (Playwright)

Located in `tests/e2e/` - Cross-application integration tests.

**Run:**
```bash
# Requires dev servers running first
pnpm dev                     # Terminal 1
pnpm test:e2e               # Terminal 2

# Or with UI
pnpm test:e2e:ui            # Interactive mode
```

## Quick Start

### Running All Tests

```bash
# Unit/integration tests (fast)
pnpm test

# E2E tests (requires servers)
pnpm dev                    # Start servers
pnpm test:e2e              # Run E2E in another terminal
```

### Running Specific Tests

```bash
# Unit tests for specific package
pnpm --filter @nearbybazaar/lib test

# Specific E2E test file
npx playwright test tests/e2e/web.spec.ts

# Specific E2E project
npx playwright test --project=web-chromium
```

## Test Guidelines

### Unit Tests
- Fast and isolated
- No external dependencies
- Mock external services
- Focus on single function/component

### Integration Tests
- Test interaction between modules
- May use in-memory database
- Test API endpoints
- Verify data flows

### E2E Tests
- Test complete user flows
- Use real browser (Chromium)
- Test across applications
- Verify production-like behavior

## Writing Tests

### Jest (Unit/Integration)

```typescript
// apps/api/tests/myFeature.spec.ts
import { myFunction } from '../src/myFeature';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Playwright (E2E)

```typescript
// tests/e2e/myFlow.spec.ts
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="button"]');
  await expect(page).toHaveURL(/success/);
});
```

## Test Coverage

Check coverage reports:

```bash
# Generate coverage for all tests
pnpm test

# Open coverage report
# Browse to coverage/lcov-report/index.html
```

## CI/CD

Tests run automatically on:
- Pull requests
- Main branch commits
- Before deployments

**CI Commands:**
```bash
pnpm test:ci               # Unit tests (serial, with coverage)
pnpm test:e2e             # E2E tests (requires server setup)
```

## Troubleshooting

### Tests fail locally but pass in CI
- Check Node version matches CI
- Ensure dependencies are up to date: `pnpm install`
- Clear caches: `pnpm clean && pnpm install`

### E2E tests timeout
- Verify dev servers are running: `pnpm dev`
- Check ports are not in use
- Increase timeout in `playwright.config.ts`

### Database tests fail
- Check MongoDB is running
- Verify `.env` has correct `MONGODB_URI`
- Ensure test database is clean

## Best Practices

1. **Keep tests fast**: Unit tests < 100ms, E2E tests < 30s
2. **Test behavior, not implementation**: Focus on user-facing outcomes
3. **Use descriptive names**: Test names should explain what they verify
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Independent tests**: Each test should work in isolation
6. **Data-testid attributes**: Use for reliable E2E selectors
7. **Mock external services**: Don't hit production APIs in tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- Internal: `DEV.md` - Testing section
- Internal: `docs/FEATURE_157_E2E_TESTS.md`

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for API endpoints
3. Add E2E tests for new user flows
4. Ensure all tests pass before PR

## Status

- ✅ Jest setup complete (Feature #156)
- ✅ Playwright setup complete (Feature #157)
- ⏳ Additional test coverage ongoing
