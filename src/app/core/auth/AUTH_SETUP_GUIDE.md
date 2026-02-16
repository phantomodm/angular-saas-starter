# Authentication Setup Guide

This guide explains how to set up and use each authentication provider with the Fusion SaaS starter.

## Overview

The app uses an **AuthAdapter interface** that allows you to plug in different authentication providers:
- ✅ **Mock Auth** (default - for testing)
- 🔥 **Firebase**
- 🔐 **AWS Cognito**
- ☁️ **Azure AD**
- 🚀 **Supabase**

Currently, the app is configured to use **MockAuthService** for out-of-the-box functionality. To switch providers, update `src/app/app.config.ts`.

---

## 1. Firebase Authentication

### Installation

```bash
npm install firebase
```

### Setup (main.ts or environment initialization)

```typescript
// src/environments/environment.ts
export const environment = {
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};

// src/main.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from './environments/environment';

const firebaseApp = initializeApp(environment.firebase);
const auth = getAuth(firebaseApp);

// Make auth available globally (optional - can also inject via service)
(window as any).firebaseAuth = auth;
```

### Enable in app.config.ts

```typescript
import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers ...
    {
      provide: AuthAdapter,
      useClass: FirebaseAuthService,
    },
  ],
};
```

### Features
- Email/Password authentication
- Social login (Google, Facebook, GitHub, etc.)
- Phone authentication
- Anonymous login
- Multi-factor authentication (MFA)

### Firebase Console Setup
1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Enable "Authentication" → "Sign-in method"
3. Add email/password provider
4. Add any social providers you want
5. Get credentials and add to `environment.ts`

---

## 2. AWS Cognito

### Installation

```bash
npm install aws-amplify @aws-amplify/auth
```

### Setup (main.ts or app initialization)

```typescript
// src/environments/environment.ts
export const environment = {
  aws: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX',
    userPoolClientId: 'XXXXXXXXXXX',
    identityPoolId: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  },
};

// src/main.ts
import { Amplify } from 'aws-amplify';
import { environment } from './environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.aws.userPoolId,
      userPoolClientId: environment.aws.userPoolClientId,
      region: environment.aws.region,
    },
  },
});
```

### Enable in app.config.ts

```typescript
import { AwsCognitoAuthService } from './core/auth/providers/cognito-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers ...
    {
      provide: AuthAdapter,
      useClass: AwsCognitoAuthService,
    },
  ],
};
```

### Features
- User pools and identity pools
- Email verification
- Multi-factor authentication (MFA)
- Social identity providers
- Custom user attributes
- User groups for authorization

