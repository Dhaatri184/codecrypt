/**
 * Quick diagnostic tool to check scan status
 * Run with: node check-scan-status.js
 */

const http = require('http');

const API_URL = 'http://localhost:3001';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${API_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function checkStatus() {
  console.log('🔍 Checking CodeCrypt System Status...\n');

  try {
    // Check if backend is running
    console.log('1. Backend API Status:');
    try {
      const repos = await makeRequest('/api/repositories');
      console.log(`   ✅ Backend is running`);
      console.log(`   📦 Repositories found: ${repos.length}`);
      
      if (repos.length > 0) {
        console.log('\n2. Repository Details:');
        repos.forEach((repo, i) => {
          console.log(`   ${i + 1}. ${repo.name || repo.url}`);
          console.log(`      ID: ${repo.id}`);
          console.log(`      URL: ${repo.url}`);
        });

        // Check scans for each repository
        console.log('\n3. Recent Scans:');
        for (const repo of repos) {
          const scans = await makeRequest(`/api/scans/repository/${repo.id}`);
          console.log(`\n   Repository: ${repo.name || repo.url}`);
          
          if (scans.length === 0) {
            console.log(`      ⚠️  No scans found`);
          } else {
            const latestScan = scans[0];
            console.log(`      Latest Scan ID: ${latestScan.id}`);
            console.log(`      Status: ${latestScan.status}`);
            console.log(`      Progress: ${latestScan.progress_percentage || 0}%`);
            console.log(`      Files: ${latestScan.files_processed || 0}/${latestScan.total_files_discovered || 0}`);
            console.log(`      Created: ${new Date(latestScan.created_at).toLocaleString()}`);
            
            if (latestScan.status === 'completed') {
              console.log(`      ✅ Scan completed successfully`);
              console.log(`      🐛 Issues found: ${latestScan.total_issues || 0}`);
            } else if (latestScan.status === 'failed') {
              console.log(`      ❌ Scan failed`);
            } else if (latestScan.status === 'scanning' || latestScan.status === 'pending') {
              console.log(`      ⏳ Scan in progress...`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Backend is not responding`);
      console.log(`   Error: ${error.message}`);
      console.log(`\n   💡 Make sure services are running:`);
      console.log(`      cd backend && npm run dev`);
      console.log(`      cd scanner && npm run worker`);
      console.log(`      cd frontend && npm run dev`);
    }

    console.log('\n4. Cached Repositories:');
    const fs = require('fs');
    const path = require('path');
    const cacheDir = path.join(process.cwd(), 'tmp', 'repos');
    
    try {
      const cached = fs.readdirSync(cacheDir);
      if (cached.length > 0) {
        console.log(`   ✅ ${cached.length} repositories cached for faster scans:`);
        cached.forEach(repo => {
          const stats = fs.statSync(path.join(cacheDir, repo));
          console.log(`      - ${repo} (cached ${Math.round((Date.now() - stats.mtimeMs) / 1000 / 60)} minutes ago)`);
        });
      } else {
        console.log(`   ℹ️  No cached repositories yet`);
      }
    } catch (e) {
      console.log(`   ℹ️  Cache directory not found (will be created on first scan)`);
    }

    console.log('\n5. System Health:');
    console.log(`   ✅ All checks complete`);
    console.log(`\n💡 Tips:`);
    console.log(`   - First scan of a repo takes 3-5 seconds`);
    console.log(`   - Subsequent scans take 1-2 seconds (cached)`);
    console.log(`   - Clear browser cache (Ctrl+Shift+R) if UI doesn't update`);
    console.log(`   - Check browser console (F12) for frontend errors`);

  } catch (error) {
    console.error('\n❌ Error checking status:', error.message);
  }
}

checkStatus();
