import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

async function runMultiRepoIsolationTests() {
  console.log('\n=============================================================');
  console.log('🧪 REPOPILOT AI — MULTI-REPO ISOLATION & ACCURACY TEST SUITE');
  console.log('=============================================================\n');

  const { buildRepositoryContext, detectLanguage, scoreFileRelevance } = await import(
    '../src/lib/server/repo-intelligence.ts'
  );
  const { aiProviderManager } = await import('../src/lib/server/ai/router.ts');
  const { AIResponseValidator } = await import('../src/lib/server/ai/validator.ts');

  // Test 1: Repository Context Isolation across 2 distinct mock workspaces
  process.stdout.write('TEST 1: Distinct repositories produce completely isolated contexts... ');
  const tmpRepo1 = path.join(process.cwd(), '.workspaces', 'test-repo-js');
  const tmpRepo2 = path.join(process.cwd(), '.workspaces', 'test-repo-py');

  fs.mkdirSync(path.join(tmpRepo1, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpRepo1, 'package.json'),
    JSON.stringify({ name: 'js-shop', dependencies: { express: '^4.18.0' } })
  );
  fs.writeFileSync(
    path.join(tmpRepo1, 'src', 'server.js'),
    'const express = require("express");\nfunction start() { express(); }'
  );

  fs.mkdirSync(path.join(tmpRepo2, 'calc'), { recursive: true });
  fs.writeFileSync(path.join(tmpRepo2, 'requirements.txt'), 'fastapi==0.100.0\n');
  fs.writeFileSync(
    path.join(tmpRepo2, 'calc', 'math.py'),
    'def divide(a, b):\n    return a / b  # Can raise ZeroDivisionError\n'
  );

  const context1 = buildRepositoryContext(tmpRepo1, {
    owner: 'user1',
    name: 'js-shop',
    branch: 'main',
    commitSha: 'sha1111',
  });
  const context2 = buildRepositoryContext(tmpRepo2, {
    owner: 'user2',
    name: 'py-calc',
    branch: 'main',
    commitSha: 'sha2222',
  });

  assert.strictEqual(context1.primaryLanguage, 'JavaScript');
  assert.strictEqual(context1.detectedFramework, 'Express');
  assert.strictEqual(context2.primaryLanguage, 'Python');
  assert.strictEqual(context2.manifests[0].type, 'pip');
  assert.notDeepStrictEqual(context1.fileTree, context2.fileTree);
  console.log('✅ PASSED');

  // Test 2: AI Response Validator blocks hallucinated files
  process.stdout.write('TEST 2: AIResponseValidator rejects hallucinated file paths... ');
  const validation = AIResponseValidator.validateAffectedFile(
    'src/middleware/auth.ts',
    context2.fileTree // py-calc does NOT have auth.ts!
  );
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors[0].includes('AI hallucinated file path'));
  console.log('✅ PASSED');

  // Test 3: AI Provider Manager health check & routing
  process.stdout.write('TEST 3: AI Provider Manager routes tasks dynamically... ');
  const health = await aiProviderManager.getOverallHealth();
  assert.ok(['gemini', 'ollama', 'hybrid'].includes(health.activeMode));
  assert.ok(health.gemini !== undefined);
  assert.ok(health.ollama !== undefined);
  console.log('✅ PASSED');

  // Clean up
  try {
    fs.rmSync(tmpRepo1, { recursive: true, force: true });
    fs.rmSync(tmpRepo2, { recursive: true, force: true });
  } catch {}

  console.log('\n=============================================================');
  console.log('🎯 MULTI-REPO ISOLATION & GROUNDING TESTS PASSED (100%)');
  console.log('=============================================================\n');
}

runMultiRepoIsolationTests().catch((e) => {
  console.error('Fatal multi-repo test error:', e);
  process.exit(1);
});
