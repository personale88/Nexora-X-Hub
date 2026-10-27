export type NavTab =
  | 'dashboard'
  | 'repositories'
  | 'issues'
  | 'fix'
  | 'verification'
  | 'history'
  | 'live-fix'
  | 'courses'
  | 'practice';

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

export type AuthProvider = 'google' | 'git' | 'mobile';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: AuthProvider;
  role: string;
  gitUsername?: string;
  verifiedAt: string;
}

export type RepairJobStatus =
  | 'QUEUED'
  | 'INITIALIZING'
  | 'REPRODUCING'
  | 'INVESTIGATING'
  | 'DIAGNOSING'
  | 'PATCHING'
  | 'TESTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NEEDS_REVIEW';

export interface RepairEvent {
  eventId: string;
  jobId: string;
  sequence: number;
  type: string;
  timestamp: string;
  stage: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface RepairJobDiagnosis {
  rootCause: string;
  affectedFile: string;
  startLine: number;
  endLine: number;
  explanation: string;
  flawExplanation?: string;
  attackScenario?: string;
  fixRationale?: string;
  rule?: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RepairJobPatch {
  file: string;
  beforeCode: string;
  afterCode: string;
  unifiedDiff: string;
  additions: number;
  deletions: number;
  explanation: string;
  appliedSuccessfully: boolean;
}

export interface RepairJobTestRun {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: string;
  stage: 'reproduction' | 'verification' | 'regression';
  passed: boolean;
}

export interface RepairJob {
  id: string;
  userId: string;
  repository: {
    owner: string;
    name: string;
    branch: string;
    gitUrl: string;
    pinnedCommitSha: string;
    localPath?: string;
  };
  issueDescription: string;
  issueCode?: string;
  reproductionEvidence?: string;
  status: RepairJobStatus;
  currentStage: string;
  diagnosis?: RepairJobDiagnosis;
  proposedPatch?: RepairJobPatch;
  testRuns: RepairJobTestRun[];
  retryCount: number;
  maxRetries: number;
  verificationOutcome: 'VERIFIED' | 'FAILED' | 'INCOMPLETE' | 'NEEDS_REVIEW';
  unresolvedRisks: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

// ==========================================
// Learning Platform & Academy Interfaces
// ==========================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'concept' | 'interactive_lab' | 'quiz';
  summary: string;
  content: string[];
  keyTakeaways?: string[];
  codeExample?: {
    language: string;
    code: string;
    description: string;
  };
  practiceChallengeId?: string;
  quiz?: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category:
    | 'Debugging & Errors'
    | 'JavaScript & TypeScript'
    | 'Python & Algorithms'
    | 'Security & Auth'
    | 'React & Architecture'
    | 'Java & Backend'
    | 'C & Systems Programming';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  xp: number;
  badge: string;
  iconName: string;
  color: string;
  modules: CourseModule[];
  skillsGained: string[];
}

// ==========================================
// Code Practicing Space & Error Explainer
// ==========================================

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'go'
  | 'rust';

export interface TestCase {
  id: string;
  name: string;
  inputDescription: string;
  expectedOutput: string;
  codeSnippetToRun?: string;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: SupportedLanguage;
  category: 'Error Debugging' | 'Algorithms' | 'Async & Promises' | 'Security' | 'State & Closures';
  description: string;
  errorNameTarget: string;
  initialCode: string;
  solutionCode: string;
  hints: string[];
  testCases: TestCase[];
  relatedCourseId?: string;
  relatedLessonId?: string;
}

export interface ErrorExplanation {
  errorName: string;
  errorMessage: string;
  failingLine?: number;
  codeContext?: string;
  whyThisHappened: string;
  conceptTitle: string;
  conceptDeepDive: string;
  analogy: string;
  mentalModelDiagram?: string;
  suggestedFixBefore: string;
  suggestedFixAfter: string;
  fixExplanation: string;
  bestPractices: string[];
  relatedLesson?: {
    courseId: string;
    lessonId: string;
    title: string;
  };
}

export interface LiveDiagnostic {
  hasError: boolean;
  type: 'syntax' | 'runtime_warning' | 'security' | 'clean';
  title: string;
  line?: number;
  codeSnippet?: string;
  whereIsMistake: string;
  whyIsError: string;
  howToFix: string;
}
