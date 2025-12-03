/**
 * Frontend test utility functions for property-based testing
 */

/**
 * Check if two arrays are equal ignoring order
 */
export function arraysEqualIgnoreOrder<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

/**
 * Check if an array is sorted
 */
export function isSorted<T>(
  arr: T[],
  compareFn?: (a: T, b: T) => number
): boolean {
  for (let i = 1; i < arr.length; i++) {
    const comparison = compareFn
      ? compareFn(arr[i - 1], arr[i])
      : String(arr[i - 1]).localeCompare(String(arr[i]));
    if (comparison > 0) return false;
  }
  return true;
}

/**
 * Check if an array is sorted in descending order
 */
export function isSortedDescending<T>(
  arr: T[],
  compareFn?: (a: T, b: T) => number
): boolean {
  for (let i = 1; i < arr.length; i++) {
    const comparison = compareFn
      ? compareFn(arr[i - 1], arr[i])
      : String(arr[i - 1]).localeCompare(String(arr[i]));
    if (comparison < 0) return false;
  }
  return true;
}

/**
 * Check if a string contains a search term (case-insensitive)
 */
export function containsSearchTerm(text: string, searchTerm: string): boolean {
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Check if an issue matches filter criteria
 */
export function matchesFilter(
  issue: any,
  filter: {
    hauntingTypes?: string[];
    severities?: string[];
    filePaths?: string[];
    searchTerm?: string;
  }
): boolean {
  // Check haunting type filter
  if (
    filter.hauntingTypes &&
    filter.hauntingTypes.length > 0 &&
    !filter.hauntingTypes.includes(issue.hauntingType)
  ) {
    return false;
  }

  // Check severity filter
  if (
    filter.severities &&
    filter.severities.length > 0 &&
    !filter.severities.includes(issue.severity)
  ) {
    return false;
  }

  // Check file path filter
  if (
    filter.filePaths &&
    filter.filePaths.length > 0 &&
    !filter.filePaths.some((path) => issue.filePath.includes(path))
  ) {
    return false;
  }

  // Check search term
  if (filter.searchTerm && filter.searchTerm.length > 0) {
    const searchLower = filter.searchTerm.toLowerCase();
    const matchesSearch =
      issue.filePath.toLowerCase().includes(searchLower) ||
      issue.message.toLowerCase().includes(searchLower) ||
      (issue.codeSnippet &&
        issue.codeSnippet.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;
  }

  return true;
}

/**
 * Get severity order for sorting
 */
export function getSeverityOrder(severity: string): number {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return order[severity] ?? 999;
}

/**
 * Compare issues by severity
 */
export function compareBySeverity(a: any, b: any): number {
  return getSeverityOrder(a.severity) - getSeverityOrder(b.severity);
}

/**
 * Compare issues by file path (alphabetical)
 */
export function compareByFilePath(a: any, b: any): number {
  return a.filePath.localeCompare(b.filePath);
}

/**
 * Check if a value is within range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Group array items by a key
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Count occurrences in an array
 */
export function countBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, number> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<K, number>);
}

/**
 * Get unique items from array
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Intersection of two arrays
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

/**
 * Difference of two arrays (items in arr1 but not in arr2)
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**
 * Check if array is monotonically increasing
 */
export function isMonotonicallyIncreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Check if array is monotonically decreasing
 */
export function isMonotonicallyDecreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i - 1]) return false;
  }
  return true;
}

/**
 * Validate JSON format
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate CSV format
 */
export function isValidCSV(csv: string): boolean {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return false;

  const headerCols = lines[0].split(',').length;
  return lines.slice(1).every((line) => {
    const cols = line.split(',').length;
    return cols === headerCols;
  });
}

/**
 * Check if all items in array satisfy predicate
 */
export function all<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.every(predicate);
}

/**
 * Check if any item in array satisfies predicate
 */
export function any<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.some(predicate);
}

/**
 * Calculate quality score from issue counts
 */
export function calculateQualityScore(issues: {
  ghost: number;
  zombie: number;
  vampire: number;
  skeleton: number;
  monster: number;
}): number {
  const weights = {
    ghost: 0.15,
    zombie: 0.2,
    vampire: 0.25,
    skeleton: 0.2,
    monster: 0.2,
  };

  const maxIssues = 100; // Assume 100 issues = 0 score
  const totalWeightedIssues =
    (issues.ghost / maxIssues) * weights.ghost +
    (issues.zombie / maxIssues) * weights.zombie +
    (issues.vampire / maxIssues) * weights.vampire +
    (issues.skeleton / maxIssues) * weights.skeleton +
    (issues.monster / maxIssues) * weights.monster;

  const score = Math.max(0, Math.min(100, 100 - totalWeightedIssues * 100));
  return Math.round(score);
}

/**
 * Check if theme is persisted in localStorage
 */
export function isThemePersisted(theme: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('theme') === theme;
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * Mock sessionStorage for testing
 */
export class MockSessionStorage extends MockLocalStorage {}

