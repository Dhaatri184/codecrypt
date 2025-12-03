const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testing API Directly\n');
  
  // You'll need to get a valid token from your browser
  // Open DevTools → Application → Local Storage → Look for 'token'
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Please provide a token:');
    console.log('   node test-api-directly.js YOUR_TOKEN_HERE\n');
    console.log('Get your token from:');
    console.log('   1. Open http://localhost:3000');
    console.log('   2. Press F12 (DevTools)');
    console.log('   3. Go to Application tab');
    console.log('   4. Local Storage → http://localhost:3000');
    console.log('   5. Copy the "token" value\n');
    return;
  }

  try {
    console.log('Testing /api/scans/279ae0ed-b916-48dc-9172-dcca133e9c2a/results...\n');
    
    const start = Date.now();
    const response = await axios.get(
      'http://localhost:4000/api/scans/279ae0ed-b916-48dc-9172-dcca133e9c2a/results',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    const duration = Date.now() - start;
    
    console.log(`✅ Response received in ${duration}ms\n`);
    console.log('Response structure:');
    console.log(`   success: ${response.data.success}`);
    console.log(`   scan.id: ${response.data.data?.scan?.id}`);
    console.log(`   scan.status: ${response.data.data?.scan?.status}`);
    console.log(`   scan.totalIssues: ${response.data.data?.scan?.totalIssues}`);
    console.log(`   issues.length: ${response.data.data?.issues?.length}`);
    console.log(`\n✅ API is working! Response time: ${duration}ms`);
    
    if (duration > 5000) {
      console.log(`\n⚠️  WARNING: Response took ${duration}ms (> 5 seconds)`);
      console.log('   This might cause timeout issues in the frontend');
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('❌ Request timed out after 30 seconds');
      console.log('   The API is taking too long to respond');
    } else if (error.response) {
      console.log(`❌ API Error: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testAPI();
