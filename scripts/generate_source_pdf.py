import os
import sys
import html
import subprocess
from datetime import datetime

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_HTML = os.path.join(WORKSPACE_DIR, "RepoPilot_Source_Code.html")
OUTPUT_PDF = os.path.join(WORKSPACE_DIR, "RepoPilot_AI_Source_Code.pdf")

# Files to include in the source code PDF in priority order
SOURCE_FILES = [
    # 1. Project Configuration & Specs
    ("package.json", "Project Dependencies & Scripts Configuration", "json"),
    ("tsconfig.json", "TypeScript Strict Compiler Configuration", "json"),
    
    # 2. Core Types & Data Models
    ("src/lib/types.ts", "Core Domain Types, Language Definitions & Data Contracts", "typescript"),
    
    # 3. Learning Academy & Course Catalog
    ("src/lib/courses-data.ts", "Learning Academy Courses, Syllabus, Quizzes & Challenges", "typescript"),
    ("src/components/views/AcademyView.tsx", "Interactive Learning Academy View & Quiz Player", "tsx"),
    
    # 4. Code Practice Lab & Real-Time Multi-Language Diagnostic Engine
    ("src/lib/error-explainer.ts", "AST Error Analysis & Multi-Language Real-Time Sentinel", "typescript"),
    ("src/components/views/CodePracticeView.tsx", "Multi-Language Practice Lab (Python, Java, C++, C, JS, TS, Go, Rust)", "tsx"),
    ("src/app/api/code-practice/route.ts", "Code Practice & AI Error Tutor API Endpoint", "typescript"),
    
    # 5. Core Layout & Navigation
    ("src/app/page.tsx", "Main View Orchestrator & Tab Router", "tsx"),
    ("src/app/layout.tsx", "Root HTML & Next.js Metadata Layout", "tsx"),
    ("src/components/layout/Sidebar.tsx", "Navigation Sidebar with Academy & Practice Lab Badges", "tsx"),
    ("src/components/layout/TopNavbar.tsx", "Application Header, User Profile & Status Bar", "tsx"),
    ("src/components/views/LoginLandingView.tsx", "Login, Demo Quick Access & Landing Hero View", "tsx"),
    ("src/components/views/DashboardView.tsx", "Dashboard Metrics, Overview Cards & Quick Launch", "tsx"),
    
    # 6. Autonomous Bug Repair Engine & Sandbox
    ("src/lib/server/sandbox.ts", "Isolated Disposable Workspace Sandbox & Security Guardrails", "typescript"),
    ("src/lib/server/repair-pipeline.ts", "Autonomous GitHub Issue Diagnostic & Repair Pipeline", "typescript"),
    ("src/lib/server/github-service.ts", "GitHub Octokit API, Webhooks & PR Generator", "typescript"),
    ("src/lib/server/llm-provider.ts", "Multi-Provider LLM Engine (OpenAI, Gemini, Anthropic)", "typescript"),
    ("src/lib/server/auth-helpers.ts", "JWT Session Management & Authentication Helpers", "typescript"),
    ("src/lib/server/crypto.ts", "Cryptographic Hashing, AES Encryption & Token Generation", "typescript"),
    ("src/lib/server/db.ts", "Local JSON/SQLite Storage for Repair Jobs & Metrics", "typescript"),
    ("src/lib/server/event-bus.ts", "Real-Time Server-Sent Events (SSE) Event Bus", "typescript"),
    
    # 7. Bug Repair Views
    ("src/components/views/LiveBugFixPlayer.tsx", "Live Interactive Autonomous Repair Pipeline Visualizer", "tsx"),
    ("src/components/views/FixView.tsx", "Unified Issue Investigation & Fix Workspace", "tsx"),
    ("src/components/views/InvestigationView.tsx", "AST & Dependency Graph Issue Investigation View", "tsx"),
    ("src/components/views/VerificationView.tsx", "Autonomous Test Suite Verification View", "tsx"),
    ("src/components/views/HistoryView.tsx", "Historical Repair Audit Log & Performance Analytics", "tsx"),
    ("src/components/views/RepositoryView.tsx", "Connected GitHub Repositories Explorer", "tsx"),
    
    # 8. API Routes
    ("src/app/api/repair-jobs/route.ts", "Repair Jobs Controller & Execution Dispatcher", "typescript"),
    ("src/app/api/auth/dev-mock/route.ts", "Dev Mock Authentication & Demo Session Generator", "typescript"),
]

def format_code_block(code_content):
    lines = code_content.splitlines()
    formatted_lines = []
    for idx, line in enumerate(lines, start=1):
        escaped_line = html.escape(line)
        formatted_lines.append(
            f'<div class="code-line"><span class="line-number">{idx:4d}</span><span class="line-content">{escaped_line if escaped_line else " "}</span></div>'
        )
    return "\n".join(formatted_lines)

