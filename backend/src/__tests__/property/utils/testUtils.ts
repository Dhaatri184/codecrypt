/**
 * Test utility functions for property-based testing
 */

/**
 * Mock date/time for consistent testing
 */
export class MockDate {
  private originalDate: DateConstructor;
  private mockTime: number;

  constructor(mockTime: Date | number = new Date('2024-01-01T00:00:00Z')) {
    this.originalDate = global.Date;
    this.mockTime = typeof mockTime === 'number' ? mockTime : mockTime.getTime();
  }

  install(): void {
    const mockTime = this.mockTime;
    // @ts-ignore
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockTime);
        } else {
          super(...args);
        }
      }

      static now(): number {
        return mockTime;
      }
    } as DateConstructor;
  }

  uninstall(): void {
    global.Date = this.originalDate;
  }

  advance(ms: number): void {
    this.mockTime += ms;
  }

  set(date: Date | number): void {
    this.mockTime = typeof date === 'number' ? date : date.getTime();
  }
}

/**
 * Create a mock date instance for testing
 */
export function mockDate(date?: Date | number): MockDate {
  return new MockDate(date);
}

/**
 * Sleep for testing async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a deterministic hash for testing
 */
export function generateTestHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
}

/**
 * Compare two arrays ignoring order
 */
export function arraysEqualIgnoreOrder<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

/**
 * Deep clone an object for testing
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is within a range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Generate a random subset of an array
 */
export function randomSubset<T>(arr: T[], size?: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const subsetSize = size ?? Math.floor(Math.random() * arr.length);
  return shuffled.slice(0, subsetSize);
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate the difference between two dates in days
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}

/**
 * Check if an array is sorted
 */
export function isSorted<T>(arr: T[], compareFn?: (a: T, b: T) => number): boolean {
  for (let i = 1; i < arr.length; i++) {
    const comparison = compareFn ? compareFn(arr[i - 1], arr[i]) : (arr[i - 1] as any) - (arr[i] as any);
    if (comparison > 0) return false;
  }
  return true;
}

/**
 * Check if an array is sorted in descending order
 */
export function isSortedDescending<T>(arr: T[], compareFn?: (a: T, b: T) => number): boolean {
  for (let i = 1; i < arr.length; i++) {
    const comparison = compareFn ? compareFn(arr[i - 1], arr[i]) : (arr[i - 1] as any) - (arr[i] as any);
    if (comparison < 0) return false;
  }
  return true;
}

/**
 * Group array items by a key function
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
 * Count occurrences of items in an array
 */
export function countOccurrences<T>(arr: T[]): Map<T, number> {
  return arr.reduce((acc, item) => {
    acc.set(item, (acc.get(item) || 0) + 1);
    return acc;
  }, new Map<T, number>());
}

/**
 * Check if a string contains all search terms
 */
export function containsAllTerms(text: string, terms: string[]): boolean {
  const lowerText = text.toLowerCase();
  return terms.every(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Check if a string contains any search term
 */
export function containsAnyTerm(text: string, terms: string[]): boolean {
  const lowerText = text.toLowerCase();
  return terms.some(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Validate CSV format
 */
export function isValidCSV(csv: string): boolean {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return false; // Need at least header and one row
  
  const headerCols = lines[0].split(',').length;
  return lines.slice(1).every(line => {
    const cols = line.split(',').length;
    return cols === headerCols;
  });
}

/**
 * Parse CSV for testing
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return headers.reduce((obj, header, idx) => {
      obj[header] = values[idx] || '';
      return obj;
    }, {} as Record<string, string>);
  });
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Check if a number is monotonically increasing in an array
 */
export function isMonotonicallyIncreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Check if a number is monotonically decreasing in an array
 */
export function isMonotonicallyDecreasing(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i - 1]) return false;
  }
  return true;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  multiplier: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Verify all items in array satisfy a predicate
 */
export function all<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.every(predicate);
}

/**
 * Verify at least one item in array satisfies a predicate
 */
export function any<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.some(predicate);
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
  return arr1.filter(item => set2.has(item));
}

/**
 * Difference of two arrays (items in arr1 but not in arr2)
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => !set2.has(item));
}

/**
 * Union of two arrays
 */
export function union<T>(arr1: T[], arr2: T[]): T[] {
  return unique([...arr1, ...arr2]);
}

