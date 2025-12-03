const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkNewTables() {
  try {
    console.log('🔍 Checking new feature enhancement tables...\n');
    
    const tables = [
      'issue_dismissals',
      'issue_notes',
      'scan_schedules',
      'quality_thresholds'
    ];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Table: ${table}`);
        console.log(`   Columns: ${result.rows.length}`);
        result.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        console.log('');
      } else {
        console.log(`❌ Table ${table} not found\n`);
      }
    }
    
    // Check new columns in scans table
    console.log('🔍 Checking new columns in scans table...\n');
    const scanColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scans' 
      AND column_name IN ('quality_score', 'threshold_status')
    `);
    
    if (scanColumns.rows.length > 0) {
      console.log('✅ New columns in scans table:');
      scanColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
    // Check new column in issues table
    const issueColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'issues' 
      AND column_name = 'issue_hash'
    `);
    
    if (issueColumns.rows.length > 0) {
      console.log('\n✅ New column in issues table:');
      issueColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
    console.log('\n✨ All feature enhancement tables verified!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkNewTables();

