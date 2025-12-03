#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import axios from 'axios';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const program = new Command();
const CONFIG_DIR = path.join(os.homedir(), '.codecrypt');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiUrl?: string;
  token?: string;
}

// Load configuration
function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore errors, return empty config
  }
  return {};
}

// Save configuration
function saveConfig(config: Config) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Failed to save configuration:'), error);
  }
}

// Create API client
function createApiClient() {
  const config = loadConfig();
  const apiUrl = config.apiUrl || 'http://localhost:4000';

  return axios.create({
    baseURL: `${apiUrl}/api`,
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
  });
}

program
  .name('codecrypt')
  .description('CodeCrypt CLI - Haunted code review for your terminal')
  .version('1.0.0');

// Auth command
program
  .command('auth')
  .description('Authenticate with CodeCrypt')
  .argument('<token>', 'API token from CodeCrypt dashboard')
  .option('--api-url <url>', 'API URL (default: http://localhost:4000)')
  .action((token: string, options: any) => {
    const config: Config = {
      token,
      apiUrl: options.apiUrl || 'http://localhost:4000',
    };

    saveConfig(config);
    console.log(chalk.green('✓ Authentication configured successfully'));
    console.log(chalk.gray(`API URL: ${config.apiUrl}`));
  });

// Scan command
program
  .command('scan')
  .description('Scan a local repository')
  .argument('[path]', 'Repository path (default: current directory)', '.')
  .option('-r, --remote <url>', 'Remote repository URL')
  .option('-b, --branch <branch>', 'Branch to scan (default: main)', 'main')
  .action(async (repoPath: string, options: any) => {
    const config = loadConfig();

    if (!config.token) {
      console.error(chalk.red('✗ Not authenticated. Run `codecrypt auth <token>` first.'));
      process.exit(1);
    }

    const spinner = ora('Scanning repository...').start();

    try {
      const apiClient = createApiClient();

      // Get repository info
      const fullPath = path.resolve(repoPath);
      const repoName = path.basename(fullPath);

      spinner.text = 'Uploading scan request...';

      // Trigger scan
      const { data: scanData } = await apiClient.post('/scans', {
        repositoryPath: fullPath,
        branch: options.branch,
      });

      const scanId = scanData.data.scanId;
      spinner.text = 'Scanning in progress...';

      // Poll for results
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (!completed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const { data: statusData } = await apiClient.get(`/scans/${scanId}`);
        const status = statusData.data.status;

        if (status === 'completed') {
          completed = true;
        } else if (status === 'failed') {
          spinner.fail('Scan failed');
          console.error(chalk.red(statusData.data.errorMessage || 'Unknown error'));
          process.exit(1);
        }

        attempts++;
      }

      if (!completed) {
        spinner.fail('Scan timed out');
        process.exit(1);
      }

      // Get results
      const { data: resultsData } = await apiClient.get(`/scans/${scanId}/results`);
      const results = resultsData.data;

      spinner.succeed('Scan completed!');

      // Display results
      console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
      console.log(chalk.bold.cyan(`  CodeCrypt Scan Results - ${repoName}`));
      console.log(chalk.bold.cyan('═'.repeat(60)) + '\n');

      // Summary
      console.log(chalk.bold('Summary:'));
      console.log(`  Total Files: ${chalk.yellow(results.scan.totalFiles)}`);
      console.log(`  Total Issues: ${chalk.yellow(results.scan.totalIssues)}`);
      console.log(`  Haunting Level: ${getHauntingLevelColor(results.scan.hauntingLevel)}\n`);

      // Issues by type
      const issuesByType: Record<string, number> = {};
      results.issues.forEach((issue: any) => {
        issuesByType[issue.hauntingType] = (issuesByType[issue.hauntingType] || 0) + 1;
      });

      console.log(chalk.bold('Issues by Type:'));
      Object.entries(issuesByType).forEach(([type, count]) => {
        const icon = getHauntingIcon(type);
        console.log(`  ${icon} ${chalk.cyan(type)}: ${chalk.yellow(count)}`);
      });

      // Issues table
      if (results.issues.length > 0) {
        console.log('\n' + chalk.bold('Issues:'));

        const table = new Table({
          head: [
            chalk.bold('Type'),
            chalk.bold('Severity'),
            chalk.bold('File'),
            chalk.bold('Line'),
            chalk.bold('Message'),
          ],
          colWidths: [12, 10, 30, 8, 40],
          wordWrap: true,
          style: {
            head: [],
            border: [],
          },
        });

        results.issues.slice(0, 20).forEach((issue: any) => {
          table.push([
            getHauntingIcon(issue.hauntingType) + ' ' + issue.hauntingType,
            getSeverityColor(issue.severity),
            chalk.gray(truncate(issue.filePath, 28)),
            chalk.gray(issue.startLine.toString()),
            truncate(issue.message, 38),
          ]);
        });

        console.log(table.toString());

        if (results.issues.length > 20) {
          console.log(chalk.gray(`\n  ... and ${results.issues.length - 20} more issues`));
        }
      }

      console.log('\n' + chalk.gray('View full results at: ') + chalk.cyan(`${config.apiUrl}/scan/${scanId}`));
    } catch (error: any) {
      spinner.fail('Scan failed');
      console.error(chalk.red('Error:'), error.response?.data?.error?.message || error.message);
      process.exit(1);
    }
  });

// Helper functions
function getHauntingIcon(type: string): string {
  const icons: Record<string, string> = {
    ghost: '👻',
    zombie: '🧟',
    vampire: '🧛',
    skeleton: '💀',
    monster: '👹',
  };
  return icons[type] || '❓';
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, any> = {
    critical: chalk.red.bold,
    high: chalk.red,
    medium: chalk.yellow,
    low: chalk.gray,
  };
  const colorFn = colors[severity] || chalk.white;
  return colorFn(severity.toUpperCase());
}

function getHauntingLevelColor(level: string): string {
  if (level.includes('Severely')) return chalk.red.bold(level);
  if (level.includes('Moderately')) return chalk.yellow(level);
  if (level.includes('Mildly')) return chalk.green(level);
  return chalk.cyan(level);
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

program.parse();
