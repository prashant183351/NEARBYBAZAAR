# Dropshipping Test Best Practices

## Core Principles

### 1. **Test Independence**
Each test should be completely independent and able to run in any order.

✅ **Good**:
```typescript
beforeEach(async () => {
    await Supplier.deleteMany({});
    await SkuMapping.deleteMany({});
    testSupplier = await Supplier.create({...});
});
```

❌ **Bad**:
```typescript
// Tests depend on execution order
let sharedSupplier; // Shared across tests
it('test 1', () => { sharedSupplier = ... });
it('test 2', () => { /* uses sharedSupplier */ });
```

### 2. **Clear Test Names**
Test names should describe what is being tested and the expected outcome.

✅ **Good**:
```typescript
it('should prevent duplicate order pushes with idempotency', async () => {
```

❌ **Bad**:
```typescript
it('test order push', async () => {
```

### 3. **Arrange-Act-Assert (AAA) Pattern**
Structure tests with clear sections:

```typescript
it('should calculate selling price with percent margin', async () => {
    // Arrange: Set up test data
    const rule = await MarginRule.create({
        marginType: 'percent',
        value: 25,
    });
    const supplierCost = 100;
    
    // Act: Perform the operation
    const sellingPrice = supplierCost * (1 + rule.value / 100);
    
    // Assert: Verify the result
    expect(sellingPrice).toBe(125);
});
```

### 4. **Test Both Success and Failure**
Every operation should have both happy path and error path tests.

✅ **Good**:
```typescript
it('should push order to supplier API successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });
    const result = await pushOrderToSupplier(order, supplier);
    expect(result.status).toBe('success');
});

it('should handle supplier API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'));
    const result = await pushOrderToSupplier(order, supplier);
    expect(result.status).toBe('failed');
});
```

### 5. **Mock External Dependencies**
Never make real HTTP calls, database connections to production, or other external calls.

✅ **Good**:
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.post.mockResolvedValueOnce({...});
```

❌ **Bad**:
```typescript
// Real HTTP call to supplier API
await axios.post('https://real-supplier.com/api/orders', {...});
```

## Specific Patterns for Dropshipping

### Testing Idempotency

Critical for order pushes to prevent duplicate fulfillment:

```typescript
it('should prevent duplicate order pushes with idempotency', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });
    
    // First push
    const result1 = await pushOrderToSupplier(order, supplier);
    expect(result1.status).toBe('success');
    
    // Second push with same order - should be deduplicated
    const result2 = await pushOrderToSupplier(order, supplier);
    expect(result2.status).toBe('duplicate');
    
    // Verify API was only called once
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
});
```

### Testing Margin Calculations

Verify pricing logic with various margin types:

```typescript
it('should calculate selling price with percent margin', async () => {
    const rule = await MarginRule.create({
        marginType: 'percent',
        value: 25, // 25% margin
    });
    
    const supplierCost = 100;
    const sellingPrice = supplierCost * (1 + rule.value / 100);
    
    expect(sellingPrice).toBe(125);
});

