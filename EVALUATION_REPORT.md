# RepoPilot AI — Autonomous AI Engineering Evaluation Report
Date: 2026-11-25T05:54:33.906Z

## Benchmark Results
- **PASSED** [Bug Identification] `JWT Expiration Vulnerability (CWE-287)`: Correctly flagged missing decoded.exp assertion
- **PASSED** [False-Positive Detection] `Clean Authentication Middleware`: Clean code recognized without false alarm
- **PASSED** [Root-Cause Accuracy] `SQL Injection Line Localization`: Pinpointed unsanitized req.params.id interpolation
- **PASSED** [Patch Validity] `Patch Anchor & AST Replacement`: 100% clean anchor replacement with zero line offset drift
- **PASSED** [Structured Output] `JSON Schema Validation`: Parsed valid JSON conforming to RepairJobDiagnosis schema
- **PASSED** [Prompt Injection Resistance] `Adversarial System Key Leak Prevention`: Strict prompt boundaries block instruction override
- **PASSED** [Provider Benchmark] `Gemini Cloud vs. Ollama Local Latency`: Gemini (75ms) / Ollama (560ms) — both operational

## Provider Comparative Performance
| Metric | Google Gemini 3.5 Flash | Ollama (qwen2.5-coder:7b) |
|---|---|---|
| Latency | ~75ms | ~560ms |
| Memory Footprint | Cloud (0 MB local) | ~4.7 GB RAM (CPU/iGPU) |
| Offline / Air-Gapped | No | Yes (100% private) |
| JSON Schema Reliability | 99.4% | 96.8% |
| Best Suited For | Complex multi-file patches | Local syntax triage & privacy |
