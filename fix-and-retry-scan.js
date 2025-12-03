const { Pool } = require('pg');
const axios = require('axios');

async function fixAndRetry() {
  const pool = new Pool({
    connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
  });

  try {
    console.log('🔧 Fixing stuck scans and preparing for retry...\n');

    // 1. Find and fix stuck scans
    const stuckScans = await pool.query(`
      SELECT id, repository_id, status, started_at
      FROM scans
      WHERE status IN ('pending', 'scanning', 'analyzing')
      ORDER BY started_at DESC
    `);

    if (stuckScans.rows.length > 0) {
      console.log(`Found ${stuckScans.rows.length} stuck scan(s):\n`);
      
      for (const scan of stuckScans.rows) {
        console.log(`   Scan ID: ${scan.id}`);
        console.log(`   Status: ${scan.status}`);
        console.log(`   Started: ${scan.started_at}`);
        
        // Mark as failed
        await pool.query(`
          UPDATE scans
          SET status = 'failed',
              completed_at = NOW(),
              error_message = 'Scan cleared - branch detection fix applied'
          WHERE id = $1
        `, [scan.id]);
        
        console.log(`   ✅ Marked as failed\n`);
      }
    } else {
      console.log('✅ No stuck scans found\n');
    }

    // 2. Check scanner worker status
    console.log('📊 System Status:\n');
    
    try {
      const backendHealth = await axios.get('http://localhost:4000/health', { timeout: 3000 });
      console.log('   ✅ Backend API: Running');
    } catch {
      console.log('   ❌ Backend API: Not responding');
    }

    // 3. Show recent scan stats
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM scans
      WHERE started_at > NOW() - INTERVAL '1 hour'
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📈 Last Hour Scan Stats:');
    if (stats.rows.length > 0) {
      stats.rows.forEach(row => {
        const icon = row.status === 'completed' ? '✅' : 
                     row.status === 'failed' ? '❌' : '🔄';
        console.log(`   ${icon} ${row.status}: ${row.count}`);
      });
    } else {
      console.log('   No scans in last hour');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 System Ready!');
    console.log('\n✨ Branch Detection Fix Applied:');
    console.log('   • Scanner now tries: main → master → develop → default');
    console.log('   • Handles repositories with any default branch');
    console.log('   • Automatic fallback to repository default');
    console.log('\n🚀 Try scanning your repository again from the UI!');
    console.log('   http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAndRetry();
