# Dropshipping Tests - Quick Start Checklist

## ✅ Pre-Merge Checklist

Before merging any PR that touches dropshipping code:

- [ ] Run `pnpm --filter @nearbybazaar/api test dropship.spec.ts`
- [ ] Verify all 37 tests pass
- [ ] Run `pnpm --filter @nearbybazaar/api test --coverage`
- [ ] Verify coverage ≥90% for `src/services/dropship/`
- [ ] Verify coverage ≥80% for global API code
- [ ] No TypeScript errors: `pnpm --filter @nearbybazaar/api type-check`
- [ ] No linting errors: `pnpm --filter @nearbybazaar/api lint`

## 🚀 Quick Start

### 1. First Time Setup

```bash
# Start MongoDB (required for tests)
docker run -d -p 27017:27017 --name test-mongo mongo:7

# Or use local MongoDB
mongod --dbpath ./data/db

# Install dependencies
pnpm install
```

### 2. Run Tests

```bash
# All tests
pnpm --filter @nearbybazaar/api test

# Dropship tests only
pnpm --filter @nearbybazaar/api test dropship.spec.ts

# Watch mode (development)
pnpm --filter @nearbybazaar/api test --watch

# With coverage
pnpm --filter @nearbybazaar/api test --coverage
```

### 3. Debug Failing Tests

```bash
# Run single test
pnpm test -- -t "should push order to supplier API successfully"

# Enable verbose logging
LOG_TESTS=1 pnpm test dropship.spec.ts

# Run with debugger (VS Code)
# Use the "Jest: Dropship Tests" launch configuration
```

## 📊 Coverage Requirements

| Area | Lines | Branches | Functions | Statements |
|------|-------|----------|-----------|------------|
| **Global API** | 80% | 70% | 70% | 80% |
| **Dropship Services** | 90% | 80% | 90% | 90% |

## 🧪 Test Categories

- **Supplier Lifecycle** (3 tests): Invitation, approval, suspension
- **SKU Mapping** (6 tests): Create, update, unique constraints
- **Margin Rules** (6 tests): Percent/fixed margins, priority
- **Order Push** (5 tests): Success, errors, idempotency
- **Supplier Interface** (5 tests): Connect, sync, disconnect
- **Integration** (3 tests): End-to-end workflows
- **Error Handling** (6 tests): Edge cases, validation
- **Performance** (2 tests): Indexing, pagination

**Total: 37 tests**

## 🔧 Common Issues

### MongoDB Connection Error

```
MongooseServerSelectionError: connect ECONNREFUSED
```

**Fix**: Start MongoDB
```bash
docker start test-mongo
# or
mongod --dbpath ./data/db
```

### Test Timeout

```
Timeout - Async callback was not invoked within 30000ms
```

**Fix**: Check for missing `await` or infinite loops

### Coverage Below Threshold

```
Jest: "global" coverage threshold for lines (80%) not met: 75%
```

**Fix**: Add tests for uncovered code paths
```bash
# See what's not covered
pnpm test --coverage --verbose
```

## 📚 Documentation

- **Comprehensive Guide**: `docs/DROPSHIP_TESTING.md`
- **Implementation Summary**: `docs/DROPSHIP_TESTING_SUMMARY.md`
- **API Reference**: `docs/DROPSHIP_API.md`

## 🚨 CI Gate

**WARNING**: This is a critical CI gate. PRs will be **automatically rejected** if:

- ❌ Any dropship test fails
- ❌ Coverage below 90% for dropship services
- ❌ Coverage below 80% globally
- ❌ TypeScript errors exist
- ❌ Linting errors exist

## 💡 Writing New Tests

### Test Template

```typescript
describe('New Feature', () => {
    let testData: any;

    beforeEach(async () => {
        // Setup test data
        testData = await Model.create({...});
    });

    it('should do something', async () => {
        // Arrange
        const input = {...};
        
        // Act
        const result = await functionUnderTest(input);
        
        // Assert
        expect(result).toBeDefined();
        expect(result.property).toBe(expectedValue);
    });
});
```

### Mock External API

```typescript
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// In test:
mockedAxios.post.mockResolvedValueOnce({
    status: 200,
    data: { success: true }
});
```

### Use Test Utilities

```typescript
// Random ObjectId
const id = global.testUtils.randomObjectId();

// Mock supplier
const supplier = global.testUtils.createMockSupplier();

// Mock order
const order = global.testUtils.createMockOrder({ total: 99.99 });

// Wait for async operation
await global.testUtils.wait(1000);
```

## 🎯 Success Criteria

✅ All 37 tests passing
✅ 90%+ coverage on dropship services
✅ 80%+ coverage globally
✅ No TypeScript/lint errors
✅ Tests run in <30 seconds
✅ CI pipeline green

## 🔗 Quick Links

- **Run Tests**: `pnpm --filter @nearbybazaar/api test dropship.spec.ts`
- **Coverage Report**: `pnpm --filter @nearbybazaar/api test --coverage`
- **CI Workflow**: `.github/workflows/api-tests-example.yml`
- **Mock Suppliers**: `apps/api/tests/__mocks__/suppliers.ts`
- **Test Setup**: `apps/api/tests/setup.ts`

---

**Remember**: These tests protect against costly fulfillment errors. Don't skip them!
