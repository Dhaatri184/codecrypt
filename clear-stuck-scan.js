const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
});

async function clearStuckScans() {
  try {
    console.log('🔧 Clearing stuck scans...\n');
    
    // Find stuck scans
    const stuck = await pool.query(`
      SELECT id, status, started_at
      FROM scans
      WHERE status = 'pending'
      AND started_at < NOW() - INTERVAL '10 minutes'
    `);
    
    if (stuck.rows.length === 0) {
      console.log('✅ No stuck scans found!');
      return;
    }
    
    console.log(`Found ${stuck.rows.length} stuck scan(s):`);
    stuck.rows.forEach(s => {
      console.log(`  - ${s.id} (${s.status}, started ${new Date(s.started_at).toLocaleString()})`);
    });
    
    // Mark them as failed
    const result = await pool.query(`
      UPDATE scans
      SET 
        status = 'failed',
        error_message = 'Scan timed out - cleared by system',
        completed_at = NOW()
      WHERE status = 'pending'
      AND started_at < NOW() - INTERVAL '10 minutes'
      RETURNING id
    `);
    
    console.log(`\n✅ Cleared ${result.rows.length} stuck scan(s)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

clearStuckScans();
