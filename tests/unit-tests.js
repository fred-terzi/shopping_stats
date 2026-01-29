/**
 * Unit Tests for Shopping Stats
 * Tests the IndexedDB wrapper functionality
 */

const { JSDOM } = require('jsdom');

// Setup JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.indexedDB = require('fake-indexeddb');
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

// Load the DB module
const fs = require('fs');
const dbCode = fs.readFileSync('./js/db.js', 'utf8');
eval(dbCode);

// Test utilities
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function assert(condition, message) {
    if (condition) {
        testResults.passed++;
        testResults.tests.push({ name: message, passed: true });
        console.log(`✓ ${message}`);
    } else {
        testResults.failed++;
        testResults.tests.push({ name: message, passed: false });
        console.log(`✗ ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function test(name, fn) {
    console.log(`\nTest: ${name}`);
    try {
        await fn();
    } catch (error) {
        console.error(`  Error: ${error.message}`);
    }
}

// Run tests
async function runTests() {
    console.log('=== Unit Tests for ShoppingDB ===\n');

    let db;

    await test('Database initialization', async () => {
        db = new ShoppingDB();
        await db.init();
        assert(db.db !== null, 'Database should be initialized');
    });

    await test('Add item to database', async () => {
        const id = await db.addItem('Milk', 2);
        assert(typeof id === 'number', 'Should return item ID');
        assert(id > 0, 'ID should be positive');
    });

    await test('Get all items', async () => {
        const items = await db.getAllItems();
        assert(Array.isArray(items), 'Should return array');
        assert(items.length > 0, 'Should have at least one item');
        assert(items[0].name === 'Milk', 'Item name should match');
        assert(items[0].quantity === 2, 'Item quantity should match');
    });

    await test('Get single item by ID', async () => {
        const items = await db.getAllItems();
        const item = await db.getItem(items[0].id);
        assert(item !== undefined, 'Should return item');
        assert(item.name === 'Milk', 'Item name should match');
    });

    await test('Update item', async () => {
        const items = await db.getAllItems();
        const id = items[0].id;
        await db.updateItem(id, { quantity: 5 });
        const updated = await db.getItem(id);
        assert(updated.quantity === 5, 'Quantity should be updated');
    });

    await test('Toggle item completed', async () => {
        const items = await db.getAllItems();
        const id = items[0].id;
        await db.toggleItemCompleted(id);
        const item = await db.getItem(id);
        assert(item.completed === true, 'Item should be completed');
        assert(item.completedAt !== null, 'CompletedAt should be set');
    });

    await test('Add multiple items', async () => {
        await db.addItem('Bread', 1);
        await db.addItem('Eggs', 12);
        const items = await db.getAllItems();
        assert(items.length === 3, 'Should have 3 items');
    });

    await test('Get statistics', async () => {
        const stats = await db.getStats();
        assert(stats.total === 3, 'Total should be 3');
        assert(stats.completed === 1, 'Completed should be 1');
        assert(stats.pending === 2, 'Pending should be 2');
    });

    await test('Delete item', async () => {
        const items = await db.getAllItems();
        const id = items[0].id;
        await db.deleteItem(id);
        const remaining = await db.getAllItems();
        assert(remaining.length === 2, 'Should have 2 items left');
    });

    await test('Clear all items', async () => {
        await db.clearAllItems();
        const items = await db.getAllItems();
        assert(items.length === 0, 'Should have no items');
    });

    // Print results
    console.log('\n=== Test Results ===');
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Total: ${testResults.passed + testResults.failed}`);

    if (testResults.failed > 0) {
        process.exit(1);
    }
}

// Run the tests
runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
