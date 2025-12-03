/**
 * Fix stuck scans that have 100% progress but are still "pending"
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
});

async function fixStuckScans() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find stuck scans (100% progress but still pending/scanning)
    const stuckScans = await client.query(`
      SELECT id, status, progress_percentage
      FROM scans 
      WHERE progress_percentage = 100 
      AND status IN ('pending', 'scanning', 'analyzing')
      ORDER BY started_at DESC
    `);

    if (stuckScans.rows.length === 0) {
      console.log('✅ No stuck scans found!');
      await client.end();
      return;
    }

    console.log(`Found ${stuckScans.rows.length} stuck scan(s):\n`);

    for (const scan of stuckScans.rows) {
      console.log(`Fixing scan ${scan.id} (status: ${scan.status})...`);
      
      // Update to completed status
      await client.query(`
        UPDATE scans 
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = $1
      `, [scan.id]);
      
      console.log(`✅ Fixed scan ${scan.id}\n`);
    }

    console.log('✅ All stuck scans have been fixed!');
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixStuckScans();
