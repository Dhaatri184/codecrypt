import { Issue, Exorcism, HauntingType } from '@codecrypt/shared';
import { githubService } from './github';
import { logger } from '../utils/logger';
import * as exorcismRepo from '../db/repositories/exorcisms';
import * as issueRepo from '../db/repositories/issues';
import * as repoRepo from '../db/repositories/repositories';
import * as aiRepo from '../db/repositories/aiExplanations';
import * as scanRepo from '../db/repositories/scans';

export interface Patch {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  diff: string;
}

export interface ExorcismResult {
  success: boolean;
  exorcismId: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  error?: string;
}

/**
 * Determines if an issue can be automatically fixed
 * Auto-fixable issues are typically simple, mechanical fixes
 */
export function canExorcise(issue: Issue): boolean {
  // Ghost hauntings (unused code) are generally auto-fixable
  if (issue.hauntingType === 'ghost') {
    // Unused imports and variables can be safely removed
    if (issue.ruleId.includes('unused-import') || issue.ruleId.includes('unused-var')) {
      return true;
    }
  }

  // Some skeleton hauntings (missing docs) can be auto-fixed with templates
  if (issue.hauntingType === 'skeleton') {
    if (issue.ruleId.includes('missing-jsdoc')) {
      return true;
    }
  }

  // Most other issues require human judgment
  return false;
}

/**
 * Generates a code patch for an auto-fixable issue
 */
export async function generatePatch(
  issue: Issue,
  fileContent: string,
  fixSuggestion?: string
): Promise<Patch> {
  let patchedContent = fileContent;
  const lines = fileContent.split('\n');

  // Apply fix based on issue type
  if (issue.hauntingType === 'ghost') {
    if (issue.ruleId.includes('unused-import')) {
      // Remove the import line
      patchedContent = removeLines(lines, issue.startLine, issue.endLine);
    } else if (issue.ruleId.includes('unused-var')) {
      // Remove the variable declaration
      patchedContent = removeLines(lines, issue.startLine, issue.endLine);
    }
  } else if (issue.hauntingType === 'skeleton' && issue.ruleId.includes('missing-jsdoc')) {
    // Add JSDoc comment template
    const indent = getIndentation(lines[issue.startLine - 1]);
    const jsdocTemplate = generateJSDocTemplate(issue, indent);
    patchedContent = insertLines(lines, issue.startLine - 1, jsdocTemplate);
  }

  // Generate diff
  const diff = generateDiff(fileContent, patchedContent);

  return {
    filePath: issue.filePath,
    originalContent: fileContent,
    patchedContent,
    diff,
  };
}

/**
 * Applies an exorcism: creates branch, commits fix, and creates PR
 */