def generate_html():
    current_time = datetime.now().strftime("%B %d, %Y - %H:%M:%S")
    
    html_parts = []
    html_parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RepoPilot AI — Source Code & Architecture Specification</title>
    <style>
        @page {{
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
            @bottom-right {{
                content: counter(page);
            }}
        }}
        
        * {{
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            line-height: 1.5;
        }}
        
        /* Cover Page */
        .cover-page {{
            page-break-after: always;
            height: 92vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 40px 20px;
            border-bottom: 2px solid #e2e8f0;
        }}
        
        .cover-header {{
            margin-top: 40px;
        }}
        
        .cover-badge {{
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            color: #ffffff;
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 6px 14px;
            border-radius: 20px;
            margin-bottom: 20px;
        }}
        
        .cover-title {{
            font-size: 32pt;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.15;
            margin: 0 0 15px 0;
            letter-spacing: -0.5px;
        }}
        
        .cover-subtitle {{
            font-size: 14pt;
            color: #475569;
            font-weight: 500;
            line-height: 1.4;
            max-width: 650px;
            margin: 0;
        }}
        
        .cover-meta {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 30px;
        }}
        
        .meta-item {{
            display: flex;
            flex-direction: column;
        }}
        
        .meta-label {{
            font-size: 8.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }}
        
        .meta-value {{
            font-size: 10.5pt;
            font-weight: 600;
            color: #0f172a;
        }}
        
        .cover-footer {{
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            color: #94a3b8;
        }}
        
        /* Table of Contents & Architecture Overview */
        .section-page {{
            page-break-after: always;
            padding-top: 10px;
        }}
        
        h2.section-heading {{
            font-size: 18pt;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 8px;
            margin-top: 0;
            margin-bottom: 20px;
        }}
        
        .feature-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 25px;
        }}
        
        .feature-card {{
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            background: #f8fafc;
        }}
        
        .feature-card h3 {{
            margin: 0 0 6px 0;
            font-size: 11pt;
            font-weight: 700;
            color: #1e1b4b;
        }}
        
        .feature-card p {{
            margin: 0;
            font-size: 9pt;
            color: #475569;
            line-height: 1.4;
        }}
        
        /* Table of Contents List */
        .toc-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }}
        
        .toc-table th {{
            text-align: left;
            background: #f1f5f9;
            padding: 8px 10px;
            font-weight: 700;
            color: #334155;
            border-bottom: 2px solid #cbd5e1;
        }}
        
        .toc-table td {{
            padding: 7px 10px;
            border-bottom: 1px solid #f1f5f9;
        }}
        
        .toc-table tr:hover {{
            background: #f8fafc;
        }}
        
        .toc-file {{
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-weight: 600;
            color: #4338ca;
        }}
        
        .toc-desc {{
            color: #64748b;
        }}
        
        /* File Source Code View */
        .file-container {{
            page-break-before: always;
            margin-bottom: 30px;
        }}
        
        .file-header {{
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 16px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
        }}
        
        .file-path {{
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 10pt;
            font-weight: 700;
            color: #38bdf8;
        }}
        
        .file-badge {{
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            background: #1e293b;
            color: #94a3b8;
            padding: 3px 8px;
            border-radius: 4px;
            border: 1px solid #475569;
        }}
        
        .file-description {{
            background: #f1f5f9;
            border-left: 3px solid #4f46e5;
            border-right: 1px solid #e2e8f0;
            padding: 8px 14px;
            font-size: 9pt;
            color: #334155;
            font-style: italic;
        }}
        
        .code-block {{
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 8px 8px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 7.5pt;
            line-height: 1.35;
            padding: 8px 0;
            overflow-x: hidden;
            white-space: pre-wrap;
            word-break: break-all;
        }}
        
        .code-line {{
            display: flex;
            padding: 1px 0;
        }}
        
        .code-line:hover {{
            background-color: #f8fafc;
        }}
        
        .line-number {{
            width: 42px;
            text-align: right;
            padding-right: 12px;
            color: #94a3b8;
            font-weight: 500;
            user-select: none;
            border-right: 1px solid #e2e8f0;
            margin-right: 10px;
            flex-shrink: 0;
        }}
        
        .line-content {{
            flex-grow: 1;
            padding-right: 12px;
            color: #1e293b;
        }}
    </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
    <div class="cover-header">
        <span class="cover-badge">Complete Source Code Specification</span>
        <h1 class="cover-title">RepoPilot AI</h1>
        <p class="cover-subtitle">
            Autonomous Bug Repair Pipeline, Multi-Language Code Practice Lab (8 Languages), Real-Time AST Sentinel & Interactive Learning Academy.
        </p>
    </div>
    
    <div class="cover-meta">
        <div class="meta-item">
            <span class="meta-label">Project Name</span>
            <span class="meta-value">Nexora-X-Hub (RepoPilot AI)</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Architecture</span>
            <span class="meta-value">Next.js 16 (App Router) + TypeScript + Node.js</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Multi-Language Runtimes</span>
            <span class="meta-value">Python 3.12, Java 21, C++20, C17, JS, TS, Go, Rust</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Styling & UI</span>
            <span class="meta-value">Tailwind CSS v4 + Lucide Icons + Canvas Confetti</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Total Included Files</span>
            <span class="meta-value">{len(SOURCE_FILES)} Core Project Modules</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Generated Timestamp</span>
            <span class="meta-value">{current_time}</span>
        </div>
    </div>
    
    <div class="cover-footer">
        <span>Repository: github.com/personale88/Nexora-X-Hub</span>
        <span>Confidential & Proprietary Source Code Document</span>
    </div>
