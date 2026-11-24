import fs from 'fs';
import path from 'path';

export interface CodeSymbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'export';
  line: number;
}

export interface FileAnalysis {
  path: string;
  language: string;
  sizeBytes: number;
  lineCount: number;
  imports: string[];
  exports: string[];
  symbols: CodeSymbol[];
}

export interface RepositoryManifest {
  type: 'npm' | 'pip' | 'gomod' | 'maven' | 'gradle' | 'cargo' | 'unknown';
  filePath: string;
  dependencies: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface RepositoryContext {
  owner: string;
  name: string;
  branch: string;
  commitSha: string;
  primaryLanguage: string;
  detectedFramework: string;
  packageManager: string;
  manifests: RepositoryManifest[];
  fileTree: string[];
  analyzedFiles: FileAnalysis[];
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'TypeScript';
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'JavaScript';
    case '.py':
      return 'Python';
    case '.go':
      return 'Go';
    case '.java':
      return 'Java';
    case '.c':
    case '.h':
      return 'C';
    case '.cpp':
    case '.cc':
    case '.cxx':
    case '.hpp':
      return 'C++';
    case '.php':
      return 'PHP';
    case '.rb':
      return 'Ruby';
    case '.rs':
      return 'Rust';
    case '.json':
      return 'JSON';
    case '.yaml':
    case '.yml':
      return 'YAML';
    case '.md':
      return 'Markdown';
    default:
      return 'Plain Text';
  }
}

/**
 * Fast Regex-based symbol and AST extractor supporting TS, JS, Python, Go
 */
export function extractSymbolsAndImports(content: string, language: string): {
  imports: string[];
  exports: string[];
  symbols: CodeSymbol[];
} {
  const lines = content.split('\n');
  const imports: string[] = [];
  const exportsList: string[] = [];
  const symbols: CodeSymbol[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // TypeScript / JavaScript
    if (language === 'TypeScript' || language === 'JavaScript') {
      const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) imports.push(importMatch[1]);

      const requireMatch = line.match(/(?:const|let|var)\s+.*=\s*require\(['"]([^'"]+)['"]\)/);
      if (requireMatch) imports.push(requireMatch[1]);

      const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/);
      if (fnMatch) symbols.push({ name: fnMatch[1], type: 'function', line: lineNum });

      const arrowFnMatch = line.match(/^(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
      if (arrowFnMatch) symbols.push({ name: arrowFnMatch[1], type: 'function', line: lineNum });

      const classMatch = line.match(/^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) symbols.push({ name: classMatch[1], type: 'class', line: lineNum });

      const exportMatch = line.match(/^export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([a-zA-Z0-9_$]+)?/);
      if (exportMatch && exportMatch[1]) exportsList.push(exportMatch[1]);
    }

    // Python
    if (language === 'Python') {
      const pyImport = line.match(/^(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/);
      if (pyImport) imports.push(pyImport[1] || pyImport[2]);

      const pyFn = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (pyFn) symbols.push({ name: pyFn[1], type: 'function', line: lineNum });

      const pyClass = line.match(/^class\s+([a-zA-Z0-9_]+)/);
      if (pyClass) symbols.push({ name: pyClass[1], type: 'class', line: lineNum });
    }

    // Go
    if (language === 'Go') {
      const goImport = line.match(/import\s+"([^"]+)"/);
      if (goImport) imports.push(goImport[1]);

      const goFn = line.match(/^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/);
      if (goFn) symbols.push({ name: goFn[1], type: 'function', line: lineNum });

      const goStruct = line.match(/^type\s+([a-zA-Z0-9_]+)\s+struct/);
      if (goStruct) symbols.push({ name: goStruct[1], type: 'class', line: lineNum });
    }
  }

  return {
    imports: Array.from(new Set(imports)),
    exports: Array.from(new Set(exportsList)),
    symbols,
  };
}

