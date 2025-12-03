/**
 * Check database scan status
 * Run with: node check-database.js
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
});

async function checkScans() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get recent scans
    const result = await client.query(`
      SELECT 
        id,
        repository_id,
        status,
        progress_percentage,
        files_processed,
        total_files_discovered,
        total_files,
        total_issues,
        started_at,
        completed_at
      FROM scans 
      ORDER BY started_at DESC 
      LIMIT 5
    `);

    console.log(`📊 Recent Scans (${result.rows.length} found):\n`);

    result.rows.forEach((scan, i) => {
      console.log(`${i + 1}. Scan ID: ${scan.id}`);
      console.log(`   Status: ${scan.status}`);
      console.log(`   Progress: ${scan.progress_percentage}%`);
      console.log(`   Files: ${scan.files_processed}/${scan.total_files_discovered} (total: ${scan.total_files})`);
      console.log(`   Issues: ${scan.total_issues}`);
      console.log(`   Started: ${new Date(scan.started_at).toLocaleString()}`);
      console.log(`   Completed: ${scan.completed_at ? new Date(scan.completed_at).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkScans();
