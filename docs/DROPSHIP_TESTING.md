# Dropshipping Tests Documentation

## Overview

This document describes the comprehensive test suite for the dropshipping module, including unit tests, integration tests, and CI/CD integration.

## Test Coverage

### Test Files

- **`apps/api/tests/dropship.spec.ts`**: Main dropshipping test suite
  - Supplier lifecycle tests
  - SKU mapping logic tests
  - Margin rule calculations
  - Order push to supplier tests
  - Dropship supplier interface tests
  - End-to-end integration tests
  - Error handling and edge cases
  - Performance and scalability tests

### Coverage Targets

The dropshipping module has strict coverage requirements to ensure correct fulfillment:

- **Global Coverage**: 80% lines, 70% branches, 70% functions
- **Dropship Services**: 90% lines, 80% branches, 90% functions

These thresholds are enforced in `apps/api/jest.config.js`.

## Running Tests

### Run All Tests

```bash
# From project root
pnpm --filter @nearbybazaar/api test

# Or from apps/api directory
cd apps/api
pnpm test
```

### Run Dropship Tests Only

```bash
pnpm --filter @nearbybazaar/api test dropship.spec.ts
```

### Run with Coverage

```bash
pnpm --filter @nearbybazaar/api test --coverage
```

### Run in Watch Mode (Development)

```bash
pnpm --filter @nearbybazaar/api test --watch
```

### Run with Verbose Output

```bash
LOG_TESTS=1 pnpm --filter @nearbybazaar/api test
```

## Test Environment Setup

### Prerequisites

1. **MongoDB**: Tests require a MongoDB instance
   - Default: `mongodb://localhost:27017/test-dropship`
   - Override with `MONGO_URL` environment variable

2. **Node.js**: Version 18+ recommended

3. **Dependencies**: Install with `pnpm install`

### Environment Variables

```bash
# Test database URL
MONGO_URL=mongodb://localhost:27017/test-dropship

# Enable test logging
LOG_TESTS=1

# Node environment (automatically set to 'test')
NODE_ENV=test
```

## Test Structure

### Supplier Lifecycle Tests

Tests the complete lifecycle of a supplier from invitation to termination:

- Creating suppliers with default 'invited' status
- Transitioning from invited → pending → active
- Suspending active suppliers
- Terminating suppliers

### SKU Mapping Tests

Validates SKU mapping logic between supplier and platform SKUs:

- Creating mappings
- Unique constraint enforcement (supplier + supplierSku)
- Finding mappings by supplier and SKU
- Bulk mapping creation
- SKU generation using `@nearbybazaar/lib/sku`

### Margin Rule Tests

Tests profit margin calculation logic:

- Percent-based margins (e.g., 20% markup)
- Fixed-amount margins (e.g., $5.99 markup)
- Category-specific rules
- Vendor-specific rules
- Rule priority (category > supplier > vendor)
- Active/inactive rule filtering

### Order Push Tests

Tests order transmission to supplier APIs:

- Successful order push
- Idempotency (preventing duplicate pushes)
- API error handling
- Network timeout handling
- Audit logging via SyncJob
- Proper payload construction

### Integration Tests

End-to-end tests covering complete workflows:

- Map SKU → Apply margin → Push order
- Handle missing SKU mappings
- Select most specific margin rule
- Multi-step fulfillment flows

### Error Handling Tests

Edge cases and error scenarios:

- Missing suppliers
- Invalid margin values
- Concurrent updates
- Supplier status transitions
- Required field validation
- Bulk operations

### Performance Tests

Scalability and performance validation:

- Indexed query performance
- Pagination
- Bulk operations (100+ records)

## Mock Implementations

### Mock Suppliers

Located in `apps/api/tests/__mocks__/suppliers.ts`:

1. **RealisticMockSupplier**: Simulates realistic API behavior
   - Connection management
   - Stock/price sync with delays
   - Configurable inventory and prices

2. **FailingMockSupplier**: Always fails (error testing)
   - Connection failures
   - API errors
   - Network timeouts

3. **SlowMockSupplier**: Slow responses (timeout testing)
   - Configurable delays
   - Timeout simulation

