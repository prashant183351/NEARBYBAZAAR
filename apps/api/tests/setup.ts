/**
 * Jest Test Setup
 * 
 * This file runs before all tests and sets up global test configuration,
 * mocks, and utilities.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); // Load environment variables from .env.test if it exists

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
    /**
     * Generate a random MongoDB ObjectId as a string
     */
    randomObjectId: () => {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const randomHex = Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return timestamp + randomHex;
    },

    /**
     * Wait for a specified number of milliseconds
     */
    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Create a mock supplier object
     */
    createMockSupplier: () => ({
        _id: global.testUtils.randomObjectId(),
        companyName: 'Mock Supplier',
        contactName: 'Test Contact',
        email: `test-${Date.now()}@supplier.com`,
        taxId: `TAX-${Date.now()}`,
        address: '123 Test Street',
        phone: '+1234567890',
        status: 'active',
        approvedAt: new Date(),
    }),

    /**
     * Create a mock order object
     */
    createMockOrder: (overrides = {}) => ({
        id: `ORD-${Date.now()}`,
        items: [
            {
                sku: 'NB-TEST-001',
                quantity: 1,
                price: 29.99,
            },
        ],
        customer: {
            name: 'Test Customer',
            email: 'customer@test.com',
            address: '100 Customer St',
        },
        total: 29.99,
        ...overrides,
    }),
};

// Suppress console output during tests unless LOG_TESTS is set
if (!process.env.LOG_TESTS) {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        // Keep error for debugging test failures
        error: console.error,
    };
}

// Add global type declarations
declare global {
    var testUtils: {
        randomObjectId: () => string;
        wait: (ms: number) => Promise<void>;
        createMockSupplier: () => any;
        createMockOrder: (overrides?: any) => any;
    };
}

export { };
