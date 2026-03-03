# Angular Frontend Setup Instructions

## Quick Start

You've received a production-ready Angular frontend with Firebase authentication integration. Here's how to set it up:

## Step 1: Create environment.ts

Create the file `src/environments/environment.ts` with your Firebase configuration:

```typescript
export const environment = {
  apiUrl: "http://localhost:8000", // Your backend API URL
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
};
```

**Where to get these values:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings (⚙️ icon)
4. Under "Your apps", find your web app
5. Copy the config values

## Step 2: Initialize Firebase in App Startup

Update `src/app/app.ts` to initialize Firebase:

```typescript
import { Component, inject, effect, APP_INITIALIZER } from "@angular/core";
import { FirebaseAuthService } from "./core/auth/providers/firebase-auth.service";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell></app-shell>`,
})
export class AppComponent {
  private authService = inject(FirebaseAuthService);

  constructor() {
    // Initialize Firebase with config
    this.authService.initWithConfig(environment.firebase);
  }
}
```

Or better yet, use APP_INITIALIZER in `app.config.ts`:

```typescript
import { APP_INITIALIZER } from "@angular/core";
import { FirebaseAuthService } from "./core/auth/providers/firebase-auth.service";
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers ...

    // Initialize Firebase
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: FirebaseAuthService) => {
        return () => {
          authService.initWithConfig(environment.firebase);
          return Promise.resolve();
        };
      },
      deps: [FirebaseAuthService],
      multi: true,
    },
  ],
};
```

## Step 3: Enable Email/Password Authentication in Firebase

1. Go to Firebase Console
2. Select your project
3. Go to Authentication → Sign-in method
4. Enable "Email/Password" provider
5. Click Save

## Step 4: Start Your Backend

The frontend expects a FastAPI backend running on `localhost:8000`:

```bash
cd backend
python main.py
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Step 5: Start Angular Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200`

You should see warnings about Firebase not being initialized. Once you've added environment.ts and initialized Firefox, you'll see:

```
✅ Firebase initialized successfully
```

## Step 6: Create Login/Signup Components

You need to create the login and signup components. Here's a template:

### Login Component (`src/app/domains/auth/pages/login.component.ts`)

```typescript
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthStore } from "../../../core/store/auth.store";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <h2 class="text-center text-3xl font-bold">Sign In</h2>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <input type="email" formControlName="email" placeholder="Email" class="w-full px-4 py-2 border rounded" />
          </div>

          <div class="mb-4">
            <input type="password" formControlName="password" placeholder="Password" class="w-full px-4 py-2 border rounded" />
          </div>

          <button type="submit" [disabled]="authStore.loading()" class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {{ authStore.loading() ? "Signing in..." : "Sign In" }}
          </button>
        </form>

        <div *ngIf="authStore.error()" class="text-red-500">
          {{ authStore.error() }}
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
  });

  onSubmit() {
    if (!this.loginForm.valid) return;

    const { email, password } = this.loginForm.value;
    this.authStore.login(email!, password!);

    // Navigate on success
    this.authStore.isAuthenticated$.subscribe((isAuth) => {
      if (isAuth) {
        this.router.navigate(["/dashboard"]);
      }
    });
  }
}
```

### Signup Component

Similar structure to login component, but call `authStore.signup()` instead.

## Step 7: Test the Flow

1. Go to `http://localhost:4200/login`
2. Enter test credentials
3. You should see a Firebase error saying the user doesn't exist
4. Go to Firebase Console → Authentication → Create a test user
5. Try logging in again
6. You should be redirected to dashboard

## Step 8: Check Browser DevTools

Open DevTools (F12) and check:

**Console:**

- Should show "✅ Firebase initialized successfully"
- Should show auth state changes

**Network:**

- Login request should go to Firebase (cross-domain)
- API requests should include `Authorization: Bearer {token}` header

**Application → Local Storage:**

- Should show `current_org_id` if organization is set

## Troubleshooting

### "Firebase config not found"

- ✓ Create `src/environments/environment.ts`
- ✓ Add Firebase config
- ✓ Ensure `initWithConfig()` is called at app startup

### "Duplicate isTokenExpiring method" or other errors

- ✓ Run `ng build` to check for TypeScript errors
- ✓ Restart `ng serve`

### Login not working

- ✓ Check that Email/Password is enabled in Firebase
- ✓ Check that user exists in Firebase Console
- ✓ Check browser console for errors

### API calls returning 401

- ✓ Check that backend is running on localhost:8000
- ✓ Check that Firebase config matches backend's project
- ✓ Check that token is being sent (DevTools → Network)

### "CORS Error"

- ✓ Check that backend has CORS configured for localhost:4200
- ✓ Check that OPTIONS requests are allowed

## What's Already Done For You

✅ **Firebase Auth Service** - Real Firebase SDK integration with token refresh
✅ **HTTP Interceptors** - Token attachment and error handling  
✅ **Multi-Tenant Support** - Organization scoping via headers
✅ **Route Guards** - Authentication and role-based access control
✅ **State Management** - Angular signals for reactive state
✅ **Error Handling** - User-friendly error messages
✅ **Documentation** - Complete integration guide

## What You Need to Do

1. ✅ Create `src/environments/environment.ts` (instructions above)
2. ✅ Initialize Firebase in app startup (instructions above)
3. Create login/signup components
4. Create dashboard component
5. Connect API services to real backend endpoints
6. Add other domain pages (billing, team, projects, etc.)

## Files You Created/Modified

- ✅ `src/app/core/auth/providers/firebase-auth.service.ts` (461 lines)
- ✅ `src/app/core/http/auth.interceptor.ts` (217 lines)
- ✅ `src/app/core/http/error.interceptor.ts` (112 lines)
- ✅ `src/app/core/tenancy/tenant-context.service.ts` (82 lines)
- ✅ `src/app/core/guards/auth.guard.ts` (51 lines)
- ✅ `src/app/core/models/user.model.ts` (added organizationId)
- ✅ `src/app/app.config.ts` (registered services)

## Documentation

Read these files for complete information:

- `src/app/core/FIREBASE_INTEGRATION_GUIDE.md` - Complete architecture and usage guide
- `FRONTEND_IMPLEMENTATION_SUMMARY.md` - What was implemented
- `backend/QUICKSTART.md` - Backend setup guide

## Next Steps

1. Set up environment.ts and initialize Firebase
2. Create login component
3. Test authentication flow
4. Create dashboard component
5. Connect to real API endpoints
6. Add other domain pages

## Questions?

Refer to `src/app/core/FIREBASE_INTEGRATION_GUIDE.md` for:

- Architecture overview
- Authentication flows
- API integration details
- Usage examples
- Troubleshooting
