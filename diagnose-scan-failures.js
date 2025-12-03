const { Pool } = require('pg');

async function diagnoseScanFailures() {
  const pool = new Pool({
    connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
  });

  try {
    console.log('\n🔍 Diagnosing Recent Scan Failures\n');
    console.log('='.repeat(70));

    // Get recent failed scans with error messages
    const failedScans = await pool.query(`
      SELECT 
        s.id,
        r.clone_url,
        s.status,
        s.error_message,
        s.started_at,
        s.completed_at
      FROM scans s
      LEFT JOIN repositories r ON s.repository_id = r.id
      WHERE s.status = 'failed'
      AND s.started_at > NOW() - INTERVAL '2 hours'
      ORDER BY s.started_at DESC
      LIMIT 5
    `);

    if (failedScans.rows.length === 0) {
      console.log('\n✅ No failed scans in the last 2 hours!\n');
      return;
    }

    console.log(`\n❌ Found ${failedScans.rows.length} failed scan(s):\n`);

    failedScans.rows.forEach((scan, index) => {
      console.log(`${index + 1}. Scan ID: ${scan.id}`);
      console.log(`   Repository: ${scan.clone_url}`);
      console.log(`   Status: ${scan.status}`);
      console.log(`   Started: ${scan.started_at}`);
      console.log(`   Error: ${scan.error_message || 'No error message'}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('\n📋 Common Failure Reasons:\n');
    console.log('1. ❌ Empty Repository');
    console.log('   Error: "Repository is empty - no commits found"');
    console.log('   Solution: Add some code files to your repository first\n');
    
    console.log('2. ❌ Branch Not Found');
    console.log('   Error: "Remote branch main not found"');
    console.log('   Solution: Fixed! Scanner now auto-detects branches\n');
    
    console.log('3. ❌ Private Repository');
    console.log('   Error: "Authentication failed"');
    console.log('   Solution: Ensure GitHub OAuth permissions are correct\n');
    
    console.log('4. ❌ Repository Doesn\'t Exist');
    console.log('   Error: "Repository not found"');
    console.log('   Solution: Check the repository URL is correct\n');

    console.log('='.repeat(70));
    console.log('\n💡 Recommendations:\n');
    
    // Check if most recent failure is empty repo
    const latestError = failedScans.rows[0].error_message || '';
    if (latestError.includes('no commits') || latestError.includes('empty')) {
      console.log('⚠️  Your repository appears to be EMPTY');
      console.log('   Repository: ' + failedScans.rows[0].clone_url);
      console.log('\n   To fix this:');
      console.log('   1. Add some code files to your repository');
      console.log('   2. Commit and push the changes');
      console.log('   3. Try scanning again\n');
    } else if (latestError.includes('branch')) {
      console.log('⚠️  Branch detection issue');
      console.log('   The scanner worker needs to be restarted with the fix');
      console.log('   Run: Restart the scanner worker (process #13)\n');
    } else {
      console.log('✅ Try scanning a different repository with actual code');
      console.log('   Example: https://github.com/octocat/Hello-World\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnoseScanFailures();
