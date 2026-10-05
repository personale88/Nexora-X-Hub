export type NavTab = 'dashboard' | 'repositories' | 'issues' | 'fix' | 'verification' | 'history';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: string;
  hasIssue?: boolean;
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface CodeHealth {
  architecture: { status: 'Good' | 'Warning' | 'Critical'; score: number; label: string };
  dependencies: { status: 'Good' | 'Warning' | 'Critical'; count: number; label: string };
  security: { status: 'Good' | 'Warning' | 'Critical'; vulnerabilities: number; label: string };
  testing: { status: 'Good' | 'Warning' | 'Critical'; coverage: number; label: string };
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

export interface RepositoryData {
  id: string;
  name: string;
  description: string;
  branch: string;
  stack: string[];
  metrics: {
    files: number;
    linesOfCode: string;
    testCoverage: string;
    dependencies: number;
  };
  languages: LanguageStat[];
  health: CodeHealth;
  status: string;
  activeIssueId: string;
  gitUrl?: string;
  stars?: number;
}

export interface DetectedIssue {
  id: string;
  code: string; // e.g. AUTH-104
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  confidence: number; // e.g. 96
  affectedFile: string;
  lines: string;
  rootCause: string;
  impact: string;
  discoveryDate: string;
}

export interface ReasoningStep {
  id: string;
  text: string;
  detail?: string;
  status: 'pending' | 'in_progress' | 'completed';
  durationMs?: number;
}

export interface DiffLine {
  type: 'context' | 'deletion' | 'addition';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface CodePatch {
  file: string;
  linesChanged: number;
  additions: number;
  deletions: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  beforeCode: string;
  afterCode: string;
  diffLines: DiffLine[];
}

export interface RegressionTest {
  filename: string;
  description: string;
  suiteName: string;
  code: string;
  framework: string;
}

export interface VerificationResult {
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  confidence: number;
  securityChecks: {
    name: string;
    status: 'PASS' | 'FAIL';
    details: string;
  }[];
  regressionTests: {
    name: string;
    status: 'PASS' | 'FAIL';
    durationMs: number;
  }[];
  logs: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  issueCode: string;
  title: string;
  action: 'Fixed + Verified' | 'Analyzed' | 'Completed' | 'Investigated';
  status: 'success' | 'warning' | 'info';
  confidence?: number;
  repository: string;
  file: string;
}
