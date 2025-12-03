# CodeCrypt CLI

Command-line interface for CodeCrypt - scan your repositories from the terminal.

## Installation

```bash
npm install -g @codecrypt/cli
```

## Usage

### Authentication

First, authenticate with your CodeCrypt API token:

```bash
codecrypt auth <your-api-token>
```

You can also specify a custom API URL:

```bash
codecrypt auth <your-api-token> --api-url https://api.codecrypt.dev
```

### Scanning

Scan the current directory:

```bash
codecrypt scan
```

Scan a specific directory:

```bash
codecrypt scan /path/to/repository
```

Scan a specific branch:

```bash
codecrypt scan --branch develop
```

## Output

The CLI displays:
- Summary statistics (total files, issues, haunting level)
- Issues grouped by type (ghost, zombie, vampire, skeleton, monster)
- Detailed table of issues with file paths, line numbers, and messages
- Link to view full results in the web interface

## Configuration

Configuration is stored in `~/.codecrypt/config.json`
