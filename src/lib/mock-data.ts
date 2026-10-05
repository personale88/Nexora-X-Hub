import { RepositoryData, DetectedIssue, CodePatch, RegressionTest, HistoryItem, FileNode } from './types';

export const ACTIVE_REPO: RepositoryData = {
  id: 'Nexora-X-Hub',
  name: 'Nexora-X-Hub',
  gitUrl: 'https://github.com/personale88/Nexora-X-Hub.git',
  description: 'AI-Powered Autonomous Debugging, AST Symbol Verification & Autonomous PR Engine',
  branch: 'main',
  stack: ['Next.js', 'React', 'TypeScript', 'TailwindCSS', 'AST Analysis'],
  metrics: {
    files: 48,
    linesOfCode: '14.8k',
    testCoverage: '94%',
    dependencies: 19,
  },
  languages: [
    { name: 'TypeScript', percentage: 78, color: '#3178C6' },
    { name: 'CSS', percentage: 14, color: '#563d7c' },
    { name: 'JSON', percentage: 8, color: '#00B4D8' },
  ],
  health: {
    architecture: { status: 'Good', score: 98, label: 'Clean Next.js App Router Structure' },
    dependencies: { status: 'Good', count: 0, label: '0 High CVE Vulnerabilities' },
    security: { status: 'Warning', vulnerabilities: 1, label: '1 Critical Auth Signature Gap' },
    testing: { status: 'Good', coverage: 94, label: '94% AST Regression Test Coverage' },
  },
  status: '1 high-confidence issue detected',
  activeIssueId: 'AUTH-104',
  stars: 12,
};

export const AVAILABLE_REPOSITORIES: RepositoryData[] = [
  ACTIVE_REPO,
  {
    id: 'Yantriksha-X-Hub',
    name: 'Yantriksha-X-Hub',
    gitUrl: 'https://github.com/personale88/Yantriksha-X-Hub.git',
    description: 'Autonomous Aerospace & Telemetry Microservices Hub',
    branch: 'main',
    stack: ['TypeScript', 'Python', 'Docker', 'FastAPI'],
    metrics: {
      files: 86,
      linesOfCode: '22.4k',
      testCoverage: '91%',
      dependencies: 24,
    },
    languages: [
      { name: 'TypeScript', percentage: 65, color: '#3178C6' },
      { name: 'Python', percentage: 25, color: '#3572A5' },
      { name: 'Shell', percentage: 10, color: '#89e051' },
    ],
    health: {
      architecture: { status: 'Good', score: 95, label: 'Modular Service Decoupling' },
      dependencies: { status: 'Good', count: 0, label: 'All dependencies verified' },
      security: { status: 'Good', vulnerabilities: 0, label: '0 Active Security Advisories' },
      testing: { status: 'Good', coverage: 91, label: '91% Pipeline Automated Tests' },
    },
    status: 'All automated tests passing',
    activeIssueId: 'AUTH-104',
    stars: 8,
  },
  {
    id: 'vulnerability-assessment-report',
    name: 'vulnerability-assessment-report',
    gitUrl: 'https://github.com/personale88/vulnerability-assessment-report.git',
    description: 'Automated Security Audit & CVE Static Vulnerability Analysis System',
    branch: 'main',
    stack: ['Python', 'Bash', 'Security Scanners', 'SARIF'],
    metrics: {
      files: 34,
      linesOfCode: '6.2k',
      testCoverage: '96%',
      dependencies: 11,
    },
    languages: [
      { name: 'Python', percentage: 85, color: '#3572A5' },
      { name: 'Shell', percentage: 15, color: '#89e051' },
    ],
    health: {
      architecture: { status: 'Good', score: 96, label: 'Hardened Security Protocol' },
      dependencies: { status: 'Good', count: 0, label: 'Audited Dependency Graph' },
      security: { status: 'Good', vulnerabilities: 0, label: 'Zero Known Vulnerabilities' },
      testing: { status: 'Good', coverage: 96, label: '96% Synthetic Attack Vector Suite' },
    },
    status: 'Audit verified',
    activeIssueId: 'AUTH-104',
    stars: 5,
  },
];

