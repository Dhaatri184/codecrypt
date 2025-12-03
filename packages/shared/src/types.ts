// Core domain types
export type HauntingType = 'ghost' | 'zombie' | 'vampire' | 'skeleton' | 'monster';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ScanStatus = 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed' | 'cancelled';
export type ExorcismStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface User {
  id: string;
  githubId: string;
  githubUsername: string;
  accessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  id: string;
  userId: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  lastScanAt?: Date;
  createdAt: Date;
}

export interface Scan {
  id: string;
  repositoryId: string;
  status: ScanStatus;
  commitSha?: string;
  totalFiles?: number;
  totalIssues?: number;
  hauntingLevel?: string;
  
  // Progress tracking fields
  progressPercentage: number;
  filesProcessed: number;
  totalFilesDiscovered: number;
  currentStatusMessage?: string;
  cancelledAt?: Date;
  
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface Issue {
  id: string;
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
  createdAt: Date;
}

export interface AIExplanation {
  id: string;
  issueId: string;
  explanation: string;
  fixSuggestion?: string;
  codeExample?: string;
  generatedAt: Date;
}

export interface Exorcism {
  id: string;
  issueId: string;
  status: ExorcismStatus;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Scanner types
export interface ScanResults {
  scanId: string;
  repositoryId: string;
  commitSha: string;
  totalFiles: number;
  totalIssues: number;
  issuesByType: Record<HauntingType, number>;
  hauntingLevel: string;
  issues: Issue[];
  scannedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'scan_update' | 'scan_complete' | 'scan_error' | 'issue_update';
  payload: any;
  timestamp: Date;
}
