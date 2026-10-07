# RepoPilot AI - Autonomous Engineering & Repository Intelligence

> **Production OAuth Authentication & GitHub Integration Architecture**

RepoPilot AI is an AI developer agent that understands repositories, diagnoses bugs, generates fixes, creates regression tests, and verifies fixes autonomously.

---

## 🚀 Key Features

- **Multi-Provider Authentication**:
  - **Continue with Google**: Secure Google OAuth 2.0 with PKCE & state verification.
  - **Continue with GitHub**: Secure GitHub OAuth authentication.
  - **Decoupled Identity & Repository Access**: Log in with Google or GitHub, and connect GitHub accounts independently without identity collision.
- **Production Security Architecture**:
  - **Zero Frontend Token Leakage**: GitHub personal access tokens and OAuth bearer tokens are **never** passed to client-side JavaScript or stored in `localStorage`.
  - **Encrypted at Rest**: All access and refresh tokens are encrypted using server-side AES-256-GCM authenticated encryption before persisting.
  - **Hardened Cookies**: Sessions and state verification use `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
  - **Principle of Least Privilege**: Requests read-only repository metadata and contents (`read:user`, `user:email`, `repo`).
- **Interactive Repository Selection Engine**:
  - Filter by **All**, **Public**, **Private**, **Owned**, and **Organization**.
  - Instant debounced search by repository name or description.
  - **5-Stage Context Preparation**:
    1. ✓ Repository authorized
    2. ✓ Repository metadata loaded
    3. ✓ File structure loaded
    4. ✓ Relevant files identified
    5. ✓ Context ready
- **Settings & Connected Accounts**:
  - Live connection badges for Google and GitHub.
  - View GitHub username, avatar, connection timestamp, and access permissions.
  - Safe disconnection flow with confirmation warnings.

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base public URL of the application | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Secret from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Google OAuth Redirect URI | `http://localhost:3000/api/auth/callback/google` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Client ID from GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Client Secret from GitHub Developer Settings |
| `GITHUB_CALLBACK_URL` | GitHub OAuth Callback URL | `http://localhost:3000/api/auth/callback/github` |
| `AUTH_SECRET` | 32+ character key for AES-256-GCM token encryption | Random 64-character hex string |
| `DATABASE_URL` | Storage descriptor (persists in `.data/repopilot_db.json`) | `file:./.data/repopilot_db.json` |

---

## 🔑 OAuth Provider Setup Guide

### 1. Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select an existing Google Cloud Project.
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Choose **External** user type.
   - Fill in the required application info (App name: `RepoPilot AI`, developer email).
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Navigate to **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `RepoPilot AI Web Client`.
   - Authorized JavaScript origins: `http://localhost:3000`.
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`.
5. Copy the **Client ID** and **Client Secret** into your `.env.local`.

---

### 2. GitHub OAuth Setup
1. Log in to [GitHub](https://github.com/) and go to **Settings** > **Developer Settings** > **OAuth Apps**.
2. Click **New OAuth App**:
   - Application name: `RepoPilot AI`.
   - Homepage URL: `http://localhost:3000`.
   - Application description: `AI software engineer and repository intelligence engine`.
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`.
3. Register the application and click **Generate a new client secret**.
4. Copy the **Client ID** and **Client Secret** into your `.env.local`.

---

## 🏃 Local Development

```bash
# Install dependencies
npm install

# Start local development server with Turbopack
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view RepoPilot AI.

### Local Development Simulation
If you haven't yet created production Google or GitHub OAuth credentials in their respective developer consoles, clicking "Continue with Google" or "Continue with GitHub" will gracefully direct you to the development preview helper at `/api/auth/dev-mock`, detailing your exact callback configurations while allowing rapid local flow verification.

---

## 🔒 Security & Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                        Browser                         │
 │  (Next.js Client Components, AuthContext, UI Views)    │
 └───────────────────────────┬────────────────────────────┘
                             │
                  Session Cookie (HttpOnly)
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                  RepoPilot Backend                     │
 │ ────────────────────────────────────────────────────── │
 │ • Auth Helpers & CSRF Verification (crypto.ts)         │
 │ • Token Encryptor/Decryptor (AES-256-GCM)              │
 │ • GitHub Service (Official REST API v3)               │
 └─────────────┬───────────────────────────┬──────────────┘
               │                           │
    Encrypted Credentials         GitHub API Requests
               │                     (Server-to-Server)
               ▼                           ▼
 ┌───────────────────────────┐   ┌────────────────────────┐
 │   Encrypted DB Storage    │   │       GitHub API       │
 │ (.data/repopilot_db.json) │   │ (api.github.com/v3)    │
 └───────────────────────────┘   └────────────────────────┘
```

- **Authentication Separation**: A user can sign in with Google, and separately link a GitHub account from either the Top Navigation or Settings > Connected Accounts.
- **Account Linking Safety**: Prevents silent email collisions and links GitHub accounts explicitly to the authenticated session user.
- **Sanitized Client Payloads**: Repositories, account metadata, and session status are strictly scrubbed of access tokens before being sent to the browser.
