/**
 * Integration Tests for Shopping Stats PWA
 * Tests the complete application flow
 */

const fs = require('fs');

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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function runTests() {
    console.log('=== Integration Tests ===\n');

    await test('HTML structure validation', async () => {
        const html = fs.readFileSync('./index.html', 'utf8');
        assert(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
        assert(html.includes('manifest.json'), 'Should reference manifest');
        assert(html.includes('Service Worker') || html.includes('serviceWorker'), 'Should register service worker');
        assert(html.includes('id="app"'), 'Should have app container');
    });

    await test('Manifest validation', async () => {
        const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
        assert(manifest.name === 'Shopping Stats', 'Should have correct name');
        assert(manifest.display === 'standalone', 'Should be standalone');
        assert(Array.isArray(manifest.icons), 'Should have icons array');
        assert(manifest.icons.length >= 2, 'Should have at least 2 icons');
    });

    await test('Service Worker validation', async () => {
        const sw = fs.readFileSync('./sw.js', 'utf8');
        assert(sw.includes('addEventListener'), 'Should have event listeners');
        assert(sw.includes('install'), 'Should handle install event');
        assert(sw.includes('activate'), 'Should handle activate event');
        assert(sw.includes('fetch'), 'Should handle fetch event');
        assert(sw.includes('caches'), 'Should use cache API');
    });

    await test('CSS file exists and has styles', async () => {
        const css = fs.readFileSync('./css/styles.css', 'utf8');
        assert(css.length > 100, 'CSS should have content');
        assert(css.includes(':root'), 'Should have CSS variables');
        assert(css.includes('@media'), 'Should be responsive');
    });

    await test('JavaScript modules exist', async () => {
        const dbExists = fs.existsSync('./js/db.js');
        const appExists = fs.existsSync('./js/app.js');
        assert(dbExists, 'db.js should exist');
        assert(appExists, 'app.js should exist');
    });

    await test('DB module structure', async () => {
        const db = fs.readFileSync('./js/db.js', 'utf8');
        assert(db.includes('class ShoppingDB'), 'Should define ShoppingDB class');
        assert(db.includes('async init()'), 'Should have init method');
        assert(db.includes('addItem'), 'Should have addItem method');
        assert(db.includes('getAllItems'), 'Should have getAllItems method');
        assert(db.includes('deleteItem'), 'Should have deleteItem method');
        assert(db.includes('indexedDB'), 'Should use IndexedDB');
    });

    await test('App module structure', async () => {
        const app = fs.readFileSync('./js/app.js', 'utf8');
        assert(app.includes('class ShoppingApp'), 'Should define ShoppingApp class');
        assert(app.includes('renderItems'), 'Should have renderItems method');
        assert(app.includes('addEventListener'), 'Should set up event listeners');
        assert(app.includes('online'), 'Should handle online/offline');
    });

    await test('Icons exist', async () => {
        const icon192Exists = fs.existsSync('./icons/icon-192.png');
        const icon512Exists = fs.existsSync('./icons/icon-512.png');
        assert(icon192Exists, 'icon-192.png should exist');
        assert(icon512Exists, 'icon-512.png should exist');
    });

    await test('PWA requirements met', async () => {
        const hasManifest = fs.existsSync('./manifest.json');
        const hasServiceWorker = fs.existsSync('./sw.js');
        const hasIcons = fs.existsSync('./icons/icon-192.png') && 
                         fs.existsSync('./icons/icon-512.png');
        
        assert(hasManifest, 'Should have manifest.json');
        assert(hasServiceWorker, 'Should have service worker');
        assert(hasIcons, 'Should have required icons');
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
