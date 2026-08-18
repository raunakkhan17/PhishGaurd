const fetch = require('node-fetch');

// Test domains
const testDomains = [
  'google.com',                     // Well-established, should be safe
  'amazonsecure-signin.com',        // Suspicious name pattern
  'randomnewdomain123xyz.com',      // Newly registered domain
  'apple-account-verify-secure.net' // Suspicious name with hyphens
];

// Function to test the API
async function testPhishingDetection(domain) {
  try {
    console.log(`\n===== Testing ${domain} =====`);
    const response = await fetch('http://localhost:5000/api/directory/check-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: domain }),
    });

    const result = await response.json();
    console.log('Safety Rating:', result.safetyRating);
    console.log('Safety Level:', result.safetyLevel);
    console.log('Score:', `${result.scorePercentage}% (${result.score}/${result.maxScore})`);
    console.log('Top Reasons:');
    result.topReasons.forEach((reason, index) => {
      console.log(`  ${index + 1}. ${reason}`);
    });

    // Log score breakdown by category
    console.log('\nScore Breakdown:');
    Object.entries(result.breakdown).forEach(([category, data]) => {
      console.log(`  ${category}: ${data.score}/${data.maxScore}`);
    });

    return result;
  } catch (error) {
    console.error(`Error testing ${domain}:`, error.message);
  }
}

// Run tests sequentially
async function runTests() {
  console.log('Starting URL Phishing Detection API Tests');
  console.log('========================================');

  for (const domain of testDomains) {
    await testPhishingDetection(domain);
  }

  console.log('\nTests completed!');
}

// Execute tests
runTests();