/**
 * Score files based on relevance to an issue description or stack trace
 */
export function scoreFileRelevance(
  filePath: string,
  analysis: FileAnalysis,
  query: string
): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();

  // 1. Exact or partial file name mention in query
  if (lowerQuery.includes(fileName)) score += 50;
  if (lowerQuery.includes(lowerPath)) score += 80;

  // 2. Matching symbols
  for (const sym of analysis.symbols) {
    if (lowerQuery.includes(sym.name.toLowerCase())) {
      score += 25;
    }
  }

  // 3. High-priority architectural files
  if (lowerPath.includes('src/') || lowerPath.includes('lib/')) score += 5;
  if (lowerPath.includes('middleware') || lowerPath.includes('auth') || lowerPath.includes('api') || lowerPath.includes('route')) {
    score += 10;
  }

  return score;
}

/**
 * Build rich repository context from workspace directory
 */
export function buildRepositoryContext(
  workspaceDir: string,
  repoMeta: { owner: string; name: string; branch: string; commitSha: string }
): RepositoryContext {
  const fileTree: string[] = [];
  const analyzedFiles: FileAnalysis[] = [];
  const manifests: RepositoryManifest[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'build', '.workspaces', '.data'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const relPath = path.relative(workspaceDir, fullPath).replace(/\\/g, '/');
        fileTree.push(relPath);

        // Check manifests
        const fileName = path.basename(relPath);
        if (fileName === 'package.json') {
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            manifests.push({
              type: 'npm',
              filePath: relPath,
              dependencies: { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) },
              scripts: pkg.scripts || {},
            });
          } catch {}
        } else if (fileName === 'requirements.txt') {
          manifests.push({
            type: 'pip',
            filePath: relPath,
            dependencies: {},
          });
        }

        // Analyze source files (under 150KB)
        const stats = fs.statSync(fullPath);
        if (stats.size < 150000 && !/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|bin)$/i.test(fileName)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lang = detectLanguage(relPath);
          const { imports, exports, symbols } = extractSymbolsAndImports(content, lang);

          analyzedFiles.push({
            path: relPath,
            language: lang,
            sizeBytes: stats.size,
            lineCount: content.split('\n').length,
            imports,
            exports,
            symbols,
          });
        }
      }
    }
  }

  scan(workspaceDir);

  // Framework detection
  let detectedFramework = 'Generic';
  let packageManager = 'Unknown';

  const npmManifest = manifests.find((m) => m.type === 'npm');
  if (npmManifest) {
    packageManager = fs.existsSync(path.join(workspaceDir, 'pnpm-lock.yaml'))
      ? 'pnpm'
      : fs.existsSync(path.join(workspaceDir, 'yarn.lock'))
      ? 'yarn'
      : 'npm';

    const deps = npmManifest.dependencies;
    if (deps['next']) detectedFramework = 'Next.js';
    else if (deps['express']) detectedFramework = 'Express';
    else if (deps['react']) detectedFramework = 'React';
    else if (deps['fastify']) detectedFramework = 'Fastify';
    else if (deps['nestjs'] || deps['@nestjs/core']) detectedFramework = 'NestJS';
  }

  // Count primary language
  const langCounts: Record<string, number> = {};
  for (const f of analyzedFiles) {
    if (['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'C', 'C++', 'PHP', 'Ruby'].includes(f.language)) {
      langCounts[f.language] = (langCounts[f.language] || 0) + f.lineCount;
    }
  }

  let primaryLanguage = 'JavaScript';
  let maxLines = 0;
  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > maxLines) {
      maxLines = count;
      primaryLanguage = lang;
    }
  }

  return {
    owner: repoMeta.owner,
    name: repoMeta.name,
    branch: repoMeta.branch,
    commitSha: repoMeta.commitSha,
    primaryLanguage,
    detectedFramework,
    packageManager,
    manifests,
    fileTree,
    analyzedFiles,
  };
}
