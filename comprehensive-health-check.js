const axios = require('axios');
const { Pool } = require('pg');
const Redis = require('ioredis');

const BASE_URL = 'http://localhost:4000';

async function comprehensiveHealthCheck() {
  console.log('🏥 CodeCrypt Comprehensive Health Check\n');
  console.log('='.repeat(60));

  // 1. Backend API Health
  console.log('\n1️⃣  Backend API Health');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.success) {
      console.log('   ✅ Backend API is healthy');
      console.log(`   📍 URL: ${BASE_URL}`);
    }
  } catch (error) {
    console.log('   ❌ Backend API is not responding');
    console.log(`   Error: ${error.message}`);
  }

  // 2. Database Connection
  console.log('\n2️⃣  Database Connection');
  const pool = new Pool({
    connectionString: 'postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt'
  });
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('   ✅ Database is connected');
    console.log(`   📍 PostgreSQL on localhost:5432`);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`   📊 Tables: ${tables.rows.length} tables found`);
    
    // Check scans
    const scans = await pool.query('SELECT status, COUNT(*) as count FROM scans GROUP BY status');
    console.log('   📈 Scans by status:');
    scans.rows.forEach(row => {
      console.log(`      - ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    await pool.end();
  }

  // 3. Redis Connection
  console.log('\n3️⃣  Redis Connection');
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
  });
  
  try {
    await redis.ping();
    console.log('   ✅ Redis is connected');
    console.log(`   📍 Redis on localhost:6379`);
    
    // Check queues
    const waiting = await redis.llen('bull:scan:waiting');
    const active = await redis.llen('bull:scan:active');
    console.log(`   📊 Queue status:`);
    console.log(`      - Waiting jobs: ${waiting}`);
    console.log(`      - Active jobs: ${active}`);
    
  } catch (error) {
    console.log('   ❌ Redis connection failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    redis.disconnect();
  }

  // 4. Frontend
  console.log('\n4️⃣  Frontend');
  try {
    const response = await axios.get('http://localhost:3000', {
      timeout: 3000,
      validateStatus: () => true
    });
    if (response.status === 200) {
      console.log('   ✅ Frontend is running');
      console.log(`   📍 URL: http://localhost:3000`);
    }
  } catch (error) {
    console.log('   ❌ Frontend is not responding');
  }

  // 5. API Endpoints Test
  console.log('\n5️⃣  API Endpoints');
  const endpoints = [
    { path: '/health', name: 'Health Check', auth: false },
    { path: '/api/repositories', name: 'Repositories', auth: true },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        validateStatus: () => true
      });
      
      if (endpoint.auth && response.status === 401) {
        console.log(`   ✅ ${endpoint.name}: Auth required (correct)`);
      } else if (response.status === 200) {
        console.log(`   ✅ ${endpoint.name}: Working`);
      } else {
        console.log(`   ⚠️  ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Health check complete!\n');
}

comprehensiveHealthCheck().catch(console.error);
