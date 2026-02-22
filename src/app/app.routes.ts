import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './core/layout/app-shell.component';
import { LoginComponent } from './domains/auth/pages/login.component';
import { SignupComponent } from './domains/auth/pages/signup.component';
import { OnboardingComponent } from './domains/auth/pages/onboarding.component';
import { DashboardComponent } from './domains/dashboard/pages/dashboard.component';
import { ApiKeysComponent } from './domains/api-keys/pages/api-keys.component';
import { AdminDashboardComponent } from './domains/admin/pages/admin-dashboard.component';
import { LogsViewerComponent } from './domains/admin/pages/logs-viewer.component';
import { BillingComponent } from './domains/billing/pages/billing.component';
import { ProjectsComponent } from './domains/projects/pages/projects.component';
import { AnalyticsComponent } from './domains/analytics/pages/analytics.component';
import { AccountSettingsComponent } from './domains/account/pages/account-settings.component';
import { PlaceholderComponent } from './domains/shared/pages/placeholder.component';

export const routes: Routes = [
  // Public auth routes
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'forgot-password',
    component: PlaceholderComponent,
    data: {
      title: 'Forgot Password',
      description: 'Reset your password',
    },
  },
  {
    path: 'reset-password',
    component: PlaceholderComponent,
    data: {
      title: 'Reset Password',
      description: 'Enter your new password',
    },
  },
  {
    path: 'onboarding',
    component: OnboardingComponent,
    canActivate: [authGuard],
  },

  // Protected routes with app shell
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },

      // Billing domain
      {
        path: 'billing',
        component: BillingComponent,
      },

      // Projects domain
      {
        path: 'projects',
        component: ProjectsComponent,
      },

      // Analytics domain
      {
        path: 'analytics',
        component: AnalyticsComponent,
      },

      // Account settings
      {
        path: 'account',
        component: AccountSettingsComponent,
      },

      // Admin domain (requires admin role)
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: '',
            component: AdminDashboardComponent,
          },
          {
            path: 'logs',
            component: LogsViewerComponent,
          },
        ],
      },

      // Developer domain
      {
        path: 'developer',
        children: [
          {
            path: 'api-keys',
            component: ApiKeysComponent,
          },
          {
            path: '',
            redirectTo: '/developer/api-keys',
            pathMatch: 'full',
          },
          {
            path: 'webhooks',
            component: PlaceholderComponent,
            data: {
              title: 'Webhooks',
              description: 'Configure webhooks for integrations',
            },
          },
        ],
      },

      // Unauthorized page
      {
        path: 'unauthorized',
        component: PlaceholderComponent,
        data: {
          title: 'Unauthorized',
          description: 'You do not have permission to access this page',
        },
      },
    ],
  },

  // Wildcard route for 404
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
