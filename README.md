# 👻 CodeCrypt - Haunted Code Review System

> Transform technical debt into literal hauntings. Visualize code quality issues as ghosts, zombies, vampires, skeletons, and monsters.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎃 Overview

CodeCrypt is a code quality analysis tool that gamifies technical debt by visualizing issues as "hauntings" in a spooky interface. Connect your GitHub repository, scan your code, and watch as technical debt manifests as literal monsters haunting your codebase.

### Haunting Types

- 👻 **Ghosts** - Dead code (unused variables, functions, imports)
- 🧟 **Zombies** - Deprecated dependencies and legacy patterns
- 🧛 **Vampires** - Performance issues (memory leaks, inefficient algorithms)
- 💀 **Skeletons** - Missing tests and documentation
- 👹 **Monsters** - High complexity functions

## ✨ Features

- 🔗 **GitHub Integration** - Connect repositories via OAuth
- 🔍 **Smart Scanning** - Static analysis with AST parsing
- 🤖 **AI Explanations** - GPT-4 powered issue explanations and fix suggestions
- 🎨 **Haunted Visualization** - Interactive spooky UI with animations
- 🔧 **Auto-Fix (Exorcism)** - Automatically fix issues and create PRs
- ⚡ **Real-time Updates** - WebSocket-powered live monitoring
- 💻 **CLI Tool** - Scan local repositories from terminal
- 📊 **Metrics & History** - Track technical debt over time

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- GitHub OAuth App (for authentication)
- OpenAI API Key (for AI explanations)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Dhaatri184/codecrypt.git
cd codecrypt
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start with Docker Compose**
```bash
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## 🏗️ Architecture

```
codecrypt/
├── frontend/          # React + TypeScript UI
├── backend/           # Express API server
├── scanner/           # Code analysis engine
├── workers/           # Background job processors
│   └── ai/           # AI explanation service
├── packages/
│   └── shared/       # Shared types and utilities
└── docker-compose.yml
```

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## 📖 Documentation

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Haunting Detection Rules](./docs/RULES.md)

## 🎯 Hackathon Category

**Frankenstein** - Stitching together GitHub API, static analysis, AI, real-time updates, and visualization into one powerful system.

### Kiro Features Showcased

- ✅ **Spec-driven Development** - Complete requirements, design, and task breakdown
- ✅ **Property-based Testing** - 40+ correctness properties with fast-check
- ✅ **Agent Hooks** - Auto-scan on file save
- ✅ **Steering Docs** - Custom code quality rules
- ✅ **MCP Integration** - GitHub API and AI service extensions

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with [Kiro](https://kiro.ai) - AI-powered development environment

---

**Made with 💀 for the Kiro Hackathon**
