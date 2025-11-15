# Polymarket Clone - Test Cases

This directory contains comprehensive test cases for the Polymarket prediction market clone, organized for integration with TestQuality test management platform.

## Overview

The test suite covers all critical functionality of a prediction market platform:

- **User Authentication** (2 test cases)
- **Market Creation** (2 test cases)
- **Trading & Order Management** (3 test cases)
- **Market Resolution** (2 test cases)
- **Liquidity Management** (2 test cases)
- **UI/UX Testing** (2 test cases)
- **Performance Testing** (2 test cases)
- **Security Testing** (2 test cases)

**Total: 17 comprehensive test cases**

## Files

- `polymarket-test-cases.json` - Main test case definitions in JSON format
- `testquality-config.json` - TestQuality integration configuration
- `sync-to-testquality.js` - Node.js script to sync test cases to TestQuality
- `README.md` - This documentation file

## Test Case Structure

Each test case includes:

- **Test Case ID**: Unique identifier (e.g., TC-001)
- **Title**: Descriptive name of the test
- **Priority**: Critical, High, Medium, or Low
- **Status**: Active, Draft, or Deprecated
- **Type**: Functional, UI, Performance, Security, or Negative
- **Preconditions**: Requirements before executing the test
- **Steps**: Detailed step-by-step instructions
- **Expected Results**: What should happen at each step
- **Tags**: Keywords for categorization and filtering

## Syncing with TestQuality

### Method 1: Using the Sync Script (Recommended)

1. **Install Node.js** (if not already installed)

2. **Get your TestQuality credentials:**
   - Sign up at [TestQuality](https://testquality.com)
   - Create a new project or select an existing one
   - Go to Settings > API to generate an API key
   - Note your Project ID from the project settings

3. **Set environment variables:**
   ```bash
   export TESTQUALITY_API_KEY=your_api_key_here
   export TESTQUALITY_PROJECT_ID=your_project_id_here
   ```

4. **Run the sync script:**
   ```bash
   cd test-cases
   node sync-to-testquality.js
   ```

5. **Verify in TestQuality:**
   - Log into your TestQuality account
   - Navigate to your project
   - Check that test suites and cases have been imported

### Method 2: Manual CSV Import

1. **Generate CSV file:**
   ```bash
   node sync-to-testquality.js --csv
   ```

2. **Import to TestQuality:**
   - Log into TestQuality
   - Go to your project
   - Navigate to Test Cases > Import
   - Upload `polymarket-test-cases.csv`
   - Map columns according to the prompts
   - Complete the import

### Method 3: Manual JSON Import

1. **Access TestQuality:**
   - Log into your TestQuality account
   - Navigate to your project

2. **Import via UI:**
   - Go to Test Cases > Import
   - Select JSON format
   - Upload `polymarket-test-cases.json`
   - Configure field mapping:
     - Suite Name → `suite_name`
     - Test Case ID → `test_case_id`
     - Priority → `priority`
     - Status → `status`
     - Tags → `tags`

## Using the Test Cases

### For Manual Testing

1. Open `polymarket-test-cases.json`
2. Navigate to the relevant test suite
3. Follow each test case step-by-step
4. Record actual results
5. Mark as Pass/Fail

### For Automated Testing

The test cases can be converted into automated tests using frameworks like:

- **Playwright** or **Cypress** for E2E UI testing
- **Jest** or **Mocha** for unit/integration testing
- **Hardhat** or **Foundry** for smart contract testing

Example Playwright test structure:

```javascript
test('TC-001: User Registration with Valid Wallet', async ({ page }) => {
  // Step 1: Navigate to homepage
  await page.goto('https://your-polymarket-clone.com');
  await expect(page).toHaveTitle(/Polymarket/);

  // Step 2: Click Connect Wallet
  await page.click('button:has-text("Connect Wallet")');
  await expect(page.locator('.wallet-modal')).toBeVisible();

  // Continue with remaining steps...
});
```

## Test Coverage Summary

### Priority Distribution
- **Critical**: 6 test cases (35%)
- **High**: 4 test cases (24%)
- **Medium**: 6 test cases (35%)
- **Low**: 1 test case (6%)

### Type Distribution
- **Functional**: 11 test cases (65%)
- **Negative**: 2 test cases (12%)
- **Security**: 2 test cases (12%)
- **UI**: 1 test case (6%)
- **Performance**: 2 test cases (12%)

### Critical Test Cases

These test cases should be executed before any production release:

1. **TC-003**: Create Binary Market with Valid Parameters
2. **TC-005**: Place Buy Order on Binary Market
3. **TC-008**: Resolve Binary Market with Yes Outcome
4. **TC-009**: Claim Winnings from Resolved Market
5. **TC-016**: Wallet Signature Verification
6. **TC-017**: Smart Contract Authorization Check

## Customization

To add new test cases:

1. Open `polymarket-test-cases.json`
2. Add a new test case object to the appropriate suite:

```json
{
  "test_case_id": "TC-018",
  "title": "Your New Test Case",
  "priority": "High",
  "status": "Active",
  "type": "Functional",
  "preconditions": [
    "List preconditions here"
  ],
  "steps": [
    {
      "step_number": 1,
      "action": "What to do",
      "expected_result": "What should happen"
    }
  ],
  "tags": ["relevant", "tags"]
}
```

3. Update the `total_test_cases` in metadata
4. Re-run the sync script to update TestQuality

## Continuous Integration

For CI/CD integration, add the sync script to your pipeline:

```yaml
# Example GitHub Actions workflow
- name: Sync Test Cases to TestQuality
  env:
    TESTQUALITY_API_KEY: ${{ secrets.TESTQUALITY_API_KEY }}
    TESTQUALITY_PROJECT_ID: ${{ secrets.TESTQUALITY_PROJECT_ID }}
  run: |
    cd test-cases
    node sync-to-testquality.js
```

## Support

- **TestQuality Documentation**: https://doc.testquality.com/
- **TestQuality API Reference**: https://api.testquality.com/docs
- **Polymarket Documentation**: https://docs.polymarket.com/

## License

These test cases are provided as-is under the MIT License. See the LICENSE file in the root directory.

## Contributing

To contribute additional test cases:

1. Follow the existing structure and format
2. Ensure test case IDs are sequential and unique
3. Add appropriate tags for discoverability
4. Update this README if adding new test suites
5. Test the sync script to ensure compatibility

## Changelog

### Version 1.0.0 (2025-11-15)
- Initial release with 17 comprehensive test cases
- 8 test suites covering all major functionality
- TestQuality sync script and documentation
- CSV export functionality