</div>

<!-- ARCHITECTURE & SYSTEM OVERVIEW -->
<div class="section-page">
    <h2 class="section-heading">1. System Architecture & Platform Capabilities</h2>
    
    <div class="feature-grid">
        <div class="feature-card">
            <h3>⚡ Multi-Language Code Practice Lab</h3>
            <p>
                Interactive sandbox supporting Python 3, Java, C++, C, JavaScript, TypeScript, Go, and Rust. Features as-you-type AST syntax diagnostics, delimiter checking, and compiler emulation.
            </p>
        </div>
        <div class="feature-card">
            <h3>🎓 Interactive Learning Academy</h3>
            <p>
                Structured course platform with 7 deep-dive tracks, 25+ interactive lessons, module syllabi, real-time knowledge check quizzes, streak/XP tracking, and digital completion certificates.
            </p>
        </div>
        <div class="feature-card">
            <h3>🤖 AI Error Concept Explainer</h3>
            <p>
                4-tab dynamic diagnostic engine: (1) Root-cause diagnosis, (2) Architectural mental model & real-world analogy, (3) Surgical fix comparison with progressive hints, and (4) Pedagogical AI Tutor chat.
            </p>
        </div>
        <div class="feature-card">
            <h3>🛡️ Disposable Sandbox Execution</h3>
            <p>
                Isolated filesystem runner with strict path traversal assertion, command execution allowlisting (blocking dangerous shell operators), secret token redaction, and multi-language compilers.
            </p>
        </div>
    </div>
    
    <h2 class="section-heading" style="margin-top: 30px;">2. Table of Included Source Files</h2>
    <table class="toc-table">
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                <th style="width: 280px;">Source File Path</th>
                <th>Module Description</th>
                <th style="width: 80px;">Language</th>
            </tr>
        </thead>
        <tbody>
    """)

    for idx, (rel_path, desc, lang) in enumerate(SOURCE_FILES, start=1):
        html_parts.append(f"""
            <tr>
                <td>{idx}</td>
                <td class="toc-file">{rel_path}</td>
                <td class="toc-desc">{desc}</td>
                <td><span style="background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 8pt; font-weight: 700;">{lang.upper()}</span></td>
            </tr>
        """)

    html_parts.append("""
        </tbody>
    </table>
</div>
""")

    # Append each source file
    for idx, (rel_path, desc, lang) in enumerate(SOURCE_FILES, start=1):
        full_path = os.path.join(WORKSPACE_DIR, rel_path)
        if not os.path.exists(full_path):
            print(f"Warning: File not found: {rel_path}")
            continue

        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            code_content = f.read()

        formatted_code = format_code_block(code_content)
        
        html_parts.append(f"""
<div class="file-container">
    <div class="file-header">
        <span class="file-path">File [{idx}/{len(SOURCE_FILES)}]: {rel_path}</span>
        <span class="file-badge">{lang.upper()} SOURCE</span>
    </div>
    <div class="file-description">
        <strong>Description:</strong> {desc}
    </div>
    <div class="code-block">
{formatted_code}
    </div>
</div>
""")

    html_parts.append("""
</body>
</html>
""")

    full_html = "".join(html_parts)
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(full_html)
    
    print(f"Generated HTML source bundle ({len(full_html)} bytes) at: {OUTPUT_HTML}")
    return OUTPUT_HTML

def convert_html_to_pdf(html_path):
    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    
    browser_exe = edge_exe if os.path.exists(edge_exe) else chrome_exe
    if not os.path.exists(browser_exe):
        print("Error: Neither Edge nor Chrome was found to print PDF.")
        return False

    temp_profile = os.path.join(os.environ.get("TEMP", "C:\\temp"), "source-pdf-profile")
    os.makedirs(temp_profile, exist_ok=True)
    
    html_url = "file:///" + html_path.replace("\\", "/")
    
    cmd = [
        browser_exe,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        f"--user-data-dir={temp_profile}",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={OUTPUT_PDF}",
        html_url,
    ]
    
    print(f"Invoking headless browser to render PDF: {OUTPUT_PDF}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(OUTPUT_PDF) and os.path.getsize(OUTPUT_PDF) > 0:
        pdf_size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
        print(f"SUCCESS: Generated PDF ({pdf_size_mb:.2f} MB) at: {OUTPUT_PDF}")
        return True
    else:
        print(f"Error rendering PDF. Stderr: {result.stderr}")
        return False

if __name__ == "__main__":
    html_file = generate_html()
    success = convert_html_to_pdf(html_file)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
