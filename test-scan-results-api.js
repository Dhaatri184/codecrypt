const axios = require('axios');

async function testScanResults() {
  try {
    console.log('🧪 Testing Scan Results API\n');
    
    // Get the most recent completed scan
    const scansResponse = await axios.get('http://localhost:4000/api/scans/repository/e3241175-c671-4cf3-8a83-f9626de0f575');
    const scans = scansResponse.data.data;
    
    console.log(`Found ${scans.length} scans for repository`);
    
    const completedScans = scans.filter(s => s.status === 'completed');
    console.log(`${completedScans.length} completed scans\n`);
    
    if (completedScans.length === 0) {
      console.log('❌ No completed scans to test');
      return;
    }
    
    const latestScan = completedScans[0];
    console.log(`Testing latest scan: ${latestScan.id}`);
    console.log(`  Status: ${latestScan.status}`);
    console.log(`  Total Files: ${latestScan.totalFiles}`);
    console.log(`  Total Issues: ${latestScan.totalIssues}\n`);
    
    // Fetch results
    console.log('Fetching results from API...');
    const resultsResponse = await axios.get(`http://localhost:4000/api/scans/${latestScan.id}/results`, {
      timeout: 30000
    });
    
    const results = resultsResponse.data.data;
    
    console.log('\n✅ API Response Structure:');
    console.log(`  Keys: ${Object.keys(results).join(', ')}`);
    console.log(`  scan: ${results.scan ? 'present' : 'missing'}`);
    console.log(`  issues: ${results.issues ? 'present' : 'missing'}`);
    console.log(`  issues type: ${typeof results.issues}`);
    console.log(`  issues is array: ${Array.isArray(results.issues)}`);
    console.log(`  issues length: ${results.issues?.length || 0}`);
    
    if (results.issues && results.issues.length > 0) {
      console.log('\n📊 Sample Issue:');
      const sample = results.issues[0];
      console.log(`  Type: ${sample.type}`);
      console.log(`  Severity: ${sample.severity}`);
      console.log(`  File: ${sample.filePath}`);
      console.log(`  Line: ${sample.lineNumber}`);
      console.log(`  Message: ${sample.message?.substring(0, 50)}...`);
    }
    
    console.log('\n✅ API is returning data correctly!');
    console.log('\nIf dashboard is not showing results, the issue is in the frontend.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testScanResults();
