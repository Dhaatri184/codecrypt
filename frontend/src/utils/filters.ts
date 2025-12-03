import { IssueFilters, HauntingType, Severity } from '../hooks/useFilters';

export interface Issue {
  id: string;
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  codeSnippet: string;
  ruleId: string;
  createdAt: Date;
  dismissed?: boolean;
}

/**
 * Filter issues based on filter criteria
 */
export function filterIssues(issues: Issue[], filters: IssueFilters): Issue[] {
  return issues.filter((issue) => {
    // Filter by haunting type
    if (
      filters.hauntingTypes.length > 0 &&
      !filters.hauntingTypes.includes(issue.hauntingType)
    ) {
      return false;
    }

    // Filter by severity
    if (
      filters.severities.length > 0 &&
      !filters.severities.includes(issue.severity)
    ) {
      return false;
    }

    // Filter by file path
    if (filters.filePaths.length > 0) {
      const matchesPath = filters.filePaths.some((path) =>
        issue.filePath.includes(path)
      );
      if (!matchesPath) return false;
    }

    // Filter by search term
    if (filters.searchTerm && filters.searchTerm.length > 0) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        issue.filePath.toLowerCase().includes(searchLower) ||
        issue.message.toLowerCase().includes(searchLower) ||
        (issue.codeSnippet &&
          issue.codeSnippet.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Filter by dismissed status
    if (!filters.showDismissed && issue.dismissed) {
      return false;
    }

    return true;
  });
}

/**
 * Get filtered issue counts
 */
export function getFilteredCounts(
  issues: Issue[],
  filters: IssueFilters
): { filtered: number; total: number } {
  const filtered = filterIssues(issues, filters);
  return {
    filtered: filtered.length,
    total: issues.length,
  };
}

/**
 * Get unique file paths from issues
 */
export function getUniqueFilePaths(issues: Issue[]): string[] {
  const paths = new Set(issues.map((issue) => issue.filePath));
  return Array.from(paths).sort();
}

/**
 * Get issue counts by haunting type
 */
export function getIssueCountsByType(
  issues: Issue[]
): Record<HauntingType, number> {
  const counts: Record<HauntingType, number> = {
    ghost: 0,
    zombie: 0,
    vampire: 0,
    skeleton: 0,
    monster: 0,
  };

  issues.forEach((issue) => {
    counts[issue.hauntingType]++;
  });

  return counts;
}

/**
 * Get issue counts by severity
 */
export function getIssueCountsBySeverity(
  issues: Issue[]
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  issues.forEach((issue) => {
    counts[issue.severity]++;
  });

  return counts;
}

/**
 * Check if an issue matches the search term
 */
export function matchesSearchTerm(issue: Issue, searchTerm: string): boolean {
  if (!searchTerm || searchTerm.length === 0) return true;

  const searchLower = searchTerm.toLowerCase();
  return (
    issue.filePath.toLowerCase().includes(searchLower) ||
    issue.message.toLowerCase().includes(searchLower) ||
    (!!issue.codeSnippet && issue.codeSnippet.toLowerCase().includes(searchLower))
  );
}

/**
 * Get filter summary text
 */
export function getFilterSummary(filters: IssueFilters): string {
  const parts: string[] = [];

  if (filters.hauntingTypes.length > 0) {
    parts.push(`${filters.hauntingTypes.length} type(s)`);
  }

  if (filters.severities.length > 0) {
    parts.push(`${filters.severities.length} severity level(s)`);
  }

  if (filters.filePaths.length > 0) {
    parts.push(`${filters.filePaths.length} file(s)`);
  }

  if (filters.searchTerm) {
    parts.push(`search: "${filters.searchTerm}"`);
  }

  if (filters.showDismissed === true) {
    parts.push('including dismissed');
  }

  return parts.length > 0 ? parts.join(', ') : 'No filters applied';
}