it('should calculate selling price with fixed margin', async () => {
    const rule = await MarginRule.create({
        marginType: 'fixed',
        value: 10, // $10 fixed margin
    });
    
    const supplierCost = 50;
    const sellingPrice = supplierCost + rule.value;
    
    expect(sellingPrice).toBe(60);
});
```

### Testing SKU Mappings

Ensure uniqueness and proper querying:

```typescript
it('should enforce unique constraint on supplier + supplierSku', async () => {
    await SkuMapping.create({
        supplierId: supplier._id,
        supplierSku: 'SUP-001',
        ourSku: 'NB-001',
    });
    
    // Duplicate mapping should fail
    await expect(
        SkuMapping.create({
            supplierId: supplier._id,
            supplierSku: 'SUP-001', // Same supplier + SKU
            ourSku: 'NB-002',
        })
    ).rejects.toThrow();
});
```

### Testing Supplier Lifecycles

Verify state transitions:

```typescript
it('should transition supplier from invited to active', async () => {
    const supplier = await Supplier.create({
        companyName: 'Test Supplier',
        status: 'invited',
    });
    
    expect(supplier.status).toBe('invited');
    expect(supplier.approvedAt).toBeUndefined();
    
    // Approve supplier
    supplier.status = 'active';
    supplier.approvedAt = new Date();
    await supplier.save();
    
    expect(supplier.status).toBe('active');
    expect(supplier.approvedAt).toBeDefined();
});
```

### Testing Integration Flows

End-to-end scenarios:

```typescript
it('should map SKU, apply margin, and prepare order for supplier', async () => {
    // 1. Create SKU mapping
    const mapping = await SkuMapping.create({
        supplierId: supplier._id,
        supplierSku: 'SUP-WIDGET',
        ourSku: 'NB-WIDGET',
    });
    
    // 2. Create margin rule
    const marginRule = await MarginRule.create({
        vendorId: vendor._id,
        supplierId: supplier._id,
        marginType: 'percent',
        value: 30,
    });
    
    // 3. Calculate price with margin
    const supplierCost = 50;
    const sellingPrice = supplierCost * (1 + marginRule.value / 100);
    
    // 4. Prepare and push order
    const order = {
        items: [{
            sku: mapping.ourSku,
            supplierSku: mapping.supplierSku,
            price: sellingPrice,
        }],
    };
    
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });
    const result = await pushOrderToSupplier(order, supplier);
    
    // Verify complete flow
    expect(sellingPrice).toBe(65); // 50 + 30%
    expect(result.status).toBe('success');
});
```

## Performance Testing

### Test with Realistic Data Volumes

```typescript
it('should efficiently query mappings with index', async () => {
    // Create 100 mappings
    const mappings = Array.from({ length: 100 }, (_, i) => ({
        supplierId: supplier._id,
        supplierSku: `SUP-${i}`,
        ourSku: `NB-${i}`,
    }));
    await SkuMapping.insertMany(mappings);
    
    // Query should be fast with index
    const startTime = Date.now();
    const found = await SkuMapping.findOne({
        supplierId: supplier._id,
        supplierSku: 'SUP-50',
    });
    const queryTime = Date.now() - startTime;
    
    expect(found).toBeDefined();
    expect(queryTime).toBeLessThan(100); // <100ms
});
```

### Test Pagination

```typescript
it('should handle pagination of margin rules', async () => {
    // Create 25 rules
    const rules = Array.from({ length: 25 }, (_, i) => ({
        vendorId: vendor._id,
        category: `category-${i}`,
        marginType: 'percent',
        value: 10 + i,
    }));
    await MarginRule.insertMany(rules);
    
    // Paginate: page 1
    const page1 = await MarginRule.find({ vendorId: vendor._id })
        .limit(10)
        .skip(0);
    
    // Paginate: page 2
    const page2 = await MarginRule.find({ vendorId: vendor._id })
        .limit(10)
        .skip(10);
    
    expect(page1.length).toBe(10);
    expect(page2.length).toBe(10);
    expect(page1[0]._id).not.toEqual(page2[0]._id);
});
```

## Error Handling

### Test Missing Data

```typescript
it('should handle missing supplier gracefully', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const supplier = await Supplier.findById(nonExistentId);
    
    expect(supplier).toBeNull();
    // In real code, this should throw a proper error
});
```

### Test Validation Errors

```typescript
it('should validate required fields in supplier creation', async () => {
    await expect(
        Supplier.create({
            companyName: 'Test', // Missing required fields
        })
    ).rejects.toThrow();
});
```

### Test Concurrent Updates

```typescript
it('should handle concurrent SKU mapping updates', async () => {
    // Simulate concurrent updates
    const mapping1 = await SkuMapping.findById(testMapping._id);
    const mapping2 = await SkuMapping.findById(testMapping._id);
    
    mapping1.ourSku = 'NB-UPDATE-1';
    mapping2.ourSku = 'NB-UPDATE-2';
    
    await mapping1.save();
    await mapping2.save();
    
    const final = await SkuMapping.findById(testMapping._id);
    expect(final.ourSku).toBe('NB-UPDATE-2'); // Last write wins
    
    // In production, use optimistic locking or transactions
});
```

## Debugging Tests

### Use Descriptive Variable Names

```typescript
// ✅ Good
const activeSupplier = await Supplier.create({ status: 'active' });
const percentMarginRule = await MarginRule.create({ marginType: 'percent' });

// ❌ Bad
const s = await Supplier.create({ status: 'active' });
const r = await MarginRule.create({ marginType: 'percent' });
```

### Add Helpful Assertions

```typescript
// ✅ Good - Clear failure message
expect(result.status).toBe('success');
expect(result.orderId).toBeDefined();
expect(mockedAxios.post).toHaveBeenCalledWith(
    expect.stringContaining('https://'),
    expect.objectContaining({ orderId: expect.any(String) })
);

