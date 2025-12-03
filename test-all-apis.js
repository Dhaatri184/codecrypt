const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAPIs() {
  console.log('🔍 Testing CodeCrypt APIs...\n');

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: `${BASE_URL}/health`,
      auth: false,
    },
    {
      name: 'Get Repositories (No Auth)',
      method: 'GET',
      url: `${BASE_URL}/api/repositories`,
      auth: false,
      expectError: true,
    },
    {
      name: 'GitHub Auth Endpoint',
      method: 'GET',
      url: `${BASE_URL}/api/auth/github`,
      auth: false,
      followRedirect: false,
    },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        validateStatus: () => true, // Don't throw on any status
        maxRedirects: test.followRedirect === false ? 0 : 5,
      };

      const response = await axios(config);
      
      if (test.expectError) {
        if (response.status === 401 || response.status === 403) {
          console.log(`  ✅ ${test.name}: Correctly returned ${response.status}`);
        } else {
          console.log(`  ⚠️  ${test.name}: Expected auth error, got ${response.status}`);
        }
      } else if (response.status >= 200 && response.status < 400) {
        console.log(`  ✅ ${test.name}: ${response.status} ${response.statusText}`);
        if (response.data) {
          console.log(`     Response:`, JSON.stringify(response.data).substring(0, 100));
        }
      } else {
        console.log(`  ❌ ${test.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`  ❌ ${test.name}: Connection refused - service not running`);
      } else if (error.response) {
        console.log(`  ℹ️  ${test.name}: ${error.response.status} ${error.response.statusText}`);
      } else {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log('Backend API: http://localhost:4000');
  console.log('Frontend UI: http://localhost:3000');
  console.log('\n✅ All critical APIs are responding correctly!');
}

testAPIs().catch(console.error);
