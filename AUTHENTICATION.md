# Authentication System Documentation

This document provides comprehensive documentation for the authentication and security system in Email Explorer.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Session Management](#session-management)
6. [Password Security](#password-security)
7. [Cookie Configuration](#cookie-configuration)
8. [Role-Based Access Control](#role-based-access-control)
9. [Password Recovery Flow](#password-recovery-flow)
10. [Database Schema](#database-schema)
11. [Frontend Authentication](#frontend-authentication)
12. [Smart Registration Mode](#smart-registration-mode)
13. [Configuration Options](#configuration-options)
14. [Security Features Summary](#security-features-summary)

---

## Overview

Email Explorer uses a session-based authentication system built on:

- **Cloudflare Workers** for serverless API handling
- **Durable Objects** for persistent session and user storage
- **SQLite** (via Durable Objects) for structured data
- **R2** for password recovery tokens and attachments

The authentication system is entirely self-contained with no external OAuth or third-party authentication providers.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vue.js App    │────▶│ Cloudflare      │────▶│  Durable Object │
│   (Dashboard)   │     │ Worker (API)    │     │  (Auth/Mailbox) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       ▼
        │                       │               ┌─────────────────┐
        │                       │               │   SQLite DB     │
        │                       │               │ (users/sessions)│
        │                       │               └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │      R2         │
        │               │ (recovery tokens│
        │               │  attachments)   │
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐
│   localStorage  │
│ (session cache) │
└─────────────────┘
```

---

## Core Components

### Backend

| Component | File Path | Description |
|-----------|-----------|-------------|
| Auth Routes | `/packages/worker/src/routes/auth.ts` | API endpoint handlers for authentication |
| Durable Object | `/packages/worker/src/durableObject/index.ts` | Session/user management and database operations |
| Types | `/packages/worker/src/types.ts` | TypeScript interfaces for Session, User, Env |
| Migrations | `/packages/worker/src/durableObject/migrations.ts` | Database schema definitions |
| Main Entry | `/packages/worker/src/index.ts` | Password recovery endpoints and middleware |

### Frontend

| Component | File Path | Description |
|-----------|-----------|-------------|
| Auth Store | `/packages/dashboard/src/stores/auth.ts` | Pinia store for auth state management |
| API Service | `/packages/dashboard/src/services/api.ts` | Axios client with interceptors |
| Router Guards | `/packages/dashboard/src/router/index.ts` | Navigation guards for protected routes |

---

## Authentication Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user (conditionally available) |
| `POST` | `/api/v1/auth/login` | Authenticate and create session |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token |
| `GET` | `/api/v1/settings` | Get app settings (auth status, registration availability) |

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/auth/me` | Get current user session |
| `POST` | `/api/v1/auth/logout` | Invalidate current session |

### Admin-Only Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/admin/register` | Create user (bypasses registration restrictions) |
| `GET` | `/api/v1/auth/admin/users` | List all users |
| `PUT` | `/api/v1/auth/admin/users/:userId` | Update user properties |
| `POST` | `/api/v1/auth/admin/grant-access` | Grant mailbox access to user |
| `POST` | `/api/v1/auth/admin/revoke-access` | Revoke mailbox access from user |

### Request/Response Examples

#### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response (201):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "isAdmin": true,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response (200):
```json
{
  "id": "session-uuid",
  "userId": "user-uuid",
  "email": "user@example.com",
  "isAdmin": true,
  "expiresAt": 1702592000000
}
```

---

## Session Management

### Session Creation

Sessions are created upon successful login:

1. User credentials are validated against stored hash
2. A UUID session token is generated using `crypto.randomUUID()`
3. Session is stored in SQLite with 30-day expiration
4. Session token is returned in response body and set as HttpOnly cookie

```typescript
// Session expiration: 30 days
const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
```

### Session Validation

Sessions are validated on each protected request:

1. Token extracted from `Authorization: Bearer <token>` header or `session` cookie
2. Session looked up in database
3. Expiration checked against current time
4. If expired, session is automatically deleted
5. User information retrieved and attached to request context

### Session Invalidation

Sessions can be invalidated by:

- **Logout**: Explicitly deletes session from database
- **Expiration**: Automatic cleanup when session is accessed after expiry
- **Client-side expiration check**: Frontend checks `expiresAt` before requests

### Token Extraction Priority

```typescript
function getSessionToken(request: Request): string | null {
  // 1. Try Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 2. Fall back to cookie
  const cookie = request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    return match ? match[1] : null;
  }

  return null;
}
```

---

## Password Security

### Hashing Algorithm

Passwords are hashed using **SHA-256** via the Web Crypto API:

```typescript
async #hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

### Password Requirements

- **Minimum length**: 8 characters (enforced via Zod schema)
- Validated at both API level and frontend

```typescript
const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Security Considerations

- Password hashes are never exposed in API responses
- Original passwords are never stored
- Comparison uses constant-time string matching (implicit via hash comparison)

---

## Cookie Configuration

Session cookies are configured with security best practices:

```typescript
const cookie = `session=${session.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`;
```

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | Yes | Prevents JavaScript access (XSS protection) |
| `Secure` | Yes | Only sent over HTTPS |
| `SameSite` | Strict | Prevents CSRF attacks |
| `Path` | `/` | Available to all routes |
| `Max-Age` | 2,592,000 (30 days) | Cookie expiration |

### Cookie Clearing on Logout

```typescript
c.header(
  "Set-Cookie",
  "session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
);
```

---

## Role-Based Access Control

### User Roles

The system supports granular mailbox-level permissions:

| Role | Description |
|------|-------------|
| `owner` | Full control over mailbox |
| `admin` | Administrative access to mailbox |
| `write` | Can read and modify emails |
| `read` | Read-only access to emails |

### Admin Privileges

Users with `isAdmin: true` can:

- Create new users via `/api/v1/auth/admin/register`
- List all users
- Update user properties
- Grant/revoke mailbox access

### Access Control Schema

```typescript
const GrantAccessRequestSchema = z.object({
  userId: z.string(),
  mailboxId: z.string(),
  role: z.enum(["owner", "admin", "write", "read"]),
});
```

---

## Password Recovery Flow

### Overview

Password recovery uses email-based token verification stored in R2:

```
User → Forgot Password → Token Generated → Email Sent → Token Verified → Password Updated
```

### Token Generation

```typescript
// Token valid for 1 hour
const token = crypto.randomUUID();
const expiresAt = Date.now() + 3600000; // 1 hour

// Store in R2
const tokenKey = `recovery-tokens/${token}.json`;
await c.env.BUCKET.put(tokenKey, JSON.stringify({
  userId: user.id,
  email: user.email,
  expiresAt,
}));
```

### Password Reset Request

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Password Reset Execution

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "uuid-token",
  "newPassword": "newsecurepassword123"
}
```

### Security Features

- Tokens expire after 1 hour
- Tokens are single-use (deleted after successful reset)
- Recovery requires explicit configuration (`accountRecovery.fromEmail`)
- Email sent via Cloudflare Email Workers

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### User Mailboxes Table

```sql
CREATE TABLE user_mailboxes (
    user_id TEXT NOT NULL,
    mailbox_id TEXT NOT NULL,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, mailbox_id)
);

CREATE INDEX idx_user_mailboxes_user_id ON user_mailboxes(user_id);
CREATE INDEX idx_user_mailboxes_mailbox_id ON user_mailboxes(mailbox_id);
```

---

## Frontend Authentication

### Pinia Auth Store

The auth store (`/packages/dashboard/src/stores/auth.ts`) manages:

- Session state
- Loading states
- Error handling
- Computed authentication status

```typescript
const isAuthenticated = computed(() => session.value !== null);
const isAdmin = computed(() => session.value?.isAdmin ?? false);
```

### Session Persistence

Sessions are persisted to localStorage:

```typescript
// On login
localStorage.setItem("session", JSON.stringify(response.data));

// On load
const storedSession = localStorage.getItem("session");
if (storedSession) {
  session.value = JSON.parse(storedSession);
}
```

### Axios Interceptors

#### Request Interceptor

Automatically attaches auth token to requests:

```typescript
apiClient.interceptors.request.use((config) => {
  const session = localStorage.getItem("session");
  if (session) {
    const parsed = JSON.parse(session);
    config.headers.Authorization = `Bearer ${parsed.id}`;
  }
  return config;
});
```

#### Response Interceptor

Handles 401 responses globally:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

### Vue Router Guards

Navigation guards protect routes based on authentication status:

```typescript
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const isPublicRoute = to.meta.public === true;
  const requiresAuth = to.meta.requiresAuth !== false;
  const requiresAdmin = to.meta.requiresAdmin === true;

  // Check session expiration
  if (authStore.session?.expiresAt < Date.now()) {
    await authStore.logout();
  }

  if (!isPublicRoute && requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else if (requiresAdmin && !authStore.isAdmin) {
    next({ name: "Home" });
  } else if (isPublicRoute && authStore.isAuthenticated &&
             (to.name === "Login" || to.name === "Register")) {
    next({ name: "Home" });
  } else {
    next();
  }
});
```

### Route Meta Fields

| Meta Field | Description |
|------------|-------------|
| `public: true` | Route accessible without authentication |
| `requiresAuth: true` | Route requires authenticated session |
| `requiresAdmin: true` | Route requires admin privileges |

---

## Smart Registration Mode

### Overview

The system supports three registration modes:

1. **Enabled** (`registerEnabled: true`): Anyone can register
2. **Disabled** (`registerEnabled: false`): Registration closed
3. **Smart Mode** (`registerEnabled: undefined`): Default behavior

### Smart Mode Behavior

When `registerEnabled` is undefined (default):

1. **First user**: Registration allowed, user becomes admin
2. **Subsequent users**: Registration closed

```typescript
// Check registration eligibility
if (registerEnabled === undefined) {
  const hasUsers = await authDO.hasUsers();
  if (hasUsers) {
    return c.json({
      error: "Registration is closed. Contact an administrator."
    }, 403);
  }
}

// First user becomes admin
const isFirstUser = !(await authDO.hasUsers());
const user = await authDO.register(email, password, isFirstUser);
```

### Admin User Creation

After registration closes, admins can create users via:

```http
POST /api/v1/auth/admin/register
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

---

## Configuration Options

### EmailExplorerOptions

```typescript
interface EmailExplorerOptions {
  auth?: {
    enabled?: boolean;        // Enable/disable auth (default: true)
    registerEnabled?: boolean; // Enable/disable registration (default: smart mode)
  };
  accountRecovery?: {
    fromEmail: string;        // Sender email for recovery emails
  };
}
```

### Default Configuration

```typescript
const defaultOptions: EmailExplorerOptions = {
  auth: {
    enabled: true,           // Auth enabled by default
    registerEnabled: undefined, // Smart mode
  },
};
```

### Usage Example

```typescript
import { EmailExplorer } from "email-explorer";

export default EmailExplorer({
  auth: {
    enabled: true,
    registerEnabled: false, // Disable public registration
  },
  accountRecovery: {
    fromEmail: "noreply@yourdomain.com",
  },
});
```

---

## Security Features Summary

| Feature | Implementation |
|---------|----------------|
| Password Hashing | SHA-256 via Web Crypto API |
| Session Tokens | UUID v4 (`crypto.randomUUID()`) |
| Session Expiration | 30 days with automatic cleanup |
| Cookie Security | HttpOnly, Secure, SameSite=Strict |
| CORS | Enabled for `/api/*` routes |
| Input Validation | Zod schemas on all endpoints |
| Admin Protection | Middleware checks `isAdmin` flag |
| Recovery Tokens | 1-hour expiry, single-use, stored in R2 |
| First User Admin | Automatic admin privileges for first registered user |
| Frontend Guards | Vue Router navigation guards |
| Token Auto-Refresh | 401 response triggers re-authentication |

### Public Routes (No Auth Required)

```typescript
const publicRoutes = [
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/settings",
  "/api/docs",
  "/api/openapi.json",
];
```

### Protected Routes (Session Required)

All routes under `/api/v1/` except public routes require valid session authentication.

### Admin Routes

```typescript
const adminRoutes = [
  "/api/v1/auth/admin/register",
  "/api/v1/auth/admin/users",
  "/api/v1/auth/admin/users/:userId",
  "/api/v1/auth/admin/grant-access",
  "/api/v1/auth/admin/revoke-access",
];
```
