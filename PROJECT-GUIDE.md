# 🔮 CodeCrypt - Complete Project Guide

## 📖 Table of Contents
1. [What is CodeCrypt?](#what-is-codecrypt)
2. [System Requirements](#system-requirements)
3. [Installation & Setup](#installation--setup)
4. [Running the Project](#running-the-project)
5. [Using CodeCrypt](#using-codecrypt)
6. [Understanding Scan Results](#understanding-scan-results)
7. [Fixing Issues](#fixing-issues)
8. [Testing the Project](#testing-the-project)
9. [Troubleshooting](#troubleshooting)
10. [Architecture Overview](#architecture-overview)

---

## 🎯 What is CodeCrypt?

**CodeCrypt** is an AI-powered code quality scanner that finds and fixes issues in your JavaScript/TypeScript projects. It detects:

- 👻 **Ghosts** - Unused code (variables, functions, imports)
- 🧟 **Zombies** - Deprecated dependencies
- 🧛 **Vampires** - Performance issues
- 💀 **Skeletons** - Missing documentation
- 👹 **Monsters** - High complexity code

**Key Features:**
- Automatic scanning of GitHub repositories
- AI-powered explanations for each issue
- Auto-fix feature (Exorcism) for simple issues
- Real-time progress tracking
- Pull request generation for fixes

---

## 💻 System Requirements

### Required Software:
- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher
- **Redis** v6 or higher
- **Git** (must be in system PATH)
- **Docker** (optional, for containerized setup)

### Operating System:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd Project-Hackthon
```

### Step 2: Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Install scanner dependencies
cd scanner
npm install
cd ..

# Install AI worker dependencies
cd workers/ai
npm install
cd ../..
```

### Step 3: Setup Environment Variables

Create a `.env` file in the project root:

```env
# GitHub OAuth (Get from: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT Secret (Generate a random string)
JWT_SECRET=your_random_jwt_secret_here

# OpenAI API Key (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=postgresql://codecrypt:codecrypt_dev_password@localhost:5432/codecrypt

# Redis
REDIS_URL=redis://localhost:6379

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
```

### Step 4: Setup Database

**Option A: Using Docker**
```bash
docker-compose up -d postgres redis
```

**Option B: Manual Setup**
```bash
# Start PostgreSQL
# Create database
psql -U postgres
CREATE DATABASE codecrypt;
CREATE USER codecrypt WITH PASSWORD 'codecrypt_dev_password';
GRANT ALL PRIVILEGES ON DATABASE codecrypt TO codecrypt;
\q

# Start Redis
redis-server
```

### Step 5: Run Database Migrations
```bash
cd backend
npm run migrate
cd ..
```

---

## ▶️ Running the Project

### Quick Start (All Services)

**Option 1: Using PowerShell Script**
```powershell
.\start.ps1
```

**Option 2: Manual Start**

Open **4 separate terminal windows**:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Scanner Worker:**
```bash
cd scanner
npm run worker
```

**Terminal 4 - AI Worker:**
```bash
cd workers/ai
npm run dev
```

### Verify Services Are Running

Open your browser and check:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Backend Health: http://localhost:4000/health

---

## 📱 Using CodeCrypt

### Step 1: Login with GitHub

1. Open http://localhost:3000
2. Click **"Connect with GitHub"**
3. Authorize the application
4. You'll be redirected back to the dashboard

### Step 2: Connect a Repository

1. Click **"+ Connect Repository"** button
2. Select a repository from your GitHub account
3. Click **"Connect"**
4. The repository will appear in your dropdown

### Step 3: Scan Your Repository

1. Select your repository from the dropdown
2. Click the **"Scan"** button
3. Watch the progress bar (takes 10-60 seconds depending on repo size)
4. Wait for status to change to **"Completed"**

### Step 4: View Results

1. Click **"View Results"** on the completed scan
2. You'll see:
   - Overall haunting level (Blessed, Mildly Haunted, etc.)
   - Issue counts by type (Ghosts, Zombies, etc.)
   - Haunting icons with numbers
   - List of all issues

### Step 5: Explore Issues

1. Click on any haunting type icon to filter issues
2. Click on an issue card to see details:
   - File path and line number
   - Code snippet
   - AI explanation
   - Suggested fix
   - Exorcise button (if auto-fixable)

### Step 6: Fix Issues (Exorcism)

**For Auto-Fixable Issues (Ghosts):**
1. Click on a Ghost issue
2. Click the **"Exorcise"** button
3. Wait for the process to complete
4. A pull request will be created on GitHub
5. Review and merge the PR

**For Manual Fixes:**
1. Read the AI explanation
2. Note the file and line number
3. Open the file in your editor
4. Apply the suggested fix
5. Commit and push your changes
6. Re-scan to verify the fix

---

## 📊 Understanding Scan Results

### Haunting Levels

Your code is assigned a haunting level based on issue count:

- **Blessed** - 0 issues ✨
- **Mildly Haunted** - 1-10 issues
- **Moderately Haunted** - 11-50 issues
- **Heavily Haunted** - 51-100 issues
- **Extremely Haunted** - 100+ issues

### Issue Types Explained

#### 👻 Ghosts (Dead Code)
**What:** Unused variables, functions, imports
**Impact:** Clutters codebase, confuses developers
**Fix:** Remove unused code
**Auto-fixable:** ✅ Yes

**Example:**
```javascript
import { useState, useEffect } from 'react'; // useEffect is unused
import { formatDate } from './utils';

function MyComponent() {
  const unusedVariable = 42; // Ghost!
  return <div>{formatDate(new Date())}</div>;
}
```

#### 🧟 Zombies (Deprecated Dependencies)
**What:** Outdated or deprecated npm packages
**Impact:** Security vulnerabilities, compatibility issues
**Fix:** Update to latest versions
**Auto-fixable:** ❌ No (requires manual testing)

**Example:**
```json
{
  "dependencies": {
    "react": "16.8.0"  // Zombie! Current is 18.x
  }
}
```

#### 🧛 Vampires (Performance Issues)
**What:** Nested loops, memory leaks, inefficient algorithms
**Impact:** Slow application, high resource usage
**Fix:** Optimize algorithms, reduce complexity
**Auto-fixable:** ❌ No (requires refactoring)

**Example:**
```javascript
// Vampire! O(n²) complexity
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    if (users[i].id === posts[j].userId) {
      // ...
    }
  }
}
```

#### 💀 Skeletons (Missing Documentation)
**What:** Functions without JSDoc comments
**Impact:** Hard to understand code purpose
**Fix:** Add documentation comments
**Auto-fixable:** ❌ No (requires human understanding)

**Example:**
```javascript
// Skeleton! No documentation
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Better:
/**
 * Calculates the total price of all items
 * @param {Array} items - Array of items with price property
 * @returns {number} Total price
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

#### 👹 Monsters (High Complexity)
**What:** Functions with high cyclomatic complexity
**Impact:** Hard to test, maintain, and understand
**Fix:** Break into smaller functions
**Auto-fixable:** ❌ No (requires refactoring)

**Example:**
```javascript
// Monster! Too many branches
function processUser(user) {
  if (user.isActive) {
    if (user.isPremium) {
      if (user.hasSubscription) {
        if (user.paymentValid) {
          // ... 20 more lines
        }
      }
    }
  }
}
```

---

## 🔧 Fixing Issues

### Priority Order (Recommended)

1. **Ghosts** → Easy wins, auto-fixable
2. **Zombies** → Security and compatibility
3. **Vampires** → Performance improvements
4. **Monsters** → Code quality
5. **Skeletons** → Documentation

### Using Exorcism (Auto-Fix)

**What can be auto-fixed:**
- Unused imports
- Unused variables (in some cases)
- Simple formatting issues

**How it works:**
1. Click "Exorcise" on a Ghost issue
2. CodeCrypt creates a new branch
3. Applies the fix automatically
4. Creates a pull request
5. You review and merge

**Pull Request includes:**
- Branch name: `codecrypt-fix-unused-import-abc123`
- Commit message: `🔮 Exorcise: Remove unused import`
- Before/after code comparison
- Link to original issue

### Manual Fixing Workflow

1. **Understand the issue** - Read AI explanation
2. **Locate the code** - Note file and line number
3. **Apply the fix** - Follow suggested solution
4. **Test locally** - Ensure nothing breaks
5. **Commit changes** - Push to GitHub
6. **Re-scan** - Verify the issue is resolved

---

## 🧪 Testing the Project

### Running Tests

**Frontend Tests:**
```bash
cd frontend
npm test
```

**Backend Tests:**
```bash
cd backend
npm test
```

**Scanner Tests:**
```bash
cd scanner
npm test
```

### Property-Based Tests

CodeCrypt uses property-based testing for correctness:

```bash
# Run all property tests
npm run test:property

# Run specific property tests
cd frontend
npm run test -- filter-correctness
```

### Manual Testing Checklist

- [ ] Can log in with GitHub
- [ ] Can connect a repository
- [ ] Can trigger a scan
- [ ] Scan completes successfully
- [ ] Can view scan results
- [ ] Can see issue details
- [ ] Can use Exorcism feature
- [ ] Pull request is created correctly
- [ ] Real-time updates work (WebSocket)

### Test Scan Flow

Run the test script:
```bash
node test-scan-flow.js
```

This tests the complete flow from scan creation to completion.

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Scans Get Stuck

**Symptoms:** Scan stays in "pending" or "scanning" forever

**Solution:**
```bash
node clear-stuck-scan.js
```

#### Issue: Git Not Found

**Symptoms:** Scanner fails with "git not found" error

**Solution:**
1. Install Git: https://git-scm.com/downloads
2. Add Git to system PATH
3. Restart scanner worker:
```powershell
.\start-scanner-worker-dev.ps1
```

#### Issue: 403 Forbidden on Results

**Symptoms:** Can't view scan results, get 403 error

**Cause:** Trying to view someone else's scan

**Solution:** Only view scans for repositories YOU own and connected

#### Issue: Frontend Not Loading

**Symptoms:** http://localhost:3000 shows 404

**Solution:**
```bash
cd frontend
npm run dev
```

#### Issue: Database Connection Failed

**Symptoms:** Backend can't connect to PostgreSQL

**Solution:**
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Run migrations:
```bash
cd backend
npm run migrate
```

#### Issue: Redis Connection Failed

**Symptoms:** Scanner worker can't connect to Redis

**Solution:**
```bash
# Windows
redis-server

# Linux/Mac
sudo service redis-server start
```

### Diagnostic Commands

**Check system health:**
```bash
node verify-system-complete.js
```

**Check recent scans:**
```bash
node check-recent-scans.js
```

**Check database:**
```bash
node check-database.js
```

**View scanner logs:**
```bash
# Check the scanner worker terminal output
```

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────┐
│   Frontend  │  React + Vite + TailwindCSS
│  (Port 3000)│  User interface
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │  Express + TypeScript
│  (Port 4000)│  REST API + WebSocket
└──────┬──────┘
       │
       ├──→ PostgreSQL (Database)
       ├──→ Redis (Queue + Cache)
       │
       ↓
┌─────────────┐
│   Scanner   │  TypeScript + simple-git
│   Worker    │  Code analysis engine
└─────────────┘
       │
       ↓
┌─────────────┐
│ AI Worker   │  OpenAI GPT-4
│             │  Generates explanations
└─────────────┘
```

### Data Flow

1. **User triggers scan** → Frontend sends request to Backend
2. **Backend creates scan** → Adds job to Redis queue
3. **Scanner worker picks up job** → Clones repo, analyzes code
4. **Scanner finds issues** → Saves to PostgreSQL
5. **AI worker processes issues** → Generates explanations
6. **Backend sends updates** → WebSocket to Frontend
7. **Frontend displays results** → User sees visualization

### Technology Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Socket.io Client
- Framer Motion

**Backend:**
- Node.js
- Express
- TypeScript
- PostgreSQL (pg)
- Redis (Bull queue)
- Socket.io
- JWT authentication

**Scanner:**
- TypeScript
- simple-git
- @typescript-eslint/parser
- AST traversal

**AI Worker:**
- OpenAI GPT-4 API
- Bull queue consumer

### Database Schema

**Key Tables:**
- `users` - GitHub user accounts
- `repositories` - Connected GitHub repos
- `scans` - Scan records with status
- `issues` - Detected code issues
- `ai_explanations` - AI-generated explanations
- `exorcisms` - Auto-fix records

---

## 📚 Additional Resources

### API Documentation

**Base URL:** `http://localhost:4000/api`

**Key Endpoints:**
- `POST /auth/github` - Initiate GitHub OAuth
- `GET /repositories` - List connected repos
- `POST /scans` - Trigger new scan
- `GET /scans/:id/results` - Get scan results
- `POST /exorcisms` - Trigger auto-fix

### File Structure

```
Project-Hackthon/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── pages/     # Dashboard, Login
│   │   ├── components/# UI components
│   │   └── api/       # API client
│   └── package.json
├── backend/           # Express backend
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── db/        # Database layer
│   │   └── websocket/ # Real-time updates
│   └── package.json
├── scanner/           # Code scanner
│   ├── src/
│   │   ├── rules/     # Detection rules
│   │   └── scanner.ts # Main scanner
│   └── package.json
├── workers/           # Background workers
│   └── ai/            # AI explanation worker
├── .env               # Environment variables
└── docker-compose.yml # Docker setup
```

### Useful Commands

```bash
# Start all services
.\start.ps1

# Clear stuck scans
node clear-stuck-scan.js

# Check system health
node verify-system-complete.js

# View recent scans
node check-recent-scans.js

# Run migrations
cd backend && npm run migrate

# Build for production
npm run build
```

---

## 🎓 Learning Path

### For New Users:
1. Read "What is CodeCrypt?"
2. Follow "Installation & Setup"
3. Complete "Running the Project"
4. Try "Using CodeCrypt" with a test repo
5. Understand "Scan Results"

### For Developers:
1. Review "Architecture Overview"
2. Explore the codebase
3. Read API documentation
4. Run tests
5. Check property-based testing docs

### For Contributors:
1. Read CONTRIBUTING.md
2. Check open issues
3. Follow coding standards
4. Write tests for new features
5. Submit pull requests

---

## 📞 Support

**Issues:** Create an issue on GitHub
**Questions:** Check troubleshooting section
**Updates:** Follow the project on GitHub

---

## 🎉 Quick Start Summary

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start database
docker-compose up -d postgres redis

# 4. Run migrations
cd backend && npm run migrate && cd ..

# 5. Start all services
.\start.ps1

# 6. Open browser
# http://localhost:3000

# 7. Connect GitHub and scan!
```

---

**Made with 🔮 by CodeCrypt Team**

*Last Updated: December 2024*
