#!/usr/bin/env node

/**
 * Test runner script for E2E tests
 * This script can run tests with or without the full application
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const testMode = args.includes('--mock-only') ? 'mock-only' : 'full';

console.log(`Running E2E tests in ${testMode} mode...`);

if (testMode === 'mock-only') {
  // Run only tests that don't require the full application
  console.log('Running basic connectivity and mock tests...');
  
  const testCommand = spawn('npx', [
    'playwright', 
    'test', 
    'src/e2e/basic-test.spec.ts',
    '--reporter=line'
  ], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  testCommand.on('close', (code) => {
    console.log(`Basic tests completed with exit code ${code}`);
    
    if (code === 0) {
      console.log('\n✅ Basic E2E test infrastructure is working correctly!');
      console.log('\nTo run full tests:');
      console.log('1. Fix any build issues in the application');
      console.log('2. Run: npm run test:e2e');
    } else {
      console.log('\n❌ Basic tests failed. Check Playwright installation.');
    }
    
    process.exit(code);
  });

  testCommand.on('error', (error) => {
    console.error('Failed to start test process:', error);
    process.exit(1);
  });

} else {
  // Run full test suite
  console.log('Running full E2E test suite...');
  
  const testCommand = spawn('npx', [
    'playwright', 
    'test',
    '--reporter=line',
    ...args.filter(arg => arg !== '--mock-only')
  ], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  testCommand.on('close', (code) => {
    console.log(`Full tests completed with exit code ${code}`);
    process.exit(code);
  });

  testCommand.on('error', (error) => {
    console.error('Failed to start test process:', error);
    process.exit(1);
  });
}