4. **MockSupplierAPI**: Complete API server simulation
   - Order recording
   - Stock/price management
   - Order acceptance/rejection

### Mocked External Dependencies

- **axios**: Mocked for HTTP calls to supplier APIs
- **BullMQ**: Job queue operations (when implemented)
- **Email service**: Notification sending (when implemented)

## CI/CD Integration

### CI Gate Configuration

The dropshipping tests are configured as a **CI gate** due to the critical nature of correct fulfillment.

**GitHub Actions Example** (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run API tests
        run: pnpm --filter @nearbybazaar/api test --coverage
        env:
          MONGO_URL: mongodb://localhost:27017/test-dropship
      
      - name: Check coverage thresholds
        run: pnpm --filter @nearbybazaar/api test --coverage --coverageReporters=text-summary
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
          flags: api
```

### Required Checks

Before merging to main branch:

1. ✅ All dropship tests must pass
2. ✅ Coverage thresholds must be met (90% for dropship services)
3. ✅ No ESLint errors
4. ✅ TypeScript compilation successful

### Preventing Merges

Configure branch protection rules:

```
Required status checks:
- API Tests (dropship.spec.ts)
- Coverage Check (>80% lines)
```

## Test Data Management

### Test Database

- **Database**: `test-dropship` (isolated from production)
- **Cleanup**: Each test suite clears collections in `beforeEach`
- **Isolation**: Tests are independent and can run in parallel

### Fixtures

Test fixtures are created inline using factory functions:

```typescript
// From setup.ts
global.testUtils.createMockSupplier()
global.testUtils.createMockOrder()
```

### Idempotency

Tests handle idempotency to prevent side effects:

- Order push idempotency cache
- Unique constraints on mappings
- Database cleanup between tests

## Debugging Tests

### Run Single Test

```bash
pnpm test -- -t "should push order to supplier API successfully"
```

### Enable Verbose Logging

```bash
LOG_TESTS=1 pnpm test
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest: Dropship Tests",
  "program": "${workspaceFolder}/apps/api/node_modules/.bin/jest",
  "args": [
    "dropship.spec.ts",
    "--runInBand",
    "--no-cache"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "env": {
    "LOG_TESTS": "1"
  }
}
```

## Common Issues

### MongoDB Connection Errors

**Problem**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**: Ensure MongoDB is running:
```bash
# Start MongoDB locally
mongod --dbpath ./data/db

# Or use Docker
docker run -d -p 27017:27017 mongo:7
```

### Timeout Errors

**Problem**: Tests timeout after 5 seconds

**Solution**: Tests have 30s timeout (configured in `setup.ts`). Check for:
- Slow network operations
- Missing await keywords
- Infinite loops

### Coverage Not Met

**Problem**: Coverage below thresholds

**Solution**: 
1. Check which files are not covered: `pnpm test --coverage`
2. Add tests for uncovered branches
3. Ensure critical paths (order push, margin calc) have 100% coverage

## Best Practices

1. **Isolation**: Each test is independent (use `beforeEach` cleanup)
2. **Mocking**: Mock external APIs (axios, supplier APIs)
3. **Assertions**: Use specific assertions (`toBe`, `toEqual`, not just `toBeTruthy`)
4. **Error Testing**: Test both success and failure paths
5. **Performance**: Keep tests fast (<100ms per test when possible)
6. **Documentation**: Comment complex test scenarios

## Future Enhancements

- [ ] Add E2E tests with real supplier sandbox APIs
- [ ] Add load testing for bulk operations (1000+ SKUs)
- [ ] Add mutation testing (Stryker.js)
- [ ] Add API contract testing (Pact)
- [ ] Add visual regression tests for vendor UI
- [ ] Add chaos engineering tests (random failures)

## Related Documentation

- [Dropshipping API Reference](./DROPSHIP_API.md)
- [Dropshipping API Summary](./DROPSHIP_API_SUMMARY.md)
- [General Testing Guidelines](./TESTING.md) (if exists)

## Contact

For questions about dropshipping tests, consult:
- Technical Lead: Dropship module owner
- CI/CD Team: For pipeline integration issues
- QA Team: For test strategy discussions
