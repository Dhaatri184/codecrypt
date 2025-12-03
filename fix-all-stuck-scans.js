const { Pool } = require('pg');

async function fixAllStuckScans() {
  const pool = new Pool({
    connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
  });

  try {
    console.log('🔧 Fixing all stuck scans...\n');

    // Find all stuck scans
    const stuckScans = await pool.query(`
      SELECT id, status, started_at, repository_id
      FROM scans
      WHERE status IN ('pending', 'scanning', 'analyzing')
      AND started_at < NOW() - INTERVAL '10 minutes'
      ORDER BY started_at DESC
    `);

    console.log(`Found ${stuckScans.rows.length} stuck scans\n`);

    if (stuckScans.rows.length === 0) {
      console.log('✅ No stuck scans found!');
      return;
    }

    // Mark them as failed
    for (const scan of stuckScans.rows) {
      console.log(`Fixing scan ${scan.id}...`);
      console.log(`  Status: ${scan.status}`);
      console.log(`  Started: ${scan.started_at}`);
      
      await pool.query(`
        UPDATE scans
        SET status = 'failed',
            completed_at = NOW(),
            error_message = 'Scan timed out or was interrupted'
        WHERE id = $1
      `, [scan.id]);
      
      console.log(`  ✅ Marked as failed\n`);
    }

    console.log(`\n✅ Fixed ${stuckScans.rows.length} stuck scans!`);
    
    // Show current status
    const status = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM scans
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n📊 Current scan status:');
    status.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAllStuckScans();
