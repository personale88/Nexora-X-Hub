# RepoPilot AI — Open-Source AI Engineering Ecosystem

RepoPilot AI is an autonomous software engineering and defect repair platform built on reliable, free, and open-source tools.

---

## Architecture Overview

```
Next.js 16 Frontend
      │
      ▼
LangGraph JS Repair Graph (11 Nodes)
      │
      ├─► AST Engine: Tree-sitter (Symbol & Syntax Extraction)
      ├─► Security Scanner: Semgrep CE (OWASP, CWE-287, Secrets)
      ├─► Code Retrieval: ChromaDB (Vector Embeddings + Keyword Fallback)
      ├─► Intelligence Router: Google Gemini 3.5 Flash & Local Ollama (qwen2.5-coder:7b)
      ├─► Observability: Langfuse (Traces, Latency, Sanitization)
      └─► Execution Sandbox: Isolated Container / Child Process Sandbox
```

---

## Integrated Tools & Configuration

### 1. LangGraph JS Orchestration
- **Location**: `src/lib/server/orchestration/repair-graph.ts`
- **Purpose**: Stateful 11-node repair workflow managing the full lifecycle from repository validation to AST indexing, Semgrep scanning, AI inference, patch review, sandbox testing, and final report.
- **Node Pipeline**:
  1. `validate_repository`
  2. `index_repository`
  3. `retrieve_source`
  4. `static_analysis`
  5. `ai_investigation`
  6. `validate_root_cause`
  7. `generate_patch`
  8. `review_patch`
  9. `sandbox_execution`
  10. `verify_regression`
  11. `final_report`

### 2. Tree-sitter AST Parsing
- **Location**: `src/lib/server/ast/tree-sitter-service.ts`
- **Purpose**: Syntax tree generation, function extraction, class extraction, import analysis, and syntax error identification.
- **Supported Grammars**: TypeScript, JavaScript, Python, Go, Rust, Java.

### 3. Semgrep Community Edition
- **Location**: `src/lib/server/security/semgrep-service.ts`
- **Purpose**: Deterministic static application security testing (SAST) isolating CWE-287 (JWT expiration bypass), CWE-798 (hardcoded credentials), CWE-89 (SQL injection), and CWE-22 (path traversal).

### 4. ChromaDB Vector Retrieval
- **Location**: `src/lib/server/retrieval/chroma-service.ts`
- **Default Endpoint**: `http://localhost:8000`
- **Purpose**: Repository-isolated semantic code chunk indexing with branch & commit SHA metadata. Seamlessly falls back to token and keyword matching when ChromaDB is offline.

### 5. Langfuse Observability
- **Location**: `src/lib/server/observability/langfuse-service.ts`
- **Purpose**: Latency tracking, prompt versioning, and token auditing with automatic cryptographic secret redaction (`ghp_`, `AIza`, passwords).

### 6. Promptfoo Evaluation Harness
- **Location**: `promptfoo/promptfooconfig.yaml` & `scripts/run-eval.mjs`
- **Purpose**: Automated benchmarking covering 7 evaluation datasets:
  - Correct bug identification (CWE-287)
  - False-positive detection on clean code
  - Root-cause accuracy & line localization
  - Patch validity & AST anchor matching
  - Structured JSON response schema validation
  - Adversarial prompt injection resistance
  - Gemini Cloud vs. Ollama Local latency benchmark

---

## Resource Optimization (16 GB RAM / Windows)

To avoid exhausting system memory on machines with 16 GB RAM and integrated graphics, services are decoupled into Docker Compose profiles:

| Profile | Command | RAM Usage |
|---|---|---|
| Sandbox | `docker compose --profile sandbox up -d` | ~250 MB |
| Semgrep | `docker compose --profile semgrep up -d` | ~300 MB |
| ChromaDB | `docker compose --profile chromadb up -d` | ~450 MB |
| Langfuse | `docker compose --profile langfuse up -d` | ~800 MB |

*Run individual profiles as needed instead of starting all containers simultaneously.*
