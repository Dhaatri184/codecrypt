/**
 * Check issues for a specific scan
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
});

const scanId = process.argv[2] || '378c6725-3691-47ae-b47f-3edda7c939d1';

async function checkIssues() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get scan info
    const scanResult = await client.query(`
      SELECT id, status, total_files, total_issues, haunting_level
      FROM scans 
      WHERE id = $1
    `, [scanId]);

    if (scanResult.rows.length === 0) {
      console.log('❌ Scan not found');
      await client.end();
      return;
    }

    const scan = scanResult.rows[0];
    console.log('📊 Scan Info:');
    console.log(`   ID: ${scan.id}`);
    console.log(`   Status: ${scan.status}`);
    console.log(`   Total Files: ${scan.total_files}`);
    console.log(`   Total Issues: ${scan.total_issues}`);
    console.log(`   Haunting Level: ${scan.haunting_level}\n`);

    // Get issues
    const issuesResult = await client.query(`
      SELECT id, haunting_type, severity, file_path, start_line, message
      FROM issues 
      WHERE scan_id = $1
      LIMIT 10
    `, [scanId]);

    console.log(`🐛 Issues Found: ${issuesResult.rows.length}\n`);

    issuesResult.rows.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.haunting_type} (${issue.severity})`);
      console.log(`   File: ${issue.file_path}:${issue.start_line}`);
      console.log(`   Message: ${issue.message}`);
      console.log('');
    });

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIssues();
