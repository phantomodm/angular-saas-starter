# Angular Firebase Authentication & Multi-Tenant Integration Guide

## Overview

This guide documents the complete Firebase authentication and multi-tenant integration for the Angular SaaS Starter with FastAPI backend.

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────┐
│          Angular Application                     │
├─────────────────────────────────────────────────┤
│  Auth Layer                                     │
│  ├─ FirebaseAuthService (providers)             │
│  │  ├─ Manages Firebase Auth state              │
│  │  ├─ Token refresh with expiry tracking       │
│  │  ├─ Custom claims extraction                 │
│  │  └─ Observable auth state streams            │
│  └─ AuthStore (state management)                │
│     ├─ Angular signals for reactive state       │
│     └─ Synced with FirebaseAuthService          │
├─────────────────────────────────────────────────┤
│  HTTP Layer                                     │
│  ├─ AuthInterceptor                             │
│  │  ├─ Attaches Bearer token to all requests    │
│  │  ├─ Handles 401 with token refresh           │
│  │  └─ Adds X-Organization-Id header            │
│  ├─ ErrorInterceptor                            │
│  │  ├─ Maps HTTP errors to user messages        │
│  │  └─ Logs errors for debugging                │
│  └─ TenantContextService                        │
│     ├─ Manages current organization context     │
│     └─ Provides organizationId via signals      │
├─────────────────────────────────────────────────┤
│  Route Protection                               │
│  ├─ authGuard: Requires authentication          │
│  ├─ roleGuard: Checks roles from custom claims  │
│  └─ permissionGuard: Checks specific permissions│
└─────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────┐
│      FastAPI Server (main.py)                   │
├─────────────────────────────────────────────────┤
│  Auth Verification                              │
│  ├─ Middleware: Verify token on each request    │
│  ├─ FirebaseService: Token verification         │
│  └─ Dependencies: Inject auth context           │
├─────────────────────────────────────────────────┤
│  Routes                                         │
│  ├─ /auth/verify-token: Verify JWT              │
│  ├─ /api/user/profile: User profile             │
│  ├─ /api/org/{org_id}/dashboard: Org data       │
│  └─ /api/admin/*: Admin endpoints               │
├─────────────────────────────────────────────────┤
│  Security                                       │
│  ├─ CORS: Allows localhost:4200                 │
│  ├─ Token validation: Firebase Admin SDK        │
│  └─ Custom claims: Roles, permissions, org_id   │
└─────────────────────────────────────────────────┘
```

## File Structure

### Frontend (Angular)

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.adapter.ts (abstract interface)
│   │   └── providers/
│   │       └── firebase-auth.service.ts (production implementation)
│   ├── http/
│   │   ├── auth.interceptor.ts (token attachment + 401 handling)
│   │   └── error.interceptor.ts (error transformation)
│   ├── guards/
│   │   ├── auth.guard.ts (authentication protection)
│   │   ├── role.guard.ts (role-based access)
│   │   └── permission.guard.ts (permission-based access)
│   ├── tenancy/
│   │   └── tenant-context.service.ts (organization management)
│   ├── models/
│   │   └── user.model.ts (User interface with organizationId)
│   ├── store/
│   │   └── auth.store.ts (Angular signals state)
│   └── services/
│       ├── profile.service.ts (user profile)
│       ├── organization.ts (org management)
│       └── billing.ts (billing operations)
└── app.config.ts (dependency injection & providers)
```

### Backend (FastAPI)

```
backend/
├── main.py (FastAPI app with 15+ endpoints)
├── firebase_service.py (Firebase Admin SDK wrapper)
├── dependencies.py (Auth/authz dependency injectors)
├── models.py (Pydantic validation models)
├── routes/
│   ├── auth.py
│   ├── users.py
│   ├── organizations.py
│   └── admin.py
└── requirements.txt
```

## Authentication Flow

### 1. Login Process

```
User Input (email, password)
            ↓
FirebaseAuthService.login()
            ↓
Firebase Auth (signInWithEmailAndPassword)
            ↓
Get ID Token + Token Result
            ↓
Extract Custom Claims (roles, org_id)
            ↓
AuthStore.login() updates signals
            ↓
Navigate to /dashboard
```

### 2. Token Refresh Flow

```
HTTP Request → AuthInterceptor
                    ↓
              Check token expiry (5-min window)
                    ↓
              If expiring: Call getToken(forceRefresh=true)
                    ↓
              FirebaseAuthService.getToken()
                    ↓
              currentUser.getIdToken(forceRefresh=true)
                    ↓
              Update tokenExpiryTime
                    ↓
              Return new token
                    ↓
              Retry original request with new token
```

### 3. 401 Unauthorized Handling

```
HTTP Response (401)
            ↓
AuthInterceptor catches error
            ↓
Is refresh already in progress?
    ├─ YES: Queue request, wait for refresh to complete
    └─ NO: Initiate new refresh
            ↓
Call authService.getToken(forceRefresh=true)
            ↓
On success: Retry original request with new token
On failure: Logout user and redirect to /login
```

## Key Services

### FirebaseAuthService

**Purpose**: Core authentication with Firebase SDK

**Key Methods**:

- `initializeAuth()` - Initialize Firebase with config from environment.ts
- `login(credentials)` - Sign in with email/password
- `signup(data)` - Create new user
- `logout()` - Sign out current user
- `getCurrentUser()` - Observable of current user
- `getToken(forceRefresh)` - Get token with auto-refresh
- `getTokenSync()` - Get cached token synchronously
- `isTokenExpiring()` - Check if token needs refresh (5-min window)
- `refreshToken()` - Force token refresh

**Observable Streams**:

- `currentUserSubject` - Current authenticated user
- `tokenSubject` - Current bearer token
- `isAuthenticatedSubject` - Authentication state

**Features**:

- ✅ Real Firebase Auth SDK integration
- ✅ Token refresh with 5-minute expiry window
- ✅ Deduped token refresh (prevents race conditions)
- ✅ Custom claims extraction (roles, permissions, org_id)
- ✅ Auth state persistence across reloads
- ✅ BehaviorSubjects for reactive state
- ✅ User-friendly error messages

### AuthInterceptor

**Purpose**: Attach tokens and handle auth errors

**Responsibilities**:

1. Skip public endpoints (login, signup, etc)
2. Attach Bearer token to all protected requests
3. Attach X-Organization-Id header for org-scoped routes
4. Proactively refresh token if expiring soon
5. Handle 401 with automatic retry
6. Prevent infinite refresh loops
7. Queue requests during refresh

**Public Endpoints** (no token required):

- `/health`
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/docs`, `/redoc`, `/openapi.json`

**Organization-Scoped URLs** (require X-Organization-Id header):

- URLs containing `/api/org/`

### TenantContextService

**Purpose**: Manage current organization context in multi-tenant application

**Key Methods**:

- `currentOrganizationId()` - Get current org ID via signal
- `switchOrganization(orgId)` - Switch to different organization
- `clearOrganization()` - Clear organization context
- `hasOrganizationContext()` - Check if org context is set

**Features**:

- ✅ Organization ID stored in localStorage
- ✅ Synced with user's custom claims
- ✅ Reactive signal for component binding
- ✅ Auto-syncs when user changes

### AuthStore

**Purpose**: Central state management for authentication

**Signals**:

- `currentUser` - Current authenticated user
- `isAuthenticated` - Authentication state
- `loading` - Loading state for async operations
- `error` - Error message
- `initialized` - Whether auth has been initialized
- `authToken` - Current bearer token

**Computed Signals**:

- `roles` - User roles from current user
- `permissions` - User permissions
- `isAdmin` - Is user admin role
- `isDeveloper` - Is user developer role

**Methods**:

- `login(email, password)` - Login with credentials
- `signup(email, password, displayName)` - Create new account
- `logout()` - Sign out user
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password
- `verifyEmail(token)` - Verify email
- `clearError()` - Clear error message

## Custom Claims Structure

Firebase custom claims (set by backend) have this structure:

```json
{
  "roles": ["admin", "user"],
  "permissions": ["read:users", "write:users"],
  "org_id": "org-123",
  "is_verified": true
}
```

**In Angular Components**:

```typescript
// Access user roles
const isAdmin = authStore.isAdmin();

// Access organization ID
const orgId = tenantContext.currentOrganizationId();

// Access all user data
const user = authStore.currentUser();
```

**In HTTP Requests**:

- Authorization header: `Bearer {token}` (includes claim in JWT)
- X-Organization-Id header: `org-123` (from TenantContextService)

## Backend Integration

### API Endpoints

The backend provides these endpoints:

```
POST /auth/verify-token
  Body: { "token": "jwt-token" }
  Response: { "valid": true, "user": {...} }

GET /api/user/profile
  Headers: Authorization: Bearer {token}
  Response: { "id": "uid", "email": "...", "roles": [...] }

GET /api/org/{org_id}/dashboard
  Headers:
    Authorization: Bearer {token}
    X-Organization-Id: {org_id}
  Response: { "organization": {...}, "metrics": {...} }

POST /api/admin/users/{uid}/claims
  Headers: Authorization: Bearer {token}
  Body: { "roles": ["admin"], "permissions": [...], "org_id": "org-123" }
  Response: { "success": true }
```

### Frontend → Backend Communication

1. **Token Verification**
   - Angular: Sends token in Authorization header
   - Backend: Verifies token with Firebase Admin SDK
   - Backend: Returns user context with custom claims

2. **Organization Scoping**
   - Angular: Sends X-Organization-Id header
   - Backend: Validates user can access that org
   - Backend: Returns org-specific data

3. **Error Handling**
   - Backend returns 401 for invalid token
   - Angular catches 401, refreshes token, retries request
   - Backend returns 403 for insufficient permissions
   - Angular shows error to user

## Configuration Files

### environment.ts (Frontend)

```typescript
export const environment = {
  apiUrl: "http://localhost:8000",
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "...",
    appId: "...",
  },
};
```

### .env (Backend)

```
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
CORS_ORIGINS=http://localhost:4200,https://yourdomain.com
AUTH_CLAIMS_ROLE_KEY=roles
AUTH_CLAIMS_ORG_KEY=org_id
AUTH_CLAIMS_PERMISSION_KEY=permissions
```

## Security Features

### Frontend Security

- ✅ Bearer tokens in Authorization header only (not localStorage)
- ✅ Tokens stored in memory (lost on page reload, but auto-restored by Firebase)
- ✅ 5-minute proactive refresh prevents token expiry during user session
- ✅ Deduped refresh prevents race conditions
- ✅ 401 → refresh → retry pattern handles concurrent requests
- ✅ Auth guards protect routes from unauthorized access
- ✅ Role guards enforce role-based access control
- ✅ Interceptor automatically adds required headers

### Backend Security

- ✅ Firebase Admin SDK validates all tokens
- ✅ Custom claims verified for roles/permissions
- ✅ Organization scoping in dependency injectors
- ✅ CORS configured for allowed origins only
- ✅ All protected routes require valid token
- ✅ 401 on invalid/expired token
- ✅ 403 on insufficient permissions

## Usage Examples

### Protecting a Route

```typescript
// In app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard],
}

// Admin-only route
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['admin'] }
}
```

### Using Auth in Components

```typescript
import { Component, inject } from "@angular/core";
import { AuthStore } from "../core/store/auth.store";

@Component({
  selector: "app-profile",
  template: `
    <div *ngIf="authStore.isAuthenticated()">
      <h1>{{ authStore.userName() }}</h1>
      <p>{{ authStore.userEmail() }}</p>
      <p *ngIf="authStore.isAdmin()">You are an admin</p>
    </div>
  `,
})
export class ProfileComponent {
  authStore = inject(AuthStore);
}
```

### Making API Calls

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({...})
export class DataComponent {
  private http = inject(HttpClient);

  loadData() {
    // AuthInterceptor automatically adds:
    // - Authorization: Bearer {token}
    // - X-Organization-Id: {orgId} (if org-scoped URL)
    this.http.get(`${environment.apiUrl}/api/org/data`).subscribe(data => {
      console.log(data);
    });
  }
}
```

### Switching Organizations

```typescript
import { Component, inject } from '@angular/core';
import { TenantContextService } from '../core/tenancy/tenant-context.service';

@Component({...})
export class OrgSwitcherComponent {
  private tenantContext = inject(TenantContextService);

  switchToOrg(orgId: string) {
    this.tenantContext.switchOrganization(orgId);
    // All subsequent requests will include X-Organization-Id header
  }
}
```

## Testing

### Testing Authentication

```typescript
import { TestBed } from "@angular/core/testing";
import { FirebaseAuthService } from "./firebase-auth.service";
import { AuthStore } from "../store/auth.store";

describe("FirebaseAuthService", () => {
  let authService: FirebaseAuthService;
  let authStore: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FirebaseAuthService, AuthStore],
    });

    authService = TestBed.inject(FirebaseAuthService);
    authStore = TestBed.inject(AuthStore);
  });

  it("should login user", (done) => {
    authService
      .login({
        email: "test@example.com",
        password: "password",
      })
      .subscribe(({ user, token }) => {
        expect(user.email).toBe("test@example.com");
        expect(token).toBeTruthy();
        expect(authStore.isAuthenticated()).toBe(true);
        done();
      });
  });
});
```

## Troubleshooting

### Token Not Attached to Requests

Check if:

- ✓ AuthInterceptor is registered in app.config.ts
- ✓ Firebase auth is initialized
- ✓ User is authenticated (getToken() returns non-null)

### 401 Loop

Check if:

- ✓ Backend is validating token with Firebase Admin SDK
- ✓ Firebase credentials are correct
- ✓ Token hasn't been revoked

### Organization Not Scoped

Check if:

- ✓ TenantContextService has organization set
- ✓ URL includes `/api/org/`
- ✓ Backend is checking X-Organization-Id header

### Custom Claims Not Available

Check if:

- ✓ Backend set custom claims with Firebase Admin SDK
- ✓ User token was refreshed after claims were set
- ✓ Token was requested with getIdTokenResult() (includes claims)

## Next Steps

1. **Environment Setup**
   - Copy Firebase config to environment.ts
   - Configure backend .env file
   - Start backend: `python main.py`

2. **Testing**
   - Create test accounts in Firebase
   - Test login/logout flow
   - Test org scoping
   - Test role-based access

3. **Components**
   - Create login/signup components
   - Create dashboard with API data
   - Add organization switcher
   - Add user profile page

4. **API Integration**
   - Connect API services to real endpoints
   - Implement caching strategies
   - Add error notifications
   - Add loading states

5. **Production**
   - Update CORS origins
   - Enable Firebase Security Rules
   - Configure production domains
   - Set up error logging (Sentry)