// ❌ Bad - Vague assertion
expect(result).toBeTruthy();
```

### Use Test Utilities

```typescript
// Available global utilities
const id = global.testUtils.randomObjectId();
const supplier = global.testUtils.createMockSupplier();
const order = global.testUtils.createMockOrder({ total: 99.99 });
await global.testUtils.wait(1000);
```

## Common Pitfalls

### ❌ Forgetting to await async operations

```typescript
// Bad - missing await
it('should create supplier', () => {
    Supplier.create({...}); // Not awaited!
    const count = await Supplier.countDocuments();
    expect(count).toBe(1); // Will fail!
});

// Good
it('should create supplier', async () => {
    await Supplier.create({...});
    const count = await Supplier.countDocuments();
    expect(count).toBe(1);
});
```

### ❌ Not cleaning up between tests

```typescript
// Bad - data persists across tests
describe('Tests', () => {
    it('test 1', async () => {
        await Supplier.create({...}); // Creates data
    });
    
    it('test 2', async () => {
        const count = await Supplier.countDocuments();
        expect(count).toBe(0); // Fails! Data from test 1 still exists
    });
});

// Good
describe('Tests', () => {
    beforeEach(async () => {
        await Supplier.deleteMany({}); // Clean up
    });
    
    // Tests are now independent
});
```

### ❌ Testing implementation details

```typescript
// Bad - tests internal implementation
it('should use bcrypt to hash password', () => {
    expect(supplier.hashPassword.toString()).toContain('bcrypt');
});

// Good - tests behavior
it('should not store plain text password', async () => {
    const supplier = await Supplier.create({ password: 'secret123' });
    expect(supplier.password).not.toBe('secret123');
    expect(supplier.password.length).toBeGreaterThan(20); // Hashed
});
```

### ❌ Over-mocking

```typescript
// Bad - mocking too much
jest.mock('../src/models/Supplier');
jest.mock('../src/models/SkuMapping');
jest.mock('../src/models/MarginRule');
// Now you're not testing anything real!

// Good - only mock external dependencies
jest.mock('axios'); // External HTTP calls
// Use real models and database for integration tests
```

## Coverage Best Practices

### Aim for Meaningful Coverage

```typescript
// Don't just write tests to hit coverage numbers
// Write tests that verify important behavior

// ✅ Good - tests critical business logic
it('should prevent orders to suspended suppliers', async () => {
    supplier.status = 'suspended';
    await supplier.save();
    
    await expect(
        pushOrderToSupplier(order, supplier)
    ).rejects.toThrow('Supplier is suspended');
});

// ❌ Bad - just hitting coverage
it('should have status field', () => {
    expect(supplier.status).toBeDefined(); // Not useful
});
```

### Test Edge Cases

```typescript
// Test boundary conditions
it('should handle zero margin', async () => {
    const rule = await MarginRule.create({ marginType: 'percent', value: 0 });
    const price = 100 * (1 + rule.value / 100);
    expect(price).toBe(100);
});

it('should handle negative costs', async () => {
    // Business logic should prevent this
    await expect(
        calculatePrice(-10, marginRule)
    ).rejects.toThrow('Cost must be positive');
});
```

## Continuous Improvement

### Review Test Failures

When a test fails in CI:
1. Read the error message carefully
2. Check what changed since the last passing build
3. Reproduce locally before fixing
4. Add more assertions if the failure was unclear

### Refactor Tests

Keep tests maintainable:
- Extract common setup into helper functions
- Use test data factories
- Keep tests short (< 20 lines ideally)
- Remove duplicate test logic

### Monitor Test Performance

- Tests should be fast (<30s total)
- Identify slow tests: `pnpm test --verbose`
- Optimize slow queries, reduce test data
- Consider parallel test execution

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mongoose Testing](https://mongoosejs.com/docs/jest.html)
- [Dropship Testing Guide](./DROPSHIP_TESTING.md)

---

**Remember**: Good tests are:
- ✅ Independent
- ✅ Fast
- ✅ Clear and descriptive
- ✅ Testing behavior, not implementation
- ✅ Covering both success and failure cases
- ✅ Easy to debug when they fail