### AWS Console Setup
1. Create User Pool in [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Configure sign-in experience
3. Configure security requirements
4. Configure sign-up experience
5. Create app client
6. Get User Pool ID and Client ID

---

## 3. Azure Active Directory

### Installation

```bash
npm install @azure/msal-browser @azure/msal-angular
```

### Setup (main.ts or app initialization)

```typescript
// src/environments/environment.ts
export const environment = {
  azure: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin,
    scopes: ['User.Read'],
  },
};

// src/main.ts
import { PublicClientApplication } from '@azure/msal-browser';
import { environment } from './environments/environment';

const msalConfig = {
  auth: {
    clientId: environment.azure.clientId,
    authority: environment.azure.authority,
    redirectUri: environment.azure.redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.initialize();

(window as any).msalInstance = msalInstance;
```

### Enable in app.config.ts

```typescript
import { AzureAdAuthService } from './core/auth/providers/azure-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers ...
    {
      provide: AuthAdapter,
      useClass: AzureAdAuthService,
    },
  ],
};
```

### Features
- Enterprise-grade authentication
- Multi-tenant support
- Conditional access policies
- Azure AD B2C for customer-facing apps
- Integration with Microsoft 365
- SAML support

### Azure Portal Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Create "App registration"
3. Add "Mobile and desktop applications" redirect URI
4. Configure API permissions
5. Get Application (client) ID and Tenant ID
6. Create client secret

---

## 4. Supabase

### Installation

```bash
npm install @supabase/supabase-js
```

### Setup (environment and initialization)

```typescript
// src/environments/environment.ts
export const environment = {
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
  },
};

// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  supabase = createClient(
    environment.supabase.url,
    environment.supabase.anonKey
  );
}

// Then inject in your auth service or provide globally
```

### Enable in app.config.ts

```typescript
import { SupabaseAuthService } from './core/auth/providers/supabase-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers ...
    {
      provide: AuthAdapter,
      useClass: SupabaseAuthService,
    },
  ],
};
```

### Features
- PostgreSQL database included
- Real-time subscriptions
- Row-level security (RLS)
- Social authentication providers
- Email & phone authentication
- JWT-based authentication

### Supabase Console Setup
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Wait for database initialization
4. Get project URL and anon key from project settings
5. Enable authentication providers in "Authentication" → "Providers"
6. Create `users` table with appropriate schema:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email VARCHAR NOT NULL,
     display_name VARCHAR,
     avatar_url VARCHAR,
     roles TEXT[] DEFAULT ARRAY['user'],
     permissions TEXT[] DEFAULT ARRAY[],
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

---

## Switching Between Providers

### Step 1: Update app.config.ts

```typescript
// Change this:
import { MockAuthService } from './core/auth/providers/mock-auth.service';
{
  provide: AuthAdapter,
  useClass: MockAuthService,
},

// To this (example with Firebase):
import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';
{
  provide: AuthAdapter,
  useClass: FirebaseAuthService,
},
```

### Step 2: Update environment.ts

Add the required credentials for your chosen provider.

### Step 3: Initialize Provider

Set up the provider in `main.ts` with its specific configuration.

### Step 4: Test

The app will automatically use the new provider! All pages will work with minimal changes because everything goes through the `AuthAdapter` interface.

---

## User Roles and Permissions

Each provider stores user roles and permissions differently:

### Firebase
- Store in Firestore custom claims or user document
- Add to custom claims: `claims.roles = ['admin']`
- Retrieve in `mapFirebaseUserToAppUser()`

### AWS Cognito
- Store in custom attributes
- Use Cognito groups for role-based access
- Query via `user-groups` claim

### Azure AD
- Use Azure AD app roles
- Assign users to directory roles
- Return in `appRoles` claim

### Supabase
- Store in `users` table `roles` and `permissions` columns
- Use RLS policies to control data access
- Fetch with user profile query

---

## Demo Credentials (MockAuthService)

- **Admin:** admin@example.com / admin123
- **User:** user@example.com / user123
- **Developer:** developer@example.com / dev123

---

## Security Best Practices

1. **Never commit credentials** - Use environment files and secrets management
2. **Use HTTPS only** - Never use HTTP in production
3. **Implement CORS correctly** - Whitelist your domains
4. **Refresh tokens regularly** - Don't let sessions get too old
5. **Use secure storage** - Never store tokens in localStorage
6. **Implement rate limiting** - Prevent brute force attacks
7. **Enable MFA** - When supported by your provider
8. **Monitor authentication logs** - Watch for suspicious activity

---

## Troubleshooting

### "Provider not initialized"
- Check that you've called the initialization code in `main.ts`
- Verify environment variables are correctly set
- Check browser console for setup errors

### "Invalid credentials"
- Verify email/password are correct
- For social providers, check redirect URIs match
- Ensure user exists in provider

### "CORS errors"
- Add your domain to provider's allowed origins
- Check that requests include proper headers

### "Token expiration"
- Implement automatic token refresh
- Call `refreshToken()` before making API requests
- Redirect to login if refresh fails

---

## Next Steps

1. Choose your authentication provider
2. Follow the setup instructions above
3. Update `app.config.ts` to use your provider
4. Test authentication flows
5. Implement role-based access control (RBAC)
6. Add custom claims/attributes for your app

For more information, see individual provider documentation:
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [Azure AD Docs](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
