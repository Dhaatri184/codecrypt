const { Pool } = require('pg');

async function clearAndTest() {
  const pool = new Pool({
    connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
  });

  try {
    console.log('🧹 Clearing stuck scans...\n');
    
    const result = await pool.query(`
      UPDATE scans
      SET status = 'failed',
          completed_at = NOW(),
          error_message = 'Scan timeout - cleared by system'
      WHERE status IN ('pending', 'scanning', 'analyzing')
      AND started_at < NOW() - INTERVAL '10 minutes'
      RETURNING id, status, started_at
    `);

    if (result.rows.length > 0) {
      console.log(`✅ Cleared ${result.rows.length} stuck scan(s):`);
      result.rows.forEach(row => {
        console.log(`   • ${row.id} (was stuck since ${row.started_at})`);
      });
    } else {
      console.log('✅ No stuck scans found');
    }

    console.log('\n📊 Current System Status:\n');
    
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM scans
      WHERE started_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'completed' THEN 1
          WHEN 'failed' THEN 2
          WHEN 'scanning' THEN 3
          WHEN 'pending' THEN 4
          ELSE 5
        END
    `);

    console.log('Last 24 hours:');
    stats.rows.forEach(row => {
      const icon = row.status === 'completed' ? '✅' : 
                   row.status === 'failed' ? '❌' : 
                   row.status === 'scanning' ? '🔄' : '⏳';
      console.log(`   ${icon} ${row.status}: ${row.count}`);
    });

    console.log('\n🎉 System is clean and ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

clearAndTest();
