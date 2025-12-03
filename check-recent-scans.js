const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
});

async function checkScans() {
  try {
    console.log('🔍 Checking Recent Scans...\n');
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.started_at,
        s.error_message,
        r.name as repo_name,
        (SELECT COUNT(*) FROM issues WHERE scan_id = s.id) as issue_count
      FROM scans s
      LEFT JOIN repositories r ON s.repository_id = r.id
      ORDER BY s.started_at DESC
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No scans found');
      return;
    }
    
    console.log(`Found ${result.rows.length} recent scans:\n`);
    
    result.rows.forEach((scan, i) => {
      const time = new Date(scan.started_at).toLocaleString();
      const status = scan.status.padEnd(12);
      const repo = (scan.repo_name || 'Unknown').padEnd(30);
      const issues = scan.issue_count || 0;
      
      console.log(`${i + 1}. ${status} ${repo} ${issues} issues`);
      console.log(`   Time: ${time}`);
      if (scan.error_message) {
        console.log(`   ❌ Error: ${scan.error_message}`);
      }
      console.log('');
    });
    
    // Check for stuck scans
    const stuck = await pool.query(`
      SELECT COUNT(*) as count
      FROM scans
      WHERE status = 'pending'
      AND started_at < NOW() - INTERVAL '10 minutes'
    `);
    
    if (stuck.rows[0].count > 0) {
      console.log(`⚠️  Found ${stuck.rows[0].count} stuck scans (pending > 10 min)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkScans();