export const OTHER_REPOSITORIES = [
  {
    id: 'Nexora-X-Hub',
    name: 'Nexora-X-Hub',
    status: '1 issue detected',
    stars: 12,
    forks: 2,
    branch: 'main',
    healthScore: 98,
    language: 'TypeScript',
  },
  {
    id: 'Yantriksha-X-Hub',
    name: 'Yantriksha-X-Hub',
    status: 'All checks passing',
    stars: 8,
    forks: 1,
    branch: 'main',
    healthScore: 95,
    language: 'TypeScript',
  },
  {
    id: 'vulnerability-assessment-report',
    name: 'vulnerability-assessment-report',
    status: 'All checks passing',
    stars: 5,
    forks: 0,
    branch: 'main',
    healthScore: 96,
    language: 'Python',
  },
  {
    id: 'user-identity-core',
    name: 'user-identity-core',
    status: 'Scheduled scan pending',
    stars: 310,
    forks: 75,
    branch: 'master',
    healthScore: 91,
    language: 'TypeScript',
  },
];

export const PRIMARY_ISSUE: DetectedIssue = {
  id: 'AUTH-104',
  code: 'AUTH-104',
  title: 'Expired JWT tokens may bypass authentication middleware.',
  description: 'The authentication middleware validates the cryptographic JWT signature but fails to reject expired tokens before allowing requests to proceed downstream.',
  severity: 'HIGH',
  confidence: 96,
  affectedFile: 'src/middleware/auth.ts',
  lines: 'L38-L48',
  rootCause: 'The authentication middleware validates the JWT signature but does not explicitly reject expired tokens before allowing the request to continue.',
  impact: 'Expired authentication tokens may continue accessing protected API endpoints.',
  discoveryDate: 'Today, 21:10 UTC',
};

export const REPO_FILE_TREE: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'controllers',
        path: 'src/controllers',
        type: 'folder',
        children: [
          { name: 'auth.controller.ts', path: 'src/controllers/auth.controller.ts', type: 'file', language: 'typescript' },
          { name: 'order.controller.ts', path: 'src/controllers/order.controller.ts', type: 'file', language: 'typescript' },
          { name: 'product.controller.ts', path: 'src/controllers/product.controller.ts', type: 'file', language: 'typescript' },
        ],
      },
      {
        name: 'services',
        path: 'src/services',
        type: 'folder',
        children: [
          { name: 'token.service.ts', path: 'src/services/token.service.ts', type: 'file', language: 'typescript' },
          { name: 'user.service.ts', path: 'src/services/user.service.ts', type: 'file', language: 'typescript' },
          { name: 'payment.service.ts', path: 'src/services/payment.service.ts', type: 'file', language: 'typescript' },
        ],
      },
      {
        name: 'middleware',
        path: 'src/middleware',
        type: 'folder',
        children: [
          {
            name: 'auth.ts',
            path: 'src/middleware/auth.ts',
            type: 'file',
            hasIssue: true,
            language: 'typescript',
            content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-key-1284';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    // BUG AUTH-104: Signature is decoded without validating exp expiration timestamp
    const decoded = jwt.verify(token, SECRET);

    if (decoded) {
      return next();
    }
  } catch (err) {
    return res.status(403).json({ error: 'Token invalid or expired signature' });
  }

  return res.status(401).json({ error: 'Unauthorized access' });
};`,
          },
          { name: 'rate-limit.ts', path: 'src/middleware/rate-limit.ts', type: 'file', language: 'typescript' },
          { name: 'error-handler.ts', path: 'src/middleware/error-handler.ts', type: 'file', language: 'typescript' },
        ],
      },
      {
        name: 'routes',
        path: 'src/routes',
        type: 'folder',
        children: [
          { name: 'auth.routes.ts', path: 'src/routes/auth.routes.ts', type: 'file', language: 'typescript' },
          { name: 'api.routes.ts', path: 'src/routes/api.routes.ts', type: 'file', language: 'typescript' },
        ],
      },
      {
        name: 'utils',
        path: 'src/utils',
        type: 'folder',
        children: [
          { name: 'jwt.ts', path: 'src/utils/jwt.ts', type: 'file', language: 'typescript' },
          { name: 'crypto.ts', path: 'src/utils/crypto.ts', type: 'file', language: 'typescript' },
          { name: 'logger.ts', path: 'src/utils/logger.ts', type: 'file', language: 'typescript' },
        ],
      },
    ],
  },
  {
    name: 'tests',
    path: 'tests',
    type: 'folder',
    children: [
      { name: 'auth.test.ts', path: 'tests/auth.test.ts', type: 'file', language: 'typescript' },
      { name: 'checkout.test.ts', path: 'tests/checkout.test.ts', type: 'file', language: 'typescript' },
      { name: 'user.test.ts', path: 'tests/user.test.ts', type: 'file', language: 'typescript' },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    language: 'json',
    content: `{
  "name": "commerce-api",
  "version": "1.4.2",
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  }
}`,
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    language: 'markdown',
    content: `# commerce-api

