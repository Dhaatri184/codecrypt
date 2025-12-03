import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'seed.sql')
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Mark existing tables as migrated if migrations table is empty
    const { rows: existingMigrations } = await client.query(
      'SELECT COUNT(*) as count FROM migrations'
    );
    
    if (existingMigrations[0].count === '0') {
      // Check if users table exists (indicating database is already set up)
      const { rows: tables } = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users'
      `);
      
      if (tables.length > 0) {
        console.log('📋 Existing database detected, marking initial migrations as executed...');
        // Mark the first 3 migrations as already executed
        const initialMigrations = files.slice(0, 3);
        for (const file of initialMigrations) {
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
            [file]
          );
          console.log(`✓ Marked ${file} as executed`);
        }
      }
    }
    
    // Get already executed migrations
    const { rows: executed } = await client.query(
      'SELECT filename FROM migrations'
    );
    const executedFiles = new Set(executed.map(r => r.filename));
    
    // Run pending migrations
    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`▶️  Executing ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Successfully executed ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error executing ${file}:`, error);
        throw error;
      }
    }
    
    console.log('✨ All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

