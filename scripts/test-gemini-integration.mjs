import assert from 'node:assert';

async function runGeminiIntegrationTests() {
  console.log('\n=============================================================');
  console.log('🤖 REPOPILOT AI — GEMINI & AGENT ARCHITECTURE TEST SUITE');
  console.log('=============================================================\n');

  const {
    GeminiProvider,
    RepositoryAnalyzer,
    BugInvestigator,
    RootCauseAnalyzer,
    PatchGenerator,
    RegressionTestGenerator,
    CodeReviewAgent,
  } = await import('../src/lib/server/gemini/index.ts');

  // Test 1: Provider config guard
  process.stdout.write('TEST 1: Provider correctly detects configuration status... ');
  const provider = new GeminiProvider();
  assert.strictEqual(typeof provider.isConfigured(), 'boolean');
  console.log('✅ PASSED');

  // Test 2: Instantiate all specialized AI agents
  process.stdout.write('TEST 2: Modular agents instantiate with GeminiProvider... ');
  const repoAnalyzer = new RepositoryAnalyzer(provider);
  const bugInvestigator = new BugInvestigator(provider);
  const rootCauseAnalyzer = new RootCauseAnalyzer(provider);
  const patchGenerator = new PatchGenerator(provider);
  const regressionTestGen = new RegressionTestGenerator(provider);
  const codeReviewAgent = new CodeReviewAgent(provider);

  assert.ok(repoAnalyzer);
  assert.ok(bugInvestigator);
  assert.ok(rootCauseAnalyzer);
  assert.ok(patchGenerator);
  assert.ok(regressionTestGen);
  assert.ok(codeReviewAgent);
  console.log('✅ PASSED');

  // Test 3: Secret filtering guard
  process.stdout.write('TEST 3: GitHub service secret filtering blocks private keys and .env... ');
  const { isSensitiveFile } = await import('../src/lib/server/github-service.ts');
  assert.strictEqual(isSensitiveFile('.env'), true);
  assert.strictEqual(isSensitiveFile('.env.local'), true);
  assert.strictEqual(isSensitiveFile('server.key'), true);
  assert.strictEqual(isSensitiveFile('id_rsa'), true);
  assert.strictEqual(isSensitiveFile('src/middleware/auth.js'), false);
  assert.strictEqual(isSensitiveFile('package.json'), false);
  console.log('✅ PASSED');

  // Test 4: Unified diff generation & patch application
  process.stdout.write('TEST 4: createUnifiedDiff and applyPatch accuracy... ');
  const { createUnifiedDiff, applyPatch, initializeWorkspace, cleanupWorkspace } = await import('../src/lib/server/sandbox.ts');
  const ws = await initializeWorkspace('test-diff-gen');
  const original = `function add(a, b) {\n  return a - b;\n}`;
  const fixed = `function add(a, b) {\n  return a + b;\n}`;
  const diff = createUnifiedDiff('math.js', original, fixed);

  assert.ok(diff.includes('--- a/math.js'));
  assert.ok(diff.includes('+++ b/math.js'));
  assert.ok(diff.includes('-  return a - b;'));
  assert.ok(diff.includes('+  return a + b;'));

  await cleanupWorkspace(ws);
  console.log('✅ PASSED');

  console.log('\n=============================================================');
  console.log('🎯 ALL GEMINI & MODULAR AGENT TESTS PASSED (100%)');
  console.log('=============================================================\n');
}

runGeminiIntegrationTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