Core REST backend service for order processing, inventory sync, and authenticated shopper sessions.`,
  },
];

export const PRIMARY_PATCH: CodePatch = {
  file: 'src/middleware/auth.ts',
  linesChanged: 8,
  additions: 11,
  deletions: 3,
  risk: 'LOW',
  confidence: 97,
  beforeCode: `const decoded = jwt.verify(token, SECRET);

if (decoded) {
    return next();
}`,
  afterCode: `const decoded = jwt.verify(token, SECRET);

if (!decoded || typeof decoded === "string") {
    return res.status(401).json({
        error: "Invalid token"
    });
}

if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return res.status(401).json({
        error: "Token expired"
    });
}

return next();`,
  diffLines: [
    { type: 'context', oldLineNumber: 37, newLineNumber: 37, content: '    // Verify token signature with configured secret' },
    { type: 'context', oldLineNumber: 38, newLineNumber: 38, content: '    const decoded = jwt.verify(token, SECRET);' },
    { type: 'deletion', oldLineNumber: 39, content: '-   if (decoded) {' },
    { type: 'deletion', oldLineNumber: 40, content: '-       return next();' },
    { type: 'deletion', oldLineNumber: 41, content: '-   }' },
    { type: 'addition', newLineNumber: 39, content: '+   if (!decoded || typeof decoded === "string") {' },
    { type: 'addition', newLineNumber: 40, content: '+       return res.status(401).json({' },
    { type: 'addition', newLineNumber: 41, content: '+           error: "Invalid token"' },
    { type: 'addition', newLineNumber: 42, content: '+       });' },
    { type: 'addition', newLineNumber: 43, content: '+   }' },
    { type: 'addition', newLineNumber: 44, content: '+   ' },
    { type: 'addition', newLineNumber: 45, content: '+   if (decoded.exp && decoded.exp * 1000 < Date.now()) {' },
    { type: 'addition', newLineNumber: 46, content: '+       return res.status(401).json({' },
    { type: 'addition', newLineNumber: 47, content: '+           error: "Token expired"' },
    { type: 'addition', newLineNumber: 48, content: '+       });' },
    { type: 'addition', newLineNumber: 49, content: '+   }' },
    { type: 'addition', newLineNumber: 50, content: '+   return next();' },
    { type: 'context', oldLineNumber: 42, newLineNumber: 51, content: '  } catch (err) {' },
    { type: 'context', oldLineNumber: 43, newLineNumber: 52, content: '    return res.status(403).json({ error: "Token invalid or expired signature" });' },
  ],
};

export const PRIMARY_REGRESSION_TEST: RegressionTest = {
  filename: 'tests/auth.test.ts',
  suiteName: 'JWT expiration security suite',
  description: 'Ensures expired tokens generate HTTP 401 Unauthorized and cannot access protected endpoints.',
  framework: 'Jest + Supertest',
  code: `describe("JWT expiration", () => {

  it("rejects expired tokens", async () => {

    const expiredToken =
      createExpiredToken();

    const response =
      await request(app)
        .get("/api/profile")
        .set(
          "Authorization",
          \`Bearer \${expiredToken}\`
        );

    expect(response.status)
      .toBe(401);

  });

});`,
};

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    timestamp: '21:14',
    issueCode: 'AUTH-104',
    title: 'JWT expiration bug',
    action: 'Fixed + Verified',
    status: 'success',
    confidence: 97,
    repository: 'commerce-api',
    file: 'src/middleware/auth.ts',
  },
  {
    id: 'hist-2',
    timestamp: '20:52',
    issueCode: 'PAY-089',
    title: 'Payment validation issue',
    action: 'Analyzed',
    status: 'warning',
    confidence: 92,
    repository: 'commerce-api',
    file: 'src/services/payment.service.ts',
  },
  {
    id: 'hist-3',
    timestamp: '19:43',
    issueCode: 'SEC-042',
    title: 'API security scan',
    action: 'Completed',
    status: 'info',
    repository: 'commerce-api',
    file: 'Full Repository AST',
  },
  {
    id: 'hist-4',
    timestamp: '18:15',
    issueCode: 'DB-018',
    title: 'PostgreSQL connection leak in pool',
    action: 'Fixed + Verified',
    status: 'success',
    confidence: 99,
    repository: 'commerce-api',
    file: 'src/db/pool.ts',
  },
  {
    id: 'hist-5',
    timestamp: '16:30',
    issueCode: 'AUTH-099',
    title: 'CORS preflight header mismatch',
    action: 'Fixed + Verified',
    status: 'success',
    confidence: 95,
    repository: 'commerce-api',
    file: 'src/server.ts',
  },
];
