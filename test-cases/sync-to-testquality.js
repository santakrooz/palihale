#!/usr/bin/env node

/**
 * TestQuality Sync Script for Polymarket Clone Test Cases
 *
 * This script syncs test cases from polymarket-test-cases.json to TestQuality
 * via their REST API.
 *
 * Prerequisites:
 * - Node.js installed
 * - TESTQUALITY_API_KEY environment variable set
 * - TESTQUALITY_PROJECT_ID environment variable set
 *
 * Usage: node sync-to-testquality.js
 */

const fs = require('fs');
const https = require('https');

// Configuration
const CONFIG = {
  apiKey: process.env.TESTQUALITY_API_KEY,
  projectId: process.env.TESTQUALITY_PROJECT_ID,
  apiEndpoint: 'api.testquality.com',
  testCasesFile: './polymarket-test-cases.json'
};

// Validate environment variables
function validateConfig() {
  if (!CONFIG.apiKey) {
    console.error('❌ Error: TESTQUALITY_API_KEY environment variable is not set');
    console.log('   Set it with: export TESTQUALITY_API_KEY=your_api_key');
    process.exit(1);
  }

  if (!CONFIG.projectId) {
    console.error('❌ Error: TESTQUALITY_PROJECT_ID environment variable is not set');
    console.log('   Set it with: export TESTQUALITY_PROJECT_ID=your_project_id');
    process.exit(1);
  }

  console.log('✓ Configuration validated');
}

// Load test cases from JSON file
function loadTestCases() {
  try {
    const data = fs.readFileSync(CONFIG.testCasesFile, 'utf8');
    const testData = JSON.parse(data);
    console.log(`✓ Loaded ${testData.metadata.total_test_cases} test cases from file`);
    return testData;
  } catch (error) {
    console.error('❌ Error loading test cases:', error.message);
    process.exit(1);
  }
}

// Make API request to TestQuality
function makeApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.apiEndpoint,
      port: 443,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`API request failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Create or update a test suite in TestQuality
async function syncTestSuite(suite) {
  console.log(`\n📁 Syncing test suite: ${suite.suite_name}`);

  try {
    const suiteData = {
      name: suite.suite_name,
      description: `Test suite for ${suite.suite_name}`,
      project_id: CONFIG.projectId,
      external_id: suite.suite_id
    };

    // Try to create the suite (or update if it exists)
    const result = await makeApiRequest('POST', '/test_suites', suiteData);
    console.log(`  ✓ Test suite synced: ${suite.suite_name}`);
    return result;
  } catch (error) {
    console.error(`  ❌ Error syncing suite ${suite.suite_name}:`, error.message);
    throw error;
  }
}

// Create or update a test case in TestQuality
async function syncTestCase(testCase, suiteId) {
  console.log(`  📝 Syncing test case: ${testCase.test_case_id} - ${testCase.title}`);

  try {
    // Convert steps to TestQuality format
    const steps = testCase.steps.map(step => ({
      step_number: step.step_number,
      action: step.action,
      expected_result: step.expected_result
    }));

    const testCaseData = {
      title: testCase.title,
      external_id: testCase.test_case_id,
      test_suite_id: suiteId,
      priority: testCase.priority.toLowerCase(),
      status: testCase.status.toLowerCase(),
      test_type: testCase.type.toLowerCase(),
      precondition: testCase.preconditions ? testCase.preconditions.join('\n') : '',
      steps: steps,
      tags: testCase.tags || []
    };

    const result = await makeApiRequest('POST', '/test_cases', testCaseData);
    console.log(`    ✓ Test case synced: ${testCase.test_case_id}`);
    return result;
  } catch (error) {
    console.error(`    ❌ Error syncing test case ${testCase.test_case_id}:`, error.message);
    // Continue with other test cases even if one fails
    return null;
  }
}

// Main sync function
async function syncToTestQuality() {
  console.log('\n🚀 Starting TestQuality sync...\n');

  validateConfig();
  const testData = loadTestCases();

  let successCount = 0;
  let failCount = 0;

  for (const suite of testData.test_suites) {
    try {
      const suiteResult = await syncTestSuite(suite);
      const suiteId = suiteResult.id || suiteResult.data?.id;

      if (suiteId && suite.test_cases) {
        for (const testCase of suite.test_cases) {
          const result = await syncTestCase(testCase, suiteId);
          if (result) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to sync suite: ${suite.suite_name}`);
      failCount += suite.test_cases ? suite.test_cases.length : 0;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Sync completed!');
  console.log(`   Success: ${successCount} test cases`);
  console.log(`   Failed: ${failCount} test cases`);
  console.log('='.repeat(50) + '\n');
}

// Alternative: Export test cases in TestQuality CSV format
function exportToCSV() {
  console.log('📄 Generating TestQuality CSV export...');

  const testData = loadTestCases();
  let csv = 'Suite,Test Case ID,Title,Priority,Status,Type,Preconditions,Steps,Expected Results,Tags\n';

  for (const suite of testData.test_suites) {
    for (const testCase of suite.test_cases) {
      const steps = testCase.steps.map(s => s.action).join(' | ');
      const expectedResults = testCase.steps.map(s => s.expected_result).join(' | ');
      const preconditions = testCase.preconditions ? testCase.preconditions.join(' | ') : '';
      const tags = testCase.tags ? testCase.tags.join(', ') : '';

      csv += `"${suite.suite_name}","${testCase.test_case_id}","${testCase.title}","${testCase.priority}","${testCase.status}","${testCase.type}","${preconditions}","${steps}","${expectedResults}","${tags}"\n`;
    }
  }

  fs.writeFileSync('./polymarket-test-cases.csv', csv);
  console.log('✓ CSV export saved to: polymarket-test-cases.csv');
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--csv')) {
  exportToCSV();
} else if (args.includes('--help')) {
  console.log(`
TestQuality Sync Script
=======================

Usage: node sync-to-testquality.js [options]

Options:
  --csv     Export test cases to CSV format instead of syncing
  --help    Show this help message

Environment Variables:
  TESTQUALITY_API_KEY      Your TestQuality API key (required)
  TESTQUALITY_PROJECT_ID   Your TestQuality project ID (required)

Examples:
  # Sync test cases to TestQuality
  export TESTQUALITY_API_KEY=your_key
  export TESTQUALITY_PROJECT_ID=123
  node sync-to-testquality.js

  # Export to CSV
  node sync-to-testquality.js --csv
  `);
} else {
  syncToTestQuality().catch(error => {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  });
}