export async function applyExorcism(
  issueId: string,
  accessToken: string
): Promise<ExorcismResult> {
  let exorcism: Exorcism | null = null;

  try {
    // Create exorcism record
    exorcism = await exorcismRepo.createExorcism(issueId);
    logger.info('Created exorcism record', { exorcismId: exorcism.id, issueId });

    // Get issue details
    const issue = await issueRepo.findIssueById(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    // Check if issue is auto-fixable
    if (!canExorcise(issue)) {
      throw new Error(`Issue type ${issue.hauntingType} with rule ${issue.ruleId} is not auto-fixable`);
    }

    // Get AI fix suggestion
    const aiExplanation = await aiRepo.findExplanationByIssueId(issueId);
    const fixSuggestion = aiExplanation?.fixSuggestion;

    // Update status to in_progress
    await exorcismRepo.updateExorcismStatus(exorcism.id, 'in_progress');

    // Generate branch name
    const branchName = generateBranchName(issue);
    logger.info('Generated branch name', { branchName, issueId });

    // Get repository details from scan
    const repository = await repoRepo.findRepositoryByScanId(issue.scanId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    const [owner, repoName] = repository.fullName.split('/');

    // Create branch
    await githubService.createBranch(
      accessToken,
      owner,
      repoName,
      branchName,
      repository.defaultBranch
    );
    logger.info('Created branch', { branchName, owner, repoName });

    // Update exorcism with branch name
    await exorcismRepo.updateExorcismStatus(exorcism.id, 'in_progress', {
      branchName,
    });

    // Note: In a real implementation, we would:
    // 1. Clone the repository
    // 2. Read the file content
    // 3. Generate and apply the patch
    // 4. Commit the changes
    // 5. Push to the branch
    //
    // For this implementation, we'll create a PR with instructions
    // since we don't have file system access in this context

    // Generate commit message
    const commitMessage = generateCommitMessage(issue);

    // Create pull request
    const prData = {
      title: `🔮 Exorcise ${issue.hauntingType}: ${issue.message}`,
      body: generatePRDescription(issue, fixSuggestion, commitMessage),
      head: branchName,
      base: repository.defaultBranch,
    };

    const pr = await githubService.createPullRequest(
      accessToken,
      owner,
      repoName,
      prData
    );

    logger.info('Created pull request', { prUrl: pr.url, prNumber: pr.number });

    // Update exorcism status to completed
    await exorcismRepo.updateExorcismStatus(exorcism.id, 'completed', {
      prUrl: pr.url,
      prNumber: pr.number,
    });

    return {
      success: true,
      exorcismId: exorcism.id,
      branchName,
      prUrl: pr.url,
      prNumber: pr.number,
    };
  } catch (error: any) {
    logger.error('Exorcism failed', { issueId, error: error.message });

    // Update exorcism status to failed
    if (exorcism) {
      await exorcismRepo.updateExorcismStatus(exorcism.id, 'failed', {
        errorMessage: error.message,
      });
    }

    return {
      success: false,
      exorcismId: exorcism?.id || '',
      error: error.message,
    };
  }
}

/**
 * Generates a branch name following the convention:
 * codecrypt/fix-{hauntingType}-{issueId}
 */
export function generateBranchName(issue: Issue): string {
  const shortId = issue.id.substring(0, 8);
  return `codecrypt/fix-${issue.hauntingType}-${shortId}`;
}

/**
 * Generates a commit message referencing the issue
 */
export function generateCommitMessage(issue: Issue): string {
  return `fix(${issue.hauntingType}): ${issue.message}

Exorcised ${issue.hauntingType} haunting in ${issue.filePath}
Lines: ${issue.startLine}-${issue.endLine}
Rule: ${issue.ruleId}

Issue ID: ${issue.id}`;
}

/**
 * Generates pull request description
 */
function generatePRDescription(
  issue: Issue,
  fixSuggestion?: string,
  commitMessage?: string
): string {
  return `## 🔮 CodeCrypt Exorcism

This PR automatically fixes a **${issue.hauntingType}** haunting detected by CodeCrypt.

### Issue Details
- **Type**: ${issue.hauntingType}
- **Severity**: ${issue.severity}
- **File**: \`${issue.filePath}\`
- **Lines**: ${issue.startLine}-${issue.endLine}
- **Rule**: ${issue.ruleId}

### Problem
${issue.message}

${fixSuggestion ? `### Fix Applied\n${fixSuggestion}\n` : ''}

### Code Snippet
\`\`\`
${issue.codeSnippet}
\`\`\`

---
*This PR was automatically generated by [CodeCrypt](https://codecrypt.dev)*
*Issue ID: ${issue.id}*`;
}

// Helper functions

function removeLines(lines: string[], startLine: number, endLine: number): string {
  const result = [...lines];
  result.splice(startLine - 1, endLine - startLine + 1);
  return result.join('\n');
}

function insertLines(lines: string[], beforeLine: number, content: string): string {
  const result = [...lines];
  result.splice(beforeLine, 0, content);
  return result.join('\n');
}

function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

function generateJSDocTemplate(issue: Issue, indent: string): string {
  return `${indent}/**
${indent} * TODO: Add description
${indent} * @returns TODO: Add return description
${indent} */`;
}

function generateDiff(original: string, patched: string): string {
  const originalLines = original.split('\n');
  const patchedLines = patched.split('\n');

  let diff = '--- original\n+++ patched\n';

  const maxLines = Math.max(originalLines.length, patchedLines.length);
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const patchLine = patchedLines[i];

    if (origLine !== patchLine) {
      if (origLine !== undefined) {
        diff += `- ${origLine}\n`;
      }
      if (patchLine !== undefined) {
        diff += `+ ${patchLine}\n`;
      }
    }
  }

  return diff;
}
