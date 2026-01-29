/**
 * Test Runner - Runs all tests
 */

const { spawn } = require('child_process');

function runTestFile(file) {
    return new Promise((resolve, reject) => {
        console.log(`\nRunning ${file}...\n`);
        const test = spawn('node', [file]);

        test.stdout.on('data', (data) => {
            process.stdout.write(data.toString());
        });

        test.stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });

        test.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${file} failed with code ${code}`));
            }
        });
    });
}

async function runAllTests() {
    console.log('=== Running All Tests ===\n');
    
    try {
        // Run integration tests (don't require dependencies)
        await runTestFile('tests/integration-tests.js');
        
        console.log('\n✓ All tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Tests failed:', error.message);
        process.exit(1);
    }
}

runAllTests();
